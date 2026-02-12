import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';
import { AdminService } from './admin.service';

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
}
