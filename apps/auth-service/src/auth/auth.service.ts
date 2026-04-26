import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserService } from '../user/user.service';
import { LogInDto } from './dto/log-in.dto';
import { SignUpDto } from './dto/sign-up.dto';
import { TokenService } from './token.service';

@Injectable()
export class AuthService {
    constructor(
        private readonly userService: UserService,
        private readonly tokenService: TokenService,
    ) { }

    async checkEmail(email: string) {
        const user = await this.userService.findByEmail(email);
        if (!user) {
            return { exists: false };
        }
        return {
            exists: true,
            hasPassword: !!user.password,
            googleLinked: !!user.googleId,
            facebookLinked: !!user.facebookId
        };
    }

    async signUp(signUpDto: SignUpDto) {
        const existingUser = await this.userService.findByEmail(signUpDto.email);
        if (existingUser) {
            throw new BadRequestException('User already exists with this email');
        }

        const hashedPassword = await this.tokenService.hashData(signUpDto.password);
        const user = await this.userService.create({
            ...signUpDto,
            password: hashedPassword,
        });

        const { password, currentHashedRefreshToken, ...result } = user.toObject();
        return { user: result, accessToken: (await this.tokenService.generateTokens(user._id.toString(), user.email)).accessToken };
    }

    async logIn(logInDto: LogInDto) {
        const user = await this.userService.findByEmail(logInDto.email);
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const isPasswordMatching = await bcrypt.compare(logInDto.password, user.password);
        if (!isPasswordMatching) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const tokens = await this.tokenService.generateTokens(user._id.toString(), user.email);
        await this.tokenService.updateUserRefreshToken(user._id.toString(), tokens.refreshToken);

        const { password, currentHashedRefreshToken, ...userResult } = user.toObject();

        return {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            user: userResult,
        };
    }

    async logout(userId: string) {
        return this.userService.removeRefreshToken(userId);
    }

    async validateGoogleUser(details: any) {
        let user = await this.userService.findByGoogleId(details.googleId);
        if (user) return user;

        user = await this.userService.findByEmail(details.email);
        if (user) {
            user.googleId = details.googleId;
            return user.save();
        }

        return this.userService.create({
            email: details.email,
            firstName: details.firstName,
            lastName: details.lastName,
            googleId: details.googleId,
        });
    }

    async validateFacebookUser(details: any) {
        let user = await this.userService.findByFacebookId(details.facebookId);
        if (user) return user;

        user = await this.userService.findByEmail(details.email);
        if (user) {
            user.facebookId = details.facebookId;
            return user.save();
        }

        return this.userService.create({
            email: details.email,
            firstName: details.firstName,
            lastName: details.lastName,
            facebookId: details.facebookId,
        });
    }

    async refreshTokens(userId: string, refreshToken: string) {
        const user = await this.userService.findById(userId);
        if (!user || !user.currentHashedRefreshToken) {
            throw new UnauthorizedException('Access Denied');
        }

        const refreshTokenMatches = await bcrypt.compare(refreshToken, user.currentHashedRefreshToken);
        if (!refreshTokenMatches) throw new UnauthorizedException('Access Denied');

        const tokens = await this.tokenService.generateTokens(user._id.toString(), user.email);
        await this.tokenService.updateUserRefreshToken(user._id.toString(), tokens.refreshToken);

        return tokens;
    }
}