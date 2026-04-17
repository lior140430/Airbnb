import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Property extends Document {
  @Prop({ required: true })
  title: string;

  @Prop()
  description: string;

  @Prop({ required: true })
  price: number;

  @Prop({ required: true })
  bedrooms: number;

  @Prop({ required: true })
  bathrooms: number;

  @Prop({ type: { type: String }, coordinates: [Number] })
  location: { type: string; coordinates: [number, number] };

  @Prop({ required: true })
  ownerId: string;

  @Prop({ default: 0 })
  rating: number;

  @Prop({ default: [] })
  images: string[];

  @Prop({ default: false })
  available: boolean;
}

export const PropertySchema = SchemaFactory.createForClass(Property);
PropertySchema.index({ 'location': '2dsphere' });
