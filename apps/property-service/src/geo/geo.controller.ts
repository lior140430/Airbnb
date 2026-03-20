import { Controller, Get, Query } from '@nestjs/common';
import { GeoService } from './geo.service';

@Controller('geo')
export class GeoController {
  constructor(private geoService: GeoService) {}

  @Get('coordinates')
  async getCoordinates(@Query('address') address: string) {
    return this.geoService.getCoordinates(address);
  }

  @Get('distance')
  async getDistance(
    @Query('lat1') lat1: number,
    @Query('lng1') lng1: number,
    @Query('lat2') lat2: number,
    @Query('lng2') lng2: number,
  ) {
    return this.geoService.getDistance(lat1, lng1, lat2, lng2);
  }
}
