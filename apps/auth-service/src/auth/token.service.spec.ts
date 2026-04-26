import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from '../user/user.service';
import { TokenService } from './token.service';

describe('TokenService', () => {
    let service: TokenService;
    let jwtService: jest.Mocked<Partial<JwtService>>;
    let userService: jest.Mocked<Partial<UserService>>;

    beforeEach(async () => {
        jwtService = {
            signAsync: jest.fn(),
            verifyAsync: jest.fn(),
        };

        userService = {
            setCurrentRefreshToken: jest.fn(),
        };

        const configService = {
            get: jest.fn().mockImplementation((key: string) => {
                const values: Record<string, string> = {
                    JWT_ACCESS_TOKEN_SECRET: 'access-secret',
                    JWT_ACCESS_TOKEN_EXPIRATION_TIME: '15m',
                    JWT_REFRESH_TOKEN_SECRET: 'refresh-secret',
                    JWT_REFRESH_TOKEN_EXPIRATION_TIME: '7d',
                };
                return values[key];
            }),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TokenService,
                { provide: JwtService, useValue: jwtService },
                { provide: ConfigService, useValue: configService },
                { provide: UserService, useValue: userService },
            ],
        }).compile();

        service = module.get<TokenService>(TokenService);
    });

    afterEach(() => jest.clearAllMocks());

    // ─── generateTokens ───
    describe('generateTokens', () => {
        it('returns accessToken and refreshToken', async () => {
            (jwtService.signAsync as jest.Mock)
                .mockResolvedValueOnce('access-token')
                .mockResolvedValueOnce('refresh-token');

            const result = await service.generateTokens('user123', 'dana@test.com');

            expect(result.accessToken).toBe('access-token');
            expect(result.refreshToken).toBe('refresh-token');
        });

        it('calls signAsync twice with correct payloads', async () => {
            (jwtService.signAsync as jest.Mock).mockResolvedValue('token');
            await service.generateTokens('user123', 'dana@test.com');

            expect(jwtService.signAsync).toHaveBeenCalledTimes(2);
            expect((jwtService.signAsync as jest.Mock).mock.calls[0][0]).toEqual(
                expect.objectContaining({ sub: 'user123', email: 'dana@test.com' }),
            );
        });
    });

    // ─── hashData ───
    describe('hashData', () => {
        it('returns a bcrypt hash (starts with $2)', async () => {
            const hashed = await service.hashData('mypassword');
            expect(hashed).toMatch(/^\$2/);
        });

        it('produces a different hash each call (random salt)', async () => {
            const h1 = await service.hashData('same');
            const h2 = await service.hashData('same');
            expect(h1).not.toBe(h2);
        });
    });

    // ─── hashRefreshToken ───
    describe('hashRefreshToken', () => {
        it('returns a bcrypt hash', async () => {
            const hashed = await service.hashRefreshToken('my-refresh-token');
            expect(hashed).toMatch(/^\$2/);
        });
    });

    // ─── updateUserRefreshToken ───
    describe('updateUserRefreshToken', () => {
        it('hashes the token and calls setCurrentRefreshToken', async () => {
            (userService.setCurrentRefreshToken as jest.Mock).mockResolvedValue(undefined);

            await service.updateUserRefreshToken('user123', 'refresh-token');

            expect(userService.setCurrentRefreshToken).toHaveBeenCalledWith(
                expect.stringMatching(/^\$2/),
                'user123',
            );
        });
    });

    // ─── verifyToken ───
    describe('verifyToken', () => {
        it('calls jwtService.verifyAsync with token and secret', async () => {
            const payload = { sub: 'user123', email: 'dana@test.com' };
            (jwtService.verifyAsync as jest.Mock).mockResolvedValue(payload);

            const result = await service.verifyToken('some-token', 'access-secret');

            expect(jwtService.verifyAsync).toHaveBeenCalledWith('some-token', { secret: 'access-secret' });
            expect(result).toEqual(payload);
        });

        it('throws when token is invalid', async () => {
            (jwtService.verifyAsync as jest.Mock).mockRejectedValue(new Error('invalid token'));
            await expect(service.verifyToken('bad-token', 'secret')).rejects.toThrow('invalid token');
        });
    });
});
