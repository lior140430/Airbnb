import { ForbiddenException, Injectable, Logger, NotFoundException, OnModuleInit, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { existsSync, mkdirSync } from 'fs';
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
    ) {
        // Ensure the uploads directory exists on startup so file uploads never fail
        const uploadsDir = './uploads/properties';
        if (!existsSync(uploadsDir)) {
            mkdirSync(uploadsDir, { recursive: true });
            this.logger.log(`Created uploads directory: ${uploadsDir}`);
        }
    }

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

    /**
     * Semantic location groups — maps a descriptive keyword returned by the AI
     * to the list of relevant Hebrew city names stored in the DB.
     * Edge-cases covered: near the sea, north, south/desert, centre, dead sea, etc.
     */
    private readonly LOCATION_GROUPS: Record<string, string[]> = {
        // ── Coastal / seaside ──
        'ליד הים':    ['תל אביב', 'חיפה', 'נתניה', 'אשדוד', 'אילת', 'עכו', 'נהריה', 'בת ים', 'הרצליה'],
        'חוף הים':    ['תל אביב', 'חיפה', 'נתניה', 'אשדוד', 'אילת', 'עכו', 'נהריה', 'בת ים', 'הרצליה'],
        'חוף':        ['תל אביב', 'חיפה', 'נתניה', 'אשדוד', 'אילת', 'עכו', 'נהריה', 'בת ים'],
        'seaside':    ['תל אביב', 'חיפה', 'נתניה', 'אשדוד', 'אילת', 'עכו', 'נהריה', 'בת ים'],
        'beach':      ['תל אביב', 'חיפה', 'נתניה', 'אשדוד', 'אילת', 'עכו', 'נהריה', 'בת ים'],
        // ── North ──
        'הצפון':   ['חיפה', 'צפת', 'טבריה', 'נהריה', 'עכו', 'ראש פינה', 'קצרין'],
        'צפון':    ['חיפה', 'צפת', 'טבריה', 'נהריה', 'עכו', 'ראש פינה', 'קצרין'],
        'גליל':    ['צפת', 'טבריה', 'ראש פינה', 'קצרין', 'נהריה'],
        'הגליל':   ['צפת', 'טבריה', 'ראש פינה', 'קצרין', 'נהריה'],
        'north':   ['חיפה', 'צפת', 'טבריה', 'נהריה', 'עכו', 'ראש פינה'],
        // ── South / Desert ──
        'הדרום':      ['באר שבע', 'מצפה רמון', 'אילת', 'דימונה'],
        'דרום':       ['באר שבע', 'מצפה רמון', 'אילת', 'דימונה'],
        'מדבר':       ['מצפה רמון', 'אילת', 'באר שבע'],
        'הנגב':       ['באר שבע', 'מצפה רמון', 'דימונה'],
        'נגב':        ['באר שבע', 'מצפה רמון', 'דימונה'],
        'south':      ['באר שבע', 'מצפה רמון', 'אילת'],
        'desert':     ['מצפה רמון', 'אילת', 'באר שבע'],
        // ── Dead Sea area ──
        'ים המלח':    ['ים המלח', 'עין גדי', 'עין בוקק', 'ערד'],
        'dead sea':   ['ים המלח', 'עין גדי', 'עין בוקק', 'ערד'],
        // ── Centre ──
        'מרכז':       ['תל אביב', 'רמת גן', 'פתח תקווה', 'הרצליה', 'רחובות', 'ראשון לציון', 'גבעתיים'],
        'center':     ['תל אביב', 'רמת גן', 'פתח תקווה', 'הרצליה', 'רחובות', 'ראשון לציון'],
        'centre':     ['תל אביב', 'רמת גן', 'פתח תקווה', 'הרצליה', 'רחובות', 'ראשון לציון'],
        // ── Mountains / high altitude ──
        'הרים':    ['ירושלים', 'צפת', 'ראש פינה'],
        'mountains': ['ירושלים', 'צפת', 'ראש פינה'],
    };

    /**
     * Normalise a location string coming from Nominatim or the AI:
     *  - Handles English city names  (AI returns "Tel Aviv")
     *  - Handles Hebrew Nominatim variants  ("תל אביב-יפו" → "תל אביב")
     * Returns the canonical Hebrew name used in the DB, or the original if unknown.
     */
    private normalizeLocation(location: string): string {
        const CITY_MAP: Record<string, string> = {
            // English → Hebrew
            'tel aviv': 'תל אביב', 'tel-aviv': 'תל אביב',
            'tel aviv-yafo': 'תל אביב', 'tel aviv yafo': 'תל אביב', 'tel aviv jaffa': 'תל אביב',
            'jerusalem': 'ירושלים', 'yerushalayim': 'ירושלים',
            'haifa': 'חיפה',
            'eilat': 'אילת',
            'netanya': 'נתניה',
            'rishon lezion': 'ראשון לציון', 'rishon le-zion': 'ראשון לציון', 'rishon leẕiyyon': 'ראשון לציון',
            'ashdod': 'אשדוד',
            'beer sheva': 'באר שבע', 'beer-sheva': 'באר שבע', "be'er sheva": 'באר שבע',
            'rosh pinna': 'ראש פינה', 'rosh ha-niqra': 'ראש הנקרה',
            'mitzpe ramon': 'מצפה רמון', 'mizpe ramon': 'מצפה רמון',
            'safed': 'צפת', 'tzfat': 'צפת', 'zefat': 'צפת',
            'nazareth': 'נצרת',
            'tiberias': 'טבריה',
            'akko': 'עכו', 'acre': 'עכו',
            'bat yam': 'בת ים',
            'petah tikva': 'פתח תקווה', 'petach tikva': 'פתח תקווה',
            'bnei brak': 'בני ברק',
            'holon': 'חולון',
            'ramat gan': 'רמת גן',
            'givatayim': 'גבעתיים',
            // Hebrew Nominatim variants → canonical DB value
            'תל אביב-יפו': 'תל אביב', 'תל אביב יפו': 'תל אביב',
            'ירושלים': 'ירושלים', 'ירושלים (יְרוּשָׁלַיִם)': 'ירושלים',
            'באר שבע': 'באר שבע', 'בְּאֵר שֶׁבַע': 'באר שבע',
        };

        const key = location.trim().toLowerCase();
        return CITY_MAP[key] ?? location;
    }

    async findAll(page: number = 1, limit: number = 10, ownerId?: string, currentUserId?: string, search?: {
        q?: string;
        location?: string;
        locations?: string[];       // multiple location groups → intersected
        excludeLocation?: string;   // negative location filter ("except X")
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

        // ── Location search ────────────────────────────────────────────────
        // Priority: locations[] (multi-group intersection) > location (single)
        // Helper: resolve a raw location string to a Set of DB city names
        const resolveCities = (raw: string): Set<string> => {
            const trimmed = raw.trim();
            const grp = this.LOCATION_GROUPS[trimmed] ?? this.LOCATION_GROUPS[trimmed.toLowerCase()];
            if (grp && grp.length > 0) return new Set(grp);
            return new Set([this.normalizeLocation(trimmed)]);
        };

        if (search?.locations && search.locations.length > 0) {
            // Multi-location: intersect all resolved city sets
            const sets = search.locations.map(l => resolveCities(l));
            let result = sets[0];
            for (let i = 1; i < sets.length; i++) {
                result = new Set([...result].filter(c => sets[i].has(c)));
            }
            // If intersection is empty (contradictory filters), fall back to union
            const finalCities = result.size > 0
                ? [...result]
                : [...new Set(sets.flatMap(s => [...s]))];
            pipeline.push({ $match: { 'location.city': { $in: finalCities } } });

        } else if (search?.location) {
            // Single location:
            //  1. Semantic group (e.g. "ליד הים") → $in list of relevant cities
            //  2. Specific city name → exact regex match only (no bounding box —
            //     bounding-box was too broad and returned neighbouring cities)
            const raw = search.location.trim();
            const groupCities = this.LOCATION_GROUPS[raw] ?? this.LOCATION_GROUPS[raw.toLowerCase()];
            if (groupCities && groupCities.length > 0) {
                pipeline.push({ $match: { 'location.city': { $in: groupCities } } });
            } else {
                const normalized = this.normalizeLocation(raw);
                pipeline.push({ $match: { 'location.city': { $regex: normalized, $options: 'i' } } });
            }
        }

        // Negative location filter (applies regardless of location/locations)
        if (search?.excludeLocation) {
            const raw = search.excludeLocation.trim();
            const excludeCities = this.LOCATION_GROUPS[raw] ?? this.LOCATION_GROUPS[raw.toLowerCase()];
            if (excludeCities && excludeCities.length > 0) {
                pipeline.push({ $match: { 'location.city': { $nin: excludeCities } } });
            } else {
                const normalized = this.normalizeLocation(raw);
                pipeline.push({ $match: { 'location.city': { $not: { $regex: `^${normalized}$`, $options: 'i' } } } });
            }
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

    async update(id: string, updatePropertyDto: UpdatePropertyDto, userId: string, newImages: string[] = []) {
        const property = await this.propertyModel.findOne({ _id: id });
        if (!property) throw new NotFoundException('Property not found');

        if (property.ownerId !== userId) {
            throw new UnauthorizedException('You are not the owner of this property');
        }

        const { keepImages, ...rest } = updatePropertyDto;

        // Build the final images array: kept existing + newly uploaded
        const images = [
            ...(keepImages ?? property.images),
            ...newImages,
        ];

        return this.propertyModel.findByIdAndUpdate(id, { ...rest, images }, { new: true });
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

    async deleteComment(commentId: string, userId: string): Promise<{ deleted: boolean }> {
        const comment = await this.commentModel.findById(commentId);
        if (!comment) throw new NotFoundException('Comment not found');
        if (comment.userId !== userId) throw new ForbiddenException('Not authorized to delete this comment');
        await comment.deleteOne();
        // Decrement commentsCount on the property
        await this.propertyModel.findByIdAndUpdate(comment.propertyId, { $inc: { commentsCount: -1 } });
        return { deleted: true };
    }

    async getMyComments(userId: string): Promise<any[]> {
        const comments = await this.commentModel
            .find({ userId })
            .sort({ createdAt: -1 })
            .lean();

        if (!comments.length) return [];

        const propertyIds = [...new Set(comments.map((c) => c.propertyId.toString()))];
        const properties = await this.propertyModel
            .find({ _id: { $in: propertyIds } }, { title: 1, images: 1 })
            .lean();

        const propertyMap = Object.fromEntries(
            properties.map((p) => [p._id.toString(), p]),
        );

        return comments.map((c) => ({
            ...c,
            propertyTitle: propertyMap[c.propertyId.toString()]?.title ?? 'נכס לא ידוע',
            propertyImage: propertyMap[c.propertyId.toString()]?.images?.[0] ?? null,
        }));
    }
}
