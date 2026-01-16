import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Request,
  HttpCode,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
} from '@nestjs/swagger';
import { ProfileService } from './profile.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('api/v1/profile')
@ApiTags('Profile')
@ApiBearerAuth()
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new profile' })
  @ApiCreatedResponse({
    description: 'Profile created successfully',
  })
  async create(@Request() req: any, @Body() createProfileDto: CreateProfileDto) {
    const userId = this.getUserIdFromRequest(req);
    return this.profileService.create(userId, createProfileDto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all profiles for the current user' })
  @ApiOkResponse({
    description: 'Profiles retrieved successfully',
  })
  async findAll(@Request() req: any) {
    const userId = this.getUserIdFromRequest(req);
    return this.profileService.findAll(userId);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a specific profile by ID' })
  @ApiOkResponse({
    description: 'Profile retrieved successfully',
  })
  async findOne(@Request() req: any, @Param('id') id: string) {
    const userId = this.getUserIdFromRequest(req);
    return this.profileService.findOne(userId, id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a profile' })
  @ApiOkResponse({
    description: 'Profile updated successfully',
  })
  async update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    const userId = this.getUserIdFromRequest(req);
    return this.profileService.update(userId, id, updateProfileDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a profile' })
  @ApiOkResponse({
    description: 'Profile deleted successfully',
  })
  async remove(@Request() req: any, @Param('id') id: string) {
    const userId = this.getUserIdFromRequest(req);
    return this.profileService.remove(userId, id);
  }

  private getUserIdFromRequest(req: any): string {
    const authHeader = req.headers?.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new HttpException(
        'Authentication required.',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const token = authHeader.substring(7);
    const authServiceUrl =
      process.env.AUTH_SERVICE_URL || 'http://localhost:8001';

    try {
      const payload = this.decodeJwt(token);
      return payload.sub;
    } catch (error) {
      throw new HttpException(
        'Invalid token.',
        HttpStatus.UNAUTHORIZED,
      );
    }
  }

  private decodeJwt(token: string): any {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      Buffer.from(base64, 'base64')
        .toString()
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    );
    return JSON.parse(jsonPayload);
  }
}

