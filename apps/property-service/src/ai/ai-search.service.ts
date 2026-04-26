import { GoogleGenerativeAI } from '@google/generative-ai';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface ParsedSearchFilters {
    location?: string;
    guests?: number;
    minPrice?: number;
    maxPrice?: number;
    bedrooms?: number;
    amenities?: string[];
    keywords?: string;
}

const SYSTEM_PROMPT = `You are a real estate search assistant. The user will provide a natural language search query (may be in Hebrew or English) about rental properties.

Extract structured search filters from the query and return a JSON object with these fields (only include fields that are clearly mentioned):
- location: city name in English (e.g. "Tel Aviv", "Jerusalem", "Haifa", "Eilat", "Netanya")  
- guests: number of guests (integer)
- minPrice: minimum price per night in ILS (integer)
- maxPrice: maximum price per night in ILS (integer)
- bedrooms: number of bedrooms (integer)
- amenities: array of amenity keys from: ["wifi", "kitchen", "washer", "airConditioning", "tv", "parking", "pool", "petFriendly", "gym", "balcony"]
- keywords: remaining search terms to match against title/description (string, keep relevant words, translate to English if needed)

Hebrew city name mappings: תל אביב→Tel Aviv, ירושלים→Jerusalem, חיפה→Haifa, אילת→Eilat, נתניה→Netanya, ראשון לציון→Rishon LeZion, אשדוד→Ashdod

Return ONLY valid JSON, no markdown, no explanation.
Example output: {"location":"Tel Aviv","guests":3,"amenities":["pool","wifi"],"keywords":"quiet apartment"}`;

@Injectable()
export class AiSearchService {
    private readonly logger = new Logger(AiSearchService.name);
    private genAI: GoogleGenerativeAI | null = null;

    private readonly aiEnabled: boolean;

    constructor(private configService: ConfigService) {
        this.aiEnabled = this.configService.get<string>('AI_SEARCH_ENABLED') !== 'false';
        const apiKey = this.configService.get<string>('GEMINI_API_KEY');
        if (this.aiEnabled && apiKey) {
            this.genAI = new GoogleGenerativeAI(apiKey);
        } else if (!this.aiEnabled) {
            this.logger.log('AI search disabled via AI_SEARCH_ENABLED=false');
        } else {
            this.logger.warn('GEMINI_API_KEY not set – AI search will fall back to keyword search');
        }
    }

    async parseQuery(query: string): Promise<ParsedSearchFilters> {
        // Skip AI if disabled, no query, or no genAI client
        if (!this.aiEnabled || !query?.trim() || !this.genAI) return {};

        try {
            const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
            const result = await model.generateContent(`${SYSTEM_PROMPT}\n\nUser query: "${query}"`);
            const text = result.response.text().trim();

            // Strip markdown code fences if present
            const clean = text.replace(/^```json\s*/i, '').replace(/```$/, '').trim();
            const parsed = JSON.parse(clean);

            this.logger.log(`AI parsed "${query}" → ${JSON.stringify(parsed)}`);
            return parsed;
        } catch (err) {
            this.logger.error('AI parse failed, falling back to keyword search', err);
            return { keywords: query };
        }
    }
}
