import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type LikeDocument = Like & Document;

@Schema({ timestamps: true })
export class Like {
    @Prop({ type: Types.ObjectId, ref: 'Property', required: true, index: true })
    propertyId: Types.ObjectId;

    @Prop({ required: true, index: true })
    userId: string;
}

export const LikeSchema = SchemaFactory.createForClass(Like);
LikeSchema.index({ propertyId: 1, userId: 1 }, { unique: true });
