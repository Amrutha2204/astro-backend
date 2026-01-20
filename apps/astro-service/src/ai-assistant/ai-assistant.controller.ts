import {
  Controller,
  Post,
  Get,
  Body,
  Request,
  HttpCode,
  HttpStatus,
  HttpException,
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

@Controller('api/v1/ai-assistant')
@ApiTags('AI Assistant')
@ApiBearerAuth()
export class AiAssistantController {
  constructor(private readonly aiAssistantService: AiAssistantService) {}

  @Post('chat')
  @HttpCode(HttpStatus.OK)
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
  async chat(@Request() req: any, @Body() dto: ChatDto) {
    const authHeader = req.headers?.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new HttpException(
        'Authentication required. Please provide a valid JWT token.',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const token = authHeader.substring(7);

    return this.aiAssistantService.chat(token, dto);
  }

  @Post('explain-kundli')
  @HttpCode(HttpStatus.OK)
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
  async explainKundli(@Request() req: any, @Body() dto: ExplainKundliDto) {
    const authHeader = req.headers?.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new HttpException(
        'Authentication required. Please provide a valid JWT token.',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const token = authHeader.substring(7);

    return this.aiAssistantService.explainKundli(token, dto);
  }

  @Get('suggestions')
  @HttpCode(HttpStatus.OK)
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
  async getSuggestions(@Request() req: any) {
    const authHeader = req.headers?.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new HttpException(
        'Authentication required. Please provide a valid JWT token.',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const token = authHeader.substring(7);

    return this.aiAssistantService.getSuggestions(token);
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

