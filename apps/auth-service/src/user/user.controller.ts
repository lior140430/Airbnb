import { Body, Controller, ForbiddenException, Get, NotFoundException, Param, Patch, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserService } from './user.service';
import { UpdateProfileDto } from '../auth/dto/update-profile.dto';

@Controller('users')
export class UserController {
    constructor(private readonly userService: UserService) { }

    @Get(':id')
    async getUser(@Param('id') id: string) {
        const user = await this.userService.findById(id);
        if (!user) {
            throw new NotFoundException('User not found');
        }

        const { password, currentHashedRefreshToken, ...result } = user.toObject();
        return result;
    }

    @UseGuards(AuthGuard('jwt'))
    @Patch(':id')
    async updateUser(@Param('id') id: string, @Req() req, @Body() updateData: UpdateProfileDto) {
        if (req.user.sub !== id) {
            throw new ForbiddenException('You can only update your own profile');
        }
        return this.userService.update(id, updateData);
    }
}
