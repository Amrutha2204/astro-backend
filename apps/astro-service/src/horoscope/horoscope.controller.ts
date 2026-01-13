import {
  Controller,
  Get,
  Query,
  HttpCode,
  HttpStatus,
  Request,
  HttpException,
} from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { HoroscopeService } from './horoscope.service';
import { DailyHoroscopeDto, ZodiacSign } from './dto/daily-horoscope.dto';

@Controller('api/v1/horoscope')
@ApiTags('Horoscope')
export class HoroscopeController {
  constructor(private readonly horoscopeService: HoroscopeService) {}

  @Get('daily')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get daily horoscope for a zodiac sign' })
  @ApiQuery({
    name: 'sign',
    enum: ZodiacSign,
    description: 'Zodiac sign',
    example: ZodiacSign.Aries,
  })
  @ApiQuery({
    name: 'date',
    required: false,
    description: 'Date for horoscope (YYYY-MM-DD). Defaults to today',
    example: '2024-01-15',
  })
  @ApiOkResponse({
    description: 'Daily horoscope retrieved successfully',
    schema: {
      example: {
        sign: 'aries',
        date: '2024-01-15',
        horoscope: {
          prediction: 'Today is a good day for...',
          love: 'Your love life...',
          career: 'Career opportunities...',
          health: 'Health tips...',
        },
        source: 'Prokerala API',
      },
    },
  })
  async getDailyHoroscope(@Query() dto: DailyHoroscopeDto) {
    return this.horoscopeService.getDailyHoroscope(dto);
  }

  @Get('my-day-today')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Get personalized daily horoscope based on user's birth details",
  })
  @ApiQuery({
    name: 'date',
    required: false,
    description: 'Date for horoscope (YYYY-MM-DD). Defaults to today',
    example: '2024-01-15',
  })
  @ApiOkResponse({
    description: 'Personalized daily horoscope retrieved successfully',
    schema: {
      example: {
        sign: 'aries',
        date: '2024-01-15',
        horoscope: {
          daily_prediction: {
            sign_name: 'Aries',
            prediction: 'Your personalized horoscope...',
          },
        },
        source: 'Prokerala API',
      },
    },
  })
  async getMyDayToday(@Request() req: any, @Query('date') date?: string) {
    const authHeader = req.headers?.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new HttpException(
        'Authentication required. Please provide a valid JWT token.',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const token = authHeader.substring(7);
    return this.horoscopeService.getMyDayToday(token, date);
  }
}

