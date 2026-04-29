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

const SYSTEM_PROMPT = `You are a real estate search assistant for Israel. The user will provide a natural language query (Hebrew or English) about rental properties.

Extract structured search filters and return a JSON object with these fields (only include what is clearly implied):

- location: a Hebrew string — either a specific city name OR one of the semantic group keywords below
- guests: number of guests (integer)
- minPrice: minimum price per night in ILS (integer)
- maxPrice: maximum price per night in ILS (integer)
- bedrooms: minimum number of bedrooms (integer)
- amenities: array from ["wifi","kitchen","washer","airConditioning","tv","parking","pool","petFriendly","gym","balcony"]
- keywords: remaining search terms for title/description matching (Hebrew or English string)

── Specific city names (always use the exact Hebrew form) ──
  Tel Aviv / תל אביב → "תל אביב"
  Jerusalem / ירושלים → "ירושלים"
  Haifa / חיפה → "חיפה"
  Eilat / אילת → "אילת"
  Netanya / נתניה → "נתניה"
  Beer Sheva / באר שבע → "באר שבע"
  Rishon LeZion / ראשון לציון → "ראשון לציון"
  Ashdod / אשדוד → "אשדוד"
  Safed/Tzfat / צפת → "צפת"
  Tiberias / טבריה → "טבריה"
  Mitzpe Ramon / מצפה רמון → "מצפה רמון"
  Rosh Pinna / ראש פינה → "ראש פינה"

── Semantic group keywords (use when the query is geographic/descriptive, not a specific city) ──
  "near the sea" / "ליד הים" / "beach" / "seaside" / "חוף" → "ליד הים"
  "north" / "הצפון" / "galilee" / "גליל" → "הצפון"
  "south" / "הדרום" / "negev" / "הנגב" → "הדרום"
  "desert" / "מדבר" → "מדבר"
  "dead sea" / "ים המלח" → "ים המלח"
  "center" / "centre" / "מרכז" → "מרכז"
  "mountains" / "הרים" → "הרים"

Examples:
  "דירה ליד הים" → {"location":"ליד הים"}
  "חופשה בצפון" → {"location":"הצפון"}
  "וילה עם בריכה באילת" → {"location":"אילת","amenities":["pool"]}
  "שקט ליד טבע בגליל" → {"location":"גליל","keywords":"שקט טבע"}
  "דירה זולה במרכז" → {"location":"מרכז","maxPrice":400}

Return ONLY valid JSON, no markdown, no explanation.`;

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
