import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class GeocodingService {
    private readonly logger = new Logger(GeocodingService.name);
    private lastRequestTime = 0;

    async geocode(city: string, street?: string): Promise<{ lat: number; lng: number } | null> {
        try {
            const timeSinceLast = Date.now() - this.lastRequestTime;
            if (timeSinceLast < 1000) {
                await new Promise((resolve) => setTimeout(resolve, 1000 - timeSinceLast));
            }

            const query = street ? `${street}, ${city}` : city;
            const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=il&limit=1`;

            this.lastRequestTime = Date.now();

            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'AirbnbClone/1.0 (educational-project)',
                },
            });

            if (!response.ok) {
                this.logger.warn(`Geocoding request failed with status ${response.status}`);
                return null;
            }

            const data = await response.json();

            if (!data || data.length === 0) {
                this.logger.debug(`No geocoding results for: ${query}`);
                return null;
            }

            return {
                lat: parseFloat(data[0].lat),
                lng: parseFloat(data[0].lon),
            };
        } catch (error) {
            this.logger.error(`Geocoding failed for ${city}`, error);
            return null;
        }
    }
}
