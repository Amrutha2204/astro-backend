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
  ): Promise<{ guidance: string; profileIdUsed: string | null; timestamp: string }> {
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

Provide 4–6 short paragraphs covering:
1. Natural strengths and suitable career fields based on the birth chart.
2. Favorable job sectors or roles to consider.
3. Timing: when to take career risks or apply for changes (based on current transits).
4. One or two practical tips for interviews or workplace success.
5. A brief reminder that astrology is for reflection and self-awareness, not a substitute for effort and planning.

Keep the tone supportive and professional. Do not give medical, legal, or financial advice.`;

    const guidance = await this.aiAssistantService.generateFromPrompt(prompt);
    return {
      guidance,
      profileIdUsed: profileId ?? null,
      timestamp: new Date().toISOString(),
    };
  }
}
