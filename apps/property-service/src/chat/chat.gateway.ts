import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ChatService } from './chat.service';

@WebSocketGateway({
  namespace: '/chat',
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  },
})
export class ChatGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private onlineUsers = new Map<string, string>();

  constructor(
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token;
      const payload = this.jwtService.verify(token);
      const userId = payload.sub;

      client.data.userId = userId;
      client.join(`user_${userId}`);

      this.onlineUsers.set(userId, client.id);
      this.server.emit('user_online', { userId });
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    if (userId) {
      this.onlineUsers.delete(userId);
      this.server.emit('user_offline', { userId });
    }
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { receiverId: string; text: string },
  ) {
    const senderId = client.data.userId;
    const message = await this.chatService.sendMessage(
      senderId,
      data.receiverId,
      data.text,
    );

    this.server.to(`user_${data.receiverId}`).emit('new_message', message);
    this.server.to(`user_${senderId}`).emit('new_message', message);

    return message;
  }

  @SubscribeMessage('mark_read')
  async handleMarkRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string },
  ) {
    const readerId = client.data.userId;
    await this.chatService.markAsRead(readerId, data.userId);

    this.server
      .to(`user_${data.userId}`)
      .emit('messages_read', { readBy: readerId });
  }

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { receiverId: string },
  ) {
    const userId = client.data.userId;
    this.server
      .to(`user_${data.receiverId}`)
      .emit('user_typing', { userId });
  }

  @SubscribeMessage('stop_typing')
  handleStopTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { receiverId: string },
  ) {
    const userId = client.data.userId;
    this.server
      .to(`user_${data.receiverId}`)
      .emit('user_stop_typing', { userId });
  }
}
