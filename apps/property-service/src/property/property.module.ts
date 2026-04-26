import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AiSearchService } from '../ai/ai-search.service';
import { GeoModule } from '../geo/geo.module';
import { PropertyController } from './property.controller';
import { PropertyService } from './property.service';
import { Comment, CommentSchema } from './schemas/comment.schema';
import { Like, LikeSchema } from './schemas/like.schema';
import { Property, PropertySchema } from './schemas/property.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Property.name, schema: PropertySchema },
            { name: Like.name, schema: LikeSchema },
            { name: Comment.name, schema: CommentSchema },
        ]),
        GeoModule,
    ],
    controllers: [PropertyController],
    providers: [PropertyService, AiSearchService],
})
export class PropertyModule { }
