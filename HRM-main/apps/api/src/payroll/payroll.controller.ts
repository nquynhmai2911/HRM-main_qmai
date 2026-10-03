import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { PayrollService } from './payroll.service';
import { Auth, GetUser } from '../auth/decorators';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('Payroll')
@ApiBearerAuth()
@Auth()
@Controller('payroll')
export class PayrollController {
  constructor(private readonly payrollService: PayrollService) {}

  @Get('my-payslips')
  @ApiOperation({ summary: 'Get current user payslips' })
  async getMyPayslips(@GetUser() user: any) {
    if (!user.employee?.id) return [];
    return this.payrollService.getMyPayslips(user.employee.id);
  }

  @Get('periods')
  @Auth('ADMIN', 'HR_MANAGER', 'CEO')
  @ApiOperation({ summary: 'Get all payroll periods' })
  async getAllPeriods() {
    return this.payrollService.getAllPeriods();
  }

  @Post('salary-review')
  @Auth('ADMIN', 'HR_MANAGER', 'CEO')
  @ApiOperation({ summary: 'Batch update employee salaries' })
  async batchUpdateSalaries(@Body() data: any) {
    return this.payrollService.batchUpdateSalaries(data);
  }

  @Post('periods/:id/compute')
  @Auth('ADMIN', 'HR_MANAGER')
  @ApiOperation({ summary: 'Compute payroll for a period' })
  async computePayroll(@Param('id') periodId: string) {
    return this.payrollService.computePayroll(periodId);
  }
}
