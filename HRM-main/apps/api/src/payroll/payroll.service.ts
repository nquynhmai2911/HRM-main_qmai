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
        items: true,
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

  async updatePayslipSalesKpi(id: string, data: {
    kpiTarget?: number;
    salesActual?: number;
    commissionRate?: number;
    extraBonus?: number;
    note?: string;
  }) {
    const payslip = await this.prisma.payslip.findUnique({
      where: { id },
      include: { employee: true, period: true }
    });
    if (!payslip) throw new NotFoundException('Phiếu lương không tồn tại');

    const kpiTarget = Math.max(0, Number(data.kpiTarget) || 0);
    const salesActual = Math.max(0, Number(data.salesActual) || 0);
    const commissionRate = Math.max(0, Number(data.commissionRate) || 0);
    const extraBonus = Number(data.extraBonus) || 0;

    // Rule:
    // If KPI is not met (salesActual < kpiTarget) => no commission (receives base salary)
    // If KPI is met (salesActual >= kpiTarget) => receives commission = salesActual * (commissionRate / 100)
    const isKpiMet = kpiTarget > 0 ? (salesActual >= kpiTarget) : (salesActual > 0);
    const commissionAmount = isKpiMet ? Math.round(salesActual * (commissionRate / 100)) : 0;
    const totalBonus = commissionAmount + extraBonus;

    // Save/update items in PayslipItem
    await this.prisma.payslipItem.deleteMany({
      where: {
        payslipId: id,
        type: { in: ['KPI_TARGET', 'SALES_ACTUAL', 'COMMISSION_RATE', 'COMMISSION', 'KPI_STATUS'] }
      }
    });

    await this.prisma.payslipItem.createMany({
      data: [
        { payslipId: id, type: 'KPI_TARGET', name: 'Chỉ tiêu KPI', amount: kpiTarget },
        { payslipId: id, type: 'SALES_ACTUAL', name: 'Doanh số thực tế', amount: salesActual },
        { payslipId: id, type: 'COMMISSION_RATE', name: 'Tỷ lệ hoa hồng (%)', amount: commissionRate },
        { payslipId: id, type: 'COMMISSION', name: 'Tiền hoa hồng', amount: commissionAmount },
        { payslipId: id, type: 'KPI_STATUS', name: isKpiMet ? 'ĐẠT KPI' : 'KHÔNG ĐẠT KPI', amount: isKpiMet ? 1 : 0 },
      ]
    });

    const diff = totalBonus - (payslip.bonus || 0);
    const newGross = Math.max(0, payslip.grossIncome + diff);
    const newNet = Math.max(0, payslip.netPay + diff);

    return this.prisma.payslip.update({
      where: { id },
      data: {
        bonus: totalBonus,
        grossIncome: newGross,
        netPay: newNet,
      },
      include: {
        items: true,
        employee: {
          include: { department: true, position: true }
        }
      }
    });
  }

  async checkPeriodKpi(periodId: string, departmentId?: string) {
    const period = await this.prisma.payrollPeriod.findUnique({ where: { id: periodId } });
    if (!period) throw new NotFoundException('Kỳ lương không tồn tại');

    const whereClause: any = { periodId };
    if (departmentId && departmentId !== 'ALL') {
      whereClause.employee = { departmentId };
    }

    const payslips = await this.prisma.payslip.findMany({
      where: whereClause,
      include: {
        items: true,
        employee: {
          include: { department: true, position: true }
        }
      }
    });

    let metCount = 0;
    let unmetCount = 0;

    for (const p of payslips) {
      const code = (p.employee?.department?.code || '').toUpperCase();
      const deptName = (p.employee?.department?.name || '').toLowerCase();
      const posName = (p.employee?.position?.name || '').toLowerCase();
      const isSales =
        code.includes('SALES') ||
        code === 'BIZ' ||
        code === 'MKT' ||
        deptName.includes('kinh doanh') ||
        deptName.includes('sales') ||
        deptName.includes('bán hàng') ||
        deptName.includes('marketing') ||
        posName.includes('sales') ||
        posName.includes('kinh doanh');

      const getItem = (type: string) => p.items.find(i => i.type === type)?.amount;
      const existingTarget = getItem('KPI_TARGET');
      const existingActual = getItem('SALES_ACTUAL');
      const existingRate   = getItem('COMMISSION_RATE');

      let target = existingTarget != null ? Number(existingTarget) : (isSales ? 100000000 : 0);
      let actual = existingActual != null ? Number(existingActual) : (isSales ? ((p.bonus && p.bonus > 1000000) ? p.bonus * 20 : 120000000) : 0);
      let rate   = existingRate != null ? Number(existingRate) : 5;

      // Check assigned KPI from employee_kpis table
      const assignedKpi = await this.prisma.employeeKpi.findUnique({
        where: {
          employeeId_month_year: {
            employeeId: p.employeeId,
            month: period.month,
            year: period.year,
          },
        },
      });

      if (assignedKpi) {
        target = assignedKpi.targetAmount;
        actual = assignedKpi.actualAmount;
        rate   = assignedKpi.commissionRate;
      }

      const isKpiMet = target > 0 ? (actual >= target) : (actual > 0);
      const commission = isKpiMet ? Math.round(actual * (rate / 100)) : 0;

      if (isKpiMet) metCount++;
      else unmetCount++;

      // Upsert KPI items
      await this.prisma.payslipItem.deleteMany({
        where: {
          payslipId: p.id,
          type: { in: ['KPI_TARGET', 'SALES_ACTUAL', 'COMMISSION_RATE', 'COMMISSION', 'KPI_STATUS'] }
        }
      });

      if (target > 0 || actual > 0) {
        await this.prisma.payslipItem.createMany({
          data: [
            { payslipId: p.id, type: 'KPI_TARGET', name: 'Chỉ tiêu KPI', amount: target },
            { payslipId: p.id, type: 'SALES_ACTUAL', name: 'Doanh số thực tế', amount: actual },
            { payslipId: p.id, type: 'COMMISSION_RATE', name: 'Tỷ lệ hoa hồng (%)', amount: rate },
            { payslipId: p.id, type: 'COMMISSION', name: 'Tiền hoa hồng', amount: commission },
            { payslipId: p.id, type: 'KPI_STATUS', name: isKpiMet ? 'ĐẠT KPI' : 'KHÔNG ĐẠT KPI', amount: isKpiMet ? 1 : 0 },
          ]
        });
      }

      const diff = commission - (p.bonus || 0);
      const newGross = Math.max(0, p.grossIncome + diff);
      const newNet = Math.max(0, p.netPay + diff);

      await this.prisma.payslip.update({
        where: { id: p.id },
        data: {
          bonus: commission,
          grossIncome: newGross,
          netPay: newNet
        }
      });
    }

    const updatedPayslips = await this.getPayslipsByPeriod(periodId);
    return {
      success: true,
      total: payslips.length,
      metCount,
      unmetCount,
      payslips: updatedPayslips
    };
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

  async previewPayroll(periodId: string, departmentId?: string) {
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

    const whereEmp: any = { status: 'ACTIVE' };
    if (departmentId && departmentId !== 'ALL') {
      whereEmp.departmentId = departmentId;
    }

    const employees = await this.prisma.employee.findMany({
      where: whereEmp,
      include: { dependents: true, department: true, position: true },
      orderBy: { fullName: 'asc' },
    });

    const rows = [];
    for (const emp of employees) {
      const profile = await this.prisma.salaryProfile.findFirst({
        where: { employeeId: emp.id, effectiveFrom: { lte: endDate } },
        orderBy: { effectiveFrom: 'desc' },
      });

      const code = (emp.department?.code || '').toUpperCase();
      const deptName = (emp.department?.name || '').toLowerCase();
      const posName = (emp.position?.name || '').toLowerCase();
      const isSales =
        code.includes('SALES') ||
        code === 'BIZ' ||
        code === 'MKT' ||
        deptName.includes('kinh doanh') ||
        deptName.includes('sales') ||
        deptName.includes('bán hàng') ||
        deptName.includes('marketing') ||
        posName.includes('sales') ||
        posName.includes('kinh doanh');

      if (!profile) {
        rows.push({
          employeeId: emp.id,
          employeeCode: emp.employeeCode,
          fullName: emp.fullName,
          department: emp.department?.name ?? '—',
          departmentId: emp.departmentId,
          position: emp.position?.name ?? '—',
          baseSalary: null,
          allowanceTotal: 0,
          workDays: 0,
          otAmount: 0,
          otHours: 0,
          bonus: 0,
          grossIncome: 0,
          insuranceEmployee: 0,
          personalIncomeTax: 0,
          netPay: 0,
          numDependents: emp.dependents.length,
          hasSalaryProfile: false,
          isSales,
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
      let bonus = 0;

      // Check assigned KPI from employee_kpis table
      const assignedKpi = await this.prisma.employeeKpi.findUnique({
        where: {
          employeeId_month_year: {
            employeeId: emp.id,
            month: period.month,
            year: period.year,
          },
        },
      });

      if (assignedKpi) {
        bonus = assignedKpi.commissionAmount + (assignedKpi.extraBonus || 0);
      } else if (isSales) {
        bonus = 6000000; // Estimated 5% of 120M
      }

      const grossIncome       = baseIncome + allowanceTotal + otAmount + bonus;
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
        departmentId: emp.departmentId,
        position: emp.position?.name ?? '—',
        baseSalary: profile.baseSalary,
        allowanceTotal,
        workDays,
        otAmount,
        otHours,
        bonus,
        grossIncome,
        insuranceEmployee,
        personalIncomeTax,
        netPay,
        numDependents: emp.dependents.length,
        hasSalaryProfile: true,
        isSales,
      });
    }

    return { period, rows };
  }

  async createPeriod(month: number, year: number, note?: string, createdBy?: string) {
    const m = Number(month);
    const y = Number(year);
    if (!m || isNaN(m) || m < 1 || m > 12) throw new BadRequestException('Tháng không hợp lệ (1-12)');
    if (!y || isNaN(y) || y < 2020 || y > 2100) throw new BadRequestException('Năm không hợp lệ');

    // Check duplicate (only version 1 for same month/year)
    const existing = await this.prisma.payrollPeriod.findFirst({
      where: { month: m, year: y },
    });
    if (existing) {
      throw new ConflictException(`Kỳ lương tháng ${m}/${y} đã tồn tại!`);
    }

    return this.prisma.payrollPeriod.create({
      data: {
        month: m,
        year: y,
        note: note || `Kỳ lương tháng ${m}/${y}`,
        status: 'DRAFT',
        createdBy,
      },
    });
  }

  async updatePeriodStatus(periodId: string, newStatus: string, userId: string, notes?: string) {
    const period = await this.prisma.payrollPeriod.findUnique({ where: { id: periodId } });
    if (!period) throw new NotFoundException('Kỳ lương không tồn tại');

    // Idempotent if already in target status
    if (period.status === newStatus) {
      return period;
    }

    // Validate status transitions
    const allowedTransitions: Record<string, string[]> = {
      DRAFT: ['APPROVED', 'PAID'],
      APPROVED: ['PAID', 'DRAFT'],
      PAID: ['APPROVED', 'DRAFT'],
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

  async batchUpdateSalaries(data: { effectiveDate?: string; employees?: { id: string; baseSalary: number; note: string }[] }) {
    const effectiveFrom = data.effectiveDate ? new Date(data.effectiveDate) : new Date();
    
    if (Array.isArray(data.employees)) {
      for (const emp of data.employees) {
        await this.prisma.salaryProfile.create({
          data: {
            employeeId: emp.id,
            baseSalary: Number(emp.baseSalary) || 0,
            allowances: JSON.stringify({ note: emp.note }),
            effectiveFrom,
          },
        });
      }
    }

    return { success: true, count: data.employees?.length || 0 };
  }

  async computePayroll(periodId: string, options?: { departmentId?: string; kpiTarget?: number; commissionRate?: number }) {
    const period = await this.prisma.payrollPeriod.findUnique({ where: { id: periodId } });
    if (!period) throw new NotFoundException('Kỳ lương không tồn tại');

    // Prevent computing on PAID periods
    if (period.status === 'PAID') {
      throw new BadRequestException('Kỳ lương đã thanh toán, không thể tính lại!');
    }

    const whereEmp: any = { status: 'ACTIVE' };
    if (options?.departmentId && options.departmentId !== 'ALL') {
      whereEmp.departmentId = options.departmentId;
    }

    const employees = await this.prisma.employee.findMany({ 
      where: whereEmp,
      include: {
        dependents: true,
        department: true,
        position: true,
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
      
      // Upsert Payslip check
      const existing = await this.prisma.payslip.findFirst({
        where: { periodId: period.id, employeeId: emp.id }
      });

      // Check if employee is Sales
      const code = (emp.department?.code || '').toUpperCase();
      const deptName = (emp.department?.name || '').toLowerCase();
      const posName = (emp.position?.name || '').toLowerCase();
      const isSales =
        code.includes('SALES') ||
        code === 'BIZ' ||
        code === 'MKT' ||
        deptName.includes('kinh doanh') ||
        deptName.includes('sales') ||
        deptName.includes('bán hàng') ||
        deptName.includes('marketing') ||
        posName.includes('sales') ||
        posName.includes('kinh doanh');

      let bonus = existing?.bonus || 0;
      let salesKpiItems: any[] = [];

      // Check if employee has assigned KPI in employee_kpis table
      const assignedKpi = await this.prisma.employeeKpi.findUnique({
        where: {
          employeeId_month_year: {
            employeeId: emp.id,
            month: period.month,
            year: period.year,
          },
        },
      });

      if (assignedKpi) {
        const kpiTarget = assignedKpi.targetAmount;
        const salesActual = assignedKpi.actualAmount;
        const commissionRate = assignedKpi.commissionRate;
        const isKpiMet = assignedKpi.isMet;
        const commissionAmount = assignedKpi.commissionAmount;
        bonus = commissionAmount + (assignedKpi.extraBonus || 0);

        salesKpiItems = [
          { type: 'KPI_TARGET', name: `Chỉ tiêu KPI (${assignedKpi.kpiCode})`, amount: kpiTarget },
          { type: 'SALES_ACTUAL', name: 'Doanh số thực tế', amount: salesActual },
          { type: 'COMMISSION_RATE', name: 'Tỷ lệ hoa hồng (%)', amount: commissionRate },
          { type: 'COMMISSION', name: 'Tiền hoa hồng', amount: commissionAmount },
          { type: 'KPI_STATUS', name: isKpiMet ? 'ĐẠT KPI' : 'KHÔNG ĐẠT KPI', amount: isKpiMet ? 1 : 0 },
        ];
      } else if (isSales) {
        const kpiTarget = Number(options?.kpiTarget) || 100000000;
        const commissionRate = Number(options?.commissionRate) || 5;
        const salesActual = 120000000; // default actual for sales
        const isKpiMet = salesActual >= kpiTarget;
        const commissionAmount = isKpiMet ? Math.round(salesActual * (commissionRate / 100)) : 0;
        bonus = commissionAmount;

        salesKpiItems = [
          { type: 'KPI_TARGET', name: 'Chỉ tiêu KPI', amount: kpiTarget },
          { type: 'SALES_ACTUAL', name: 'Doanh số thực tế', amount: salesActual },
          { type: 'COMMISSION_RATE', name: 'Tỷ lệ hoa hồng (%)', amount: commissionRate },
          { type: 'COMMISSION', name: 'Tiền hoa hồng', amount: commissionAmount },
          { type: 'KPI_STATUS', name: isKpiMet ? 'ĐẠT KPI' : 'KHÔNG ĐẠT KPI', amount: isKpiMet ? 1 : 0 },
        ];
      }

      const grossIncome = baseIncome + allowanceTotal + otAmount + bonus;
      
      // Insurances (calculated on base salary)
      const insuranceEmployee = profile.baseSalary * (bhxhRate + bhytRate + bhtnRate);
      const insuranceCompany = profile.baseSalary * 0.215;
      
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

      let savedPayslipId = '';
      if (existing) {
        const updated = await this.prisma.payslip.update({
          where: { id: existing.id },
          data: {
            workDays, standardWorkDays, baseIncome, allowanceTotal, otAmount, bonus,
            grossIncome, insuranceEmployee, insuranceCompany, personalIncomeTax, netPay
          }
        });
        savedPayslipId = updated.id;
      } else {
        const created = await this.prisma.payslip.create({
          data: {
            periodId: period.id, employeeId: emp.id,
            workDays, standardWorkDays, baseIncome, allowanceTotal, otAmount, bonus,
            grossIncome, insuranceEmployee, insuranceCompany, personalIncomeTax, netPay
          }
        });
        savedPayslipId = created.id;
      }

      if (salesKpiItems.length > 0 && savedPayslipId) {
        await this.prisma.payslipItem.deleteMany({
          where: {
            payslipId: savedPayslipId,
            type: { in: ['KPI_TARGET', 'SALES_ACTUAL', 'COMMISSION_RATE', 'COMMISSION', 'KPI_STATUS'] }
          }
        });
        await this.prisma.payslipItem.createMany({
          data: salesKpiItems.map(it => ({ ...it, payslipId: savedPayslipId }))
        });
      }

      count++;
    }

    return { success: true, count, skipped };
  }

  async deletePeriod(periodId: string) {
    const period = await this.prisma.payrollPeriod.findUnique({ where: { id: periodId } });
    if (!period) throw new NotFoundException('Kỳ lương không tồn tại');
    if (period.status === 'PAID') {
      throw new BadRequestException('Kỳ lương đã thanh toán, không thể xóa!');
    }
    const payslips = await this.prisma.payslip.findMany({ where: { periodId } });
    const ids = payslips.map(p => p.id);
    if (ids.length > 0) {
      await this.prisma.payslipItem.deleteMany({ where: { payslipId: { in: ids } } });
      await this.prisma.payslip.deleteMany({ where: { periodId } });
    }
    return this.prisma.payrollPeriod.delete({ where: { id: periodId } });
  }
}
