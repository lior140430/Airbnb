import { Controller, Post, Get, Body, UseGuards, Req, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { CreateUserDto, LoginDto } from './dto/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private userService: UserService,
  ) {}

  @Post('signup')
  async signup(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(
      createUserDto.email,
      createUserDto.password,
      createUserDto.name,
    );
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    const user = await this.userService.findByEmail(loginDto.email);
    if (!user) return { error: 'Invalid credentials' };
    const tokens = await this.authService.login(user);
    return tokens;
  }

  @Get('google')
  async googleAuth() {
    return { message: 'Google auth initiated' };
  }

  @Get('google/callback')
  async googleCallback(@Req() req: any) {
    return { user: req.user };
  }

  @Post('refresh')
  async refresh(@Body('refreshToken') token: string) {
    const payload = await this.authService.login({ _id: payload.sub, email: payload.email });
    return payload;
  }
}
