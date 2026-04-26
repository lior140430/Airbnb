import { Body, Controller, ForbiddenException, Get, NotFoundException, Param, Patch, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserService } from './user.service';
import { UpdateProfileDto } from '../auth/dto/update-profile.dto';

@ApiTags('users')
@Controller('users')
export class UserController {
    constructor(private readonly userService: UserService) { }

    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Search users by name or email' })
    @ApiQuery({ name: 'q', required: false, description: 'Search query' })
    @ApiResponse({ status: 200, description: 'Returns a list of matching users.' })
    @UseGuards(AuthGuard('jwt'))
    @Get('search')
    async searchUsers(@Req() req, @Query('q') q: string) {
        const users = await this.userService.search(q, req.user.sub);
        return users.map((u) => {
            const { password, currentHashedRefreshToken, ...rest } = u.toObject();
            return rest;
        });
    }

    @ApiOperation({ summary: 'Get user by ID' })
    @ApiResponse({ status: 200, description: 'Returns user object.' })
    @ApiResponse({ status: 404, description: 'User not found.' })
    @Get(':id')
    async getUser(@Param('id') id: string) {
        const user = await this.userService.findById(id);
        if (!user) {
            throw new NotFoundException('User not found');
        }

        const { password, currentHashedRefreshToken, ...result } = user.toObject();
        return result;
    }

    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Update user profile' })
    @ApiResponse({ status: 200, description: 'Profile updated successfully.' })
    @ApiResponse({ status: 403, description: 'Forbidden — can only update your own profile.' })
    @UseGuards(AuthGuard('jwt'))
    @Patch(':id')
    async updateUser(@Param('id') id: string, @Req() req, @Body() updateData: UpdateProfileDto) {
        if (req.user.sub !== id) {
            throw new ForbiddenException('You can only update your own profile');
        }
        return this.userService.update(id, updateData);
    }
}
