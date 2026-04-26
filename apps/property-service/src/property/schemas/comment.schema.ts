import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CommentDocument = Comment & Document;

@Schema({ timestamps: true })
export class Comment {
    @Prop({ type: Types.ObjectId, ref: 'Property', required: true, index: true })
    propertyId: Types.ObjectId;

    @Prop({ required: true })
    userId: string;

    @Prop({ required: true })
    username: string;

    @Prop({ required: true })
    text: string;

    @Prop({ required: true, min: 1, max: 5 })
    rating: number;
}

export const CommentSchema = SchemaFactory.createForClass(Comment);
