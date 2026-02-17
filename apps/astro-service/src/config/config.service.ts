import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppConfig } from './app-config.entity';

@Injectable()
export class AppConfigService {
  static readonly KEY_AI_ENABLED = 'aiEnabled';
  static readonly KEY_CONTENT = 'content';

  constructor(
    @InjectRepository(AppConfig)
    private readonly repo: Repository<AppConfig>,
  ) {}

  async get(key: string): Promise<string | null> {
    const row = await this.repo.findOne({ where: { key } });
    return row?.value ?? null;
  }

  async set(key: string, value: string): Promise<void> {
    await this.repo.upsert({ key, value }, { conflictPaths: ['key'] });
  }

  async getAiEnabled(): Promise<boolean> {
    const v = await this.get(AppConfigService.KEY_AI_ENABLED);
    return v === 'true';
  }

  async setAiEnabled(enabled: boolean): Promise<void> {
    await this.set(AppConfigService.KEY_AI_ENABLED, enabled ? 'true' : 'false');
  }

  async getContent(): Promise<{ sunSignMeanings?: string; planetMeanings?: string; transitInterpretations?: string }> {
    const raw = await this.get(AppConfigService.KEY_CONTENT);
    if (!raw?.trim()) return {};
    try {
      return JSON.parse(raw) as { sunSignMeanings?: string; planetMeanings?: string; transitInterpretations?: string };
    } catch {
      return {};
    }
  }

  async setContent(content: { sunSignMeanings?: string; planetMeanings?: string; transitInterpretations?: string }): Promise<void> {
    await this.set(AppConfigService.KEY_CONTENT, JSON.stringify(content));
  }
}
