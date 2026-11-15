import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { KpiService } from './kpi.service';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Auth, GetUser } from '../auth/decorators';

@ApiTags('KPI')
@ApiBearerAuth()
@Auth()
@Controller('kpis')
export class KpiController {
  constructor(private readonly kpiService: KpiService) {}

  @Get()
  @ApiOperation({ summary: 'Get all KPI assignments with filter and summary' })
  findAll(
    @GetUser() user: any,
    @Query('month') month?: number,
    @Query('year') year?: number,
    @Query('departmentId') departmentId?: string,
    @Query('isMet') isMet?: string,
    @Query('search') search?: string,
  ) {
    return this.kpiService.findAll({ month, year, departmentId, isMet, search, user });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single KPI assignment' })
  findOne(@Param('id') id: string) {
    return this.kpiService.findOne(id);
  }

  @Post()
  @Auth('ADMIN', 'HR_MANAGER', 'ACCOUNTANT', 'MANAGER')
  @ApiOperation({ summary: 'Create or upsert employee KPI assignment' })
  create(@Body() data: any) {
    return this.kpiService.create(data);
  }

  @Post('batch-apply-sales')
  @Auth('ADMIN', 'HR_MANAGER', 'ACCOUNTANT', 'MANAGER')
  @ApiOperation({ summary: 'Batch apply KPI target to all employees in a sales department' })
  batchApplySales(@Body() data: any) {
    return this.kpiService.batchApplySales(data);
  }

  @Put(':id')
  @Auth('ADMIN', 'HR_MANAGER', 'ACCOUNTANT', 'MANAGER')
  @ApiOperation({ summary: 'Update KPI assignment and actual amount' })
  update(@Param('id') id: string, @Body() data: any) {
    return this.kpiService.update(id, data);
  }

  @Delete(':id')
  @Auth('ADMIN', 'HR_MANAGER', 'ACCOUNTANT')
  @ApiOperation({ summary: 'Delete KPI assignment' })
  remove(@Param('id') id: string) {
    return this.kpiService.remove(id);
  }
}

