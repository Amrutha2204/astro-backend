import { Controller, Get, Put, Query, Body, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags, ApiBearerAuth, ApiQuery, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';
import { AdminService } from './admin.service';

export class AdminContentDto {
  sunSignMeanings?: string;
  planetMeanings?: string;
  transitInterpretations?: string;
}

export class AdminAiEnabledDto {
  enabled: boolean;
}

@Controller('api/v1/admin')
@ApiTags('Admin')
@UseGuards(JwtAuthGuard, AdminGuard)
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get admin dashboard stats (admin only)' })
  @ApiOkResponse({ description: 'Report, transaction, subscription counts and revenue' })
  async getStats() {
    return this.adminService.getStats();
  }

  @Get('transactions')
  @ApiOperation({ summary: 'List recent transactions (admin only)' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiOkResponse({ description: 'Paginated transactions' })
  async getTransactions(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const l = limit ? Math.min(parseInt(limit, 10) || 50, 100) : 50;
    const o = offset ? Math.max(0, parseInt(offset, 10)) : 0;
    return this.adminService.getTransactions(l, o);
  }

  @Get('reports')
  @ApiOperation({ summary: 'List recent reports (admin only)' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiOkResponse({ description: 'Paginated reports' })
  async getReports(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const l = limit ? Math.min(parseInt(limit, 10) || 50, 100) : 50;
    const o = offset ? Math.max(0, parseInt(offset, 10)) : 0;
    return this.adminService.getReports(l, o);
  }

  @Get('content')
  @ApiOperation({ summary: 'Get editable content (sun sign, planet, transit)' })
  @ApiOkResponse({ description: 'Content keys and values' })
  async getContent() {
    return this.adminService.getContent();
  }

  @Put('content')
  @ApiOperation({ summary: 'Update editable content' })
  @ApiBody({ type: AdminContentDto })
  @ApiOkResponse({ description: 'Content updated' })
  async setContent(@Body() body: AdminContentDto) {
    await this.adminService.setContent(body);
  }

  @Get('ai-enabled')
  @ApiOperation({ summary: 'Get AI assistant enabled flag' })
  @ApiOkResponse({ description: 'enabled: boolean' })
  async getAiEnabled() {
    return { enabled: await this.adminService.getAiEnabled() };
  }

  @Put('ai-enabled')
  @ApiOperation({ summary: 'Set AI assistant on/off' })
  @ApiBody({ type: AdminAiEnabledDto })
  @ApiOkResponse({ description: 'AI enabled updated' })
  async setAiEnabled(@Body() body: AdminAiEnabledDto) {
    await this.adminService.setAiEnabled(!!body.enabled);
  }
}
