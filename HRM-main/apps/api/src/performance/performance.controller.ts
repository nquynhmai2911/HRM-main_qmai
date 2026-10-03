import { Controller, Get, Post, Put, Delete, Body, Param, Req } from '@nestjs/common';
import { PerformanceService } from './performance.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Auth } from '../auth/decorators/auth.decorator';

@ApiTags('performance')
@ApiBearerAuth()
@Controller('performance/reviews')
export class PerformanceController {
  constructor(private readonly performanceService: PerformanceService) {}

  @Get()
  @Auth()
  findAll() {
    return this.performanceService.findAll();
  }

  @Post()
  @Auth('ADMIN', 'HR_MANAGER', 'MANAGER')
  create(@Body() data: any, @Req() req: any) {
    return this.performanceService.create({
      ...data,
      reviewerId: data.reviewerId || req.user.employeeId
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
