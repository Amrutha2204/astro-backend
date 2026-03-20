import { Controller, Get, Post, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { SubscriptionService } from './subscription.service';

@Controller('api/v1/subscription')
@ApiTags('Subscription')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Get('plans')
  @ApiOperation({ summary: 'List available subscription plans' })
  @ApiOkResponse({ description: 'List of plans' })
  async getPlans() {
    return this.subscriptionService.getPlans();
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my current subscription' })
  @ApiOkResponse({ description: 'Current plan and status' })
  async getMySubscription(@CurrentUser() user: { userId: string }) {
    return this.subscriptionService.getMySubscription(user.userId);
  }

  @Post('subscribe')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Subscribe to a plan (after payment); duration in months' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        planSlug: { type: 'string', example: 'premium_monthly' },
        durationMonths: { type: 'number', example: 1 },
      },
      required: ['planSlug'],
    },
  })
  @ApiOkResponse({ description: 'Subscription created' })
  async subscribe(
    @CurrentUser() user: { userId: string },
    @Body() body: { planSlug: string; durationMonths?: number },
  ) {
    return this.subscriptionService.subscribe(
      user.userId,
      body.planSlug,
      body.durationMonths ?? 1,
    );
  }
}
