import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { AiSearchService } from '../ai/ai-search.service';
import { PropertyController } from './property.controller';
import { PropertyService } from './property.service';

const validObjectId = new Types.ObjectId().toHexString();

const mockProperty = {
    _id: validObjectId,
    title: 'Sunny Apartment',
    price: 500,
    ownerId: 'user123',
};

describe('PropertyController', () => {
    let controller: PropertyController;
    let propertyService: jest.Mocked<Partial<PropertyService>>;
    let aiSearchService: jest.Mocked<Partial<AiSearchService>>;

    beforeEach(async () => {
        propertyService = {
            create: jest.fn(),
            seed: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
            toggleLike: jest.fn(),
            addComment: jest.fn(),
            getComments: jest.fn(),
        };

        aiSearchService = {
            parseQuery: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [PropertyController],
            providers: [
                { provide: PropertyService, useValue: propertyService },
                { provide: AiSearchService, useValue: aiSearchService },
            ],
        }).compile();

        controller = module.get<PropertyController>(PropertyController);
    });

    afterEach(() => jest.clearAllMocks());

    // ─── POST /properties ───
    describe('create', () => {
        it('passes userId from req.user._id and returns created property', async () => {
            (propertyService.create as jest.Mock).mockResolvedValue(mockProperty);
            const req = { user: { _id: 'user123' } };
            const dto = { title: 'Test', price: 500, description: 'desc', location: { city: 'TA', street: 'Herzl 1' } };

            const result = await controller.create(dto as any, [], req as any);

            expect(propertyService.create).toHaveBeenCalledWith(dto, 'user123', []);
            expect(result).toEqual(mockProperty);
        });

        it('normalizes uploaded file paths to forward slashes', async () => {
            (propertyService.create as jest.Mock).mockResolvedValue(mockProperty);
            const req = { user: { _id: 'user123' } };
            const dto = { title: 'Test', price: 500, description: 'desc', location: { city: 'TA', street: 'Herzl 1' } };
            const files = [{ path: 'uploads\\properties\\abc.jpg' }] as any;

            await controller.create(dto as any, files, req as any);

            expect(propertyService.create).toHaveBeenCalledWith(dto, 'user123', ['uploads/properties/abc.jpg']);
        });
    });

    // ─── POST /properties/seed ───
    describe('seed', () => {
        it('calls propertyService.seed and returns message', async () => {
            (propertyService.seed as jest.Mock).mockResolvedValue(undefined);
            const result = await controller.seed();
            expect(propertyService.seed).toHaveBeenCalled();
            expect(result).toEqual({ message: 'Seeding initiated' });
        });
    });

    // ─── GET /properties/me ───
    describe('findMyProperties', () => {
        it('calls findAll with owner set to current user', async () => {
            (propertyService.findAll as jest.Mock).mockResolvedValue([mockProperty]);
            const req = { user: { _id: 'user123' } };

            const result = await controller.findMyProperties(req as any, 1, 10);

            expect(propertyService.findAll).toHaveBeenCalledWith(1, 10, 'user123', 'user123');
            expect(result).toEqual([mockProperty]);
        });
    });

    // ─── GET /properties/ai-search ───
    describe('aiSearch', () => {
        it('uses AI-parsed filters and returns properties', async () => {
            (aiSearchService.parseQuery as jest.Mock).mockResolvedValue({
                location: 'Tel Aviv',
                guests: 2,
                amenities: ['wifi'],
            });
            (propertyService.findAll as jest.Mock).mockResolvedValue([mockProperty]);

            const req = { user: { _id: 'user123' } };
            const result = await controller.aiSearch('apartment in Tel Aviv', '', '', '', undefined, 1, 10, req as any);

            expect(aiSearchService.parseQuery).toHaveBeenCalledWith('apartment in Tel Aviv');
            expect(propertyService.findAll).toHaveBeenCalledWith(
                1, 10, undefined, 'user123',
                expect.objectContaining({ location: 'Tel Aviv' }),
            );
            expect(result).toEqual([mockProperty]);
        });

        it('explicit query params override AI-parsed values', async () => {
            (aiSearchService.parseQuery as jest.Mock).mockResolvedValue({ location: 'Haifa' });
            (propertyService.findAll as jest.Mock).mockResolvedValue([]);

            const req = { user: { _id: 'user123' } };
            await controller.aiSearch('q', 'Eilat', '', '', 5, 1, 10, req as any);

            expect(propertyService.findAll).toHaveBeenCalledWith(
                1, 10, undefined, 'user123',
                expect.objectContaining({ location: 'Eilat', guests: 5 }),
            );
        });
    });

    // ─── GET /properties ───
    describe('findAll', () => {
        it('returns paginated list with filters', async () => {
            (propertyService.findAll as jest.Mock).mockResolvedValue([mockProperty]);
            const req = { user: null };

            const result = await controller.findAll(1, 10, 'apartment', 'Tel Aviv', '', '', 2, '', req as any);

            expect(propertyService.findAll).toHaveBeenCalledWith(
                1, 10, undefined, undefined,
                expect.objectContaining({ q: 'apartment', location: 'Tel Aviv', guests: 2 }),
            );
            expect(result).toEqual([mockProperty]);
        });

        it('defaults to page 1, limit 10', async () => {
            (propertyService.findAll as jest.Mock).mockResolvedValue([]);
            const req = { user: null };
            await controller.findAll(undefined as any, undefined as any, '', '', '', '', undefined as any, '', req as any);
            expect(propertyService.findAll).toHaveBeenCalledWith(1, 10, undefined, undefined, expect.any(Object));
        });
    });

    // ─── GET /properties/:id ───
    describe('findOne', () => {
        it('calls findOne with id and currentUserId', async () => {
            (propertyService.findOne as jest.Mock).mockResolvedValue(mockProperty);
            const req = { user: { _id: 'user123' } };

            const result = await controller.findOne(validObjectId, req as any);

            expect(propertyService.findOne).toHaveBeenCalledWith(validObjectId, 'user123');
            expect(result).toEqual(mockProperty);
        });
    });

    // ─── PATCH /properties/:id ───
    describe('update', () => {
        it('updates property with user id', async () => {
            const updated = { ...mockProperty, price: 600 };
            (propertyService.update as jest.Mock).mockResolvedValue(updated);
            const req = { user: { _id: 'user123' } };

            const result = await controller.update(validObjectId, { price: 600 } as any, req as any);

            expect(propertyService.update).toHaveBeenCalledWith(validObjectId, { price: 600 }, 'user123');
            expect(result).toEqual(updated);
        });
    });

    // ─── DELETE /properties/:id ───
    describe('remove', () => {
        it('removes property with user id', async () => {
            (propertyService.remove as jest.Mock).mockResolvedValue(mockProperty);
            const req = { user: { _id: 'user123' } };

            const result = await controller.remove(validObjectId, req as any);

            expect(propertyService.remove).toHaveBeenCalledWith(validObjectId, 'user123');
            expect(result).toEqual(mockProperty);
        });
    });

    // ─── POST /properties/:id/like ───
    describe('toggleLike', () => {
        it('calls toggleLike and returns liked status', async () => {
            (propertyService.toggleLike as jest.Mock).mockResolvedValue({ liked: true });
            const req = { user: { _id: 'user123' } };

            const result = await controller.toggleLike(validObjectId, req as any);

            expect(propertyService.toggleLike).toHaveBeenCalledWith(validObjectId, 'user123');
            expect(result).toEqual({ liked: true });
        });
    });

    // ─── POST /properties/:id/comment ───
    describe('addComment', () => {
        it('uses req.user.email as username', async () => {
            const comment = { text: 'Nice', rating: 5 };
            (propertyService.addComment as jest.Mock).mockResolvedValue(comment);
            const req = { user: { _id: 'user123', email: 'dana@test.com' } };

            const result = await controller.addComment(validObjectId, { text: 'Nice', rating: 5 }, req as any);

            expect(propertyService.addComment).toHaveBeenCalledWith(
                validObjectId, { text: 'Nice', rating: 5 }, 'user123', 'dana@test.com',
            );
            expect(result).toEqual(comment);
        });

        it('falls back to "User" when email is missing', async () => {
            (propertyService.addComment as jest.Mock).mockResolvedValue({});
            const req = { user: { _id: 'user123', email: null } };
            await controller.addComment(validObjectId, { text: 'test', rating: 4 }, req as any);
            expect(propertyService.addComment).toHaveBeenCalledWith(
                validObjectId, expect.anything(), 'user123', 'User',
            );
        });
    });

    // ─── GET /properties/:id/comments ───
    describe('getComments', () => {
        it('returns comments for a property', async () => {
            const comments = [{ text: 'Great!', rating: 5 }];
            (propertyService.getComments as jest.Mock).mockResolvedValue(comments);

            const result = await controller.getComments(validObjectId);

            expect(propertyService.getComments).toHaveBeenCalledWith(validObjectId);
            expect(result).toEqual(comments);
        });
    });
});
