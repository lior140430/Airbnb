import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Property } from './schemas/property.schema';

@Injectable()
export class PropertyService {
  constructor(
    @InjectModel(Property.name) private propertyModel: Model<Property>,
  ) {}

  async create(data: any): Promise<Property> {
    return this.propertyModel.create(data);
  }

  async findAll(filters: any = {}): Promise<Property[]> {
    return this.propertyModel.find(filters).exec();
  }

  async findById(id: string): Promise<Property> {
    return this.propertyModel.findById(id).exec();
  }

  async update(id: string, data: any): Promise<Property> {
    return this.propertyModel.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async delete(id: string): Promise<any> {
    return this.propertyModel.findByIdAndDelete(id).exec();
  }

  async findNearby(lat: number, lng: number, distance: number = 5000): Promise<Property[]> {
    return this.propertyModel.find({
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [lng, lat] },
          $maxDistance: distance,
        },
      },
    }).exec();
  }
}
