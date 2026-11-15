import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class KpiService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: {
    month?: number;
    year?: number;
    departmentId?: string;
    isMet?: string;
    search?: string;
    user?: any;
  }) {
    const where: any = {};

    // Permission scoping: Regular employee can only see their own KPI
    if (query.user?.role === 'EMPLOYEE' && query.user?.employee?.id) {
      where.employeeId = query.user.employee.id;
    }

    if (query.month) where.month = Number(query.month);
    if (query.year) where.year = Number(query.year);

    if (query.isMet === 'true') where.isMet = true;
    if (query.isMet === 'false') where.isMet = false;

    if (query.departmentId && query.departmentId !== 'ALL') {
      where.employee = { departmentId: query.departmentId };
    }

    if (query.search && query.search.trim()) {
      const q = query.search.trim();
      where.OR = [
        { kpiCode: { contains: q } },
        { kpiName: { contains: q } },
        { employee: { fullName: { contains: q } } },
        { employee: { employeeCode: { contains: q } } },
      ];
    }

    const list = await this.prisma.employeeKpi.findMany({
      where,
      orderBy: [{ year: 'desc' }, { month: 'desc' }, { createdAt: 'desc' }],
      include: {
        employee: {
          include: {
            department: true,
            position: true,
          },
        },
      },
    });

    const totalCount = list.length;
    const totalTarget = list.reduce((sum, item) => sum + item.targetAmount, 0);
    const totalActual = list.reduce((sum, item) => sum + item.actualAmount, 0);
    const totalCommission = list.reduce((sum, item) => sum + item.commissionAmount, 0);
    const metCount = list.filter(item => item.isMet).length;
    const unmetCount = totalCount - metCount;

    return {
      list,
      summary: {
        totalCount,
        totalTarget,
        totalActual,
        totalCommission,
        metCount,
        unmetCount,
      },
    };
  }

  async findOne(id: string) {
    const kpi = await this.prisma.employeeKpi.findUnique({
      where: { id },
      include: {
        employee: {
          include: {
            department: true,
            position: true,
          },
        },
      },
    });
    if (!kpi) throw new NotFoundException('Không tìm thấy chỉ tiêu KPI');
    return kpi;
  }

  async create(data: {
    employeeId: string;
    month: number;
    year: number;
    kpiCode?: string;
    kpiName?: string;
    targetAmount: number;
    actualAmount?: number;
    commissionRate?: number;
    extraBonus?: number;
    note?: string;
  }) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: data.employeeId },
      include: { department: true },
    });
    if (!employee) throw new NotFoundException('Nhân viên không tồn tại');

    const month = Number(data.month);
    const year = Number(data.year);
    if (!month || month < 1 || month > 12) throw new BadRequestException('Tháng không hợp lệ (1-12)');
    if (!year || year < 2020) throw new BadRequestException('Năm không hợp lệ');

    const targetAmount = Math.max(0, Number(data.targetAmount) || 0);
    const actualAmount = Math.max(0, Number(data.actualAmount) || 0);
    const commissionRate = Math.max(0, Number(data.commissionRate) || 0);
    const extraBonus = Math.max(0, Number(data.extraBonus) || 0);

    const isMet = targetAmount > 0 ? actualAmount >= targetAmount : actualAmount > 0;
    const commissionAmount = isMet ? Math.round(actualAmount * (commissionRate / 100)) : 0;

    const mStr = month < 10 ? `0${month}` : `${month}`;
    const kpiCode = data.kpiCode || `KPI-${year}${mStr}-${employee.employeeCode}`;
    const kpiName = data.kpiName || `KPI Doanh số Tháng ${month}/${year}`;

    // Upsert into employeeKpi
    return this.prisma.employeeKpi.upsert({
      where: {
        employeeId_month_year: {
          employeeId: data.employeeId,
          month,
          year,
        },
      },
      update: {
        kpiCode,
        kpiName,
        targetAmount,
        actualAmount,
        commissionRate,
        extraBonus,
        isMet,
        commissionAmount,
        note: data.note || null,
      },
      create: {
        employeeId: data.employeeId,
        month,
        year,
        kpiCode,
        kpiName,
        targetAmount,
        actualAmount,
        commissionRate,
        extraBonus,
        isMet,
        commissionAmount,
        note: data.note || null,
      },
      include: {
        employee: {
          include: { department: true, position: true },
        },
      },
    });
  }

  async batchApplySales(data: {
    departmentId: string;
    month: number;
    year: number;
    kpiCodePrefix?: string;
    kpiName?: string;
    targetAmount: number;
    commissionRate: number;
    note?: string;
  }) {
    const month = Number(data.month);
    const year = Number(data.year);
    if (!month || month < 1 || month > 12) throw new BadRequestException('Tháng không hợp lệ (1-12)');
    if (!year || year < 2020) throw new BadRequestException('Năm không hợp lệ');

    const targetAmount = Math.max(0, Number(data.targetAmount) || 100000000);
    const commissionRate = Math.max(0, Number(data.commissionRate) || 5);

    const whereEmp: any = { status: 'ACTIVE' };
    if (data.departmentId && data.departmentId !== 'ALL') {
      whereEmp.departmentId = data.departmentId;
    } else {
      // If ALL departments, restrict to Sales / Business departments only
      whereEmp.department = {
        OR: [
          { code: { contains: 'SALES' } },
          { code: 'BIZ' },
          { code: 'MKT' },
          { name: { contains: 'Kinh doanh' } },
          { name: { contains: 'Bán hàng' } },
          { name: { contains: 'Sales' } },
          { name: { contains: 'Marketing' } },
        ],
      };
    }

    const employees = await this.prisma.employee.findMany({
      where: whereEmp,
      include: { department: true, position: true },
    });

    const mStr = month < 10 ? `0${month}` : `${month}`;
    let appliedCount = 0;

    for (const emp of employees) {
      const kpiCode = `${data.kpiCodePrefix || 'KPI'}-${year}${mStr}-${emp.employeeCode}`;
      const kpiName = data.kpiName || `KPI Doanh số Tháng ${month}/${year}`;

      // Check existing to retain actualAmount if already logged
      const existing = await this.prisma.employeeKpi.findUnique({
        where: {
          employeeId_month_year: {
            employeeId: emp.id,
            month,
            year,
          },
        },
      });

      const actualAmount = existing ? existing.actualAmount : 0;
      const isMet = targetAmount > 0 ? actualAmount >= targetAmount : false;
      const commissionAmount = isMet ? Math.round(actualAmount * (commissionRate / 100)) : 0;

      await this.prisma.employeeKpi.upsert({
        where: {
          employeeId_month_year: {
            employeeId: emp.id,
            month,
            year,
          },
        },
        update: {
          kpiCode,
          kpiName,
          targetAmount,
          commissionRate,
          isMet,
          commissionAmount,
          note: data.note || existing?.note || 'Áp KPI hàng loạt theo phòng ban',
        },
        create: {
          employeeId: emp.id,
          month,
          year,
          kpiCode,
          kpiName,
          targetAmount,
          actualAmount: 0,
          commissionRate,
          isMet: false,
          commissionAmount: 0,
          note: data.note || 'Áp KPI hàng loạt theo phòng ban',
        },
      });

      appliedCount++;
    }

    return {
      success: true,
      count: appliedCount,
      message: `Đã áp mã KPI cho ${appliedCount} nhân viên trong kỳ Tháng ${month}/${year}!`,
    };
  }

  async update(id: string, data: {
    kpiCode?: string;
    kpiName?: string;
    targetAmount?: number;
    actualAmount?: number;
    commissionRate?: number;
    extraBonus?: number;
    note?: string;
    status?: string;
  }) {
    const kpi = await this.prisma.employeeKpi.findUnique({ where: { id } });
    if (!kpi) throw new NotFoundException('Không tìm thấy chỉ tiêu KPI');

    const targetAmount = data.targetAmount != null ? Math.max(0, Number(data.targetAmount)) : kpi.targetAmount;
    const actualAmount = data.actualAmount != null ? Math.max(0, Number(data.actualAmount)) : kpi.actualAmount;
    const commissionRate = data.commissionRate != null ? Math.max(0, Number(data.commissionRate)) : kpi.commissionRate;
    const extraBonus = data.extraBonus != null ? Math.max(0, Number(data.extraBonus)) : kpi.extraBonus;

    const isMet = targetAmount > 0 ? actualAmount >= targetAmount : actualAmount > 0;
    const commissionAmount = isMet ? Math.round(actualAmount * (commissionRate / 100)) : 0;

    return this.prisma.employeeKpi.update({
      where: { id },
      data: {
        kpiCode: data.kpiCode || kpi.kpiCode,
        kpiName: data.kpiName || kpi.kpiName,
        targetAmount,
        actualAmount,
        commissionRate,
        extraBonus,
        isMet,
        commissionAmount,
        note: data.note !== undefined ? data.note : kpi.note,
        status: data.status || kpi.status,
      },
      include: {
        employee: {
          include: { department: true, position: true },
        },
      },
    });
  }

  async remove(id: string) {
    const kpi = await this.prisma.employeeKpi.findUnique({ where: { id } });
    if (!kpi) throw new NotFoundException('Không tìm thấy chỉ tiêu KPI');
    return this.prisma.employeeKpi.delete({ where: { id } });
  }
}

