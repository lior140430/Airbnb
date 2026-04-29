import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { AiSearchService } from '../ai/ai-search.service';
import { OptionalJwtGuard } from '../auth/optional-jwt.guard';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { PropertyService } from './property.service';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const multerOptions = {
    storage: diskStorage({
        destination: './uploads/properties',
        filename: (req, file, cb) => {
            const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
            cb(null, `${randomName}${extname(file.originalname)}`);
        },
    }),
    fileFilter: (req, file, cb) => {
        if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only image files (jpeg, png, webp) are allowed'), false);
        }
    },
    limits: { fileSize: 25 * 1024 * 1024 },
};

@ApiTags('properties')
@Controller('properties')
export class PropertyController {
    constructor(
        private readonly propertyService: PropertyService,
        private readonly aiSearchService: AiSearchService,
    ) { }

    @Post()
    @UseGuards(AuthGuard('jwt'))
    @ApiOperation({ summary: 'Create a new property' })
    @ApiResponse({ status: 201, description: 'The property has been successfully created.' })
    @UseInterceptors(FilesInterceptor('images', 5, multerOptions))
    create(@Body() createPropertyDto: CreatePropertyDto, @UploadedFiles() files: Array<Express.Multer.File>, @Req() req) {
        const userId = req.user._id;
        // Normalize paths for cross-platform consistency
        const images = files ? files.map(file => file.path.replace(/\\/g, '/')) : [];
        return this.propertyService.create(createPropertyDto, userId, images);
    }

    @Post('seed')
    @ApiOperation({ summary: 'Manual seed for dev' })
    async seed() {
        await this.propertyService.seed();
        return { message: 'Seeding initiated' };
    }

    @Get('me')
    @UseGuards(AuthGuard('jwt'))
    @ApiOperation({ summary: 'Get current user properties' })
    @ApiResponse({ status: 200, description: 'Return user properties.' })
    findMyProperties(@Req() req, @Query('page') page: number, @Query('limit') limit: number) {
        return this.propertyService.findAll(Number(page) || 1, Number(limit) || 10, req.user._id, req.user._id);
    }

    @Get('ai-search')
    @UseGuards(OptionalJwtGuard)
    @ApiOperation({ summary: 'AI-powered free-text property search via Gemini' })
    @ApiResponse({ status: 200, description: 'Return matched properties.' })
    async aiSearch(
        @Query('q') q: string,
        @Query('location') locationOverride: string,
        @Query('checkIn') checkIn: string,
        @Query('checkOut') checkOut: string,
        @Query('guests') guestsOverride: number,
        @Query('page') page: number,
        @Query('limit') limit: number,
        @Req() req,
    ) {
        const currentUserId = req.user?._id;
        const parsed = await this.aiSearchService.parseQuery(q);

        // Explicit params take precedence over AI-parsed values
        const location = locationOverride || parsed.location;
        const guests = guestsOverride ? Number(guestsOverride) : parsed.guests;

        return this.propertyService.findAll(
            Number(page) || 1,
            Number(limit) || 20,
            undefined,
            currentUserId,
            {
                location,
                locations: parsed.locations,
                excludeLocation: parsed.excludeLocation,
                checkIn,
                checkOut,
                guests,
                minPrice: parsed.minPrice,
                maxPrice: parsed.maxPrice,
                bedrooms: parsed.bedrooms,
                amenities: parsed.amenities,
                keywords: parsed.keywords,
            },
        );
    }

    @Get()
    @UseGuards(OptionalJwtGuard)
    @ApiOperation({ summary: 'Get all properties with pagination' })
    @ApiResponse({ status: 200, description: 'Return all properties with associated likes/comments counts.' })
    findAll(
        @Query('page') page: number,
        @Query('limit') limit: number,
        @Query('q') q: string,
        @Query('location') location: string,
        @Query('checkIn') checkIn: string,
        @Query('checkOut') checkOut: string,
        @Query('guests') guests: number,
        @Query('ownerId') ownerId: string,
        @Req() req,
    ) {
        const currentUserId = req.user?._id;
        return this.propertyService.findAll(
            Number(page) || 1,
            Number(limit) || 10,
            ownerId || undefined,
            currentUserId,
            { q, location, checkIn, checkOut, guests: guests ? Number(guests) : undefined },
        );
    }

    @Get(':id')
    @UseGuards(OptionalJwtGuard)
    @ApiOperation({ summary: 'Get a property by id' })
    @ApiResponse({ status: 200, description: 'Return the property.' })
    findOne(@Param('id') id: string, @Req() req) {
        const currentUserId = req.user?._id;
        return this.propertyService.findOne(id, currentUserId);
    }

    @Patch(':id')
    @UseGuards(AuthGuard('jwt'))
    @ApiOperation({ summary: 'Update a property' })
    @ApiResponse({ status: 200, description: 'The property has been successfully updated.' })
    update(@Param('id') id: string, @Body() updatePropertyDto: UpdatePropertyDto, @Req() req) {
        return this.propertyService.update(id, updatePropertyDto, req.user._id);
    }

    @Delete(':id')
    @UseGuards(AuthGuard('jwt'))
    @ApiOperation({ summary: 'Delete a property' })
    @ApiResponse({ status: 200, description: 'The property has been successfully deleted.' })
    remove(@Param('id') id: string, @Req() req) {
        return this.propertyService.remove(id, req.user._id);
    }

    @Get('comments/mine')
    @UseGuards(AuthGuard('jwt'))
    @ApiOperation({ summary: 'Get all comments written by the current user' })
    @ApiResponse({ status: 200, description: 'Return comments with property info.' })
    getMyComments(@Req() req) {
        return this.propertyService.getMyComments(req.user._id);
    }

    @Post(':id/like')
    @UseGuards(AuthGuard('jwt'))
    @ApiOperation({ summary: 'Toggle like for a property' })
    @ApiResponse({ status: 200, description: 'Like toggled.' })
    toggleLike(@Param('id') id: string, @Req() req) {
        return this.propertyService.toggleLike(id, req.user._id);
    }

    @Post(':id/comment')
    @UseGuards(AuthGuard('jwt'))
    @ApiOperation({ summary: 'Add a comment to a property' })
    @ApiResponse({ status: 201, description: 'Comment added.' })
    addComment(@Param('id') id: string, @Body() createCommentDto: CreateCommentDto, @Req() req) {
        const username = req.user.email || 'User';
        return this.propertyService.addComment(id, createCommentDto, req.user._id, username);
    }

    @Get(':id/comments')
    @ApiOperation({ summary: 'Get comments for a property' })
    @ApiResponse({ status: 200, description: 'Return comments.' })
    getComments(@Param('id') id: string) {
        return this.propertyService.getComments(id);
    }
}
