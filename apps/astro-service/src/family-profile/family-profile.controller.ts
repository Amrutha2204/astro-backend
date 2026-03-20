import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiOkResponse, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { FamilyProfileService } from './family-profile.service';
import { CreateFamilyProfileDto } from './dto/create-family-profile.dto';
import { UpdateFamilyProfileDto } from './dto/update-family-profile.dto';
import { FamilyProfileResponse } from './family-profile.service';

@Controller('api/v1/family-profiles')
@ApiTags('Family Profiles')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FamilyProfileController {
  constructor(private readonly familyProfileService: FamilyProfileService) {}

  @Get()
  @ApiOperation({ summary: 'List all family profiles for the current user' })
  @ApiOkResponse({ description: 'List of family profiles (id, name, dob, birthPlace, birthTime, relation, createdAt, updatedAt)' })
  async list(@CurrentUser() user: { userId: string }): Promise<FamilyProfileResponse[]> {
    return this.familyProfileService.findAllByUserId(user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one family profile by id' })
  @ApiOkResponse({ description: 'Family profile' })
  async getOne(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
  ): Promise<FamilyProfileResponse> {
    return this.familyProfileService.findOne(id, user.userId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a family profile' })
  @ApiBody({ type: CreateFamilyProfileDto })
  @ApiOkResponse({ description: 'Created family profile' })
  async create(
    @CurrentUser() user: { userId: string },
    @Body() dto: CreateFamilyProfileDto,
  ): Promise<FamilyProfileResponse> {
    return this.familyProfileService.create(user.userId, dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a family profile' })
  @ApiBody({ type: UpdateFamilyProfileDto })
  @ApiOkResponse({ description: 'Updated family profile' })
  async update(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
    @Body() dto: UpdateFamilyProfileDto,
  ): Promise<FamilyProfileResponse> {
    return this.familyProfileService.update(id, user.userId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a family profile' })
  async remove(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
  ): Promise<void> {
    return this.familyProfileService.remove(id, user.userId);
  }
}
