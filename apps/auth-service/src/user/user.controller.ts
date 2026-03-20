import { Controller, Post, Body, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto, UpdateProfileDto } from '../auth/dto/auth.dto';

@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @Get(':id')
  async getUser(@Param('id') id: string) {
    return this.userService.findById(id);
  }

  @Patch(':id')
  async updateUser(@Param('id') id: string, @Body() updateData: UpdateProfileDto) {
    return this.userService.updateProfile(id, updateData);
  }
}
