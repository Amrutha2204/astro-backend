import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiTags,
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
        source: 'Prokerala API',
      },
    },
  })
  async getTodayTransits() {
    return this.transitsService.getTodayTransits();
  }
}

