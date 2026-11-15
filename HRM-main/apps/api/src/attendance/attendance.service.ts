import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

@Injectable()
export class AttendanceService {
  constructor(private prisma: PrismaService) {}

  async checkIn(user: any) {
    if (!user?.employee?.id) throw new BadRequestException('User is not an employee');
    
    const today = dayjs().startOf('day').toDate();
    const existingLog = await this.prisma.attendanceLog.findFirst({
      where: {
        employeeId: user.employee.id,
        date: today
      }
    });

    if (existingLog?.checkInAt) {
      throw new BadRequestException('Bạn đã check-in hôm nay rồi');
    }

    const now = new Date();
    // 8:30 AM is standard start time
    const standardStart = dayjs().hour(8).minute(30).second(0);
    const lateMinutes = dayjs(now).isAfter(standardStart) ? dayjs(now).diff(standardStart, 'minute') : 0;

    if (existingLog) {
      return this.prisma.attendanceLog.update({
        where: { id: existingLog.id },
        data: { checkInAt: now, lateMinutes }
      });
    }

    return this.prisma.attendanceLog.create({
      data: {
        employeeId: user.employee.id,
        date: today,
        checkInAt: now,
        lateMinutes,
        workMode: 'ONSITE',
        status: 'APPROVED', // auto approved if real-time
      }
    });
  }

  async checkOut(user: any) {
    if (!user?.employee?.id) throw new BadRequestException('User is not an employee');
    
    const today = dayjs().startOf('day').toDate();
    const log = await this.prisma.attendanceLog.findFirst({
      where: {
        employeeId: user.employee.id,
        date: today
      }
    });

    if (!log || !log.checkInAt) {
      throw new BadRequestException('Bạn chưa check-in hôm nay');
    }

    const now = new Date();
    const workedHours = dayjs(now).diff(dayjs(log.checkInAt), 'hour', true);

    return this.prisma.attendanceLog.update({
      where: { id: log.id },
      data: {
        checkOutAt: now,
        workedHours: Number(workedHours.toFixed(2)),
      }
    });
  }

  async getMyTimesheet(month: number, year: number, user: any) {
    if (!user?.employee?.id) {
      return { logs: [], leaveRequests: [], holidays: [] };
    }
    
    const now = dayjs();
    const targetMonth = (!month || isNaN(month)) ? now.month() + 1 : month;
    const targetYear = (!year || isNaN(year)) ? now.year() : year;

    const startDate = dayjs(`${targetYear}-${String(targetMonth).padStart(2, '0')}-01`).startOf('month').toDate();
    const endDate = dayjs(startDate).endOf('month').toDate();

    const logs = await this.prisma.attendanceLog.findMany({
      where: {
        employeeId: user.employee.id,
        date: { gte: startDate, lte: endDate }
      },
      orderBy: { date: 'asc' }
    });

    const leaveRequests = await this.prisma.leaveRequest.findMany({
      where: {
        employeeId: user.employee.id,
        status: 'APPROVED',
        fromDate: { lte: endDate },
        toDate: { gte: startDate }
      },
      include: { leaveType: true }
    });

    const holidays = await this.prisma.holiday.findMany({
      where: { year: targetYear, date: { gte: startDate, lte: endDate } }
    });

    return { logs, leaveRequests, holidays };
  }

  // --- LEAVE MANAGEMENT ---

  async getLeaveTypes() {
    return this.prisma.leaveType.findMany({ where: { isActive: true } });
  }

