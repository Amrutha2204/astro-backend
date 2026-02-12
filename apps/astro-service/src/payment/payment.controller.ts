import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
  RawBodyRequest,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PaymentService } from './payment.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Controller('api/v1/payment')
@ApiTags('Payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('create-order')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a Razorpay order (amount in INR)' })
  @ApiBody({ type: CreateOrderDto })
  @ApiOkResponse({ description: 'Order created; use orderId and keyId on client' })
  async createOrder(
    @CurrentUser() user: { userId: string },
    @Body() dto: CreateOrderDto,
  ) {
    return this.paymentService.createOrder(user.userId, dto);
  }

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify payment after client-side success' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        orderId: { type: 'string' },
        paymentId: { type: 'string' },
        signature: { type: 'string' },
      },
      required: ['orderId', 'paymentId', 'signature'],
    },
  })
  @ApiOkResponse({ description: 'Payment verified' })
  async verify(
    @CurrentUser() user: { userId: string },
    @Body() body: { orderId: string; paymentId: string; signature: string },
  ) {
    return this.paymentService.verifyPayment(
      user.userId,
      body.orderId,
      body.paymentId,
      body.signature,
    );
  }

  @Get('wallet/balance')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current wallet balance' })
  @ApiOkResponse({ description: 'Balance in paise and rupees' })
  async getBalance(@CurrentUser() user: { userId: string }) {
    return this.paymentService.getBalance(user.userId);
  }

  @Post('webhook/razorpay')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Razorpay webhook (payment.captured etc.)' })
  async webhook(@Req() req: RawBodyRequest<Request>) {
    const signature = (req.headers['x-razorpay-signature'] as string) || '';
    const rawBody = req.rawBody ? req.rawBody.toString('utf8') : JSON.stringify(req.body || {});
    return this.paymentService.handleWebhook(rawBody, signature);
  }
}
