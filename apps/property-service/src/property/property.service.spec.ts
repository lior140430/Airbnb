import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { GeocodingService } from '../geo/geocoding.service';
import { PropertyService } from './property.service';
import { Comment } from './schemas/comment.schema';
import { Like } from './schemas/like.schema';
import { Property } from './schemas/property.schema';

const validObjectId = new Types.ObjectId().toHexString();

const mockProperty = {
    _id: validObjectId,
    title: 'Sunny Apartment',
    description: 'Nice place',
    price: 500,
    location: { city: 'Tel Aviv', street: 'Herzl 1' },
    images: [],
    ownerId: 'user123',
    maxGuests: 4,
    bedrooms: 2,
    beds: 2,
    bathrooms: 1,
    amenities: ['wifi', 'pool'],
    coordinates: { lat: 32.08, lng: 34.78 },
    save: jest.fn().mockResolvedValue(undefined),
};

describe('PropertyService', () => {
    let service: PropertyService;
    let propertyModel: any;
    let likeModel: any;
    let commentModel: any;

    beforeEach(async () => {
        propertyModel = {
            countDocuments: jest.fn().mockResolvedValue(50),
            aggregate: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
            findById: jest.fn(),
            findByIdAndUpdate: jest.fn(),
            findByIdAndDelete: jest.fn(),
        };
        likeModel = {
            findOne: jest.fn(),
            findByIdAndDelete: jest.fn(),
            deleteMany: jest.fn(),
            create: jest.fn(),
        };
        commentModel = {
            create: jest.fn(),
            find: jest.fn(),
            deleteMany: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PropertyService,
                { provide: getModelToken(Property.name), useValue: propertyModel },
                { provide: getModelToken(Like.name), useValue: likeModel },
                { provide: getModelToken(Comment.name), useValue: commentModel },
                { provide: GeocodingService, useValue: { geocode: jest.fn() } },
            ],
        }).compile();

        // Prevent onModuleInit from running during tests
        jest.spyOn(service = module.get<PropertyService>(PropertyService), 'onModuleInit' as any).mockResolvedValue(undefined);
    });

    afterEach(() => jest.clearAllMocks());

    // ─── findAll ───
    describe('findAll', () => {
        it('calls aggregate and returns results', async () => {
            const properties = [mockProperty];
            propertyModel.aggregate.mockResolvedValue(properties);

            const result = await service.findAll(1, 10);

            expect(propertyModel.aggregate).toHaveBeenCalled();
            expect(result).toEqual(properties);
        });

        it('includes $match for ownerId when provided', async () => {
            propertyModel.aggregate.mockResolvedValue([]);
            await service.findAll(1, 10, 'user123');
            const pipeline = propertyModel.aggregate.mock.calls[0][0];
            expect(pipeline[0]).toEqual({ $match: { ownerId: 'user123' } });
        });

        it('applies location filter when search.location provided', async () => {
            propertyModel.aggregate.mockResolvedValue([]);
            await service.findAll(1, 10, undefined, undefined, { location: 'Tel Aviv' });
            const pipeline = propertyModel.aggregate.mock.calls[0][0];
            const locationStage = pipeline.find((s: any) => s.$match?.['location.city']);
            expect(locationStage).toBeDefined();
        });

        it('applies price range filter', async () => {
            propertyModel.aggregate.mockResolvedValue([]);
            await service.findAll(1, 10, undefined, undefined, { minPrice: 200, maxPrice: 800 });
            const pipeline = propertyModel.aggregate.mock.calls[0][0];
            const priceStage = pipeline.find((s: any) => s.$match?.price);
            expect(priceStage.$match.price).toEqual({ $gte: 200, $lte: 800 });
        });

        it('applies amenities filter', async () => {
            propertyModel.aggregate.mockResolvedValue([]);
            await service.findAll(1, 10, undefined, undefined, { amenities: ['wifi', 'pool'] });
            const pipeline = propertyModel.aggregate.mock.calls[0][0];
            const amenitiesStage = pipeline.find((s: any) => s.$match?.amenities);
            expect(amenitiesStage.$match.amenities).toEqual({ $all: ['wifi', 'pool'] });
        });

        it('applies guests filter', async () => {
            propertyModel.aggregate.mockResolvedValue([]);
            await service.findAll(1, 10, undefined, undefined, { guests: 3 });
            const pipeline = propertyModel.aggregate.mock.calls[0][0];
            const guestsStage = pipeline.find((s: any) => s.$match?.maxGuests);
            expect(guestsStage.$match.maxGuests).toEqual({ $gte: 3 });
        });

        it('calculates correct skip based on page', async () => {
            propertyModel.aggregate.mockResolvedValue([]);
            await service.findAll(3, 10);
            const pipeline = propertyModel.aggregate.mock.calls[0][0];
            const skipStage = pipeline.find((s: any) => s.$skip !== undefined);
            expect(skipStage.$skip).toBe(20); // (3 - 1) * 10
        });
    });

    // ─── findOne ───
    describe('findOne', () => {
        it('throws NotFoundException for invalid ObjectId', async () => {
            await expect(service.findOne('not-valid-id')).rejects.toThrow(NotFoundException);
        });

        it('throws NotFoundException when property not found', async () => {
            propertyModel.aggregate.mockResolvedValue([]);
            await expect(service.findOne(validObjectId)).rejects.toThrow(NotFoundException);
        });

        it('returns property when found', async () => {
            propertyModel.aggregate.mockResolvedValue([mockProperty]);
            const result = await service.findOne(validObjectId);
            expect(result).toEqual(mockProperty);
        });

        it('passes currentUserId for isLiked lookup', async () => {
            propertyModel.aggregate.mockResolvedValue([{ ...mockProperty, isLiked: true }]);
            const result = await service.findOne(validObjectId, 'user123');
            expect(result.isLiked).toBe(true);
            const pipeline = propertyModel.aggregate.mock.calls[0][0];
            // Should have an isLiked $addFields stage
            const addFieldsStage = pipeline.find((s: any) => s.$addFields?.isLiked !== undefined);
            expect(addFieldsStage).toBeDefined();
        });
    });

    // ─── update ───
    describe('update', () => {
        it('throws NotFoundException when property not found', async () => {
            propertyModel.findOne.mockResolvedValue(null);
            await expect(service.update(validObjectId, {} as any, 'user123')).rejects.toThrow(NotFoundException);
        });

        it('throws UnauthorizedException when user is not owner', async () => {
            propertyModel.findOne.mockResolvedValue({ ...mockProperty, ownerId: 'other-user' });
            await expect(service.update(validObjectId, {} as any, 'user123')).rejects.toThrow(UnauthorizedException);
        });

        it('updates and returns property when owner matches', async () => {
            propertyModel.findOne.mockResolvedValue(mockProperty);
            const updated = { ...mockProperty, price: 600 };
            propertyModel.findByIdAndUpdate.mockResolvedValue(updated);

            const result = await service.update(validObjectId, { price: 600 } as any, 'user123');
            expect(propertyModel.findByIdAndUpdate).toHaveBeenCalledWith(validObjectId, { price: 600, images: [] }, { new: true });
            expect(result?.price).toBe(600);
        });
    });

    // ─── remove ───
    describe('remove', () => {
        it('throws NotFoundException when property not found', async () => {
            propertyModel.findOne.mockResolvedValue(null);
            await expect(service.remove(validObjectId, 'user123')).rejects.toThrow(NotFoundException);
        });

        it('throws UnauthorizedException when user is not owner', async () => {
            propertyModel.findOne.mockResolvedValue({ ...mockProperty, ownerId: 'other-user' });
            await expect(service.remove(validObjectId, 'user123')).rejects.toThrow(UnauthorizedException);
        });

        it('deletes property and cascades to likes and comments', async () => {
            propertyModel.findOne.mockResolvedValue(mockProperty);
            likeModel.deleteMany.mockResolvedValue(undefined);
            commentModel.deleteMany.mockResolvedValue(undefined);
            propertyModel.findByIdAndDelete.mockResolvedValue(mockProperty);

            await service.remove(validObjectId, 'user123');

            expect(likeModel.deleteMany).toHaveBeenCalledWith({ propertyId: validObjectId });
            expect(commentModel.deleteMany).toHaveBeenCalledWith({ propertyId: validObjectId });
            expect(propertyModel.findByIdAndDelete).toHaveBeenCalledWith(validObjectId);
        });
    });

    // ─── toggleLike ───
    describe('toggleLike', () => {
        it('throws NotFoundException for invalid ObjectId', async () => {
            await expect(service.toggleLike('invalid-id', 'user123')).rejects.toThrow(NotFoundException);
        });

        it('removes like and returns { liked: false } when like exists', async () => {
            const existingLike = { _id: 'like-id' };
            likeModel.findOne.mockResolvedValue(existingLike);
            likeModel.findByIdAndDelete.mockResolvedValue(undefined);

            const result = await service.toggleLike(validObjectId, 'user123');
            expect(likeModel.findByIdAndDelete).toHaveBeenCalledWith('like-id');
            expect(result).toEqual({ liked: false });
        });

        it('creates like and returns { liked: true } when like does not exist', async () => {
            likeModel.findOne.mockResolvedValue(null);
            likeModel.create.mockResolvedValue({ _id: 'new-like-id' });

            const result = await service.toggleLike(validObjectId, 'user123');
            expect(likeModel.create).toHaveBeenCalled();
            expect(result).toEqual({ liked: true });
        });
    });

    // ─── addComment ───
    describe('addComment', () => {
        it('throws NotFoundException for invalid ObjectId', async () => {
            await expect(
                service.addComment('bad-id', { text: 'Great!', rating: 5 }, 'user123', 'Dana'),
            ).rejects.toThrow(NotFoundException);
        });

        it('creates and returns comment', async () => {
            const comment = { _id: 'c1', text: 'Great!', rating: 5, userId: 'user123' };
            commentModel.create.mockResolvedValue(comment);

            const result = await service.addComment(validObjectId, { text: 'Great!', rating: 5 }, 'user123', 'Dana Cohen');
            expect(commentModel.create).toHaveBeenCalledWith(
                expect.objectContaining({ text: 'Great!', rating: 5, userId: 'user123', username: 'Dana Cohen' }),
            );
            expect(result).toBe(comment);
        });
    });

    // ─── getComments ───
    describe('getComments', () => {
        it('throws NotFoundException for invalid ObjectId', async () => {
            await expect(service.getComments('bad-id')).rejects.toThrow(NotFoundException);
        });

        it('returns comments sorted by createdAt desc', async () => {
            const comments = [{ text: 'Nice' }];
            commentModel.find.mockReturnValue({ sort: jest.fn().mockResolvedValue(comments) });

            const result = await service.getComments(validObjectId);
            expect(commentModel.find).toHaveBeenCalled();
            expect(result).toEqual(comments);
        });
    });

    // ─── getMyComments ───
    describe('getMyComments', () => {
        it('returns empty array when user has no comments', async () => {
            commentModel.find.mockReturnValue({
                sort: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([]) }),
            });

            const result = await service.getMyComments('user123');
            expect(result).toEqual([]);
        });

        it('returns comments enriched with property title and image', async () => {
            const propId = new Types.ObjectId();
            const mockComments = [
                { _id: 'c1', text: 'Great!', rating: 5, userId: 'user123', propertyId: propId },
            ];
            const mockProperties = [
                { _id: propId, title: 'Sunny Apartment', images: ['img1.jpg'] },
            ];

            commentModel.find.mockReturnValue({
                sort: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(mockComments) }),
            });
            propertyModel.find.mockReturnValue({ lean: jest.fn().mockResolvedValue(mockProperties) });

            const result = await service.getMyComments('user123');
            expect(result).toHaveLength(1);
            expect(result[0].propertyTitle).toBe('Sunny Apartment');
            expect(result[0].propertyImage).toBe('img1.jpg');
        });

        it('sets fallback title when property not found', async () => {
            const propId = new Types.ObjectId();
            const mockComments = [
                { _id: 'c1', text: 'OK', rating: 3, userId: 'user123', propertyId: propId },
            ];

            commentModel.find.mockReturnValue({
                sort: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(mockComments) }),
            });
            propertyModel.find.mockReturnValue({ lean: jest.fn().mockResolvedValue([]) });

            const result = await service.getMyComments('user123');
            expect(result[0].propertyTitle).toBe('נכס לא ידוע');
            expect(result[0].propertyImage).toBeNull();
        });
    });
});
