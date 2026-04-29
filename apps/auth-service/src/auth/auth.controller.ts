import { Body, Controller, Get, Patch, Post, Req, Res, UnauthorizedException, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { existsSync, mkdirSync } from 'fs';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { UserService } from '../user/user.service';
import { AuthService } from './auth.service';
import { LogInDto } from './dto/log-in.dto';
import { SignUpDto } from './dto/sign-up.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { TokenService } from './token.service';

const AVATAR_UPLOAD_DIR = './uploads/avatars';
if (!existsSync(AVATAR_UPLOAD_DIR)) {
    mkdirSync(AVATAR_UPLOAD_DIR, { recursive: true });
}

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const avatarMulterOptions = {
    storage: diskStorage({
        destination: AVATAR_UPLOAD_DIR,
        filename: (req, file, cb) => {
            const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
            cb(null, `${randomName}${extname(file.originalname)}`);
        },
    }),
    fileFilter: (req, file, cb) => {
        if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only jpeg, png, and webp images are allowed'), false);
        }
    },
    limits: { fileSize: 25 * 1024 * 1024 },
};

@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly tokenService: TokenService,
        private readonly userService: UserService,
        private readonly configService: ConfigService,
    ) { }

    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Update current user profile' })
    @ApiResponse({ status: 200, description: 'Profile updated successfully.' })
    @UseGuards(AuthGuard('jwt'))
    @Patch('profile')
    async updateProfile(@Req() req, @Body() updateData: UpdateProfileDto) {
        return this.userService.update(req.user.sub, updateData);
    }

    @ApiOperation({ summary: 'Check if email exists and which providers are linked' })
    @ApiResponse({ status: 200, description: 'Returns email existence and provider flags.' })
    @Post('check-email')
    async checkEmail(@Body('email') email: string) {
        return this.authService.checkEmail(email);
    }

    @ApiOperation({ summary: 'Register a new user' })
    @ApiResponse({ status: 201, description: 'User created, returns accessToken and user object.' })
    @Post('signup')
    async signUp(@Body() signUpDto: SignUpDto, @Res({ passthrough: true }) response: Response) {
        const result = await this.authService.signUp(signUpDto);

        const tokens = await this.tokenService.generateTokens(result.user._id.toString(), result.user.email);
        await this.tokenService.updateUserRefreshToken(result.user._id.toString(), tokens.refreshToken);

        response.cookie('Refresh', tokens.refreshToken, {
            httpOnly: true,
            path: '/',
            secure: process.env.NODE_ENV === 'production',
        });

        return { accessToken: tokens.accessToken, user: result.user };
    }

    @ApiOperation({ summary: 'Login with email and password' })
    @ApiResponse({ status: 200, description: 'Returns accessToken and user object.' })
    @ApiResponse({ status: 401, description: 'Invalid credentials.' })
    @Post('login')
    async logIn(@Body() logInDto: LogInDto, @Res({ passthrough: true }) response: Response) {
        const { accessToken, refreshToken, user } = await this.authService.logIn(logInDto);

        response.cookie('Refresh', refreshToken, {
            httpOnly: true,
            path: '/',
            secure: process.env.NODE_ENV === 'production',
        });

        return { accessToken, user };
    }

    @ApiOperation({ summary: 'Refresh access token using the Refresh cookie' })
    @ApiResponse({ status: 200, description: 'Returns new accessToken.' })
    @Post('refresh')
    async refresh(@Req() req: Request, @Res({ passthrough: true }) response: Response) {
        const refreshToken = req.cookies?.['Refresh'];
        if (!refreshToken) {
            throw new UnauthorizedException('No refresh token');
        }

        const payload = await this.tokenService.verifyToken(
            refreshToken,
            this.configService.get<string>('JWT_REFRESH_TOKEN_SECRET'),
        );

        const tokens = await this.authService.refreshTokens(payload.sub, refreshToken);

        response.cookie('Refresh', tokens.refreshToken, {
            httpOnly: true,
            path: '/',
            secure: process.env.NODE_ENV === 'production',
        });

        return { accessToken: tokens.accessToken };
    }

    @Get('google')
    @UseGuards(AuthGuard('google'))
    async googleAuth(@Req() req) { }

    @Get('google/callback')
    @UseGuards(AuthGuard('google'))
    async googleAuthRedirect(@Req() req, @Res({ passthrough: true }) response: Response) {
        const user = req.user;
        const tokens = await this.tokenService.generateTokens(user._id.toString(), user.email);
        await this.tokenService.updateUserRefreshToken(user._id.toString(), tokens.refreshToken);

        response.cookie('Refresh', tokens.refreshToken, {
            httpOnly: true,
            path: '/',
            secure: process.env.NODE_ENV === 'production',
        });

        const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';
        response.redirect(`${frontendUrl}/auth/callback?accessToken=${tokens.accessToken}&userId=${user._id}`);
    }

    @Get('facebook')
    @UseGuards(AuthGuard('facebook'))
    async facebookAuth(@Req() req) { }

    @Get('facebook/callback')
    @UseGuards(AuthGuard('facebook'))
    async facebookAuthRedirect(@Req() req, @Res({ passthrough: true }) response: Response) {
        const user = req.user;
        const tokens = await this.tokenService.generateTokens(user._id.toString(), user.email);
        await this.tokenService.updateUserRefreshToken(user._id.toString(), tokens.refreshToken);

        response.cookie('Refresh', tokens.refreshToken, {
            httpOnly: true,
            path: '/',
            secure: process.env.NODE_ENV === 'production',
        });

        const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';
        response.redirect(`${frontendUrl}/auth/callback?accessToken=${tokens.accessToken}&userId=${user._id}`);
    }

    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Logout — clears refresh token' })
    @ApiResponse({ status: 200, description: 'Logged out successfully.' })
    @Get('logout')
    @UseGuards(AuthGuard('jwt'))
    async logout(@Req() req, @Res({ passthrough: true }) response: Response) {
        const userId = req.user['sub'];
        await this.authService.logout(userId);
        response.clearCookie('Refresh');
        return true;
    }
}