  async createLeaveRequest(data: any, user: any) {
    if (!user?.employee?.id) throw new BadRequestException('User is not an employee');
    
    // Resolve leaveTypeId if not provided or invalid
    let leaveTypeId = data.leaveTypeId || data.typeId;
    if (!leaveTypeId) {
      const firstType = await this.prisma.leaveType.findFirst();
      leaveTypeId = firstType?.id;
    } else {
      const exists = await this.prisma.leaveType.findUnique({ where: { id: leaveTypeId } });
      if (!exists) {
        const firstType = await this.prisma.leaveType.findFirst();
        leaveTypeId = firstType?.id;
      }
    }
    if (!leaveTypeId) throw new BadRequestException('Chưa có loại nghỉ phép trong hệ thống');

    const fromDate = data.fromDate || data.startDate ? new Date(data.fromDate || data.startDate) : new Date();
    const toDate = data.toDate || data.endDate ? new Date(data.toDate || data.endDate) : new Date();
    const days = Number(data.days) || Math.max(1, Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 3600 * 24)) + 1);

    let approverId = null;
    if (data.approverEmail) {
      const approverEmp = await this.prisma.employee.findFirst({
        where: { workEmail: data.approverEmail }
      });
      if (!approverEmp) throw new BadRequestException(`Không tìm thấy quản lý với email ${data.approverEmail}`);
      approverId = approverEmp.id;
    }

    return this.prisma.leaveRequest.create({
      data: {
        employeeId: user.employee.id,
        leaveTypeId,
        fromDate,
        toDate,
        days,
        reason: data.reason || 'Nghỉ phép',
        approverId,
        status: 'PENDING'
      }
    });
  }

  async getMyLeaveRequests(user: any) {
    if (!user?.employee?.id) throw new BadRequestException('User is not an employee');
    return this.prisma.leaveRequest.findMany({
      where: { employeeId: user.employee.id },
      include: { leaveType: true, approver: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getPendingApprovals(user: any) {
    if (!user?.employee?.id) throw new BadRequestException('User is not an employee');
    const isAdminOrHR = ['ADMIN', 'CEO', 'HR_MANAGER'].includes(user.role);
    return this.prisma.leaveRequest.findMany({
      where: isAdminOrHR ? undefined : { approverId: user.employee.id },
      include: { 
        employee: {
          include: { department: true, position: true }
        }, 
        leaveType: true,
        approver: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async approveLeave(id: string, decision: 'APPROVED' | 'REJECTED', user: any) {
    if (!user?.employee?.id) throw new BadRequestException('User is not an employee');
    const req = await this.prisma.leaveRequest.findUnique({ where: { id }, include: { leaveType: true } });
    if (!req) throw new NotFoundException('Leave request not found');
    const isAdminOrHR = ['ADMIN', 'CEO', 'HR_MANAGER'].includes(user.role);
    if (!isAdminOrHR && req.approverId && req.approverId !== user.employee.id) {
      throw new BadRequestException('Bạn không có quyền duyệt đơn này');
    }

    if (decision === 'APPROVED' && req.leaveType.isPaid) {
      const year = req.fromDate.getFullYear();
      const diffTime = Math.abs(req.toDate.getTime() - req.fromDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

      // Ensure balance exists
      let balance = await this.prisma.leaveBalance.findFirst({
        where: { employeeId: req.employeeId, leaveTypeId: req.leaveTypeId, year }
      });

      if (!balance) {
        balance = await this.prisma.leaveBalance.create({
          data: { employeeId: req.employeeId, leaveTypeId: req.leaveTypeId, year, total: 12, used: 0 }
        });
      }

      if (balance.used + diffDays > balance.total) {
        throw new BadRequestException('Không đủ số dư phép');
      }

      await this.prisma.leaveBalance.update({
        where: { id: balance.id },
        data: { used: balance.used + diffDays }
      });
    }

    return this.prisma.leaveRequest.update({
      where: { id },
      data: { status: decision, approvedAt: new Date() }
    });
  }

  // --- OVERTIME MANAGEMENT ---
  async createOvertimeRequest(data: any, user: any) {
    if (!user?.employee?.id) throw new BadRequestException('User is not an employee');
    
    let approverId = null;
    if (data.approverEmail) {
      const approverEmp = await this.prisma.employee.findFirst({
        where: { workEmail: data.approverEmail }
      });
      if (!approverEmp) throw new BadRequestException(`Không tìm thấy quản lý với email ${data.approverEmail}`);
      approverId = approverEmp.id;
    }

    const otDate = data.date ? new Date(data.date) : new Date();
    const startTime = data.startTime ? new Date(data.startTime) : new Date();
    const endTime = data.endTime ? new Date(data.endTime) : new Date(Date.now() + 2 * 3600 * 1000);
    const hours = Number(data.hours) || Math.max(1, Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 3600)));

    return this.prisma.overtimeRequest.create({
      data: {
        employeeId: user.employee.id,
        date: otDate,
        startTime,
        endTime,
        hours,
        dayType: data.dayType || 'NORMAL',
        reason: data.reason || 'Tăng ca dự án',
        approverId,
        status: 'PENDING'
      }
    });
  }

  async getMyOvertimeRequests(user: any) {
    if (!user?.employee?.id) throw new BadRequestException('User is not an employee');
    return this.prisma.overtimeRequest.findMany({
      where: { employeeId: user.employee.id },
      include: { approver: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getPendingOvertimeApprovals(user: any) {
    if (!user?.employee?.id) throw new BadRequestException('User is not an employee');
    return this.prisma.overtimeRequest.findMany({
      where: { approverId: user.employee.id, status: 'PENDING' },
      include: { employee: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  async approveOvertime(id: string, decision: 'APPROVED' | 'REJECTED', user: any) {
    if (!user?.employee?.id) throw new BadRequestException('User is not an employee');
    const req = await this.prisma.overtimeRequest.findUnique({ where: { id } });
    if (!req) throw new NotFoundException('Overtime request not found');
    if (req.approverId !== user.employee.id) {
      throw new BadRequestException('Bạn không có quyền duyệt đơn này');
    }

    return this.prisma.overtimeRequest.update({
      where: { id },
      data: { status: decision, approvedAt: new Date() }
    });
  }
}
