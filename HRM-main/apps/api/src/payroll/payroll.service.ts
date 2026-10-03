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

    const employees = await this.prisma.employee.findMany({ where: { status: 'ACTIVE' } });
    const startDate = new Date(period.year, period.month - 1, 1);
    const endDate = new Date(period.year, period.month, 0);

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
          allowanceTotal = 500000; // default standard allowance if only note is present
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
        let multiplier = 1.5;
        if (req.dayType === 'WEEKEND') multiplier = 2.0;
        if (req.dayType === 'HOLIDAY') multiplier = 3.0;
        otAmount += req.hours * otHourlyRate * multiplier;
      }

      // Base Income (assuming full 22 days for simplicity, real app would count attendance logs)
      const workDays = 22;
      const baseIncome = profile.baseSalary;
      const bonus = 0;
      
      const grossIncome = baseIncome + allowanceTotal + otAmount + bonus;
      // Insurances: BHXH(8%) + BHYT(1.5%) + BHTN(1%) = 10.5%
      const insuranceEmployee = profile.baseSalary * 0.105;
      
      // Simplified PIT (Personal Income Tax)
      let personalIncomeTax = 0;
      const taxable = grossIncome - insuranceEmployee - 11000000;
      if (taxable > 0) personalIncomeTax = taxable * 0.05; // 5% flat for simplicity

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
            insuranceEmployee, personalIncomeTax, netPay, status: 'DRAFT'
          }
        });
      }
      count++;
    }

    return { success: true, count };
  }
}
