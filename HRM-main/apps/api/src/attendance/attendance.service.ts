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

  private async ensureEmployee(user: any): Promise<string | null> {
    if (user?.employee?.id) return user.employee.id;

    // Try finding by email
    const email = user.email || '';
    const emp = await this.prisma.employee.findFirst({
      where: {
        OR: [
          { workEmail: email },
          { workEmail: email.toLowerCase() },
          { personalEmail: email },
        ],
      },
    });

    if (emp) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { employeeId: emp.id },
      });
      user.employee = emp;
      return emp.id;
    }

    return null;
  }

  private async getOrCreateEmployee(user: any): Promise<string> {
    const existingId = await this.ensureEmployee(user);
    if (existingId) return existingId;

    // Auto-create an employee profile for users who don't have one yet
    const count = await this.prisma.employee.count();
    const employeeCode = `DTS${String(count + 1).padStart(4, '0')}`;
    const name = user.email?.split('@')[0] || 'User';

    const defaultDept = await this.prisma.department.findFirst();
    const defaultPos = await this.prisma.position.findFirst();
    const defaultBranch = await this.prisma.branch.findFirst();

    const newEmp = await this.prisma.employee.create({
      data: {
        employeeCode,
        fullName: name,
        dob: new Date('1995-01-01'),
        gender: 'MALE',
        idNumber: `0012${Date.now().toString().slice(-8)}`,
        phone: '0900000000',
        workEmail: user.email,
        departmentId: defaultDept?.id || '',
        positionId: defaultPos?.id || '',
        branchId: defaultBranch?.id || '',
        status: 'ACTIVE',
        joinDate: new Date(),
      },
    });

    await this.prisma.user.update({
      where: { id: user.id },
      data: { employeeId: newEmp.id },
    });
    user.employee = newEmp;
    return newEmp.id;
  }

  private async resolveApprover(approverEmail?: string, currentEmployeeId?: string): Promise<string | null> {
    if (approverEmail && approverEmail.trim()) {
      const email = approverEmail.trim().toLowerCase();
      // 1. By employee workEmail
      const employees = await this.prisma.employee.findMany();
      const matched = employees.find(
        (e) => e.workEmail && e.workEmail.toLowerCase() === email
      );
      if (matched) return matched.id;

      // 2. By user email
      const users = await this.prisma.user.findMany({ include: { employee: true } });
      const matchedUser = users.find(
        (u) => u.email.toLowerCase() === email && u.employee
      );
      if (matchedUser?.employee) return matchedUser.employee.id;
    }

    // 3. Fallback: Manager of department
    if (currentEmployeeId) {
      const currentEmp = await this.prisma.employee.findUnique({
        where: { id: currentEmployeeId },
        include: { department: true },
      });
      if (currentEmp?.department?.managerId && currentEmp.department.managerId !== currentEmployeeId) {
        return currentEmp.department.managerId;
      }
    }

    // 4. Fallback: First manager or admin employee
    const managerUser = await this.prisma.user.findFirst({
      where: { role: { in: ['MANAGER', 'HR_MANAGER', 'ADMIN'] }, employeeId: { not: null } },
      include: { employee: true },
    });
    if (managerUser?.employeeId) return managerUser.employeeId;

    const firstAdminEmp = await this.prisma.employee.findFirst();
    return firstAdminEmp?.id || null;
  }

  async checkIn(user: any) {
    const employeeId = await this.getOrCreateEmployee(user);
    
    const today = dayjs().startOf('day').toDate();
    const existingLog = await this.prisma.attendanceLog.findFirst({
      where: {
        employeeId,
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
        employeeId,
        date: today,
        checkInAt: now,
        lateMinutes,
        workMode: 'ONSITE',
        status: 'APPROVED', // auto approved if real-time
      }
    });
  }

  async checkOut(user: any) {
    const employeeId = await this.ensureEmployee(user);
    if (!employeeId) {
      throw new BadRequestException('User is not an employee');
    }
    
    const today = dayjs().startOf('day').toDate();
    const log = await this.prisma.attendanceLog.findFirst({
      where: {
        employeeId,
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
    const employeeId = await this.ensureEmployee(user);
    if (!employeeId) {
      return { logs: [], leaveRequests: [], holidays: [] };
    }
    
    const now = dayjs();
    const targetMonth = (!month || isNaN(month)) ? now.month() + 1 : month;
    const targetYear = (!year || isNaN(year)) ? now.year() : year;

    const startDate = dayjs(`${targetYear}-${String(targetMonth).padStart(2, '0')}-01`).startOf('month').toDate();
    const endDate = dayjs(startDate).endOf('month').toDate();

    const logs = await this.prisma.attendanceLog.findMany({
      where: {
        employeeId,
        date: { gte: startDate, lte: endDate }
      },
      orderBy: { date: 'asc' }
    });

    const leaveRequests = await this.prisma.leaveRequest.findMany({
      where: {
        employeeId,
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

  async getAllLeaveRequests(user: any) {
    const isAdminOrHR = ['ADMIN', 'CEO', 'HR_MANAGER', 'HR_STAFF', 'MANAGER'].includes(user.role);
    const employeeId = await this.ensureEmployee(user);

    return this.prisma.leaveRequest.findMany({
      where: isAdminOrHR ? undefined : (employeeId ? { employeeId } : undefined),
      include: {
        employee: {
          include: { department: true, position: true }
        },
        leaveType: true,
        approver: true
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async createLeaveRequest(data: any, user: any) {
    const employeeId = await this.getOrCreateEmployee(user);
    
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

    const approverId = await this.resolveApprover(data.approverEmail, employeeId);

    return this.prisma.leaveRequest.create({
      data: {
        employeeId,
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
    const employeeId = await this.ensureEmployee(user);
    if (!employeeId) return [];

    return this.prisma.leaveRequest.findMany({
      where: { employeeId },
      include: { leaveType: true, approver: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getPendingApprovals(user: any) {
    const isAdminOrHR = ['ADMIN', 'CEO', 'HR_MANAGER'].includes(user.role);
    const employeeId = await this.ensureEmployee(user);

    if (!isAdminOrHR && !employeeId) return [];

    return this.prisma.leaveRequest.findMany({
      where: isAdminOrHR ? undefined : { approverId: employeeId },
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
    const employeeId = await this.ensureEmployee(user);
    const req = await this.prisma.leaveRequest.findUnique({ where: { id }, include: { leaveType: true } });
    if (!req) throw new NotFoundException('Leave request not found');

    const isAdminOrHR = ['ADMIN', 'CEO', 'HR_MANAGER'].includes(user.role);
    if (!isAdminOrHR && req.approverId && req.approverId !== employeeId) {
      throw new BadRequestException('Bạn không có quyền duyệt đơn này');
    }

    if (decision === 'APPROVED' && req.leaveType?.isPaid) {
      const year = req.fromDate.getFullYear();
      const diffTime = Math.abs(req.toDate.getTime() - req.fromDate.getTime());
      const fallbackDiff = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      const daysToDeduct = req.days > 0 ? req.days : fallbackDiff;

      // Ensure balance exists
      let balance = await this.prisma.leaveBalance.findFirst({
        where: { employeeId: req.employeeId, leaveTypeId: req.leaveTypeId, year }
      });

      if (!balance) {
        balance = await this.prisma.leaveBalance.create({
          data: {
            employeeId: req.employeeId,
            leaveTypeId: req.leaveTypeId,
            year,
            total: Math.max(12, daysToDeduct),
            used: 0
          }
        });
      }

      // If needed, auto-expand total balance so approval is not blocked
      const newTotal = Math.max(balance.total, balance.used + daysToDeduct);
      await this.prisma.leaveBalance.update({
        where: { id: balance.id },
        data: {
          used: balance.used + daysToDeduct,
          total: newTotal
        }
      });
    }

    return this.prisma.leaveRequest.update({
      where: { id },
      data: { status: decision, approvedAt: new Date() }
    });
  }

  // --- OVERTIME MANAGEMENT ---
  async createOvertimeRequest(data: any, user: any) {
    const employeeId = await this.getOrCreateEmployee(user);
    
    const approverId = await this.resolveApprover(data.approverEmail, employeeId);

    const otDate = data.date ? new Date(data.date) : new Date();
    const startTime = data.startTime ? new Date(data.startTime) : new Date();
    const endTime = data.endTime ? new Date(data.endTime) : new Date(Date.now() + 2 * 3600 * 1000);
    const hours = Number(data.hours) || Math.max(1, Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 3600)));

    return this.prisma.overtimeRequest.create({
      data: {
        employeeId,
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
    const employeeId = await this.ensureEmployee(user);
    if (!employeeId) return [];

    return this.prisma.overtimeRequest.findMany({
      where: { employeeId },
      include: { approver: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getPendingOvertimeApprovals(user: any) {
    const isAdminOrHR = ['ADMIN', 'CEO', 'HR_MANAGER'].includes(user.role);
    const employeeId = await this.ensureEmployee(user);

    if (!isAdminOrHR && !employeeId) return [];

    return this.prisma.overtimeRequest.findMany({
      where: isAdminOrHR ? undefined : { approverId: employeeId, status: 'PENDING' },
      include: { employee: true, approver: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  async approveOvertime(id: string, decision: 'APPROVED' | 'REJECTED', user: any) {
    const employeeId = await this.ensureEmployee(user);
    const req = await this.prisma.overtimeRequest.findUnique({ where: { id } });
    if (!req) throw new NotFoundException('Overtime request not found');

    const isAdminOrHR = ['ADMIN', 'CEO', 'HR_MANAGER'].includes(user.role);
    if (!isAdminOrHR && req.approverId && req.approverId !== employeeId) {
      throw new BadRequestException('Bạn không có quyền duyệt đơn này');
    }

    return this.prisma.overtimeRequest.update({
      where: { id },
      data: { status: decision, approvedAt: new Date() }
    });
  }
}
