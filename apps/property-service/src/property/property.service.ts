import { Injectable, Logger, NotFoundException, OnModuleInit, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { GeocodingService } from '../geo/geocoding.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { Comment, CommentDocument } from './schemas/comment.schema';
import { Like, LikeDocument } from './schemas/like.schema';
import { Property, PropertyDocument } from './schemas/property.schema';

@Injectable()
export class PropertyService implements OnModuleInit {
    private readonly logger = new Logger(PropertyService.name);

    constructor(
        @InjectModel(Property.name) private propertyModel: Model<PropertyDocument>,
        @InjectModel(Like.name) private likeModel: Model<LikeDocument>,
        @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
        private readonly geocodingService: GeocodingService,
    ) { }

    async onModuleInit() {
        try {
            const count = await this.propertyModel.countDocuments();
            this.logger.log(`Current property count: ${count}`);

            if (count < 10) {
                this.logger.log('Database has few properties. Seeding mock data...');
                await this.seed();
                this.logger.log('Seeding complete.');
            } else {
                this.logger.log('Database already populated. Skipping seed.');
            }

            // Backfill coordinates for existing properties that don't have them
            await this.backfillCoordinates();
        } catch (err) {
            this.logger.error('Seeding failed', err);
        }
    }

    public async seed() {
        const cities = ['Tel Aviv', 'Jerusalem', 'Haifa', 'Eilat', 'Rishon LeZion', 'Netanya', 'Ashdod'];
        const cityCoords: Record<string, { lat: number; lng: number }> = {
            'Tel Aviv': { lat: 32.0853, lng: 34.7818 },
            'Jerusalem': { lat: 31.7683, lng: 35.2137 },
            'Haifa': { lat: 32.7940, lng: 34.9896 },
            'Eilat': { lat: 29.5577, lng: 34.9519 },
            'Rishon LeZion': { lat: 31.9730, lng: 34.7925 },
            'Netanya': { lat: 32.3215, lng: 34.8532 },
            'Ashdod': { lat: 31.8014, lng: 34.6431 },
        };
        const streets = ['Herzl', 'Dizengoff', 'Rothschild', 'Jaffa', 'Ben Yehuda', 'Begin', 'Allenby'];
        const types = ['Apartment', 'Studio', 'Villa', 'Penthouse', 'Loft', 'Duplex'];
        const adjectives = ['Luxury', 'Cozy', 'Modern', 'Spacious', 'Charming', 'Sunny', 'Quiet'];
        const allAmenities = ['wifi', 'kitchen', 'washer', 'airConditioning', 'tv', 'parking', 'pool', 'petFriendly', 'gym', 'balcony'];

        const mockProperties = Array.from({ length: 50 }).map((_, i) => {
            const city = cities[Math.floor(Math.random() * cities.length)];
            const street = streets[Math.floor(Math.random() * streets.length)];
            const type = types[Math.floor(Math.random() * types.length)];
            const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
            const maxGuests = Math.floor(Math.random() * 8) + 1;
            const bedrooms = Math.max(1, Math.floor(maxGuests / 2));
            const amenityCount = Math.floor(Math.random() * 6) + 2;
            const amenities = [...allAmenities].sort(() => Math.random() - 0.5).slice(0, amenityCount);

            return {
                title: `${adj} ${type} in ${city}`,
                description: `Beautiful ${type.toLowerCase()} located in the heart of ${city}. Close to all amenities, fully furnished. Perfect for vacations.`,
                price: Math.floor(Math.random() * (1500 - 300) + 300),
                location: {
                    city: city,
                    street: `${street} ${Math.floor(Math.random() * 100) + 1}`,
                },
                images: [
                    `https://picsum.photos/seed/${i * 123}/800/600`,
                    `https://picsum.photos/seed/${i * 456}/800/600`,
                    `https://picsum.photos/seed/${i * 789}/800/600`,
                ],
                ownerId: new Types.ObjectId().toString(),
                maxGuests,
                bedrooms,
                beds: bedrooms + (Math.random() > 0.5 ? 1 : 0),
                bathrooms: Math.max(1, Math.ceil(bedrooms / 2)),
                amenities,
                coordinates: {
                    lat: cityCoords[city].lat + (Math.random() - 0.5) * 0.05,
                    lng: cityCoords[city].lng + (Math.random() - 0.5) * 0.05,
                },
            };
        });

        await this.propertyModel.insertMany(mockProperties);
    }

    private async backfillCoordinates() {
        const cityCoords: Record<string, { lat: number; lng: number }> = {
            'Tel Aviv': { lat: 32.0853, lng: 34.7818 },
            'Jerusalem': { lat: 31.7683, lng: 35.2137 },
            'Haifa': { lat: 32.7940, lng: 34.9896 },
            'Eilat': { lat: 29.5577, lng: 34.9519 },
            'Rishon LeZion': { lat: 31.9730, lng: 34.7925 },
            'Netanya': { lat: 32.3215, lng: 34.8532 },
            'Ashdod': { lat: 31.8014, lng: 34.6431 },
        };

        const noCoords = await this.propertyModel.find({ coordinates: null });
        if (noCoords.length === 0) return;

        this.logger.log(`Backfilling coordinates for ${noCoords.length} properties...`);
        for (const prop of noCoords) {
            const base = cityCoords[prop.location?.city] || { lat: 31.5, lng: 34.8 };
            prop.coordinates = {
                lat: base.lat + (Math.random() - 0.5) * 0.05,
                lng: base.lng + (Math.random() - 0.5) * 0.05,
            };
            await prop.save();
        }
        this.logger.log('Coordinates backfill complete.');
    }

    async create(createPropertyDto: CreatePropertyDto, userId: string, images: string[]) {
        const property = new this.propertyModel({
            ...createPropertyDto,
            ownerId: userId,
            images,
        });
        return property.save();
    }

    async findAll(page: number = 1, limit: number = 10, ownerId?: string, currentUserId?: string, search?: {
        q?: string;
        location?: string;
        checkIn?: string;
        checkOut?: string;
        guests?: number;
        minPrice?: number;
        maxPrice?: number;
        bedrooms?: number;
        amenities?: string[];
        keywords?: string;
    }) {
        const skip = (page - 1) * limit;

        const pipeline: any[] = [];
        if (ownerId) {
            pipeline.push({ $match: { ownerId } });
        }

        // Search filters
        if (search?.location) {
            pipeline.push({ $match: { 'location.city': { $regex: search.location, $options: 'i' } } });
        }

        if (search?.guests) {
            pipeline.push({ $match: { maxGuests: { $gte: search.guests } } });
        }

        if (search?.q) {
            pipeline.push({
                $match: {
                    $or: [
                        { title: { $regex: search.q, $options: 'i' } },
                        { description: { $regex: search.q, $options: 'i' } },
                        { 'location.city': { $regex: search.q, $options: 'i' } },
                        { 'location.street': { $regex: search.q, $options: 'i' } },
                    ],
                },
            });
        }

        if (search?.keywords) {
            pipeline.push({
                $match: {
                    $or: [
                        { title: { $regex: search.keywords, $options: 'i' } },
                        { description: { $regex: search.keywords, $options: 'i' } },
                    ],
                },
            });
        }

        if (search?.minPrice !== undefined || search?.maxPrice !== undefined) {
            const priceFilter: any = {};
            if (search.minPrice !== undefined) priceFilter.$gte = search.minPrice;
            if (search.maxPrice !== undefined) priceFilter.$lte = search.maxPrice;
            pipeline.push({ $match: { price: priceFilter } });
        }

        if (search?.bedrooms !== undefined) {
            pipeline.push({ $match: { bedrooms: { $gte: search.bedrooms } } });
        }

        if (search?.amenities && search.amenities.length > 0) {
            pipeline.push({ $match: { amenities: { $all: search.amenities } } });
        }

        pipeline.push(
            { $skip: skip },
            { $limit: limit },
            {
                $lookup: {
                    from: 'likes',
                    let: { pid: '$_id' },
                    pipeline: [
                        { $match: { $expr: { $eq: ['$propertyId', '$$pid'] } } },
                        { $count: 'count' }
                    ],
                    as: 'likesCountArr'
                }
            },
            {
                $lookup: {
                    from: 'comments',
                    let: { pid: '$_id' },
                    pipeline: [
                        { $match: { $expr: { $eq: ['$propertyId', '$$pid'] } } },
                    ],
                    as: 'commentsArr'
                }
            },
            {
                $addFields: {
                    likesCount: { $ifNull: [{ $arrayElemAt: ['$likesCountArr.count', 0] }, 0] },
                    commentsCount: { $size: '$commentsArr' },
                    averageRating: {
                        $cond: {
                            if: { $gt: [{ $size: '$commentsArr' }, 0] },
                            then: { $round: [{ $avg: '$commentsArr.rating' }, 1] },
                            else: null
                        }
                    }
                }
            },
        );

        // Add isLiked check if a logged-in user is making the request
        if (currentUserId) {
            pipeline.push(
                {
                    $lookup: {
                        from: 'likes',
                        let: { pid: '$_id' },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $and: [
                                            { $eq: ['$propertyId', '$$pid'] },
                                            { $eq: ['$userId', currentUserId] }
                                        ]
                                    }
                                }
                            },
                            { $limit: 1 }
                        ],
                        as: 'userLike'
                    }
                },
                {
                    $addFields: {
                        isLiked: { $gt: [{ $size: '$userLike' }, 0] }
                    }
                },
            );
        }

        pipeline.push(
            { $project: { likesCountArr: 0, commentsArr: 0, userLike: 0 } }
        );

        const result = await this.propertyModel.aggregate(pipeline);
        return result;
    }

    async findOne(id: string, currentUserId?: string) {
        if (!Types.ObjectId.isValid(id)) throw new NotFoundException('Invalid Property ID');

        const pipeline: any[] = [
            { $match: { _id: new Types.ObjectId(id) } },
            {
                $lookup: {
                    from: 'likes',
                    let: { pid: '$_id' },
                    pipeline: [
                        { $match: { $expr: { $eq: ['$propertyId', '$$pid'] } } },
                        { $count: 'count' }
                    ],
                    as: 'likesCountArr'
                }
            },
            {
                $lookup: {
                    from: 'comments',
                    let: { pid: '$_id' },
                    pipeline: [
                        { $match: { $expr: { $eq: ['$propertyId', '$$pid'] } } },
                        { $sort: { createdAt: -1 } }
                    ],
                    as: 'comments'
                }
            },
            {
                $addFields: {
                    likesCount: { $ifNull: [{ $arrayElemAt: ['$likesCountArr.count', 0] }, 0] },
                    commentsCount: { $size: '$comments' },
                    averageRating: {
                        $cond: {
                            if: { $gt: [{ $size: '$comments' }, 0] },
                            then: { $round: [{ $avg: '$comments.rating' }, 1] },
                            else: null
                        }
                    }
                }
            },
        ];

        // Add isLiked check if a logged-in user is making the request
        if (currentUserId) {
            pipeline.push(
                {
                    $lookup: {
                        from: 'likes',
                        let: { pid: '$_id' },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $and: [
                                            { $eq: ['$propertyId', '$$pid'] },
                                            { $eq: ['$userId', currentUserId] }
                                        ]
                                    }
                                }
                            },
                            { $limit: 1 }
                        ],
                        as: 'userLike'
                    }
                },
                {
                    $addFields: {
                        isLiked: { $gt: [{ $size: '$userLike' }, 0] }
                    }
                },
            );
        }

        pipeline.push(
            { $project: { likesCountArr: 0, userLike: 0 } }
        );

        const result = await this.propertyModel.aggregate(pipeline);

        if (!result || result.length === 0) {
            throw new NotFoundException('Property not found');
        }

        return result[0];
    }

    async update(id: string, updatePropertyDto: UpdatePropertyDto, userId: string) {
        const property = await this.propertyModel.findOne({ _id: id });
        if (!property) throw new NotFoundException('Property not found');

        if (property.ownerId !== userId) {
            throw new UnauthorizedException('You are not the owner of this property');
        }

        return this.propertyModel.findByIdAndUpdate(id, updatePropertyDto, { new: true });
    }

    async remove(id: string, userId: string) {
        const property = await this.propertyModel.findOne({ _id: id });
        if (!property) throw new NotFoundException('Property not found');

        if (property.ownerId !== userId) {
            throw new UnauthorizedException('You are not the owner of this property');
        }

        // Delete associated likes and comments
        await this.likeModel.deleteMany({ propertyId: id });
        await this.commentModel.deleteMany({ propertyId: id });

        return this.propertyModel.findByIdAndDelete(id);
    }

    async toggleLike(propertyId: string, userId: string) {
        if (!Types.ObjectId.isValid(propertyId)) throw new NotFoundException('Invalid Property ID');

        const existingLike = await this.likeModel.findOne({
            propertyId: new Types.ObjectId(propertyId),
            userId,
        });

        if (existingLike) {
            await this.likeModel.findByIdAndDelete(existingLike._id);
            return { liked: false };
        } else {
            await this.likeModel.create({
                propertyId: new Types.ObjectId(propertyId),
                userId,
            });
            return { liked: true };
        }
    }

    async addComment(propertyId: string, createCommentDto: CreateCommentDto, userId: string, username: string) {
        if (!Types.ObjectId.isValid(propertyId)) throw new NotFoundException('Invalid Property ID');

        const comment = await this.commentModel.create({
            propertyId: new Types.ObjectId(propertyId),
            userId,
            username,
            text: createCommentDto.text,
            rating: createCommentDto.rating
        });
        return comment;
    }

    async getComments(propertyId: string) {
        if (!Types.ObjectId.isValid(propertyId)) throw new NotFoundException('Invalid Property ID');
        return this.commentModel.find({ propertyId: new Types.ObjectId(propertyId) }).sort({ createdAt: -1 });
    }
}
