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
    if (!user?.employee?.id) throw new BadRequestException('User is not an employee');
    
    const startDate = dayjs(`${year}-${month}-01`).startOf('month').toDate();
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
      where: { year, date: { gte: startDate, lte: endDate } }
    });

    return { logs, leaveRequests, holidays };
  }

  // --- LEAVE MANAGEMENT ---

  async getLeaveTypes() {
    return this.prisma.leaveType.findMany({ where: { isActive: true } });
  }

  async createLeaveRequest(data: any, user: any) {
    if (!user?.employee?.id) throw new BadRequestException('User is not an employee');
    
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
        leaveTypeId: data.leaveTypeId,
        fromDate: new Date(data.fromDate),
        toDate: new Date(data.toDate),
        days: Number(data.days),
        reason: data.reason,
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
    return this.prisma.leaveRequest.findMany({
      where: { approverId: user.employee.id, status: 'PENDING' },
      include: { employee: true, leaveType: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  async approveLeave(id: string, decision: 'APPROVED' | 'REJECTED', user: any) {
    if (!user?.employee?.id) throw new BadRequestException('User is not an employee');
    const req = await this.prisma.leaveRequest.findUnique({ where: { id } });
    if (!req) throw new NotFoundException('Leave request not found');
    if (req.approverId !== user.employee.id) {
      throw new BadRequestException('Bạn không có quyền duyệt đơn này');
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

    return this.prisma.overtimeRequest.create({
      data: {
        employeeId: user.employee.id,
        date: new Date(data.date),
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
        hours: Number(data.hours),
        dayType: data.dayType || 'NORMAL',
        reason: data.reason,
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
