import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  ValidateIf,
} from 'class-validator';
import { Role } from '../../common/enums/role.enum';

export class SignUpDto {
  @ApiProperty({ description: 'Full name', minLength: 1, maxLength: 255 })
  @IsString()
  @Length(1, 255)
  name: string;

  @ApiProperty({ description: 'Email address' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Password (min 8 chars)', minLength: 8 })
  @IsString()
  @Length(8, 255)
  password: string;

  @ApiPropertyOptional({ description: 'Phone number' })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional({ description: 'Timezone' })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiProperty({
    description: 'Role of the user',
    enum: [Role.User, Role.Astrologer],
  })
  @IsIn([Role.User, Role.Astrologer])
  roleId: Role;

  @ApiPropertyOptional({ description: 'Guest ID to convert', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  guestId?: string;

  @ApiPropertyOptional({ description: 'Date of birth (required if not guest)' })
  @ValidateIf((dto) => !dto.guestId)
  @IsDateString()
  @IsOptional()
  dob?: string;

  @ApiPropertyOptional({ description: 'Birth place (required if not guest)' })
  @ValidateIf((dto) => !dto.guestId)
  @IsString()
  @Length(1, 255)
  @IsOptional()
  birthPlace?: string;

  @ApiPropertyOptional({ description: 'Birth time' })
  @IsOptional()
  @IsString()
  birthTime?: string;
}
