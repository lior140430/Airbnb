import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { UserService } from '../user/user.service';
import { AuthService } from './auth.service';
import { TokenService } from './token.service';

jest.mock('bcrypt');

const mockUserDoc = (overrides: any = {}) => {
    const base = {
        _id: { toString: () => 'user123' },
        email: 'dana@test.com',
        firstName: 'Dana',
        lastName: 'Cohen',
        password: 'hashedpwd',
        googleId: null,
        facebookId: null,
        currentHashedRefreshToken: 'hashedRefresh',
        save: jest.fn().mockImplementation(function () { return Promise.resolve(this); }),
        ...overrides,
    };
    return { ...base, toObject: () => ({ ...base, _id: 'user123' }) };
};

describe('AuthService', () => {
    let service: AuthService;
    let userService: jest.Mocked<Partial<UserService>>;
    let tokenService: jest.Mocked<Partial<TokenService>>;

    beforeEach(async () => {
        userService = {
            findByEmail: jest.fn(),
            findByGoogleId: jest.fn(),
            findByFacebookId: jest.fn(),
            findById: jest.fn(),
            create: jest.fn(),
            removeRefreshToken: jest.fn(),
        };

        tokenService = {
            hashData: jest.fn(),
            generateTokens: jest.fn(),
            updateUserRefreshToken: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                { provide: UserService, useValue: userService },
                { provide: TokenService, useValue: tokenService },
            ],
        }).compile();

        service = module.get<AuthService>(AuthService);
    });

    afterEach(() => jest.clearAllMocks());

    // ─── checkEmail ───
    describe('checkEmail', () => {
        it('returns { exists: false } when user not found', async () => {
            (userService.findByEmail as jest.Mock).mockResolvedValue(null);
            expect(await service.checkEmail('nope@test.com')).toEqual({ exists: false });
        });

        it('returns exists + provider flags when user found', async () => {
            const user = mockUserDoc({ password: 'hashed', googleId: 'g123', facebookId: null });
            (userService.findByEmail as jest.Mock).mockResolvedValue(user);

            const result = await service.checkEmail('dana@test.com');

            expect(result).toEqual({
                exists: true,
                hasPassword: true,
                googleLinked: true,
                facebookLinked: false,
            });
        });

        it('correctly reports hasPassword as false when no password set', async () => {
            const user = mockUserDoc({ password: undefined });
            (userService.findByEmail as jest.Mock).mockResolvedValue(user);
            const result = await service.checkEmail('dana@test.com');
            expect((result as any).hasPassword).toBe(false);
        });
    });

    // ─── signUp ───
    describe('signUp', () => {
        it('throws BadRequestException when email already exists', async () => {
            (userService.findByEmail as jest.Mock).mockResolvedValue(mockUserDoc());
            await expect(
                service.signUp({ email: 'dana@test.com', password: 'Pass1234!', firstName: 'Dana', lastName: 'Cohen' }),
            ).rejects.toThrow(BadRequestException);
        });

        it('creates user, returns user object and accessToken', async () => {
            (userService.findByEmail as jest.Mock).mockResolvedValue(null);
            (tokenService.hashData as jest.Mock).mockResolvedValue('hashedpwd');
            const newUser = mockUserDoc();
            (userService.create as jest.Mock).mockResolvedValue(newUser);
            (tokenService.generateTokens as jest.Mock).mockResolvedValue({
                accessToken: 'access-token',
                refreshToken: 'refresh-token',
            });

            const result = await service.signUp({
                email: 'dana@test.com',
                password: 'Pass1234!',
                firstName: 'Dana',
                lastName: 'Cohen',
            });

            expect(userService.create).toHaveBeenCalledWith(
                expect.objectContaining({ email: 'dana@test.com', password: 'hashedpwd' }),
            );
            expect(result.accessToken).toBe('access-token');
            expect(result.user).not.toHaveProperty('password');
            expect(result.user).not.toHaveProperty('currentHashedRefreshToken');
        });
    });

    // ─── logIn ───
    describe('logIn', () => {
        it('throws UnauthorizedException when user not found', async () => {
            (userService.findByEmail as jest.Mock).mockResolvedValue(null);
            await expect(
                service.logIn({ email: 'nope@test.com', password: 'Pass1234!' }),
            ).rejects.toThrow(UnauthorizedException);
        });

        it('throws UnauthorizedException when password does not match', async () => {
            (userService.findByEmail as jest.Mock).mockResolvedValue(mockUserDoc());
            (bcrypt.compare as jest.Mock).mockResolvedValue(false);
            await expect(
                service.logIn({ email: 'dana@test.com', password: 'wrong' }),
            ).rejects.toThrow(UnauthorizedException);
        });

        it('returns tokens and sanitised user on success', async () => {
            (userService.findByEmail as jest.Mock).mockResolvedValue(mockUserDoc());
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);
            (tokenService.generateTokens as jest.Mock).mockResolvedValue({
                accessToken: 'access',
                refreshToken: 'refresh',
            });
            (tokenService.updateUserRefreshToken as jest.Mock).mockResolvedValue(undefined);

            const result = await service.logIn({ email: 'dana@test.com', password: 'Pass1234!' });

            expect(result.accessToken).toBe('access');
            expect(result.refreshToken).toBe('refresh');
            expect(result.user).not.toHaveProperty('password');
        });
    });

    // ─── logout ───
    describe('logout', () => {
        it('calls removeRefreshToken with userId', async () => {
            (userService.removeRefreshToken as jest.Mock).mockResolvedValue(undefined);
            await service.logout('user123');
            expect(userService.removeRefreshToken).toHaveBeenCalledWith('user123');
        });
    });

    // ─── validateGoogleUser ───
    describe('validateGoogleUser', () => {
        const details = { email: 'dana@test.com', firstName: 'Dana', lastName: 'Cohen', googleId: 'g123' };

        it('returns existing user found by googleId', async () => {
            const user = mockUserDoc({ googleId: 'g123' });
            (userService.findByGoogleId as jest.Mock).mockResolvedValue(user);
            const result = await service.validateGoogleUser(details);
            expect(result).toBe(user);
        });

        it('links googleId to existing user found by email', async () => {
            const user = mockUserDoc({ googleId: null });
            (userService.findByGoogleId as jest.Mock).mockResolvedValue(null);
            (userService.findByEmail as jest.Mock).mockResolvedValue(user);
            const result = await service.validateGoogleUser(details);
            expect(result.googleId).toBe('g123');
            expect(user.save).toHaveBeenCalled();
        });

        it('creates new user when no matching user found', async () => {
            (userService.findByGoogleId as jest.Mock).mockResolvedValue(null);
            (userService.findByEmail as jest.Mock).mockResolvedValue(null);
            const newUser = mockUserDoc({ googleId: 'g123' });
            (userService.create as jest.Mock).mockResolvedValue(newUser);

            const result = await service.validateGoogleUser(details);

            expect(userService.create).toHaveBeenCalledWith(
                expect.objectContaining({ email: details.email, googleId: details.googleId }),
            );
            expect(result).toBe(newUser);
        });
    });

    // ─── refreshTokens ───
    describe('refreshTokens', () => {
        it('throws UnauthorizedException when user not found', async () => {
            (userService.findById as jest.Mock).mockResolvedValue(null);
            await expect(service.refreshTokens('user123', 'rt')).rejects.toThrow(UnauthorizedException);
        });

        it('throws UnauthorizedException when stored hash is missing', async () => {
            (userService.findById as jest.Mock).mockResolvedValue(
                mockUserDoc({ currentHashedRefreshToken: null }),
            );
            await expect(service.refreshTokens('user123', 'rt')).rejects.toThrow(UnauthorizedException);
        });

        it('throws UnauthorizedException when refresh token does not match', async () => {
            (userService.findById as jest.Mock).mockResolvedValue(mockUserDoc());
            (bcrypt.compare as jest.Mock).mockResolvedValue(false);
            await expect(service.refreshTokens('user123', 'wrong-rt')).rejects.toThrow(UnauthorizedException);
        });

        it('returns new tokens when refresh token matches', async () => {
            (userService.findById as jest.Mock).mockResolvedValue(mockUserDoc());
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);
            (tokenService.generateTokens as jest.Mock).mockResolvedValue({
                accessToken: 'new-access',
                refreshToken: 'new-refresh',
            });
            (tokenService.updateUserRefreshToken as jest.Mock).mockResolvedValue(undefined);

            const result = await service.refreshTokens('user123', 'valid-rt');

            expect(result.accessToken).toBe('new-access');
            expect(result.refreshToken).toBe('new-refresh');
        });

        it('calls updateUserRefreshToken with new refresh token', async () => {
            (userService.findById as jest.Mock).mockResolvedValue(mockUserDoc());
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);
            (tokenService.generateTokens as jest.Mock).mockResolvedValue({
                accessToken: 'a',
                refreshToken: 'new-rt',
            });
            (tokenService.updateUserRefreshToken as jest.Mock).mockResolvedValue(undefined);

            await service.refreshTokens('user123', 'valid-rt');

            expect(tokenService.updateUserRefreshToken).toHaveBeenCalledWith('user123', 'new-rt');
        });
    });

    // ─── validateFacebookUser ───
    describe('validateFacebookUser', () => {
        const details = { email: 'dana@test.com', firstName: 'Dana', lastName: 'Cohen', facebookId: 'fb456' };

        it('returns existing user found by facebookId', async () => {
            const user = mockUserDoc({ facebookId: 'fb456' });
            (userService.findByFacebookId as jest.Mock).mockResolvedValue(user);
            const result = await service.validateFacebookUser(details);
            expect(result).toBe(user);
        });

        it('links facebookId to existing user found by email', async () => {
            const user = mockUserDoc({ facebookId: null });
            (userService.findByFacebookId as jest.Mock).mockResolvedValue(null);
            (userService.findByEmail as jest.Mock).mockResolvedValue(user);
            const result = await service.validateFacebookUser(details);
            expect(result.facebookId).toBe('fb456');
            expect(user.save).toHaveBeenCalled();
        });

        it('creates new user when no matching user found', async () => {
            (userService.findByFacebookId as jest.Mock).mockResolvedValue(null);
            (userService.findByEmail as jest.Mock).mockResolvedValue(null);
            const newUser = mockUserDoc({ facebookId: 'fb456' });
            (userService.create as jest.Mock).mockResolvedValue(newUser);

            const result = await service.validateFacebookUser(details);

            expect(userService.create).toHaveBeenCalledWith(
                expect.objectContaining({ email: details.email, facebookId: details.facebookId }),
            );
            expect(result).toBe(newUser);
        });
    });

    // ─── signUp extra coverage ───
    describe('signUp (extra)', () => {
        it('only returns accessToken (no refresh token) on sign up', async () => {
            (userService.findByEmail as jest.Mock).mockResolvedValue(null);
            (tokenService.hashData as jest.Mock).mockResolvedValue('hashedpwd');
            (userService.create as jest.Mock).mockResolvedValue(mockUserDoc());
            (tokenService.generateTokens as jest.Mock).mockResolvedValue({
                accessToken: 'access-only',
                refreshToken: 'rt',
            });

            const result = await service.signUp({ email: 'new@test.com', password: 'Pass1234!', firstName: 'X', lastName: 'Y' });

            expect(result.accessToken).toBe('access-only');
            expect(result).not.toHaveProperty('refreshToken');
        });
    });

    // ─── logIn extra coverage ───
    describe('logIn (extra)', () => {
        it('throws UnauthorizedException when user has no password (OAuth-only account)', async () => {
            (userService.findByEmail as jest.Mock).mockResolvedValue(mockUserDoc({ password: undefined }));
            (bcrypt.compare as jest.Mock).mockResolvedValue(false);
            await expect(
                service.logIn({ email: 'dana@test.com', password: 'Pass1234!' }),
            ).rejects.toThrow(UnauthorizedException);
        });

        it('stores hashed refresh token after successful login', async () => {
            (userService.findByEmail as jest.Mock).mockResolvedValue(mockUserDoc());
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);
            (tokenService.generateTokens as jest.Mock).mockResolvedValue({
                accessToken: 'a',
                refreshToken: 'rt',
            });
            (tokenService.updateUserRefreshToken as jest.Mock).mockResolvedValue(undefined);

            await service.logIn({ email: 'dana@test.com', password: 'Pass1234!' });

            expect(tokenService.updateUserRefreshToken).toHaveBeenCalledWith('user123', 'rt');
        });
    });

    // ─── checkEmail extra coverage ───
    describe('checkEmail (extra)', () => {
        it('reports both providers linked when user has google and facebook', async () => {
            const user = mockUserDoc({ password: 'hashed', googleId: 'g123', facebookId: 'fb456' });
            (userService.findByEmail as jest.Mock).mockResolvedValue(user);
            const result = await service.checkEmail('dana@test.com') as any;
            expect(result.googleLinked).toBe(true);
            expect(result.facebookLinked).toBe(true);
        });
    });
});
