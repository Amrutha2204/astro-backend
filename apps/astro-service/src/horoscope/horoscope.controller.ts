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

@Controller('api/v1/horoscope')
@ApiTags('Horoscope')
export class HoroscopeController {
  constructor(private readonly horoscopeService: HoroscopeService) {}

  @Get('weekly')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get personalized weekly horoscope (next 7 days)',
  })
  @ApiOkResponse({
    description: 'Weekly horoscope retrieved successfully',
  })
  async getWeeklyHoroscope(@Request() req: any) {
    const authHeader = req.headers?.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new HttpException(
        'Authentication required.',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const token = authHeader.substring(7);
    return this.horoscopeService.getWeeklyHoroscope(token);
  }

  @Get('monthly')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get personalized monthly horoscope (next 30 days)',
  })
  @ApiOkResponse({
    description: 'Monthly horoscope retrieved successfully',
  })
  async getMonthlyHoroscope(@Request() req: any) {
    const authHeader = req.headers?.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new HttpException(
        'Authentication required.',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const token = authHeader.substring(7);
    return this.horoscopeService.getMonthlyHoroscope(token);
  }
}

