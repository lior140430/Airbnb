import { Controller, Get, Post, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { PropertyService } from './property.service';

@Controller('properties')
export class PropertyController {
  constructor(private readonly propertyService: PropertyService) {}

  @Post()
  async create(@Body() data: any) {
    return this.propertyService.create(data);
  }

  @Get()
  async findAll(@Query() filters: any) {
    return this.propertyService.findAll(filters);
  }

  @Get('/nearby')
  async getNearby(@Query('lat') lat: number, @Query('lng') lng: number, @Query('distance') distance: number) {
    return this.propertyService.findNearby(lat, lng, distance);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.propertyService.findById(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() data: any) {
    return this.propertyService.update(id, data);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.propertyService.delete(id);
  }
}
