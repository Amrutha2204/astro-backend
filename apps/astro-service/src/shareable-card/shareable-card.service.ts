import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { join } from 'path';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import sharp from 'sharp';
import { PDFDocument } from 'pdf-lib';
import { CreateCardDto, CardType } from './dto/create-card.dto';

export interface StoredCard {
  id: string;
  imagePath: string;
  imageUrl: string;
  pdfPath?: string;
  pdfUrl?: string;
  createdAt: string;
}

@Injectable()
export class ShareableCardService {
  private readonly logger = new Logger(ShareableCardService.name);
  private readonly storageDir: string;
  private readonly baseUrl: string;

  constructor() {
    this.storageDir =
      process.env.CARDS_STORAGE_PATH ||
      join(process.cwd(), 'apps', 'astro-service', 'uploads', 'cards');
    this.baseUrl = process.env.APP_PUBLIC_URL || 'http://localhost:3000';
    this.ensureStorageDir();
  }

  private ensureStorageDir(): void {
    if (!existsSync(this.storageDir)) {
      mkdirSync(this.storageDir, { recursive: true });
      this.logger.log(`Created cards storage directory: ${this.storageDir}`);
    }
  }

  /** Treat empty or placeholder values as missing for display. */
  private isMeaningful(value: unknown): boolean {
    if (value == null) return false;
    const s = String(value).trim();
    return s.length > 0 && s !== '—' && s !== '-' && s.toLowerCase() !== 'n/a';
  }

  /** Build SVG string for a horoscope or kundli summary card. */
  private buildCardSvg(dto: CreateCardDto): string {
    const title = dto.title || (dto.type === CardType.Horoscope ? "Today's Horoscope" : 'Kundli Summary');
    const date = dto.date || new Date().toISOString().split('T')[0];
    const payload = dto.payload || {};
    const lines: string[] = [];
    if (dto.type === CardType.Horoscope) {
      const dayType = this.isMeaningful(payload['dayType']) ? String(payload['dayType']).trim() : 'Based on today\'s chart';
      const theme = this.isMeaningful(payload['mainTheme']) ? String(payload['mainTheme']).trim() : 'General planetary influence';
      const reason = this.isMeaningful(payload['reason']) ? String(payload['reason']).trim() : 'Derived from current transits and Vedic methods.';
      lines.push(`Day: ${dayType}`);
      lines.push(`Theme: ${theme}`);
      lines.push(`Reason: ${reason}`);
    } else {
      Object.entries(payload).slice(0, 8).forEach(([k, v]) => {
        const val = this.isMeaningful(v) ? String(v).trim() : 'Not specified';
        lines.push(`${String(k).trim()}: ${val}`);
      });
      if (lines.length === 0) lines.push('Based on your birth chart (Swiss Ephemeris).');
    }
    const displayLines = lines.length ? lines : ['Based on your chart and current planetary positions.'];
    const width = 600;
    const height = 400;
    const bg = '#1a1a2e';
    const accent = '#e94560';
    const textColor = '#eee';
    const lineHeight = 22;
    const bodyY = 160;
    const tspanLines = displayLines
      .map((line, i) => `<tspan x="40" dy="${i === 0 ? 0 : lineHeight}">${this.escapeXml(line)}</tspan>`)
      .join('\n  ');
    return `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#16213e"/>
      <stop offset="100%" style="stop-color:#1a1a2e"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#bg)"/>
  <rect x="20" y="20" width="${width - 40}" height="4" fill="${accent}" rx="2"/>
  <text x="40" y="70" fill="${textColor}" font-family="system-ui, sans-serif" font-size="28" font-weight="bold">${this.escapeXml(title)}</text>
  <text x="40" y="105" fill="#aaa" font-family="system-ui, sans-serif" font-size="14">${this.escapeXml(date)}</text>
  <text x="40" y="${bodyY}" fill="${textColor}" font-family="system-ui, sans-serif" font-size="16">${tspanLines}</text>
  <text x="${width - 120}" y="${height - 30}" fill="#666" font-family="system-ui, sans-serif" font-size="12">Astro</text>
</svg>`.trim();
  }

  private escapeXml(s: string): string {
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /** Generate PNG buffer from SVG using sharp. */
  async generateCardImage(dto: CreateCardDto): Promise<Buffer> {
    const svg = this.buildCardSvg(dto);
    const buffer = Buffer.from(svg);
    const png = await sharp(buffer)
      .png()
      .toBuffer();
    return png;
  }

  /** Store PNG (and optional PDF) to disk; return paths and URLs. */
  async createAndStore(dto: CreateCardDto): Promise<StoredCard> {
    try {
      this.ensureStorageDir();
      const id = `card_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      const imageFilename = `${id}.png`;
      const pdfFilename = `${id}.pdf`;
      const imagePath = join(this.storageDir, imageFilename);
      const pdfPath = join(this.storageDir, pdfFilename);

      const pngBuffer = await this.generateCardImage(dto);
      writeFileSync(imagePath, pngBuffer);

      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([600, 400]);
      const pngBytes = new Uint8Array(pngBuffer);
      const image = await pdfDoc.embedPng(pngBytes);
      page.drawImage(image, { x: 0, y: 0, width: 600, height: 400 });
      const pdfBytes = await pdfDoc.save();
      writeFileSync(pdfPath, Buffer.from(pdfBytes));

      const createdAt = new Date().toISOString();
      const imageUrl = `${this.baseUrl}/api/v1/shareable-card/file/${imageFilename}`;
      const pdfUrl = `${this.baseUrl}/api/v1/shareable-card/file/${pdfFilename}`;

      return {
        id,
        imagePath,
        imageUrl,
        pdfPath,
        pdfUrl,
        createdAt,
      };
    } catch (error) {
      this.logger.error(`Error creating shareable card: ${error.message}`, error.stack);
      throw new HttpException(
        'Failed to create shareable card.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /** Get stored file path for serving. */
  getFilePath(filename: string): string | null {
    const path = join(this.storageDir, filename);
    if (existsSync(path)) return path;
    return null;
  }

  /** Read file buffer for streaming. */
  readFile(filename: string): Buffer | null {
    const path = this.getFilePath(filename);
    if (!path) return null;
    return readFileSync(path);
  }

  /** Build share URLs for social platforms (Shareable Part 2). */
  getShareLinks(url: string, title?: string): { whatsapp: string; twitter: string; telegram: string } {
    const text = title ? `${title} ${url}` : url;
    const encoded = encodeURIComponent(text);
    const encodedUrl = encodeURIComponent(url);
    return {
      whatsapp: `https://wa.me/?text=${encoded}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodedUrl}`,
      telegram: `https://t.me/share/url?url=${encodedUrl}${title ? `&text=${encodeURIComponent(title)}` : ''}`,
    };
  }
}
