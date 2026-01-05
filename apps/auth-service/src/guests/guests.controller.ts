import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateGuestDto } from './dto/create-guest.dto';
import { GuestsService } from './guests.service';

@Controller('api/v1/guests')
@ApiTags('Guests')
export class GuestsController {
  constructor(private readonly guestsService: GuestsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Onboard a guest user' })
  @ApiCreatedResponse({
    description: 'Guest user onboarded successfully',
    schema: {
      example: {
        message: 'Guest user onboarded successfully',
        guestId: 'uuid',
      },
    },
  })
  createGuest(@Body() dto: CreateGuestDto) {
    return this.guestsService.onboardGuest(dto);
  }
}
