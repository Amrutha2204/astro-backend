import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiBearerAuth,
  ApiSecurity,
} from '@nestjs/swagger';
import { UserDetailsService } from './user-details.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { InternalApiKeyGuard } from '../common/guards/internal-api-key.guard';

@Controller('api/v1/user-details')
@ApiTags('User Details')
export class UserDetailsController {
  constructor(private readonly userDetailsService: UserDetailsService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get authenticated user details' })
  @ApiOkResponse({
    description: 'User details retrieved successfully',
    schema: {
      example: {
        id: 'uuid',
        user: {
          id: 'uuid',
          name: 'John Doe',
          email: 'john@example.com',
          phoneNumber: '+1234567890',
          timezone: 'UTC',
          profilePic: null,
          roleId: 1,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
        guestName: null,
        dob: '1990-01-01',
        birthPlace: 'New York',
        birthTime: '12:00:00',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    },
  })
  async getMyDetails(@Request() req: any) {
    const user = req.user;
    return this.userDetailsService.getMeOrEmpty(user.id);
  }

  @Get('internal/:userId')
  @UseGuards(InternalApiKeyGuard)
  @HttpCode(HttpStatus.OK)
  @ApiSecurity('InternalApiKey')
  @ApiOperation({ summary: '[Internal] Get user details by userId for astro-service' })
  @ApiOkResponse({ description: 'User details for the given userId' })
  async getByUserIdInternal(@Param('userId') userId: string) {
    const userDetails = await this.userDetailsService.findByUserId(userId);
    if (!userDetails) {
      throw new NotFoundException('User details not found');
    }
    return {
      id: userDetails.id,
      dob: userDetails.dob,
      birthPlace: userDetails.birthPlace,
      birthTime: userDetails.birthTime ?? '12:00:00',
    };
  }

  @Post('birth-details')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create or update birth details for the authenticated user' })
  @ApiOkResponse({ description: 'Birth details saved successfully' })
  async saveBirthDetails(@Request() req: any, @Body() body: { dob?: string; birthTime?: string; placeOfBirth?: string }) {
    const user = req.user;
    const birthPlace = body.placeOfBirth?.trim();
    if (!birthPlace) {
      throw new BadRequestException('Birth place is required');
    }
    const dobRaw = body.dob?.trim();
    if (!dobRaw) {
      throw new BadRequestException('Date of birth is required');
    }
    const dob = this.normalizeDob(dobRaw);
    const updated = await this.userDetailsService.upsertBirthDetails(user.id, {
      dob,
      birthPlace,
      birthTime: body.birthTime?.trim() || undefined,
    });
    return updated;
  }

  private normalizeDob(value: string): string {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    const m = value.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
    return value;
  }
}

