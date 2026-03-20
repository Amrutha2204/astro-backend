import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppConfig } from './app-config.entity';

@Injectable()
export class AppConfigService {
  static readonly KEY_AI_ENABLED = 'aiEnabled';
  static readonly KEY_CONTENT = 'content';

  private readonly logger = new Logger(AppConfigService.name);

  constructor(
    @InjectRepository(AppConfig)
    private readonly repo: Repository<AppConfig>,
  ) {}

  async get(key: string): Promise<string | null> {
    try {
      const row = await this.repo.findOne({ where: { key } });
      return row?.value ?? null;
    } catch (err) {
      this.logger.warn(`AppConfig get('${key}') failed: ${err instanceof Error ? err.message : err}`);
      return null;
    }
  }

  async set(key: string, value: string): Promise<void> {
    try {
      await this.repo.upsert({ key, value }, { conflictPaths: ['key'] });
    } catch (err) {
      this.logger.warn(`AppConfig set('${key}') failed: ${err instanceof Error ? err.message : err}`);
    }
  }

  /** When table is missing or no row: default true (AI on). Only 'false' turns it off. */
  async getAiEnabled(): Promise<boolean> {
    try {
      const v = await this.get(AppConfigService.KEY_AI_ENABLED);
      return v !== 'false';
    } catch (err) {
      this.logger.warn(`getAiEnabled failed: ${err instanceof Error ? err.message : err}`);
      return true;
    }
  }

  async setAiEnabled(enabled: boolean): Promise<void> {
    await this.set(AppConfigService.KEY_AI_ENABLED, enabled ? 'true' : 'false');
  }

  async getContent(): Promise<{ sunSignMeanings?: string; planetMeanings?: string; transitInterpretations?: string }> {
    try {
      const raw = await this.get(AppConfigService.KEY_CONTENT);
      if (!raw?.trim()) return {};
      return JSON.parse(raw) as { sunSignMeanings?: string; planetMeanings?: string; transitInterpretations?: string };
    } catch (err) {
      this.logger.warn(`getContent failed: ${err instanceof Error ? err.message : err}`);
      return {};
    }
  }

  async setContent(content: { sunSignMeanings?: string; planetMeanings?: string; transitInterpretations?: string }): Promise<void> {
    await this.set(AppConfigService.KEY_CONTENT, JSON.stringify(content));
  }
}
