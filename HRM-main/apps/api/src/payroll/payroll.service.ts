import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PayrollService {
  constructor(private prisma: PrismaService) {}

  async getMyPayslips(employeeId: string) {
    return this.prisma.payslip.findMany({
      where: { employeeId },
      include: {
        period: true,
        items: true,
      },
      orderBy: [
        { period: { year: 'desc' } },
        { period: { month: 'desc' } },
      ],
    });
  }

  async getAllPeriods() {
    return this.prisma.payrollPeriod.findMany({
      orderBy: [
        { year: 'desc' },
        { month: 'desc' },
      ],
      include: {
        _count: {
          select: { payslips: true },
        },
      }
    });
  }

  async batchUpdateSalaries(data: { effectiveDate: string; employees: { id: string; baseSalary: number; note: string }[] }) {
    const effectiveFrom = new Date(data.effectiveDate);
    
    // Create a new salary profile for each employee
    for (const emp of data.employees) {
      await this.prisma.salaryProfile.create({
        data: {
          employeeId: emp.id,
          baseSalary: emp.baseSalary,
          allowances: JSON.stringify({ note: emp.note }),
          effectiveFrom,
        },
      });
    }

    return { success: true, count: data.employees.length };
  }

  async computePayroll(periodId: string) {
    const period = await this.prisma.payrollPeriod.findUnique({ where: { id: periodId } });
    if (!period) throw new Error('Period not found');

    const employees = await this.prisma.employee.findMany({ 
      where: { status: 'ACTIVE' },
      include: {
        dependents: true
      }
    });
    const startDate = new Date(period.year, period.month - 1, 1);
    const endDate = new Date(period.year, period.month, 0);

    // Fetch System Configs
    const configs = await this.prisma.systemConfig.findMany();
    const getConfig = (key: string, defaultVal: string) => {
      const c = configs.find(c => c.key === key);
      return c ? c.value : defaultVal;
    };

    const bhxhRate = parseFloat(getConfig('BHXH_EMPLOYEE_RATE', '0.08'));
    const bhytRate = parseFloat(getConfig('BHYT_EMPLOYEE_RATE', '0.015'));
    const bhtnRate = parseFloat(getConfig('BHTN_EMPLOYEE_RATE', '0.01'));
    const personalDeduction = parseFloat(getConfig('PIT_PERSONAL_DEDUCTION', '11000000'));
    const dependentDeduction = parseFloat(getConfig('PIT_DEPENDENT_DEDUCTION', '4400000'));
    
    let taxBrackets = [];
    try {
      taxBrackets = JSON.parse(getConfig('PIT_TAX_BRACKETS', '[]'));
    } catch(e) {}

    let count = 0;

    for (const emp of employees) {
      // Find latest salary profile active for this period
      const profile = await this.prisma.salaryProfile.findFirst({
        where: { employeeId: emp.id, effectiveFrom: { lte: endDate } },
        orderBy: { effectiveFrom: 'desc' }
      });

      if (!profile) continue; // Skip if no salary profile

      // Calculate Allowances
      let allowanceTotal = 0;
      try {
        const parsed = JSON.parse(profile.allowances);
        if (parsed.note && !parsed.amount) {
          allowanceTotal = 500000;
        } else if (parsed.amount) {
          allowanceTotal = Number(parsed.amount);
        }
      } catch (e) { allowanceTotal = 0; }

      // Get OT Hours
      const otRequests = await this.prisma.overtimeRequest.findMany({
        where: { employeeId: emp.id, status: 'APPROVED', date: { gte: startDate, lte: endDate } }
      });

      let otAmount = 0;
      const otHourlyRate = (profile.baseSalary / 22) / 8;
      for (const req of otRequests) {
        let multiplier = parseFloat(getConfig('OT_RATE_WEEKDAY', '1.5'));
        if (req.dayType === 'WEEKEND') multiplier = parseFloat(getConfig('OT_RATE_WEEKEND', '2.0'));
        if (req.dayType === 'HOLIDAY') multiplier = parseFloat(getConfig('OT_RATE_HOLIDAY', '3.0'));
        otAmount += req.hours * otHourlyRate * multiplier;
      }

      // Calculate actual work days from AttendanceLog
      const attendanceLogs = await this.prisma.attendanceLog.findMany({
        where: { employeeId: emp.id, date: { gte: startDate, lte: endDate }, status: 'APPROVED' }
      });

      // Approved leaves
      const leaveRequests = await this.prisma.leaveRequest.findMany({
        where: { employeeId: emp.id, status: 'APPROVED', fromDate: { lte: endDate }, toDate: { gte: startDate } },
        include: { leaveType: true }
      });

      let workDays = attendanceLogs.length;

      // Add paid leaves
      for (const leave of leaveRequests) {
        if (leave.leaveType.isPaid) {
          const leaveStart = leave.fromDate < startDate ? startDate : leave.fromDate;
          const leaveEnd = leave.toDate > endDate ? endDate : leave.toDate;
          const diffTime = Math.abs(leaveEnd.getTime() - leaveStart.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
          workDays += diffDays;
        }
      }

      if (workDays > 22) workDays = 22; // Cap at 22 for simplicity of base calculation

      const baseIncome = (profile.baseSalary / 22) * workDays;
      const bonus = 0;
      
      const grossIncome = baseIncome + allowanceTotal + otAmount + bonus;
      
      // Insurances
      const insuranceEmployee = profile.baseSalary * (bhxhRate + bhytRate + bhtnRate);
      
      // Dependents
      const totalDependentDeduction = emp.dependents.length * dependentDeduction;

      // Taxable income
      let taxable = grossIncome - insuranceEmployee - personalDeduction - totalDependentDeduction;
      if (taxable < 0) taxable = 0;

      // Calculate PIT with brackets
      let personalIncomeTax = 0;
      if (taxable > 0 && taxBrackets.length > 0) {
        for (const bracket of taxBrackets) {
          if (taxable > bracket.from) {
            const amountInBracket = Math.min(taxable - bracket.from, (bracket.to || Infinity) - bracket.from);
            personalIncomeTax += amountInBracket * bracket.rate;
          }
        }
      }

      const netPay = grossIncome - insuranceEmployee - personalIncomeTax;

      // Upsert Payslip
      const existing = await this.prisma.payslip.findFirst({
        where: { periodId: period.id, employeeId: emp.id }
      });

      if (existing) {
        await this.prisma.payslip.update({
          where: { id: existing.id },
          data: {
            workDays, baseIncome, allowanceTotal, otAmount, grossIncome,
            insuranceEmployee, personalIncomeTax, netPay
          }
        });
      } else {
        await this.prisma.payslip.create({
          data: {
            periodId: period.id, employeeId: emp.id,
            workDays, baseIncome, allowanceTotal, otAmount, grossIncome,
            insuranceEmployee, personalIncomeTax, netPay
          }
        });
      }
      count++;
    }

    return { success: true, count };
  }
}
