import { Controller, Get, Post, Body, Param, Patch, Query, Delete } from '@nestjs/common';
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
  @Auth()
  @ApiOperation({ summary: 'Get payroll periods (accountants get all, regular users get their own)' })
  async getAllPeriods(@GetUser() user: any) {
    return this.payrollService.getPeriodsForUser(user);
  }

  @Get('periods/:id/preview')
  @Auth('ADMIN', 'HR_MANAGER', 'HR_STAFF', 'ACCOUNTANT')
  @ApiOperation({ summary: 'Preview payroll calculation for a period (dry-run, no save)' })
  async previewPayroll(@Param('id') periodId: string, @Query('departmentId') departmentId?: string) {
    return this.payrollService.previewPayroll(periodId, departmentId);
  }

  @Post('periods')
  @Auth('ADMIN', 'HR_MANAGER', 'HR_STAFF', 'ACCOUNTANT')
  @ApiOperation({ summary: 'Create a new payroll period' })
  async createPeriod(
    @Body() data: { month: number; year: number; note?: string },
    @GetUser() user: any,
  ) {
    return this.payrollService.createPeriod(data.month, data.year, data.note, user.id);
  }

  @Delete('periods/:id')
  @Auth('ADMIN', 'HR_MANAGER', 'ACCOUNTANT')
  @ApiOperation({ summary: 'Delete a payroll period and its payslips' })
  async deletePeriod(@Param('id') periodId: string) {
    return this.payrollService.deletePeriod(periodId);
  }

  @Get('periods/:id/payslips')
  @Auth()
  @ApiOperation({ summary: 'Get all payslips for a period (accountant gets all, user gets own)' })
  async getPayslipsByPeriod(@Param('id') periodId: string, @GetUser() user: any) {
    return this.payrollService.getPayslipsByPeriod(periodId, user);
  }

  @Post('salary-review')
  @Auth('ADMIN', 'HR_MANAGER', 'CEO')
  @ApiOperation({ summary: 'Batch update employee salaries' })
  async batchUpdateSalaries(@Body() data: any) {
    return this.payrollService.batchUpdateSalaries(data);
  }

  @Post('periods/:id/compute')
  @Auth('ADMIN', 'HR_MANAGER', 'HR_STAFF', 'ACCOUNTANT')
  @ApiOperation({ summary: 'Compute payroll for a period (Accountant can run this)' })
  async computePayroll(@Param('id') periodId: string, @Body() data?: any) {
    return this.payrollService.computePayroll(periodId, data);
  }

  @Patch('periods/:id/approve')
  @Auth('ADMIN', 'HR_MANAGER', 'CEO')
  @ApiOperation({ summary: 'Approve a payroll period' })
  async approvePeriod(@Param('id') periodId: string, @GetUser() user: any, @Body('notes') notes?: string) {
    return this.payrollService.updatePeriodStatus(periodId, 'APPROVED', user.id, notes);
  }

  @Patch('periods/:id/mark-paid')
  @Auth('ADMIN', 'HR_MANAGER', 'ACCOUNTANT')
  @ApiOperation({ summary: 'Mark payroll period as paid' })
  async markPaid(@Param('id') periodId: string, @GetUser() user: any) {
    return this.payrollService.updatePeriodStatus(periodId, 'PAID', user.id);
  }

  @Patch('payslips/:id/bonus')
  @Auth('ADMIN', 'HR_MANAGER', 'ACCOUNTANT')
  @ApiOperation({ summary: 'Update bonus for a payslip' })
  async updateBonus(@Param('id') id: string, @Body('bonus') bonus: number) {
    return this.payrollService.updatePayslipBonus(id, bonus);
  }

  @Patch('payslips/:id/sales-kpi')
  @Auth('ADMIN', 'HR_MANAGER', 'ACCOUNTANT', 'MANAGER')
  @ApiOperation({ summary: 'Update sales KPI and commission for a payslip' })
  async updateSalesKpi(@Param('id') id: string, @Body() data: any) {
    return this.payrollService.updatePayslipSalesKpi(id, data);
  }

  @Post('periods/:id/check-kpi')
  @Auth('ADMIN', 'HR_MANAGER', 'ACCOUNTANT', 'MANAGER')
  @ApiOperation({ summary: 'Quick check and evaluate KPI for employees in a period' })
  async checkPeriodKpi(@Param('id') periodId: string, @Body('departmentId') departmentId?: string) {
    return this.payrollService.checkPeriodKpi(periodId, departmentId);
  }
}
