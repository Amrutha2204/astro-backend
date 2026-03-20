import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiOkResponse,
  ApiBody,
} from '@nestjs/swagger';
import { AiAssistantService } from './ai-assistant.service';
import { ChatDto } from './dto/chat.dto';
import { ExplainKundliDto } from './dto/explain-kundli.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('api/v1/ai-assistant')
@ApiTags('AI Assistant')
@ApiBearerAuth()
export class AiAssistantController {
  constructor(private readonly aiAssistantService: AiAssistantService) {}

  @Post('chat')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Ask astrology questions to AI assistant' })
  @ApiBody({ type: ChatDto })
  @ApiOkResponse({
    description: 'AI response to user question',
    schema: {
      example: {
        answer:
          'Based on your birth chart, today Venus is in a favorable position...',
        relatedTransits: [
          { planet: 'Venus', sign: 'Libra' },
          { planet: 'Moon', sign: 'Cancer' },
        ],
        timestamp: '2026-01-20T11:00:00.000Z',
      },
    },
  })
  async chat(@CurrentUser() user: any, @Body() dto: ChatDto) {
    return this.aiAssistantService.chat(user.token, dto);
  }

  @Post('explain-kundli')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get AI explanation of birth chart' })
  @ApiBody({ type: ExplainKundliDto })
  @ApiOkResponse({
    description: 'AI explanation of birth chart',
    schema: {
      example: {
        explanation: {
          text: 'Your birth chart shows...',
          focus: 'overall',
        },
        chartSummary: {
          sunSign: 'Leo',
          moonSign: 'Cancer',
          ascendant: 'Scorpio',
          nakshatra: 'Rohini',
        },
      },
    },
  })
  async explainKundli(
    @CurrentUser() user: any,
    @Body() dto: ExplainKundliDto,
  ) {
    return this.aiAssistantService.explainKundli(user.token, dto);
  }

  @Get('suggestions')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get daily personalized AI suggestions' })
  @ApiOkResponse({
    description: 'Daily personalized suggestions based on transits',
    schema: {
      example: {
        date: '2026-01-20',
        suggestions: [
          {
            category: 'relationships',
            suggestion: 'Focus on open communication today...',
            reason: 'Venus trine your Moon sign',
          },
          {
            category: 'career',
            suggestion: 'Good day for planning and strategy...',
            reason: 'Mercury in favorable position',
          },
        ],
        overallTheme: 'Day of reflection and planning',
      },
    },
  })
  async getSuggestions(@CurrentUser() user: any) {
    return this.aiAssistantService.getSuggestions(user.token);
  }

  @Get('models')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List available Gemini models (for debugging)' })
  @ApiOkResponse({
    description: 'List of available models',
  })
  async listModels() {
    return this.aiAssistantService.listAvailableModels();
  }
}

