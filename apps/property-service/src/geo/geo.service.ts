import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class GeoService {
  async getCoordinates(address: string): Promise<{ lat: number; lng: number }> {
    const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: { address, key: process.env.GOOGLE_MAPS_API_KEY },
    });
    const location = response.data.results[0]?.geometry?.location;
    return location;
  }

  async getDistance(lat1: number, lng1: number, lat2: number, lng2: number): Promise<number> {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * 
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}
