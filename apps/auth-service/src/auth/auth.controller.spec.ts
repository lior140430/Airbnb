import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { Request, Response } from 'express';
import { UserService } from '../user/user.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TokenService } from './token.service';

const mockUser = {
    _id: { toString: () => 'user123' },
    email: 'dana@test.com',
    firstName: 'Dana',
    lastName: 'Cohen',
    toObject: () => ({ _id: 'user123', email: 'dana@test.com', firstName: 'Dana', lastName: 'Cohen' }),
};

const mockResponse = () => ({
    cookie: jest.fn(),
    clearCookie: jest.fn(),
}) as unknown as Response;

describe('AuthController', () => {
    let controller: AuthController;
    let authService: jest.Mocked<Partial<AuthService>>;
    let tokenService: jest.Mocked<Partial<TokenService>>;
    let userService: jest.Mocked<Partial<UserService>>;
    let configService: jest.Mocked<Partial<ConfigService>>;

    beforeEach(async () => {
        authService = {
            checkEmail: jest.fn(),
            signUp: jest.fn(),
            logIn: jest.fn(),
            logout: jest.fn(),
        };

        tokenService = {
            generateTokens: jest.fn(),
            updateUserRefreshToken: jest.fn(),
            verifyToken: jest.fn(),
        };

        userService = {
            update: jest.fn(),
            findById: jest.fn(),
        };

        configService = {
            get: jest.fn().mockReturnValue('secret'),
        };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [AuthController],
            providers: [
                { provide: AuthService, useValue: authService },
                { provide: TokenService, useValue: tokenService },
                { provide: UserService, useValue: userService },
                { provide: ConfigService, useValue: configService },
                { provide: JwtService, useValue: {} },
            ],
        }).compile();

        controller = module.get<AuthController>(AuthController);
    });

    afterEach(() => jest.clearAllMocks());

    // ─── POST /auth/check-email ───
    describe('checkEmail', () => {
        it('returns result from authService.checkEmail', async () => {
            (authService.checkEmail as jest.Mock).mockResolvedValue({ exists: false });
            const result = await controller.checkEmail('dana@test.com');
            expect(authService.checkEmail).toHaveBeenCalledWith('dana@test.com');
            expect(result).toEqual({ exists: false });
        });
    });

    // ─── POST /auth/signup ───
    describe('signUp', () => {
        it('sets Refresh cookie and returns accessToken + user', async () => {
            (authService.signUp as jest.Mock).mockResolvedValue({ user: mockUser, accessToken: 'ignored' });
            (tokenService.generateTokens as jest.Mock).mockResolvedValue({
                accessToken: 'access-token',
                refreshToken: 'refresh-token',
            });
            (tokenService.updateUserRefreshToken as jest.Mock).mockResolvedValue(undefined);

            const res = mockResponse();
            const dto = { email: 'dana@test.com', password: 'Pass1234!', firstName: 'Dana', lastName: 'Cohen' };
            const result = await controller.signUp(dto as any, res);

            expect(res.cookie).toHaveBeenCalledWith(
                'Refresh',
                'refresh-token',
                expect.objectContaining({ httpOnly: true }),
            );
            expect(result.accessToken).toBe('access-token');
        });
    });

    // ─── POST /auth/login ───
    describe('logIn', () => {
        it('sets Refresh cookie and returns accessToken + user', async () => {
            (authService.logIn as jest.Mock).mockResolvedValue({
                accessToken: 'access-token',
                refreshToken: 'refresh-token',
                user: mockUser,
            });

            const res = mockResponse();
            const result = await controller.logIn({ email: 'dana@test.com', password: 'Pass1234!' } as any, res);

            expect(res.cookie).toHaveBeenCalledWith(
                'Refresh',
                'refresh-token',
                expect.objectContaining({ httpOnly: true }),
            );
            expect(result.accessToken).toBe('access-token');
            expect(result.user).toBe(mockUser);
        });
    });

    // ─── POST /auth/refresh ───
    describe('refresh', () => {
        it('throws UnauthorizedException when no refresh cookie', async () => {
            const req = { cookies: {} } as Request;
            const res = mockResponse();
            await expect(controller.refresh(req, res)).rejects.toThrow(UnauthorizedException);
        });

        it('returns new accessToken when refresh token is valid', async () => {
            (tokenService.verifyToken as jest.Mock).mockResolvedValue({ sub: 'user123', email: 'dana@test.com' });
            const user = { ...mockUser, currentHashedRefreshToken: 'hashed' };
            (userService.findById as jest.Mock).mockResolvedValue(user);
            (tokenService.updateUserRefreshToken as jest.Mock).mockResolvedValue(undefined);
            (tokenService.generateTokens as jest.Mock).mockResolvedValue({
                accessToken: 'new-access',
                refreshToken: 'new-refresh',
            });

            const req = { cookies: { Refresh: 'valid-refresh-token' } } as any;
            const res = mockResponse();
            const result = await controller.refresh(req, res);

            expect(result.accessToken).toBe('new-access');
            expect(res.cookie).toHaveBeenCalledWith(
                'Refresh',
                'new-refresh',
                expect.objectContaining({ httpOnly: true }),
            );
        });
    });

    // ─── PATCH /auth/profile ───
    describe('updateProfile', () => {
        it('updates user profile via userService', async () => {
            const updated = { ...mockUser, firstName: 'NewName' };
            (userService.update as jest.Mock).mockResolvedValue(updated);

            const req = { user: { sub: 'user123' } };
            const result = await controller.updateProfile(req as any, { firstName: 'NewName' } as any);

            expect(userService.update).toHaveBeenCalledWith('user123', { firstName: 'NewName' });
            expect(result.firstName).toBe('NewName');
        });
    });
});
