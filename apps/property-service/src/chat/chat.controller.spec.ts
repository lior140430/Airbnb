import { Test, TestingModule } from '@nestjs/testing';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';

const user1 = 'user-aaa';
const user2 = 'user-bbb';

describe('ChatController', () => {
  let controller: ChatController;
  let chatService: jest.Mocked<Partial<ChatService>>;

  beforeEach(async () => {
    chatService = {
      getConversations: jest.fn(),
      getMessages: jest.fn(),
      sendMessage: jest.fn(),
      markAsRead: jest.fn(),
      getUnreadCount: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChatController],
      providers: [
        { provide: ChatService, useValue: chatService },
      ],
    }).compile();

    controller = module.get<ChatController>(ChatController);
  });

  afterEach(() => jest.clearAllMocks());

  // ─── GET /chat/conversations ───
  describe('getConversations', () => {
    it('returns conversations for the current user', async () => {
      const convs = [{ _id: 'c1', participants: [user1, user2] }];
      (chatService.getConversations as jest.Mock).mockResolvedValue(convs);

      const req = { user: { _id: user1 } };
      const result = await controller.getConversations(req as any);

      expect(chatService.getConversations).toHaveBeenCalledWith(user1);
      expect(result).toEqual(convs);
    });
  });

  // ─── GET /chat/messages/:userId ───
  describe('getMessages', () => {
    it('returns messages with default pagination (page 1, limit 50)', async () => {
      const messages = [{ _id: 'm1', text: 'hi', senderId: user1, receiverId: user2 }];
      (chatService.getMessages as jest.Mock).mockResolvedValue(messages);

      const req = { user: { _id: user1 } };
      const result = await controller.getMessages(req as any, user2, '1', '50');

      expect(chatService.getMessages).toHaveBeenCalledWith(user1, user2, 1, 50);
      expect(result).toEqual(messages);
    });

    it('parses string page and limit to numbers', async () => {
      (chatService.getMessages as jest.Mock).mockResolvedValue([]);
      const req = { user: { _id: user1 } };
      await controller.getMessages(req as any, user2, '2', '25');
      expect(chatService.getMessages).toHaveBeenCalledWith(user1, user2, 2, 25);
    });
  });

  // ─── POST /chat/messages ───
  describe('sendMessage', () => {
    it('creates and returns a message', async () => {
      const msg = { _id: 'm1', senderId: user1, receiverId: user2, text: 'שלום' };
      (chatService.sendMessage as jest.Mock).mockResolvedValue(msg);

      const req = { user: { _id: user1 } };
      const result = await controller.sendMessage(req as any, user2, 'שלום');

      expect(chatService.sendMessage).toHaveBeenCalledWith(user1, user2, 'שלום');
      expect(result).toEqual(msg);
    });
  });

  // ─── PATCH /chat/read/:userId ───
  describe('markAsRead', () => {
    it('marks messages as read and returns { success: true }', async () => {
      (chatService.markAsRead as jest.Mock).mockResolvedValue(undefined);

      const req = { user: { _id: user1 } };
      const result = await controller.markAsRead(req as any, user2);

      expect(chatService.markAsRead).toHaveBeenCalledWith(user1, user2);
      expect(result).toEqual({ success: true });
    });
  });

  // ─── GET /chat/unread ───
  describe('getUnreadCount', () => {
    it('returns unread count for the current user', async () => {
      (chatService.getUnreadCount as jest.Mock).mockResolvedValue(7);

      const req = { user: { _id: user1 } };
      const result = await controller.getUnreadCount(req as any);

      expect(chatService.getUnreadCount).toHaveBeenCalledWith(user1);
      expect(result).toEqual({ count: 7 });
    });

    it('returns { count: 0 } when no unread messages', async () => {
      (chatService.getUnreadCount as jest.Mock).mockResolvedValue(0);
      const result = await controller.getUnreadCount({ user: { _id: user1 } } as any);
      expect(result).toEqual({ count: 0 });
    });
  });
});
