import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PayrollService {
  constructor(private prisma: PrismaService) {}

  async getMyPayslips(employeeId: string) {
    const payslips = await this.prisma.payslip.findMany({
      where: { employeeId },
      include: {
        period: true,
        items: true,
        employee: {
          include: {
            department: true,
            position: true,
          },
        },
      },
      orderBy: [
        { period: { year: 'desc' } },
        { period: { month: 'desc' } },
      ],
    });

    return Promise.all(
      payslips.map(async (ps) => {
        const enriched = await this.enrichPayslipsWithAttendance([ps], ps.period.month, ps.period.year);
        return enriched[0];
      })
    );
  }

  async getPeriodsForUser(user: any) {
    const isAuthorizedRole = ['ADMIN', 'HR_MANAGER', 'ACCOUNTANT', 'MANAGER'].includes(user.role);
    if (isAuthorizedRole) {
      return this.getAllPeriods();
    }
    if (!user.employee?.id) return [];
    const myPayslips = await this.prisma.payslip.findMany({
      where: { employeeId: user.employee.id },
      include: { period: true },
      orderBy: [
        { period: { year: 'desc' } },
        { period: { month: 'desc' } },
      ],
    });
    return myPayslips.map(ps => ({
      ...ps.period,
      isPersonalOnly: true,
      myPayslip: ps,
      _count: { payslips: 1 },
    }));
  }

  async getPayslipsByPeriod(periodId: string, user?: any) {
    const isAuthorizedRole = user && ['ADMIN', 'HR_MANAGER', 'ACCOUNTANT', 'MANAGER'].includes(user.role);
    const whereClause: any = { periodId };
    if (!isAuthorizedRole && user?.employee?.id) {
      whereClause.employeeId = user.employee.id;
    }

    const payslips = await this.prisma.payslip.findMany({
      where: whereClause,
      include: {
        period: true,
        employee: {
          include: {
            department: true,
            position: true,
          },
        },
      },
      orderBy: { employee: { fullName: 'asc' } },
    });

    const period = payslips[0]?.period || await this.prisma.payrollPeriod.findUnique({ where: { id: periodId } });
    if (!period) return payslips;

    return this.enrichPayslipsWithAttendance(payslips, period.month, period.year);
  }

  private async enrichPayslipsWithAttendance(payslips: any[], periodMonth: number, periodYear: number) {
    if (!payslips || !payslips.length) return [];
    
    const startDate = new Date(periodYear, periodMonth - 1, 1);
    const endDate = new Date(periodYear, periodMonth, 0);
    const yearStart = new Date(periodYear, 0, 1);
    const yearEnd = new Date(periodYear, 11, 31);

    // Fetch holidays in this month
    const holidaysCount = await this.prisma.holiday.count({
      where: { date: { gte: startDate, lte: endDate } }
    });

    return Promise.all(
      payslips.map(async (ps) => {
        const empId = ps.employeeId;

        // Attendance logs
        const logsCount = await this.prisma.attendanceLog.count({
          where: { employeeId: empId, date: { gte: startDate, lte: endDate }, status: 'APPROVED' }
        });

        // Leaves in this month
        const monthLeaves = await this.prisma.leaveRequest.findMany({
          where: { employeeId: empId, status: 'APPROVED', fromDate: { lte: endDate }, toDate: { gte: startDate } },
          include: { leaveType: true }
        });

        // Annual leaves in this year
        const yearAnnualLeaves = await this.prisma.leaveRequest.findMany({
          where: {
            employeeId: empId,
            status: 'APPROVED',
            fromDate: { gte: yearStart },
            toDate: { lte: yearEnd },
            leaveType: { name: { contains: 'Phép năm' } }
          }
        });
        const annualLeaveUsedInYear = yearAnnualLeaves.reduce((sum, l) => sum + (l.days || 0), 0);
        const totalAnnualLeave = 12;
        const remainingAnnualLeave = Math.max(0, totalAnnualLeave - annualLeaveUsedInYear);

        let paidLeaveDays = 0;
        let unpaidLeaveDays = 0;
        let regimeLeaveDays = 0;

        for (const l of monthLeaves) {
          const lName = (l.leaveType?.name || '').toLowerCase();
          if (lName.includes('không lương') || !l.leaveType?.isPaid) {
            unpaidLeaveDays += (l.days || 0);
          } else if (lName.includes('thai sản') || lName.includes('ốm') || lName.includes('việc riêng')) {
            regimeLeaveDays += (l.days || 0);
          } else {
            paidLeaveDays += (l.days || 0);
          }
        }

        let actualWorkDays = logsCount > 0 ? logsCount : Math.max(0, Math.round(ps.workDays - paidLeaveDays - regimeLeaveDays));
        if (actualWorkDays === 0 && ps.workDays > 0) {
          actualWorkDays = ps.workDays;
        }

        return {
          ...ps,
          actualWorkDays,
          paidLeaveDays,
          unpaidLeaveDays,
          holidayDays: holidaysCount,
          regimeLeaveDays,
          remainingAnnualLeave,
        };
      })
    );
  }

  async updatePayslipBonus(id: string, bonus: number) {
    const payslip = await this.prisma.payslip.findUnique({ where: { id } });
    if (!payslip) throw new NotFoundException('Phiếu lương không tồn tại');
    const newBonus = Number(bonus) || 0;
    const diff = newBonus - (payslip.bonus || 0);
    const newGross = payslip.grossIncome + diff;
    const newNet = Math.max(0, payslip.netPay + diff);
    return this.prisma.payslip.update({
      where: { id },
      data: {
        bonus: newBonus,
        grossIncome: newGross,
        netPay: newNet,
      },
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

  async previewPayroll(periodId: string) {
    const period = await this.prisma.payrollPeriod.findUnique({ where: { id: periodId } });
    if (!period) throw new NotFoundException('Kỳ lương không tồn tại');

    const startDate = new Date(period.year, period.month - 1, 1);
    const endDate   = new Date(period.year, period.month, 0);

    const configs   = await this.prisma.systemConfig.findMany();
    const getConfig = (key: string, def: string) => (configs.find(c => c.key === key)?.value ?? def);

    const bhxhRate = parseFloat(getConfig('BHXH_EMPLOYEE_RATE', '0.08'));
    const bhytRate = parseFloat(getConfig('BHYT_EMPLOYEE_RATE', '0.015'));
    const bhtnRate = parseFloat(getConfig('BHTN_EMPLOYEE_RATE', '0.01'));
    const personalDeduction  = parseFloat(getConfig('PIT_PERSONAL_DEDUCTION',  '11000000'));
    const dependentDeduction = parseFloat(getConfig('PIT_DEPENDENT_DEDUCTION', '4400000'));
    let taxBrackets: any[] = [];
    try { taxBrackets = JSON.parse(getConfig('PIT_TAX_BRACKETS', '[]')); } catch {}

    const employees = await this.prisma.employee.findMany({
      where: { status: 'ACTIVE' },
      include: { dependents: true, department: true, position: true },
      orderBy: { fullName: 'asc' },
    });

    const rows = [];
    for (const emp of employees) {
      const profile = await this.prisma.salaryProfile.findFirst({
        where: { employeeId: emp.id, effectiveFrom: { lte: endDate } },
        orderBy: { effectiveFrom: 'desc' },
      });

      if (!profile) {
        rows.push({
          employeeId: emp.id,
          employeeCode: emp.employeeCode,
          fullName: emp.fullName,
          department: emp.department?.name ?? '—',
          position: emp.position?.name ?? '—',
          baseSalary: null,
          allowanceTotal: 0,
          workDays: 0,
          otAmount: 0,
          otHours: 0,
          grossIncome: 0,
          insuranceEmployee: 0,
          personalIncomeTax: 0,
          netPay: 0,
          numDependents: emp.dependents.length,
          hasSalaryProfile: false,
        });
        continue;
      }

      // Allowances
      let allowanceTotal = 0;
      try {
        const parsed = JSON.parse(profile.allowances);
        if (parsed.amount) allowanceTotal = Number(parsed.amount);
        else if (parsed.note && !parsed.amount) allowanceTotal = 500000;
        else allowanceTotal = Object.values(parsed as Record<string,number>).filter(v => typeof v === 'number').reduce((a,b) => a+b, 0);
      } catch { allowanceTotal = 0; }

      // OT
      const otRequests = await this.prisma.overtimeRequest.findMany({
        where: { employeeId: emp.id, status: 'APPROVED', date: { gte: startDate, lte: endDate } },
      });
      let otAmount = 0;
      let otHours  = 0;
      const otHourlyRate = (profile.baseSalary / 22) / 8;
      for (const req of otRequests) {
        let m = parseFloat(getConfig('OT_RATE_WEEKDAY', '1.5'));
        if (req.dayType === 'WEEKEND') m = parseFloat(getConfig('OT_RATE_WEEKEND', '2.0'));
        if (req.dayType === 'HOLIDAY') m = parseFloat(getConfig('OT_RATE_HOLIDAY', '3.0'));
        otAmount += req.hours * otHourlyRate * m;
        otHours  += req.hours;
      }

      // Work days
      const logs = await this.prisma.attendanceLog.findMany({
        where: { employeeId: emp.id, date: { gte: startDate, lte: endDate }, status: 'APPROVED' },
      });
      const leaves = await this.prisma.leaveRequest.findMany({
        where: { employeeId: emp.id, status: 'APPROVED', fromDate: { lte: endDate }, toDate: { gte: startDate } },
        include: { leaveType: true },
      });
      let workDays = logs.length;
      for (const lv of leaves) {
        if (!lv.leaveType.isPaid) continue;
        const s = lv.fromDate < startDate ? startDate : lv.fromDate;
        const e = lv.toDate   > endDate   ? endDate   : lv.toDate;
        workDays += Math.ceil(Math.abs(e.getTime() - s.getTime()) / 86400000) + 1;
      }
      if (workDays === 0) workDays = 22;
      else if (workDays > 22) workDays = 22;

      const baseIncome        = (profile.baseSalary / 22) * workDays;
      const grossIncome       = baseIncome + allowanceTotal + otAmount;
      const insuranceEmployee = profile.baseSalary * (bhxhRate + bhytRate + bhtnRate);
      const totalDepDeduction = emp.dependents.length * dependentDeduction;
      let taxable             = grossIncome - insuranceEmployee - personalDeduction - totalDepDeduction;
      if (taxable < 0) taxable = 0;

      let personalIncomeTax = 0;
      for (const br of taxBrackets) {
        if (taxable > br.from) {
          personalIncomeTax += Math.min(taxable - br.from, (br.to || Infinity) - br.from) * br.rate;
        }
      }

      const netPay = Math.max(0, grossIncome - insuranceEmployee - personalIncomeTax);

      rows.push({
        employeeId: emp.id,
        employeeCode: emp.employeeCode,
        fullName: emp.fullName,
        department: emp.department?.name ?? '—',
        position: emp.position?.name ?? '—',
        baseSalary: profile.baseSalary,
        allowanceTotal,
        workDays,
        otAmount,
        otHours,
        grossIncome,
        insuranceEmployee,
        personalIncomeTax,
        netPay,
        numDependents: emp.dependents.length,
        hasSalaryProfile: true,
      });
    }

    return { period, rows };
  }

  async createPeriod(month: number, year: number, note?: string, createdBy?: string) {
    // Validate
    if (month < 1 || month > 12) throw new BadRequestException('Tháng không hợp lệ (1-12)');
    if (year < 2020 || year > 2100) throw new BadRequestException('Năm không hợp lệ');

    // Check duplicate (only version 1 for same month/year)
    const existing = await this.prisma.payrollPeriod.findFirst({
      where: { month, year },
    });
    if (existing) {
      throw new ConflictException(`Kỳ lương tháng ${month}/${year} đã tồn tại!`);
    }

    return this.prisma.payrollPeriod.create({
      data: {
        month,
        year,
        note: note || `Kỳ lương tháng ${month}/${year}`,
        status: 'DRAFT',
        createdBy,
      },
    });
  }

  async updatePeriodStatus(periodId: string, newStatus: string, userId: string, notes?: string) {
    const period = await this.prisma.payrollPeriod.findUnique({ where: { id: periodId } });
    if (!period) throw new NotFoundException('Kỳ lương không tồn tại');

    // Validate status transitions
    const allowedTransitions: Record<string, string[]> = {
      DRAFT: ['APPROVED'],
      APPROVED: ['PAID'],
    };
    if (!allowedTransitions[period.status]?.includes(newStatus)) {
      throw new BadRequestException(
        `Không thể chuyển từ trạng thái "${period.status}" sang "${newStatus}"`,
      );
    }

    const updateData: any = { status: newStatus };
    if (newStatus === 'APPROVED') {
      updateData.approvedBy = userId;
      updateData.approvedAt = new Date();
      if (notes) {
        updateData.note = period.note ? `${period.note} [Duyệt: ${notes}]` : `Duyệt: ${notes}`;
      }
    }
    if (newStatus === 'PAID') {
      updateData.paidAt = new Date();
    }

    return this.prisma.payrollPeriod.update({
      where: { id: periodId },
      data: updateData,
    });
  }

  async batchUpdateSalaries(data: { effectiveDate: string; employees: { id: string; baseSalary: number; note: string }[] }) {
    const effectiveFrom = new Date(data.effectiveDate);
    
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
    if (!period) throw new NotFoundException('Kỳ lương không tồn tại');

    // Prevent computing on PAID periods
    if (period.status === 'PAID') {
      throw new BadRequestException('Kỳ lương đã thanh toán, không thể tính lại!');
    }

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
    
    let taxBrackets: any[] = [];
    try {
      taxBrackets = JSON.parse(getConfig('PIT_TAX_BRACKETS', '[]'));
    } catch(e) {}

    let count = 0;
    const skipped: string[] = [];

    for (const emp of employees) {
      // Find latest salary profile active for this period
      const profile = await this.prisma.salaryProfile.findFirst({
        where: { employeeId: emp.id, effectiveFrom: { lte: endDate } },
        orderBy: { effectiveFrom: 'desc' }
      });

      if (!profile) {
        skipped.push(emp.fullName);
        continue; // Skip if no salary profile
      }

      // Calculate Allowances
      let allowanceTotal = 0;
      try {
        const parsed = JSON.parse(profile.allowances);
        if (parsed.note && !parsed.amount) {
          allowanceTotal = 500000;
        } else if (parsed.amount) {
          allowanceTotal = Number(parsed.amount);
        } else if (typeof parsed === 'object') {
          // sum all keys like { lunch: 700000, transport: 500000, phone: 200000 }
          allowanceTotal = Object.values(parsed as Record<string, number>)
            .filter(v => typeof v === 'number')
            .reduce((a, b) => a + b, 0);
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

      if (workDays === 0) workDays = 22;
      else if (workDays > 22) workDays = 22; // Cap at 22
      const standardWorkDays = 22;

      const baseIncome = (profile.baseSalary / 22) * workDays;
      
      // Upsert Payslip check (to preserve bonus if already set)
      const existing = await this.prisma.payslip.findFirst({
        where: { periodId: period.id, employeeId: emp.id }
      });
      const bonus = existing?.bonus || 0;
      const grossIncome = baseIncome + allowanceTotal + otAmount + bonus;
      
      // Insurances (calculated on base salary)
      const insuranceEmployee = profile.baseSalary * (bhxhRate + bhytRate + bhtnRate);
      const insuranceCompany = profile.baseSalary * 0.215; // BHXH 17.5% + BHYT 3% + BHTN 1% 
      
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

      const netPay = Math.max(0, grossIncome - insuranceEmployee - personalIncomeTax);

      if (existing) {
        await this.prisma.payslip.update({
          where: { id: existing.id },
          data: {
            workDays, standardWorkDays, baseIncome, allowanceTotal, otAmount, bonus,
            grossIncome, insuranceEmployee, insuranceCompany, personalIncomeTax, netPay
          }
        });
      } else {
        await this.prisma.payslip.create({
          data: {
            periodId: period.id, employeeId: emp.id,
            workDays, standardWorkDays, baseIncome, allowanceTotal, otAmount, bonus,
            grossIncome, insuranceEmployee, insuranceCompany, personalIncomeTax, netPay
          }
        });
      }
      count++;
    }

    // Move status from DRAFT to DRAFT (keep) after compute
    // Status stays DRAFT until manually approved
    return { success: true, count, skipped };
  }
}
