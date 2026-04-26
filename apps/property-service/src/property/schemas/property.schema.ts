import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PropertyDocument = Property & Document;

@Schema({ timestamps: true })
export class Property {
    @Prop({ required: true })
    title: string;

    @Prop({ required: true })
    description: string;

    @Prop({ required: true })
    price: number;

    @Prop({
        type: {
            city: { type: String, required: true },
            street: { type: String, required: true },
        },
        required: true,
    })
    location: {
        city: string;
        street: string;
    };

    @Prop([String])
    images: string[];

    @Prop({ required: true, index: true })
    ownerId: string;

    @Prop({ default: 2 })
    maxGuests: number;

    @Prop({ default: 1 })
    bedrooms: number;

    @Prop({ default: 1 })
    beds: number;

    @Prop({ default: 1 })
    bathrooms: number;

    @Prop([String])
    amenities: string[];

    @Prop({ type: { lat: Number, lng: Number }, default: null })
    coordinates?: { lat: number; lng: number };
}

export const PropertySchema = SchemaFactory.createForClass(Property);
