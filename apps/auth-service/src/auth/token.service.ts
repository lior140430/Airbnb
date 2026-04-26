import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserService } from '../user/user.service';

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly userService: UserService,
  ) { }

  async generateTokens(userId: string, email: string) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { sub: userId, email },
        {
          secret: this.configService.get<string>('JWT_ACCESS_TOKEN_SECRET'),
          expiresIn: this.configService.get<string>('JWT_ACCESS_TOKEN_EXPIRATION_TIME'),
        },
      ),
      this.jwtService.signAsync(
        { sub: userId, email },
        {
          secret: this.configService.get<string>('JWT_REFRESH_TOKEN_SECRET'),
          expiresIn: this.configService.get<string>('JWT_REFRESH_TOKEN_EXPIRATION_TIME'),
        },
      ),
    ]);

    return { accessToken, refreshToken };
  }

  async hashRefreshToken(token: string): Promise<string> {
    const salt = await bcrypt.genSalt();
    return bcrypt.hash(token, salt);
  }

  async updateUserRefreshToken(userId: string, refreshToken: string) {
    const hashedRefreshToken = await this.hashRefreshToken(refreshToken);
    await this.userService.setCurrentRefreshToken(hashedRefreshToken, userId);
  }

  async hashData(data: string): Promise<string> {
    const salt = await bcrypt.genSalt();
    return bcrypt.hash(data, salt);
  }

  async verifyToken(token: string, secret: string) {
    return this.jwtService.verifyAsync(token, { secret });
  }
}
