import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { ThrottlerModule } from '@nestjs/throttler';
import { JwtStrategy } from './auth/jwt.strategy';
import { PropertyModule } from './property/property.module';
import { ChatModule } from './chat/chat.module';
import { join } from 'path';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true, envFilePath: join(__dirname, '..', '.env') }),
        ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }]),
        MongooseModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                uri: configService.get<string>('MONGODB_URI'),
            }),
            inject: [ConfigService],
        }),
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.registerAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                secret: configService.get<string>('JWT_ACCESS_TOKEN_SECRET'),
            }),
            inject: [ConfigService],
        }),
        PropertyModule,
        ChatModule,
    ],
    providers: [JwtStrategy],
    exports: [JwtModule, PassportModule],
})
export class AppModule { }
