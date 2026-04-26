import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
    @Prop({ required: true, unique: true })
    email: string;

    @Prop({ required: false })
    password?: string;

    @Prop({ required: true })
    firstName: string;

    @Prop({ required: true })
    lastName: string;

    @Prop({ default: null })
    picture?: string;

    @Prop({ default: null })
    googleId?: string;

    @Prop({ default: null })
    facebookId?: string;

    @Prop({ default: null })
    currentHashedRefreshToken: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
