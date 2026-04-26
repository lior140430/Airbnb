import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ChatService } from './chat.service';

@Controller('chat')
@UseGuards(AuthGuard('jwt'))
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('conversations')
  async getConversations(@Req() req) {
    const userId = req.user._id;
    return this.chatService.getConversations(userId);
  }

  @Get('messages/:userId')
  async getMessages(
    @Req() req,
    @Param('userId') otherUserId: string,
    @Query('page') page = '1',
    @Query('limit') limit = '50',
  ) {
    const userId = req.user._id;
    return this.chatService.getMessages(
      userId,
      otherUserId,
      parseInt(page, 10),
      parseInt(limit, 10),
    );
  }

  @Post('messages')
  async sendMessage(
    @Req() req,
    @Body('receiverId') receiverId: string,
    @Body('text') text: string,
  ) {
    const userId = req.user._id;
    return this.chatService.sendMessage(userId, receiverId, text);
  }

  @Patch('read/:userId')
  async markAsRead(@Req() req, @Param('userId') otherUserId: string) {
    const userId = req.user._id;
    await this.chatService.markAsRead(userId, otherUserId);
    return { success: true };
  }

  @Get('unread')
  async getUnreadCount(@Req() req) {
    const userId = req.user._id;
    const count = await this.chatService.getUnreadCount(userId);
    return { count };
  }
}
