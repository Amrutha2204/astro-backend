import { Controller, Post, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiOkResponse, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CareerService } from './career.service';
import { CareerGuidanceDto } from './dto/career-guidance.dto';

@Controller('api/v1/career')
@ApiTags('Career & Job Guidance')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CareerController {
  constructor(private readonly careerService: CareerService) {}

  @Post('guidance')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get AI-based career and job guidance from birth chart and transits' })
  @ApiBody({ type: CareerGuidanceDto })
  @ApiOkResponse({
    description: 'Career and job guidance text',
    schema: { example: { guidance: 'Based on your chart, your Sun in...' } },
  })
  async getGuidance(
    @CurrentUser() user: { userId: string; token: string },
    @Body() dto: CareerGuidanceDto,
  ) {
    return this.careerService.getGuidance(user.userId, user.token, dto.profileId);
  }
}
