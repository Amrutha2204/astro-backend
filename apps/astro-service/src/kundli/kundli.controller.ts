import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  HttpException,
} from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { KundliService } from './kundli.service';
import { KundliDto } from './dto/kundli.dto';
import { GuestKundliRequestDto } from './dto/guest-kundli.dto';
import {
  ChartType,
  getCoordinatesFromCity,
  searchPlaces,
} from '../common/utils/coordinates.util';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('api/v1/kundli')
@ApiTags('Kundli')
export class KundliController {
  constructor(private readonly kundliService: KundliService) {}

  @Get('places/search')
  @ApiOperation({
    summary: 'Search places for autocomplete (city, town, village). Fetches from OpenStreetMap; empty q returns default list.',
  })
  @ApiQuery({ name: 'q', required: false, description: 'Search query; empty returns default suggestions' })
  @ApiQuery({ name: 'limit', required: false, description: 'Max results (default 15)' })
  @ApiOkResponse({ description: 'List of { displayName, lat, lng }' })
  async getPlaceSearch(
    @Query('q') q?: string,
    @Query('limit') limit?: string,
  ) {
    const limitNum = limit ? Math.min(Math.max(1, parseInt(limit, 10)), 20) : 15;
    const places = await searchPlaces(q ?? '', limitNum);
    return { places };
  }

  @Get('geocode')
  @ApiOperation({
    summary: 'Resolve a place name (city, town, village) to coordinates. Used for birth place and compatibility.',
  })
  @ApiQuery({ name: 'place', required: true, description: 'Place name, e.g. "Mumbai, Maharashtra, India" or "Lonavala"' })
  @ApiOkResponse({ description: 'Latitude, longitude, and optional display name' })
  async geocode(@Query('place') place: string) {
    if (!place?.trim()) {
      throw new HttpException('place is required', HttpStatus.BAD_REQUEST);
    }
    const coordinates = await getCoordinatesFromCity(place.trim());
    return {
      lat: coordinates.lat,
      lng: coordinates.lng,
      displayName: place.trim(),
    };
  }

  @Post('guest')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get Kundli for guest (no login). Uses birth details only. No data is stored.',
  })
  @ApiOkResponse({
    description: 'Kundli calculated successfully',
    schema: {
      example: {
        lagna: 'Aries',
        moonSign: 'Leo',
        nakshatra: 'Magha',
        planetaryPositions: [],
        houses: [],
        source: 'Swiss Ephemeris',
      },
    },
  })
  async getGuestKundli(@Body() dto: GuestKundliRequestDto) {
    try {
      const useUnknownTime = dto.unknownTime === true || !dto.birthTime?.trim();
      const rawTime = useUnknownTime ? '12:00:00' : dto.birthTime!.trim();
      const birthTime =
        rawTime.split(':').length === 2 ? `${rawTime}:00` : rawTime;
      const coordinates = await getCoordinatesFromCity(dto.placeOfBirth);

      const kundliDto: KundliDto = {
        dob: dto.dob,
        birthTime,
        latitude: coordinates.lat,
        longitude: coordinates.lng,
        chartType: ChartType.NorthIndian,
        chart: dto.chart,
      };

      if (dto.system === 'western') {
        return this.kundliService.getWesternKundli(kundliDto);
      }
      return this.kundliService.getKundli(kundliDto);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        'Failed to calculate Kundli. Please check your birth details and try again.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('my-kundli')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get personalized kundli (birth chart) based on user birth details',
  })
  @ApiQuery({
    name: 'chartType',
    required: false,
    enum: ChartType,
    description: 'Chart type (north-indian, south-indian, east-indian)',
    example: ChartType.NorthIndian,
  })
  @ApiQuery({
    name: 'system',
    required: false,
    enum: ['vedic', 'western'],
    description: 'Astrology system: vedic (sidereal) or western (tropical). Default vedic.',
  })
  @ApiQuery({
    name: 'chart',
    required: false,
    description: 'Vedic chart: lagna (D-1), navamsa (D-9), saptamsa (D-7), dasamsa (D-10), dwadasamsa (D-12), shodasamsa (D-16), vimsamsa (D-20), chaturvimsamsa (D-24), trimsamsa (D-30). Ignored when system is western.',
  })
  @ApiOkResponse({
    description: 'Kundli retrieved successfully',
    schema: {
      example: {
        lagna: 'Aries',
        moonSign: 'Leo',
        nakshatra: 'Magha',
        planetaryPositions: {},
        houses: {},
        source: 'Swiss Ephemeris',
      },
    },
  })
  async getMyKundli(
    @CurrentUser() user: any,
    @Query('chartType') chartType?: ChartType,
    @Query('system') system?: 'vedic' | 'western',
    @Query('chart') chart?: string,
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
        if (userDetailsResponse.status === 401) {
          throw new HttpException(
            'Invalid or expired token. Please login again.',
            HttpStatus.UNAUTHORIZED,
          );
        }
        if (userDetailsResponse.status === 404) {
          throw new HttpException(
            'Birth details not found. Please complete your profile first.',
            HttpStatus.NOT_FOUND,
          );
        }
        throw new HttpException(
          'Failed to fetch user details.',
          userDetailsResponse.status,
        );
      }

      const userDetails = await userDetailsResponse.json();

      if (!userDetails.dob || !userDetails.birthPlace) {
        throw new HttpException(
          'Birth details incomplete. Please provide date of birth and birth place.',
          HttpStatus.BAD_REQUEST,
        );
      }

      const dob = new Date(userDetails.dob);
      const dobString = dob.toISOString().split('T')[0];
      const birthTime = userDetails.birthTime || '12:00:00';
      const coordinates = await getCoordinatesFromCity(userDetails.birthPlace);

      const kundliDto: KundliDto = {
        dob: dobString,
        birthTime,
        latitude: coordinates.lat,
        longitude: coordinates.lng,
        chartType: chartType || ChartType.NorthIndian,
        chart,
      };

      if (system === 'western') {
        return this.kundliService.getWesternKundli(kundliDto);
      }
      return this.kundliService.getKundli(kundliDto);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        'Failed to fetch kundli. Please try again later.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

