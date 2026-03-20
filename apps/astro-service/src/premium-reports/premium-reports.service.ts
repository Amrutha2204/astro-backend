import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { join } from 'path';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { Report } from './entities/report.entity';

@Injectable()
export class PremiumReportsService {
  private readonly logger = new Logger(PremiumReportsService.name);
  private readonly storageDir: string;
  private readonly baseUrl: string;

  constructor(
    @InjectRepository(Report)
    private readonly reportRepo: Repository<Report>,
  ) {
    this.storageDir =
      process.env.REPORTS_STORAGE_PATH ||
      join(process.cwd(), 'apps', 'astro-service', 'uploads', 'reports');
    this.baseUrl = process.env.APP_PUBLIC_URL || 'http://localhost:3000';
    this.ensureStorageDir();
  }

  private ensureStorageDir(): void {
    if (!existsSync(this.storageDir)) {
      mkdirSync(this.storageDir, { recursive: true });
    }
  }

  async generateKundliSummaryPdf(
    userId: string,
    content: { title: string; sections: { heading: string; text: string }[] },
  ): Promise<Report> {
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const page = pdfDoc.addPage([595, 842]);
    const margin = 50;
    let y = 800;

    page.drawText(content.title, {
      x: margin,
      y,
      size: 18,
      font: boldFont,
      color: rgb(0.2, 0.2, 0.4),
    });
    y -= 30;

    for (const section of content.sections) {
      if (y < 100) break;
      page.drawText(section.heading, {
        x: margin,
        y,
        size: 14,
        font: boldFont,
        color: rgb(0.2, 0.2, 0.4),
      });
      y -= 20;
      const lines = this.wrapText(section.text, 80).slice(0, 25);
      for (const line of lines) {
        if (y < 50) break;
        page.drawText(line, { x: margin, y, size: 10, font, color: rgb(0, 0, 0) });
        y -= 14;
      }
      y -= 15;
    }

    const id = `report_${Date.now()}_${userId.slice(0, 8)}`;
    const filename = `${id}.pdf`;
    const filePath = join(this.storageDir, filename);
    const pdfBytes = await pdfDoc.save();
    writeFileSync(filePath, Buffer.from(pdfBytes));

    const report = this.reportRepo.create({
      userId,
      reportType: 'kundli_summary',
      filename,
      filePath,
    });
    await this.reportRepo.save(report);
    return report;
  }

  async generateCompatibilitySummaryPdf(
    userId: string,
    content: { title: string; sections: { heading: string; text: string }[] },
  ): Promise<Report> {
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const page = pdfDoc.addPage([595, 842]);
    const margin = 50;
    let y = 800;

    page.drawText(content.title, {
      x: margin,
      y,
      size: 18,
      font: boldFont,
      color: rgb(0.2, 0.2, 0.4),
    });
    y -= 30;

    for (const section of content.sections) {
      if (y < 100) break;
      page.drawText(section.heading, {
        x: margin,
        y,
        size: 14,
        font: boldFont,
        color: rgb(0.2, 0.2, 0.4),
      });
      y -= 20;
      const lines = this.wrapText(section.text, 80).slice(0, 25);
      for (const line of lines) {
        if (y < 50) break;
        page.drawText(line, { x: margin, y, size: 10, font, color: rgb(0, 0, 0) });
        y -= 14;
      }
      y -= 15;
    }

    const id = `report_comp_${Date.now()}_${userId.slice(0, 8)}`;
    const filename = `${id}.pdf`;
    const filePath = join(this.storageDir, filename);
    const pdfBytes = await pdfDoc.save();
    writeFileSync(filePath, Buffer.from(pdfBytes));

    const report = this.reportRepo.create({
      userId,
      reportType: 'compatibility_summary',
      filename,
      filePath,
    });
    await this.reportRepo.save(report);
    return report;
  }

  private wrapText(text: string, maxChars: number): string[] {
    const words = text.split(/\s+/);
    const lines: string[] = [];
    let current = '';
    for (const w of words) {
      if (current.length + w.length + 1 <= maxChars) {
        current += (current ? ' ' : '') + w;
      } else {
        if (current) lines.push(current);
        current = w;
      }
    }
    if (current) lines.push(current);
    return lines;
  }

  async getReport(userId: string, reportId: string): Promise<Report | null> {
    return this.reportRepo.findOne({
      where: { id: reportId, userId },
    });
  }

  getFilePath(filename: string): string | null {
    const path = join(this.storageDir, filename);
    return existsSync(path) ? path : null;
  }

  readFile(filename: string): Buffer | null {
    const path = this.getFilePath(filename);
    return path ? readFileSync(path) : null;
  }

  getDownloadUrl(filename: string): string {
    return `${this.baseUrl}/api/v1/reports/file/${filename}`;
  }

  async listMyReports(userId: string): Promise<{ id: string; reportType: string; downloadUrl: string; createdAt: string }[]> {
    const reports = await this.reportRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 50,
    });
    return reports.map((r) => ({
      id: r.id,
      reportType: r.reportType,
      downloadUrl: this.getDownloadUrl(r.filename),
      createdAt: r.createdAt.toISOString(),
    }));
  }
}
