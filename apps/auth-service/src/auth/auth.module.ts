import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { UserModule } from '../user/user.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { FacebookStrategy } from './strategies/facebook.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { TokenService } from './token.service';

@Module({
    imports: [
        UserModule,
        JwtModule.register({}),
    ],
    controllers: [AuthController],
    providers: [AuthService, TokenService, GoogleStrategy, FacebookStrategy, JwtStrategy],
})
export class AuthModule { }
