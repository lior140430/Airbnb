import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Message, MessageDocument } from './schemas/message.schema';
import {
  Conversation,
  ConversationDocument,
} from './schemas/conversation.schema';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Message.name)
    private readonly messageModel: Model<MessageDocument>,
    @InjectModel(Conversation.name)
    private readonly conversationModel: Model<ConversationDocument>,
  ) {}

  async getOrCreateConversation(
    userId1: string,
    userId2: string,
  ): Promise<ConversationDocument> {
    const participants = [userId1, userId2].sort();

    let conversation = await this.conversationModel.findOne({
      participants,
    });

    if (!conversation) {
      conversation = await this.conversationModel.create({
        participants,
        lastMessage: '',
        lastMessageAt: new Date(),
      });
    }

    return conversation;
  }

  async getConversations(userId: string): Promise<ConversationDocument[]> {
    return this.conversationModel
      .find({ participants: userId })
      .sort({ lastMessageAt: -1 })
      .exec();
  }

  async getMessages(
    userId: string,
    otherUserId: string,
    page: number,
    limit: number,
  ): Promise<MessageDocument[]> {
    const skip = (page - 1) * limit;

    return this.messageModel
      .find({
        $or: [
          { senderId: userId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: userId },
        ],
      })
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit)
      .exec();
  }

  async sendMessage(
    senderId: string,
    receiverId: string,
    text: string,
  ): Promise<MessageDocument> {
    const message = await this.messageModel.create({
      senderId,
      receiverId,
      text,
    });

    const participants = [senderId, receiverId].sort();

    await this.conversationModel.findOneAndUpdate(
      { participants },
      {
        participants,
        lastMessage: text,
        lastMessageAt: new Date(),
      },
      { upsert: true },
    );

    return message;
  }

  async markAsRead(userId: string, otherUserId: string): Promise<void> {
    await this.messageModel.updateMany(
      { senderId: otherUserId, receiverId: userId, read: false },
      { read: true },
    );
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.messageModel.countDocuments({
      receiverId: userId,
      read: false,
    });
  }
}
