import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateUserDto } from './dto/create-user.dto';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UserService {
    constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) { }

    async create(createUserDto: CreateUserDto): Promise<UserDocument> {
        const createdUser = new this.userModel(createUserDto);
        return createdUser.save();
    }

    async findByEmail(email: string): Promise<UserDocument | null> {
        return this.userModel.findOne({ email }).exec();
    }

    async findByGoogleId(googleId: string): Promise<UserDocument | null> {
        return this.userModel.findOne({ googleId }).exec();
    }

    async findByFacebookId(facebookId: string): Promise<UserDocument | null> {
        return this.userModel.findOne({ facebookId }).exec();
    }

    async findById(id: string): Promise<UserDocument | null> {
        return this.userModel.findById(id).exec();
    }

    async update(id: string, updateData: Partial<User>): Promise<UserDocument | null> {
        return this.userModel.findByIdAndUpdate(id, updateData, { new: true }).exec();
    }

    async setCurrentRefreshToken(refreshToken: string, userId: string) {
        await this.userModel.findByIdAndUpdate(userId, {
            currentHashedRefreshToken: refreshToken,
        });
    }

    async removeRefreshToken(userId: string) {
        return this.userModel.findByIdAndUpdate(userId, {
            currentHashedRefreshToken: null,
        });
    }
}
