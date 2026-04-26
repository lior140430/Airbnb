import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';

const mockUserDoc = (overrides: any = {}) => {
    const base = {
        _id: 'user123',
        email: 'dana@test.com',
        firstName: 'Dana',
        lastName: 'Cohen',
        password: 'hashed',
        currentHashedRefreshToken: 'token',
        ...overrides,
    };
    return {
        ...base,
        toObject: () => base,
    };
};

describe('UserController', () => {
    let controller: UserController;
    let userService: jest.Mocked<UserService>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [UserController],
            providers: [
                {
                    provide: UserService,
                    useValue: {
                        search: jest.fn(),
                        findById: jest.fn(),
                        update: jest.fn(),
                    },
                },
            ],
        }).compile();

        controller = module.get<UserController>(UserController);
        userService = module.get(UserService);
    });

    afterEach(() => jest.clearAllMocks());

    // ─── GET /users/search ───
    describe('searchUsers', () => {
        it('returns sanitised user list without sensitive fields', async () => {
            const doc = mockUserDoc();
            userService.search.mockResolvedValue([doc] as any);
            const req = { user: { sub: 'user123' } };

            const result = await controller.searchUsers(req as any, 'dana');

            expect(userService.search).toHaveBeenCalledWith('dana', 'user123');
            expect(result[0]).not.toHaveProperty('password');
            expect(result[0]).not.toHaveProperty('currentHashedRefreshToken');
        });

        it('returns empty array when service returns []', async () => {
            userService.search.mockResolvedValue([]);
            const result = await controller.searchUsers({ user: { sub: 'x' } } as any, 'zz');
            expect(result).toEqual([]);
        });
    });

    // ─── GET /users/:id ───
    describe('getUser', () => {
        it('returns sanitised user when found', async () => {
            const doc = mockUserDoc();
            userService.findById.mockResolvedValue(doc as any);

            const result = await controller.getUser('user123');

            expect(userService.findById).toHaveBeenCalledWith('user123');
            expect(result).not.toHaveProperty('password');
            expect(result).not.toHaveProperty('currentHashedRefreshToken');
            expect((result as any).email).toBe('dana@test.com');
        });

        it('throws NotFoundException when user not found', async () => {
            userService.findById.mockResolvedValue(null);
            await expect(controller.getUser('nonexistent')).rejects.toThrow(NotFoundException);
        });
    });

    // ─── PATCH /users/:id ───
    describe('updateUser', () => {
        it('updates and returns user when requester matches id', async () => {
            const updated = mockUserDoc({ firstName: 'New' });
            userService.update.mockResolvedValue(updated as any);
            const req = { user: { sub: 'user123' } };

            const result = await controller.updateUser('user123', req as any, { firstName: 'New' } as any);

            expect(userService.update).toHaveBeenCalledWith('user123', { firstName: 'New' });
            expect(result?.firstName).toBe('New');
        });

        it('throws ForbiddenException when requester does not match id', async () => {
            const req = { user: { sub: 'other-user' } };
            await expect(
                controller.updateUser('user123', req as any, {} as any),
            ).rejects.toThrow(ForbiddenException);
            expect(userService.update).not.toHaveBeenCalled();
        });
    });
});
