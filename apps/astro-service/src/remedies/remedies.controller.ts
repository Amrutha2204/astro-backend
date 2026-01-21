import {
  Controller,
  Get,
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
} from '@nestjs/swagger';
import { RemediesService } from './remedies.service';
import { getCoordinatesFromCity } from '../common/utils/coordinates.util';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('api/v1/remedies')
@ApiTags('Remedies')
export class RemediesController {
  constructor(private readonly remediesService: RemediesService) {}

  @Get('recommendations')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get astrological remedies recommendations',
  })
  @ApiOkResponse({
    description: 'Remedies retrieved successfully',
  })
  async getRemedies(@CurrentUser() user: any) {
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
      const coordinates = getCoordinatesFromCity(userDetails.birthPlace);

      const remedies = await this.remediesService.getRemedies(
        dob.getFullYear(),
        dob.getMonth() + 1,
        dob.getDate(),
        hours || 12,
        minutes || 0,
        coordinates.lat,
        coordinates.lng,
      );

      return {
        ...remedies,
        source: 'Swiss Ephemeris',
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to fetch remedies.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('timing')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get best timing for performing remedies',
  })
  @ApiOkResponse({
    description: 'Remedy timing retrieved successfully',
  })
  async getRemedyTiming(@CurrentUser() user: any) {
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

      if (!userDetails.birthPlace) {
        throw new HttpException(
          'Birth place required.',
          HttpStatus.BAD_REQUEST,
        );
      }

      const coordinates = getCoordinatesFromCity(userDetails.birthPlace);
      const remedies = await this.remediesService.getRemedies(
        1990, 1, 1, 12, 0,
        coordinates.lat,
        coordinates.lng,
      );

      return {
        bestTiming: remedies.bestTiming,
        source: 'Swiss Ephemeris',
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to fetch remedy timing.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

