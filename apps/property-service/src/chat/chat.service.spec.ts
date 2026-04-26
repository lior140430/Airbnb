import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { ChatService } from './chat.service';
import { Conversation } from './schemas/conversation.schema';
import { Message } from './schemas/message.schema';

const user1 = 'aaaaaaaaaaaa';
const user2 = 'bbbbbbbbbbbb';

const mockMessage = {
    _id: 'msg1',
    senderId: user1,
    receiverId: user2,
    text: 'שלום!',
    read: false,
    createdAt: new Date().toISOString(),
};

const mockConversation = {
    _id: 'conv1',
    participants: [user1, user2].sort(),
    lastMessage: 'שלום!',
    lastMessageAt: new Date(),
};

describe('ChatService', () => {
    let service: ChatService;
    let messageModel: any;
    let conversationModel: any;

    beforeEach(async () => {
        messageModel = {
            create: jest.fn(),
            find: jest.fn(),
            updateMany: jest.fn(),
            countDocuments: jest.fn(),
        };

        conversationModel = {
            find: jest.fn(),
            findOne: jest.fn(),
            findOneAndUpdate: jest.fn(),
            create: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ChatService,
                { provide: getModelToken(Message.name), useValue: messageModel },
                { provide: getModelToken(Conversation.name), useValue: conversationModel },
            ],
        }).compile();

        service = module.get<ChatService>(ChatService);
    });

    afterEach(() => jest.clearAllMocks());

    // ─── getOrCreateConversation ───
    describe('getOrCreateConversation', () => {
        it('returns existing conversation when found', async () => {
            conversationModel.findOne.mockResolvedValue(mockConversation);
            const result = await service.getOrCreateConversation(user1, user2);
            expect(conversationModel.findOne).toHaveBeenCalledWith({
                participants: [user1, user2].sort(),
            });
            expect(result).toEqual(mockConversation);
        });

        it('creates conversation when none found', async () => {
            conversationModel.findOne.mockResolvedValue(null);
            conversationModel.create.mockResolvedValue(mockConversation);

            const result = await service.getOrCreateConversation(user1, user2);

            expect(conversationModel.create).toHaveBeenCalledWith(
                expect.objectContaining({ participants: [user1, user2].sort() }),
            );
            expect(result).toEqual(mockConversation);
        });

        it('always sorts participants canonically', async () => {
            conversationModel.findOne.mockResolvedValue(mockConversation);
            // Call with reversed order
            await service.getOrCreateConversation(user2, user1);
            expect(conversationModel.findOne).toHaveBeenCalledWith({
                participants: [user1, user2].sort(),
            });
        });
    });

    // ─── getConversations ───
    describe('getConversations', () => {
        it('returns conversations sorted by lastMessageAt desc', async () => {
            const conversations = [mockConversation];
            conversationModel.find.mockReturnValue({
                sort: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(conversations) }),
            });

            const result = await service.getConversations(user1);

            expect(conversationModel.find).toHaveBeenCalledWith({ participants: user1 });
            expect(result).toEqual(conversations);
        });
    });

    // ─── getMessages ───
    describe('getMessages', () => {
        it('returns messages between two users sorted ascending', async () => {
            const messages = [mockMessage];
            messageModel.find.mockReturnValue({
                sort: jest.fn().mockReturnValue({
                    skip: jest.fn().mockReturnValue({
                        limit: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(messages) }),
                    }),
                }),
            });

            const result = await service.getMessages(user1, user2, 1, 50);

            expect(messageModel.find).toHaveBeenCalledWith({
                $or: [
                    { senderId: user1, receiverId: user2 },
                    { senderId: user2, receiverId: user1 },
                ],
            });
            const sortFn = messageModel.find.mock.results[0].value.sort;
            expect(sortFn).toHaveBeenCalledWith({ createdAt: 1 });
            expect(result).toEqual(messages);
        });

        it('applies correct skip for pagination', async () => {
            const skipMock = jest.fn().mockReturnValue({
                limit: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue([]) }),
            });
            messageModel.find.mockReturnValue({
                sort: jest.fn().mockReturnValue({ skip: skipMock }),
            });

            await service.getMessages(user1, user2, 3, 20);
            expect(skipMock).toHaveBeenCalledWith(40); // (3 - 1) * 20
        });
    });

    // ─── sendMessage ───
    describe('sendMessage', () => {
        it('creates message and upserts conversation', async () => {
            messageModel.create.mockResolvedValue(mockMessage);
            conversationModel.findOneAndUpdate.mockResolvedValue(mockConversation);

            const result = await service.sendMessage(user1, user2, 'שלום!');

            expect(messageModel.create).toHaveBeenCalledWith({
                senderId: user1,
                receiverId: user2,
                text: 'שלום!',
            });
            expect(conversationModel.findOneAndUpdate).toHaveBeenCalledWith(
                { participants: [user1, user2].sort() },
                expect.objectContaining({ lastMessage: 'שלום!' }),
                { upsert: true },
            );
            expect(result).toEqual(mockMessage);
        });

        it('sorts participants in the conversation upsert', async () => {
            messageModel.create.mockResolvedValue(mockMessage);
            conversationModel.findOneAndUpdate.mockResolvedValue(mockConversation);

            await service.sendMessage(user2, user1, 'hi');
            const updateCall = conversationModel.findOneAndUpdate.mock.calls[0];
            expect(updateCall[0].participants).toEqual([user1, user2].sort());
        });
    });

    // ─── markAsRead ───
    describe('markAsRead', () => {
        it('marks messages from otherUser to currentUser as read', async () => {
            messageModel.updateMany.mockResolvedValue({ modifiedCount: 2 });

            await service.markAsRead(user1, user2);

            expect(messageModel.updateMany).toHaveBeenCalledWith(
                { senderId: user2, receiverId: user1, read: false },
                { read: true },
            );
        });
    });

    // ─── getUnreadCount ───
    describe('getUnreadCount', () => {
        it('returns count of unread messages for user', async () => {
            messageModel.countDocuments.mockResolvedValue(5);

            const result = await service.getUnreadCount(user1);

            expect(messageModel.countDocuments).toHaveBeenCalledWith({
                receiverId: user1,
                read: false,
            });
            expect(result).toBe(5);
        });

        it('returns 0 when no unread messages', async () => {
            messageModel.countDocuments.mockResolvedValue(0);
            expect(await service.getUnreadCount(user1)).toBe(0);
        });
    });
});
