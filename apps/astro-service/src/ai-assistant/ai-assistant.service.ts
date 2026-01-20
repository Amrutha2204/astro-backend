import {
  Injectable,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { NatalChartService } from '../natal-chart/natal-chart.service';
import { TransitsService } from '../transits/transits.service';
import { AstrologyEngineService } from '../astrology-engine/astrology-engine.service';
import { getCoordinatesFromCity } from '../common/utils/coordinates.util';
import { ChatDto } from './dto/chat.dto';
import { ExplainKundliDto } from './dto/explain-kundli.dto';

interface RateLimitEntry {
  count: number;
  resetAt: Date;
}

@Injectable()
export class AiAssistantService {
  private readonly logger = new Logger(AiAssistantService.name);
  private readonly genAI: GoogleGenerativeAI;
  private readonly model: any;
  private readonly rateLimitMap = new Map<string, RateLimitEntry>();
  private readonly MAX_QUESTIONS_PER_DAY = 5;

  constructor(
    private readonly configService: ConfigService,
    private readonly natalChartService: NatalChartService,
    private readonly transitsService: TransitsService,
    private readonly astrologyEngineService: AstrologyEngineService,
  ) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      this.logger.warn('GEMINI_API_KEY not found in environment variables');
    } else {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({ 
        model: 'gemini-2.5-flash',
      });
      this.logger.log('Initialized Gemini model: gemini-2.5-flash');
    }
  }

  private validateToken(token: string): {
    valid: boolean;
    userId?: string;
    expired?: boolean;
    error?: string;
  } {
    if (!token || token.trim() === '') {
      return { valid: false, error: 'Token is missing' };
    }

    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return { valid: false, error: 'Invalid token format' };
      }

      const payload = Buffer.from(parts[1], 'base64').toString('utf-8');
      const decoded = JSON.parse(payload);

      const userId = decoded.sub || decoded.id;
      if (!userId) {
        return { valid: false, error: 'Token does not contain user ID' };
      }

      const exp = decoded.exp;
      if (exp) {
        const expirationTime = exp * 1000;
        const now = Date.now();
        if (now >= expirationTime) {
          return {
            valid: false,
            expired: true,
            error: 'Token has expired',
          };
        }
      }

      return { valid: true, userId };
    } catch (error: any) {
      this.logger.warn(`Token validation error: ${error.message}`);
      return { valid: false, error: 'Invalid token format' };
    }
  }

  private decodeJwtToken(token: string): string | null {
    const validation = this.validateToken(token);
    if (!validation.valid) {
      return null;
    }
    return validation.userId || null;
  }

  private async fetchUserDetails(token: string) {
    const authServiceUrl =
      process.env.AUTH_SERVICE_URL || 'http://localhost:8001';

    const userDetailsResponse = await fetch(
      `${authServiceUrl}/api/v1/user-details/me`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      },
    );

    if (!userDetailsResponse.ok) {
      if (userDetailsResponse.status === 401) {
        throw new HttpException(
          'Invalid or expired token. Please login again.',
          HttpStatus.UNAUTHORIZED,
        );
      }
      if (userDetailsResponse.status === 404) {
        throw new HttpException(
          'Birth details not found. Please complete your profile first.',
          HttpStatus.NOT_FOUND,
        );
      }
      throw new HttpException(
        'Failed to fetch user details.',
        userDetailsResponse.status,
      );
    }

    return userDetailsResponse.json();
  }

  private checkRateLimit(userId: string): void {
    const now = new Date();
    const entry = this.rateLimitMap.get(userId);

    if (entry) {
      if (now > entry.resetAt) {
        this.rateLimitMap.delete(userId);
      } else if (entry.count >= this.MAX_QUESTIONS_PER_DAY) {
        throw new HttpException(
          `Rate limit exceeded. You can ask up to ${this.MAX_QUESTIONS_PER_DAY} questions per day. Please try again tomorrow.`,
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }
  }

  private incrementRateLimit(userId: string): void {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const entry = this.rateLimitMap.get(userId);
    if (entry) {
      entry.count += 1;
    } else {
      this.rateLimitMap.set(userId, {
        count: 1,
        resetAt: tomorrow,
      });
    }
  }

  private buildChatPrompt(
    natalChart: any,
    transits: any,
    question: string,
    context?: string,
  ): string {
    const contextHint = context
      ? `Focus on: ${context}. `
      : '';

    return `You are an astrology assistant helping users understand their birth chart and current planetary influences.

User's Birth Chart:
- Sun Sign: ${natalChart.sunSign}
- Moon Sign: ${natalChart.moonSign}
- Ascendant (Rising Sign): ${natalChart.ascendant}
- Planetary Positions: ${JSON.stringify(natalChart.planetSignList)}

Today's Planetary Transits:
- Current Positions: ${JSON.stringify(transits.majorActiveTransits)}
- Date: ${transits.date}

User Question: ${question}

${contextHint}Provide a personalized, non-technical answer in 2-3 sentences. Use psychological, reflective language. 

IMPORTANT RULES:
- No medical advice (don't say "you should see a doctor" or give health recommendations)
- No legal advice
- No financial predictions or money advice
- Use conditional language: "may", "could", "might", "tends to"
- Include this disclaimer: "Remember, astrology is for reflection and self-awareness, not prediction."
- Be supportive and encouraging
- Keep response under 200 words`;
  }

  private buildExplainKundliPrompt(vedicChart: any, focus?: string): string {
    const focusInstruction = focus
      ? `Focus specifically on: ${focus}. `
      : 'Provide a comprehensive explanation covering all aspects. ';

    const moonPlanet = vedicChart.planets.find((p: any) => p.planet === 'Moon');
    const nakshatraInfo = moonPlanet?.nakshatra
      ? `- Nakshatra: ${moonPlanet.nakshatra} (Pada ${moonPlanet.pada || 1})`
      : '- Nakshatra: Not available';

    return `You are an astrology assistant explaining a birth chart in simple, relatable terms.

Birth Chart Details:
- Sun: ${vedicChart.sunSign.sign} at ${vedicChart.sunSign.degree}°
- Moon: ${vedicChart.moonSign.sign} at ${vedicChart.moonSign.degree}°
- Ascendant (Rising): ${vedicChart.lagna.sign} at ${vedicChart.lagna.degree}°
${nakshatraInfo}
- Planetary Positions:
${vedicChart.planets.map((p: any) => `  - ${p.planet}: ${p.sign} at ${p.degree}°`).join('\n')}
- Houses:
${vedicChart.houses.map((h: any) => `  - House ${h.house}: ${h.sign}`).join('\n')}

${focusInstruction}Explain this chart as if talking to a friend. Use:
- Psychological insights
- Real-life examples
- Avoid technical jargon
- Be encouraging and supportive
- Keep explanations clear and relatable

IMPORTANT RULES:
- No medical or legal advice
- Use conditional language: "may", "could", "suggests"
- Include disclaimer: "Astrology is for reflection and self-awareness, not prediction."`;
  }

  private buildSuggestionsPrompt(natalChart: any, transits: any): string {
    return `You are an astrology assistant providing daily personalized suggestions.

User's Birth Chart:
- Sun Sign: ${natalChart.sunSign}
- Moon Sign: ${natalChart.moonSign}
- Ascendant: ${natalChart.ascendant}

Today's Planetary Transits:
- Current Positions: ${JSON.stringify(transits.majorActiveTransits)}
- Date: ${transits.date}

Generate 3-5 actionable suggestions covering:
1. Relationships (communication, connections, boundaries)
2. Career/Work (focus areas, opportunities, challenges)
3. Wellness/Self-care (energy, rest, activities)
4. Personal Growth (reflection, learning, development)

Format each suggestion as:
- Category: [category name]
- Suggestion: [short, actionable advice]
- Reason: [astrological reasoning based on transits]

IMPORTANT RULES:
- No medical or legal advice
- Use conditional language: "may", "could", "consider"
- Be supportive and practical
- Keep each suggestion under 50 words
- Include overall theme for the day`;
  }

  async listAvailableModels() {
    try {
      const apiKey = this.configService.get<string>('GEMINI_API_KEY');
      if (!apiKey) {
        throw new HttpException(
          'AI service not configured. Please check GEMINI_API_KEY.',
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
      );
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        models: data.models?.map((m: any) => ({
          name: m.name,
          displayName: m.displayName,
          supportedMethods: m.supportedGenerationMethods,
        })) || [],
      };
    } catch (error: any) {
      this.logger.error(`Error listing models: ${error.message}`, error.stack);
      throw new HttpException(
        `Failed to list models: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private async callGemini(prompt: string, retries = 2): Promise<string> {
    if (!this.model) {
      throw new HttpException(
        'AI service not configured. Please check GEMINI_API_KEY.',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error: any) {
      this.logger.error(
        `Gemini API error: ${error.message}`,
        error.stack,
      );
      this.logger.error(`Error details: ${JSON.stringify(error)}`);
      
      if (error.message?.includes('API_KEY')) {
        throw new HttpException(
          'Invalid API key. Please check GEMINI_API_KEY.',
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }
      
      if (error.message?.includes('overloaded') && retries > 0) {
        this.logger.warn(`Model overloaded, retrying... (${retries} attempts left)`);
        await new Promise((resolve) => setTimeout(resolve, 2000));
        return this.callGemini(prompt, retries - 1);
      }
      
      if (error.message?.includes('overloaded')) {
        throw new HttpException(
          'AI service is temporarily overloaded. Please try again in a few moments.',
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }
      
      if (error.message?.includes('404') || error.message?.includes('not found')) {
        this.logger.warn('Model not found. Available models might be different.');
        const availableModels = await this.listAvailableModels().catch(() => null);
        if (availableModels) {
          this.logger.log(`Available models: ${JSON.stringify(availableModels)}`);
        }
      }
      
      throw new HttpException(
        `Failed to generate AI response: ${error.message || 'Unknown error'}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async chat(token: string, dto: ChatDto) {
    try {
      const tokenValidation = this.validateToken(token);
      if (!tokenValidation.valid) {
        if (tokenValidation.expired) {
          throw new HttpException(
            'Token has expired. Please login again.',
            HttpStatus.UNAUTHORIZED,
          );
        }
        throw new HttpException(
          tokenValidation.error || 'Invalid token',
          HttpStatus.UNAUTHORIZED,
        );
      }

      const userId = tokenValidation.userId || token.substring(0, 20);
      this.checkRateLimit(userId);

      const userDetails = await this.fetchUserDetails(token);

      if (!userDetails.dob || !userDetails.birthPlace) {
        throw new HttpException(
          'Birth details incomplete. Please provide date of birth and birth place.',
          HttpStatus.BAD_REQUEST,
        );
      }

      const dob = new Date(userDetails.dob);
      const dobString = dob.toISOString().split('T')[0];
      const birthTime = userDetails.birthTime || '12:00:00';
      const coordinates = getCoordinatesFromCity(userDetails.birthPlace);

      const natalChart = await this.natalChartService.getNatalChart({
        dob: dobString,
        birthTime,
        latitude: coordinates.lat,
        longitude: coordinates.lng,
      });

      const transits = await this.transitsService.getTodayTransits();

      const prompt = this.buildChatPrompt(
        natalChart,
        transits,
        dto.question,
        dto.context,
      );

      const answer = await this.callGemini(prompt);

      this.incrementRateLimit(userId);

      return {
        answer,
        relatedTransits: transits.majorActiveTransits.slice(0, 3),
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(`Error in chat: ${error.message}`, error.stack);
      throw new HttpException(
        'Failed to process chat request. Please try again later.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async explainKundli(token: string, dto: ExplainKundliDto) {
    try {
      const tokenValidation = this.validateToken(token);
      if (!tokenValidation.valid) {
        if (tokenValidation.expired) {
          throw new HttpException(
            'Token has expired. Please login again.',
            HttpStatus.UNAUTHORIZED,
          );
        }
        throw new HttpException(
          tokenValidation.error || 'Invalid token',
          HttpStatus.UNAUTHORIZED,
        );
      }

      const userDetails = await this.fetchUserDetails(token);

      if (!userDetails.dob || !userDetails.birthPlace) {
        throw new HttpException(
          'Birth details incomplete. Please provide date of birth and birth place.',
          HttpStatus.BAD_REQUEST,
        );
      }

      const dob = new Date(userDetails.dob);
      const year = dob.getFullYear();
      const month = dob.getMonth() + 1;
      const day = dob.getDate();
      const birthTime = userDetails.birthTime || '12:00:00';
      const [hours, minutes] = birthTime.split(':').map(Number);
      const coordinates = getCoordinatesFromCity(userDetails.birthPlace);

      const vedicChart = await this.astrologyEngineService.calculateVedicChart(
        {
          year,
          month,
          day,
          hour: hours || 12,
          minute: minutes || 0,
          latitude: coordinates.lat,
          longitude: coordinates.lng,
        },
      );

      const prompt = this.buildExplainKundliPrompt(vedicChart, dto.focus);

      const explanation = await this.callGemini(prompt);

      const moonPlanet = vedicChart.planets.find((p) => p.planet === 'Moon');

      return {
        explanation: {
          text: explanation,
          focus: dto.focus || 'overall',
        },
        chartSummary: {
          sunSign: vedicChart.sunSign.sign,
          moonSign: vedicChart.moonSign.sign,
          ascendant: vedicChart.lagna.sign,
          nakshatra: moonPlanet?.nakshatra || 'Unknown',
        },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(
        `Error explaining kundli: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        'Failed to explain kundli. Please try again later.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getSuggestions(token: string) {
    try {
      const tokenValidation = this.validateToken(token);
      if (!tokenValidation.valid) {
        if (tokenValidation.expired) {
          throw new HttpException(
            'Token has expired. Please login again.',
            HttpStatus.UNAUTHORIZED,
          );
        }
        throw new HttpException(
          tokenValidation.error || 'Invalid token',
          HttpStatus.UNAUTHORIZED,
        );
      }

      const userDetails = await this.fetchUserDetails(token);

      if (!userDetails.dob || !userDetails.birthPlace) {
        throw new HttpException(
          'Birth details incomplete. Please provide date of birth and birth place.',
          HttpStatus.BAD_REQUEST,
        );
      }

      const dob = new Date(userDetails.dob);
      const dobString = dob.toISOString().split('T')[0];
      const birthTime = userDetails.birthTime || '12:00:00';
      const coordinates = getCoordinatesFromCity(userDetails.birthPlace);

      const natalChart = await this.natalChartService.getNatalChart({
        dob: dobString,
        birthTime,
        latitude: coordinates.lat,
        longitude: coordinates.lng,
      });

      const transits = await this.transitsService.getTodayTransits();

      const prompt = this.buildSuggestionsPrompt(natalChart, transits);

      const response = await this.callGemini(prompt);

      const suggestions = this.parseSuggestionsResponse(response);

      return {
        date: new Date().toISOString().split('T')[0],
        suggestions,
        overallTheme: this.extractOverallTheme(response),
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(
        `Error getting suggestions: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        'Failed to get suggestions. Please try again later.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private parseSuggestionsResponse(response: string): Array<{
    category: string;
    suggestion: string;
    reason: string;
  }> {
    const suggestions: Array<{
      category: string;
      suggestion: string;
      reason: string;
    }> = [];

    const lines = response.split('\n').filter((line) => line.trim());

    let currentSuggestion: any = null;

    for (const line of lines) {
      if (line.toLowerCase().includes('category:')) {
        if (currentSuggestion) {
          suggestions.push(currentSuggestion);
        }
        currentSuggestion = {
          category: line.split(':')[1]?.trim() || 'General',
          suggestion: '',
          reason: '',
        };
      } else if (line.toLowerCase().includes('suggestion:')) {
        if (currentSuggestion) {
          currentSuggestion.suggestion = line.split(':')[1]?.trim() || '';
        }
      } else if (line.toLowerCase().includes('reason:')) {
        if (currentSuggestion) {
          currentSuggestion.reason = line.split(':')[1]?.trim() || '';
        }
      }
    }

    if (currentSuggestion) {
      suggestions.push(currentSuggestion);
    }

    if (suggestions.length === 0) {
      return [
        {
          category: 'General',
          suggestion: response.substring(0, 200),
          reason: 'Based on current planetary transits',
        },
      ];
    }

    return suggestions;
  }

  private extractOverallTheme(response: string): string {
    const themeMatch = response.match(/overall theme[:\-]?\s*(.+)/i);
    if (themeMatch) {
      return themeMatch[1].trim();
    }

    return 'Day of reflection and growth';
  }
}

