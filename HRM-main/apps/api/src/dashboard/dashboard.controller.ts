import { Controller, Get, Req } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { Auth } from '../auth/decorators/auth.decorator';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('dashboard')
@ApiBearerAuth()
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @Auth()
  @ApiOperation({ summary: 'Get dashboard statistics based on user role' })
  getStats(@Req() req: any) {
    return this.dashboardService.getStats(req.user);
  }
}
