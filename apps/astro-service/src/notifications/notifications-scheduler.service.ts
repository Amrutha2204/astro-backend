import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { NotificationsService } from './notifications.service';

@Injectable()
export class NotificationsSchedulerService {
  private readonly logger = new Logger(NotificationsSchedulerService.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  /** Run every 15 minutes; send daily horoscope push to users whose preferred time is now */
  @Cron('*/15 * * * *')
  async runDailyHoroscopePush() {
    this.logger.log('Running daily horoscope push job');
    const due = await this.notificationsService.findUsersDueForDailyPush();
    for (const prefs of due) {
      try {
        const payload = await this.notificationsService.getDailyHoroscopeForPush(prefs.userId);
        if (payload) {
          await this.notificationsService.sendPush(
            prefs.userId,
            prefs.deviceToken,
            payload.title,
            payload.body,
          );
        }
      } catch (e) {
        this.logger.warn(
          `Daily push failed for userId=${prefs.userId}: ${(e as Error).message}`,
        );
      }
    }
  }
}
