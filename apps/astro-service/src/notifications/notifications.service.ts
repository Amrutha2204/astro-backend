import {
  Injectable,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationPreference } from './entities/notification-preference.entity';
import { UpdateNotificationPreferencesDto } from './dto/update-preferences.dto';
import { HoroscopeRuleService } from '../horoscope-rule/horoscope-rule.service';
import { getCoordinatesFromCity } from '../common/utils/coordinates.util';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly authServiceUrl: string;
  private readonly authInternalKey: string;
  private readonly fcmServerKey: string;

  constructor(
    @InjectRepository(NotificationPreference)
    private readonly prefsRepo: Repository<NotificationPreference>,
    private readonly horoscopeRuleService: HoroscopeRuleService,
    private readonly configService: ConfigService,
  ) {
    this.authServiceUrl =
      this.configService.get<string>('AUTH_SERVICE_URL') || 'http://localhost:8001';
    this.authInternalKey =
      this.configService.get<string>('AUTH_INTERNAL_API_KEY') || '';
    this.fcmServerKey = this.configService.get<string>('FCM_SERVER_KEY') || '';
  }

  async getPreferences(userId: string) {
    let prefs = await this.prefsRepo.findOne({ where: { userId } });
    if (!prefs) {
      prefs = this.prefsRepo.create({
        userId,
        dailyHoroscopeEnabled: false,
        preferredTime: '09:00',
        timezone: 'Asia/Kolkata',
        deviceToken: null,
      });
      await this.prefsRepo.save(prefs);
    }
    return {
      dailyHoroscopeEnabled: prefs.dailyHoroscopeEnabled,
      preferredTime: prefs.preferredTime,
      timezone: prefs.timezone,
      deviceRegistered: !!prefs.deviceToken,
    };
  }

  async updatePreferences(
    userId: string,
    dto: UpdateNotificationPreferencesDto,
  ) {
    let prefs = await this.prefsRepo.findOne({ where: { userId } });
    if (!prefs) {
      prefs = this.prefsRepo.create({
        userId,
        dailyHoroscopeEnabled: false,
        preferredTime: '09:00',
        timezone: 'Asia/Kolkata',
        deviceToken: null,
      });
    }
    if (dto.dailyHoroscopeEnabled !== undefined)
      prefs.dailyHoroscopeEnabled = dto.dailyHoroscopeEnabled;
    if (dto.preferredTime !== undefined) prefs.preferredTime = dto.preferredTime;
    if (dto.timezone !== undefined) prefs.timezone = dto.timezone;
    await this.prefsRepo.save(prefs);
    return this.getPreferences(userId);
  }

  async registerDevice(userId: string, deviceToken: string) {
    let prefs = await this.prefsRepo.findOne({ where: { userId } });
    if (!prefs) {
      prefs = this.prefsRepo.create({
        userId,
        dailyHoroscopeEnabled: false,
        preferredTime: '09:00',
        timezone: 'Asia/Kolkata',
        deviceToken,
      });
    } else {
      prefs.deviceToken = deviceToken;
    }
    await this.prefsRepo.save(prefs);
    return { message: 'Device registered for push notifications' };
  }

  /** Used by scheduler: fetch user birth details from auth-service (internal API) */
  async getUserBirthDetails(userId: string): Promise<{
    dob: string;
    birthPlace: string;
    birthTime: string;
  } | null> {
    if (!this.authInternalKey) {
      this.logger.warn('AUTH_INTERNAL_API_KEY not set; cannot fetch user details for push');
      return null;
    }
    try {
      const res = await fetch(
        `${this.authServiceUrl}/api/v1/user-details/internal/${userId}`,
        {
          headers: {
            'X-Internal-Api-Key': this.authInternalKey,
            Accept: 'application/json',
          },
        },
      );
      if (!res.ok) return null;
      const data = await res.json();
      const dob = data.dob instanceof Date ? data.dob : new Date(data.dob);
      const dobString = dob.toISOString().split('T')[0];
      return {
        dob: dobString,
        birthPlace: data.birthPlace || '',
        birthTime: data.birthTime || '12:00:00',
      };
    } catch (e) {
      this.logger.warn(`Failed to fetch user details for ${userId}: ${(e as Error).message}`);
      return null;
    }
  }

  /** Generate today's horoscope for a user (by userId) and return text for push */
  async getDailyHoroscopeForPush(userId: string): Promise<{ title: string; body: string } | null> {
    const birth = await this.getUserBirthDetails(userId);
    if (!birth || !birth.birthPlace) return null;
    try {
      const { lat, lng } = await getCoordinatesFromCity(birth.birthPlace.trim());
      const birthTime =
        birth.birthTime.split(':').length === 2
          ? `${birth.birthTime}:00`
          : birth.birthTime;
      const kundliDto = {
        dob: birth.dob,
        birthTime: birthTime,
        latitude: lat,
        longitude: lng,
      };
      const horoscope = await this.horoscopeRuleService.getTodayHoroscope(kundliDto);
      return {
        title: "Your Daily Horoscope",
        body: `${horoscope.dayType} day. ${horoscope.mainTheme} ${horoscope.reason}`,
      };
    } catch (e) {
      this.logger.warn(`Failed to generate horoscope for push (userId=${userId}): ${(e as Error).message}`);
      return null;
    }
  }

  /** Send push via FCM Legacy API when FCM_SERVER_KEY is set; otherwise log only. */
  async sendPush(userId: string, deviceToken: string | null, title: string, body: string) {
    if (!deviceToken) {
      this.logger.log(`[Push] userId=${userId} – no device token, skip`);
      return;
    }
    if (this.fcmServerKey) {
      try {
        const res = await fetch('https://fcm.googleapis.com/fcm/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `key=${this.fcmServerKey}`,
          },
          body: JSON.stringify({
            to: deviceToken,
            notification: { title, body },
            priority: 'high',
          }),
        });
        if (!res.ok) {
          const text = await res.text();
          this.logger.warn(`[Push] FCM send failed for userId=${userId}: ${res.status} ${text}`);
          return;
        }
        const data = await res.json();
        if (data.failure === 1) {
          this.logger.warn(`[Push] FCM reported failure for userId=${userId}: ${JSON.stringify(data.results)}`);
          return;
        }
        this.logger.log(`[Push] userId=${userId} – sent: ${title}`);
      } catch (e) {
        this.logger.warn(`[Push] FCM error for userId=${userId}: ${(e as Error).message}`);
      }
      return;
    }
    this.logger.log(`[Push] userId=${userId} – (no FCM_SERVER_KEY) ${title}: ${body}`);
  }

  /** Find preferences where it's currently the user's preferred time (within 15-min window) */
  async findUsersDueForDailyPush(): Promise<NotificationPreference[]> {
    const all = await this.prefsRepo.find({
      where: { dailyHoroscopeEnabled: true },
    });
    const now = new Date();
    const due: NotificationPreference[] = [];
    for (const prefs of all) {
      try {
        const tz = prefs.timezone || 'Asia/Kolkata';
        const localTimeStr = now.toLocaleString('en-CA', {
          timeZone: tz,
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
        });
        const [prefHour, prefMin] = (prefs.preferredTime || '09:00')
          .split(':')
          .map(Number);
        const preferredStartMinutes = prefHour * 60 + prefMin;
        const [currentHour, currentMinute] = localTimeStr.split(':').map(Number);
        const currentMinutes = currentHour * 60 + currentMinute;
        const diff = currentMinutes - preferredStartMinutes;
        const inWindow = diff >= 0 && diff < 15;
        if (inWindow) due.push(prefs);
      } catch {
        // invalid timezone, skip
      }
    }
    return due;
  }
}
