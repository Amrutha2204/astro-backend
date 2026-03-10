import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { AuthClientService } from '../common/services/auth-client.service';
import { getCoordinatesFromCity } from '../common/utils/coordinates.util';
import { ChartType } from '../common/utils/coordinates.util';
import { FamilyProfileService } from '../family-profile/family-profile.service';
import { NatalChartService } from '../natal-chart/natal-chart.service';
import { TransitsService } from '../transits/transits.service';
import { AiAssistantService } from '../ai-assistant/ai-assistant.service';

@Injectable()
export class CareerService {
  constructor(
    private readonly authClient: AuthClientService,
    private readonly familyProfileService: FamilyProfileService,
    private readonly natalChartService: NatalChartService,
    private readonly transitsService: TransitsService,
    private readonly aiAssistantService: AiAssistantService,
  ) {}

  async getGuidance(
    userId: string,
    token: string,
    profileId?: string,
  ): Promise<{
    guidance: string;
    sections?: {
      strengths?: string;
      suitableFields?: string;
      timing?: string;
      tips?: string;
      disclaimer?: string;
    };
    profileIdUsed: string | null;
    timestamp: string;
  }> {
    let dob: string;
    let birthPlace: string;
    let birthTime: string;
    let name: string;

    if (profileId) {
      const profile = await this.familyProfileService.findOne(profileId, userId);
      dob = profile.dob;
      birthPlace = profile.birthPlace;
      birthTime = profile.birthTime || '12:00:00';
      name = profile.name;
    } else {
      const userDetails = await this.authClient.getMe(token);
      if (!userDetails.dob || !userDetails.birthPlace) {
        throw new HttpException(
          'Birth details incomplete. Add your date and place of birth in profile, or use a family profile.',
          HttpStatus.BAD_REQUEST,
        );
      }
      dob = String(userDetails.dob);
      birthPlace = userDetails.birthPlace;
      birthTime = userDetails.birthTime || '12:00:00';
      name = 'You';
    }

    const coordinates = await getCoordinatesFromCity(birthPlace);
    const natalChart = await this.natalChartService.getNatalChart({
      dob,
      birthTime,
      latitude: coordinates.lat,
      longitude: coordinates.lng,
      chartType: ChartType.NorthIndian,
    });
    const transits = await this.transitsService.getTodayTransits();

    const prompt = `You are an astrology-based career and job guidance advisor. Give practical, encouraging career and job guidance based on the following.

**Birth chart for ${name}:**
- Sun Sign: ${natalChart.sunSign}
- Moon Sign: ${natalChart.moonSign}
- Ascendant (Rising): ${natalChart.ascendant}
- Planetary positions: ${JSON.stringify(natalChart.planetSignList)}

**Current transits (today):**
${JSON.stringify(transits.majorActiveTransits || [])}

You MUST structure your response using exactly these section headers (each on its own line, with nothing else on that line):
## Strengths
## Suitable Fields
## Timing
## Tips
## Disclaimer

Under each header, write 1–3 short paragraphs. For Strengths: natural strengths and suitable career fields from the birth chart. For Suitable Fields: favorable job sectors or roles. For Timing: when to take career risks or apply for changes based on transits. For Tips: one or two practical tips for interviews or workplace success. For Disclaimer: a brief reminder that astrology is for reflection and self-awareness, not a substitute for effort and planning. Keep the tone supportive and professional. Do not give medical, legal, or financial advice.`;

    const guidance = await this.aiAssistantService.generateFromPrompt(prompt);
    const sections = this.parseGuidanceSections(guidance);
    return {
      guidance,
      sections: Object.keys(sections).length > 0 ? sections : undefined,
      profileIdUsed: profileId ?? null,
      timestamp: new Date().toISOString(),
    };
  }

  private parseGuidanceSections(text: string): {
    strengths?: string;
    suitableFields?: string;
    timing?: string;
    tips?: string;
    disclaimer?: string;
  } {
    const sections: Record<string, string> = {};
    const headers = [
      '## Strengths',
      '## Suitable Fields',
      '## Timing',
      '## Tips',
      '## Disclaimer',
    ];
    const keys: (keyof typeof sections)[] = [
      'strengths',
      'suitableFields',
      'timing',
      'tips',
      'disclaimer',
    ];
    for (let i = 0; i < headers.length; i++) {
      const start = text.indexOf(headers[i]);
      if (start === -1) continue;
      const contentStart = start + headers[i].length;
      const nextStart =
        i < headers.length - 1
          ? text.indexOf(headers[i + 1], contentStart)
          : text.length;
      const content = text
        .slice(contentStart, nextStart > contentStart ? nextStart : text.length)
        .replace(/^\s*\n+|\n+\s*$/g, '')
        .trim();
      if (content) sections[keys[i]] = content;
    }
    return sections as any;
  }
}
