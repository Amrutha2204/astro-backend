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
import { DoshaService } from './dosha.service';
import { getCoordinatesFromCity } from '../common/utils/coordinates.util';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('api/v1/dosha')
@ApiTags('Dosha')
export class DoshaController {
  constructor(private readonly doshaService: DoshaService) {}

  @Get('check')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Check all doshas (Manglik, Nadi, Bhakoot)',
  })
  @ApiOkResponse({
    description: 'Dosha check completed successfully',
  })
  async checkDoshas(@CurrentUser() user: any) {
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

      const doshaDetails = await this.doshaService.checkDoshas(
        dob.getFullYear(),
        dob.getMonth() + 1,
        dob.getDate(),
        hours || 12,
        minutes || 0,
        coordinates.lat,
        coordinates.lng,
      );

      return {
        ...doshaDetails,
        source: 'Swiss Ephemeris',
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to check doshas.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('manglik')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Check Manglik (Mangal Dosha) status',
  })
  @ApiOkResponse({
    description: 'Manglik status retrieved successfully',
  })
  async checkManglik(@CurrentUser() user: any) {
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

      const doshaDetails = await this.doshaService.checkDoshas(
        dob.getFullYear(),
        dob.getMonth() + 1,
        dob.getDate(),
        hours || 12,
        minutes || 0,
        coordinates.lat,
        coordinates.lng,
      );

      return {
        manglik: doshaDetails.manglik,
        source: 'Swiss Ephemeris',
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to check Manglik status.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

