import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterDeviceDto {
  @ApiProperty({ description: 'FCM or Web Push subscription token' })
  @IsString()
  @MinLength(10)
  @MaxLength(512)
  deviceToken: string;
}
