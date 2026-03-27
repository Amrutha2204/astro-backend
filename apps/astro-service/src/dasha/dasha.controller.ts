import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  HttpException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { DashaService } from './dasha.service';
import { getCoordinatesFromCity } from '../common/utils/coordinates.util';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { GuestKundliRequestDto } from '../kundli/dto/guest-kundli.dto';

@Controller('api/v1/dasha')
@ApiTags('Dasha')
export class DashaController {
  constructor(private readonly dashaService: DashaService) {}

  @Post('guest')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get current Dasha from birth details – no login' })
  @ApiBody({ type: GuestKundliRequestDto })
  @ApiOkResponse({ description: 'Current dasha retrieved successfully' })
  async getCurrentDashaGuest(@Body() dto: GuestKundliRequestDto) {
    try {
      const birthTime = dto.birthTime.split(':').length === 2
        ? `${dto.birthTime}:00`
        : dto.birthTime;
      const [hours = 12, minutes = 0] = birthTime.split(':').map(Number);
      const { lat, lng } = await getCoordinatesFromCity(dto.placeOfBirth.trim());
      const dob = new Date(dto.dob);
      const details = await this.dashaService.calculateDasha(
        dob.getFullYear(),
        dob.getMonth() + 1,
        dob.getDate(),
        hours,
        minutes,
        lat,
        lng,
      );
      return { ...details.current, source: 'Swiss Ephemeris' };
    } catch (e) {
      if (e instanceof HttpException) throw e;
      throw new HttpException('Failed to calculate dasha.', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('guest/timeline')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get Dasha timeline from birth details – no login' })
  @ApiBody({ type: GuestKundliRequestDto })
  @ApiQuery({ name: 'years', required: false, example: 10 })
  @ApiOkResponse({ description: 'Dasha timeline retrieved successfully' })
  async getDashaTimelineGuest(
    @Body() dto: GuestKundliRequestDto,
    @Query('years') years?: string,
  ) {
    try {
      const birthTime = dto.birthTime.split(':').length === 2
        ? `${dto.birthTime}:00`
        : dto.birthTime;
      const [hours = 12, minutes = 0] = birthTime.split(':').map(Number);
      const { lat, lng } = await getCoordinatesFromCity(dto.placeOfBirth.trim());
      const dob = new Date(dto.dob);
      const details = await this.dashaService.calculateDasha(
        dob.getFullYear(),
        dob.getMonth() + 1,
        dob.getDate(),
        hours,
        minutes,
        lat,
        lng,
      );
      const n = Math.min(Math.max(parseInt(years || '10', 10) || 10, 1), 30);
      return { timeline: details.timeline.slice(0, n * 2), source: 'Swiss Ephemeris' };
    } catch (e) {
      if (e instanceof HttpException) throw e;
      throw new HttpException('Failed to calculate dasha timeline.', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('current')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get current Mahadasha, Antardasha details',
  })
  @ApiOkResponse({
    description: 'Current dasha retrieved successfully',
  })
  async getCurrentDasha(@CurrentUser() user: any) {
    const token = user.token;
    const authServiceUrl =
      process.env.AUTH_SERVICE_URL || 'http://localhost:8001';

    try {
      const userDetailsResponse = await fetch(
        `${authServiceUrl}/api/v1/user-details/me`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        },
      );

      if (!userDetailsResponse.ok) {
        throw new HttpException(
          'Failed to fetch user details.',
          userDetailsResponse.status,
        );
      }

      const userDetails = await userDetailsResponse.json();

      if (!userDetails.dob || !userDetails.birthPlace) {
        throw new HttpException(
          'Birth details incomplete.',
          HttpStatus.BAD_REQUEST,
        );
      }

      const dob = new Date(userDetails.dob);
      const birthTime = userDetails.birthTime || '12:00:00';
      const [hours, minutes] = birthTime.split(':').map(Number);
      const coordinates = await getCoordinatesFromCity(userDetails.birthPlace);

      const dashaDetails = await this.dashaService.calculateDasha(
        dob.getFullYear(),
        dob.getMonth() + 1,
        dob.getDate(),
        hours || 12,
        minutes || 0,
        coordinates.lat,
        coordinates.lng,
      );

      return {
        ...dashaDetails.current,
        source: 'Swiss Ephemeris',
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to fetch dasha details.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('timeline')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiQuery({
    name: 'years',
    required: false,
    description: 'Number of years ahead to show timeline',
    example: 10,
  })
  @ApiOperation({
    summary: 'Get Dasha timeline for next N years',
  })
  @ApiOkResponse({
    description: 'Dasha timeline retrieved successfully',
  })
  async getDashaTimeline(
    @CurrentUser() user: any,
    @Query('years') years?: number,
  ) {
    const token = user.token;
    const authServiceUrl =
      process.env.AUTH_SERVICE_URL || 'http://localhost:8001';

    try {
      const userDetailsResponse = await fetch(
        `${authServiceUrl}/api/v1/user-details/me`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        },
      );

      if (!userDetailsResponse.ok) {
        throw new HttpException(
          'Failed to fetch user details.',
          userDetailsResponse.status,
        );
      }

      const userDetails = await userDetailsResponse.json();

      if (!userDetails.dob || !userDetails.birthPlace) {
        throw new HttpException(
          'Birth details incomplete.',
          HttpStatus.BAD_REQUEST,
        );
      }

      const dob = new Date(userDetails.dob);
      const birthTime = userDetails.birthTime || '12:00:00';
      const [hours, minutes] = birthTime.split(':').map(Number);
      const coordinates = await getCoordinatesFromCity(userDetails.birthPlace);

      const dashaDetails = await this.dashaService.calculateDasha(
        dob.getFullYear(),
        dob.getMonth() + 1,
        dob.getDate(),
        hours || 12,
        minutes || 0,
        coordinates.lat,
        coordinates.lng,
      );

      return {
        timeline: dashaDetails.timeline.slice(0, (years || 10) * 2),
        source: 'Swiss Ephemeris',
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to fetch dasha timeline.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

