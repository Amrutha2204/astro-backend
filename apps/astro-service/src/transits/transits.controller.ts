import {
  Controller,
  Get,
  Query,
  HttpCode,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiQuery,
} from '@nestjs/swagger';
import { TransitsService } from './transits.service';

@Controller('api/v1/astrology')
@ApiTags('Astrology')
export class TransitsController {
  constructor(private readonly transitsService: TransitsService) {}

  @Get('transits/today')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Get today's planetary transits and current planet positions",
  })
  @ApiOkResponse({
    description: 'Transits retrieved successfully',
    schema: {
      example: {
        currentPlanetPositions: {
          sun: { name: 'Sun', sign: { name: 'Makara' } },
          moon: { name: 'Moon', sign: { name: 'Vrischika' } },
        },
        majorActiveTransits: [
          { planet: 'Sun', sign: 'Makara' },
          { planet: 'Moon', sign: 'Vrischika' },
        ],
        date: '2026-01-14',
        source: 'Swiss Ephemeris',
      },
    },
  })
  async getTodayTransits() {
    return this.transitsService.getTodayTransits();
  }

  @Get('transits/retrogrades/on-date')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get which planets are retrograde on a single date (for "on this day" result)',
  })
  @ApiQuery({
    name: 'date',
    required: true,
    description: 'Date YYYY-MM-DD',
    example: '2025-06-15',
  })
  @ApiQuery({
    name: 'latitude',
    required: false,
    description: 'Observer latitude (default Delhi)',
  })
  @ApiQuery({
    name: 'longitude',
    required: false,
    description: 'Observer longitude (default Delhi)',
  })
  @ApiOkResponse({ description: 'List of planet names that are retrograde on this date' })
  async getRetrogradesOnDate(
    @Query('date') date: string,
    @Query('latitude') latitude?: string,
    @Query('longitude') longitude?: string,
  ) {
    if (!date?.trim()) {
      throw new HttpException(
        'date is required (YYYY-MM-DD).',
        HttpStatus.BAD_REQUEST,
      );
    }
    const lat = latitude != null && latitude !== '' ? Number(latitude) : 28.6139;
    const lng = longitude != null && longitude !== '' ? Number(longitude) : 77.209;
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      throw new HttpException(
        'latitude and longitude must be valid numbers.',
        HttpStatus.BAD_REQUEST,
      );
    }
    return this.transitsService.getRetrogradesOnDate(date.trim(), lat, lng);
  }

  @Get('transits/retrogrades')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get retrograde periods (Mercury, Venus, Mars, Jupiter, Saturn) for a date range',
  })
  @ApiQuery({
    name: 'fromDate',
    required: true,
    description: 'Start date YYYY-MM-DD',
    example: '2025-01-01',
  })
  @ApiQuery({
    name: 'toDate',
    required: true,
    description: 'End date YYYY-MM-DD (max 3 years from fromDate)',
    example: '2026-12-31',
  })
  @ApiQuery({
    name: 'latitude',
    required: false,
    description: 'Observer latitude (default Delhi)',
  })
  @ApiQuery({
    name: 'longitude',
    required: false,
    description: 'Observer longitude (default Delhi)',
  })
  @ApiOkResponse({ description: 'Retrograde periods list' })
  async getRetrogrades(
    @Query('fromDate') fromDate: string,
    @Query('toDate') toDate: string,
    @Query('latitude') latitude?: string,
    @Query('longitude') longitude?: string,
  ) {
    if (!fromDate?.trim() || !toDate?.trim()) {
      throw new HttpException(
        'fromDate and toDate are required (YYYY-MM-DD).',
        HttpStatus.BAD_REQUEST,
      );
    }
    const lat = latitude != null && latitude !== '' ? Number(latitude) : 28.6139;
    const lng = longitude != null && longitude !== '' ? Number(longitude) : 77.209;
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      throw new HttpException(
        'latitude and longitude must be valid numbers.',
        HttpStatus.BAD_REQUEST,
      );
    }
    return this.transitsService.getRetrogrades(
      fromDate.trim(),
      toDate.trim(),
      lat,
      lng,
    );
  }

  @Get('transits/eclipses')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get solar and lunar eclipses for a date range',
  })
  @ApiQuery({
    name: 'fromDate',
    required: true,
    description: 'Start date to search from YYYY-MM-DD',
    example: '2025-01-01',
  })
  @ApiQuery({
    name: 'toDate',
    required: false,
    description:
      'End date YYYY-MM-DD. If provided, results are filtered to range and paginated.',
    example: '2025-12-31',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Max number of solar and lunar eclipses each (default 10)',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number (starts at 1). Used when toDate is provided.',
  })
  @ApiQuery({
    name: 'pageSize',
    required: false,
    description:
      'Items per page (default 20, max 100). Used when toDate is provided.',
  })
  @ApiOkResponse({ description: 'Solar and lunar eclipse lists' })
  async getEclipses(
    @Query('fromDate') fromDate: string,
    @Query('toDate') toDate?: string,
    @Query('limit') limit?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    if (!fromDate?.trim()) {
      throw new HttpException(
        'fromDate is required (YYYY-MM-DD).',
        HttpStatus.BAD_REQUEST,
      );
    }
    const hasToDate = toDate != null && toDate.trim() !== '';
    if (hasToDate) {
      const p = page ? parseInt(page, 10) : 1;
      const ps = pageSize ? parseInt(pageSize, 10) : 20;
      return this.transitsService.getEclipsesInRange(
        fromDate.trim(),
        toDate.trim(),
        p,
        ps,
      );
    }
    const n = limit ? Math.min(parseInt(limit, 10) || 10, 20) : 10;
    return this.transitsService.getEclipses(fromDate.trim(), n);
  }

  @Get('transits/major')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get major transits (Jupiter, Saturn sign changes) for a date range',
  })
  @ApiQuery({
    name: 'fromDate',
    required: true,
    description: 'Start date YYYY-MM-DD',
    example: '2025-01-01',
  })
  @ApiQuery({
    name: 'toDate',
    required: true,
    description: 'End date YYYY-MM-DD (max 12 years)',
    example: '2030-12-31',
  })
  @ApiQuery({
    name: 'latitude',
    required: false,
    description: 'Observer latitude',
  })
  @ApiQuery({
    name: 'longitude',
    required: false,
    description: 'Observer longitude',
  })
  @ApiOkResponse({ description: 'Major transit events (sign changes)' })
  async getMajorTransits(
    @Query('fromDate') fromDate: string,
    @Query('toDate') toDate: string,
    @Query('latitude') latitude?: string,
    @Query('longitude') longitude?: string,
  ) {
    if (!fromDate?.trim() || !toDate?.trim()) {
      throw new HttpException(
        'fromDate and toDate are required (YYYY-MM-DD).',
        HttpStatus.BAD_REQUEST,
      );
    }
    const lat = latitude != null && latitude !== '' ? Number(latitude) : 28.6139;
    const lng = longitude != null && longitude !== '' ? Number(longitude) : 77.209;
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      throw new HttpException(
        'latitude and longitude must be valid numbers.',
        HttpStatus.BAD_REQUEST,
      );
    }
    return this.transitsService.getMajorTransits(
      fromDate.trim(),
      toDate.trim(),
      lat,
      lng,
    );
  }
}
