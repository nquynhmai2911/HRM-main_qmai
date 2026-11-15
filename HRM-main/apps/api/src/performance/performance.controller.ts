import { Controller, Get, Post, Put, Delete, Body, Param, Req } from '@nestjs/common';
import { PerformanceService } from './performance.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Auth } from '../auth/decorators/auth.decorator';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('performance')
@ApiBearerAuth()
@Controller('performance/reviews')
export class PerformanceController {
  constructor(
    private readonly performanceService: PerformanceService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @Auth()
  findAll() {
    return this.performanceService.findAll();
  }

  @Post()
  @Auth('ADMIN', 'HR_MANAGER', 'MANAGER')
  async create(@Body() data: any, @Req() req: any) {
    let reviewerId = data.reviewerId || req.user?.employee?.id;
    if (!reviewerId) {
      const firstEmp = await this.prisma.employee.findFirst();
      reviewerId = firstEmp?.id || data.employeeId;
    }
    return this.performanceService.create({
      ...data,
      reviewerId,
    });
  }

  @Put(':id')
  @Auth('ADMIN', 'HR_MANAGER', 'MANAGER')
  update(@Param('id') id: string, @Body() data: any) {
    return this.performanceService.update(id, data);
  }

  @Delete(':id')
  @Auth('ADMIN', 'HR_MANAGER')
  remove(@Param('id') id: string) {
    return this.performanceService.remove(id);
  }
}
