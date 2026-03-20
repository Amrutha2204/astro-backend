import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { SignUpDto } from './dto/signup.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('api/v1/auth')
@ApiTags('Auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user or convert guest to user' })
  @ApiCreatedResponse({
    description: 'User registered successfully',
    schema: {
      example: {
        message: 'User registered successfully',
        userId: 'uuid',
      },
    },
  })
  signup(@Body() dto: SignUpDto) {
    return this.authService.signup(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login and obtain JWT with session expiry' })
  @ApiOkResponse({
    description: 'Login successful - Session stored in database',
    schema: {
      example: {
        accessToken: 'jwt-token',
        expiresAt: '2024-01-08T13:00:00.000Z', // Session expiry
        expiresIn: '1h',
        user: {
          id: 'uuid',
          name: 'John Doe',
          roleId: 1,
        },
      },
    },
  })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout - Delete session from database' })
  @ApiOkResponse({
    description: 'Session deleted successfully',
    schema: {
      example: {
        message: 'Logged out successfully. Session deleted.',
      },
    },
  })
  async logout(@Request() req: any) {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.substring(7)
      : null;

    return this.authService.logout(token);
  }
}
