import {
  Controller,
  Get,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { HoroscopeService } from './horoscope.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('api/v1/horoscope')
@ApiTags('Horoscope')
export class HoroscopeController {
  constructor(private readonly horoscopeService: HoroscopeService) {}

  @Get('weekly')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get personalized weekly horoscope (next 7 days)',
  })
  @ApiOkResponse({
    description: 'Weekly horoscope retrieved successfully',
  })
  async getWeeklyHoroscope(@CurrentUser() user: any) {
    return this.horoscopeService.getWeeklyHoroscope(user.token);
  }

  @Get('monthly')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get personalized monthly horoscope (next 30 days)',
  })
  @ApiOkResponse({
    description: 'Monthly horoscope retrieved successfully',
  })
  async getMonthlyHoroscope(@CurrentUser() user: any) {
    return this.horoscopeService.getMonthlyHoroscope(user.token);
  }
}

