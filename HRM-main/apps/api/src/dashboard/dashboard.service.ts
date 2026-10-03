import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getStats(user: any) {
    const role = user.role;
    const employeeId = user.employee?.id;

    if (['ADMIN', 'CEO', 'HR_MANAGER', 'HR_STAFF'].includes(role)) {
      // HR/Admin stats
      const totalEmployees = await this.prisma.employee.count({ where: { status: 'ACTIVE' } });
      
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const newThisMonth = await this.prisma.employee.count({
        where: {
          joinDate: { gte: startOfMonth }
        }
      });

      const resignedThisMonth = await this.prisma.employee.count({
        where: {
          status: 'RESIGNED',
          updatedAt: { gte: startOfMonth } // Assuming updatedAt is when they resigned
        }
      });

      const openRequisitions = await this.prisma.jobRequisition.count({
        where: { status: 'OPEN' }
      });

      const pendingLeaves = await this.prisma.leaveRequest.count({
        where: { status: 'PENDING' }
      });

      const pendingOT = await this.prisma.overtimeRequest.count({
        where: { status: 'PENDING' }
      });

      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      const contractsExpiring = await this.prisma.contract.count({
        where: {
          endDate: { gte: new Date(), lte: nextMonth },
          status: 'ACTIVE',
          type: { not: 'PROBATION' }
        }
      });

      const probationEnding = await this.prisma.contract.count({
        where: {
          endDate: { gte: new Date(), lte: nextMonth },
          status: 'ACTIVE',
          type: 'PROBATION'
        }
      });

      return {
        totalEmployees,
        newThisMonth,
        resignedThisMonth,
        openRequisitions,
        pendingLeaves,
        pendingOT,
        contractsExpiring,
        probationEnding,
      };
    } else if (role === 'MANAGER') {
      // Manager stats
      if (!employeeId) return {};

      // Get employees in same department
      const employee = await this.prisma.employee.findUnique({ where: { id: employeeId } });
      if (!employee) return {};

      const teamMembers = await this.prisma.employee.count({
        where: { departmentId: employee.departmentId, status: 'ACTIVE' }
      });

      const pendingLeaves = await this.prisma.leaveRequest.count({
        where: { approverId: employeeId, status: 'PENDING' }
      });

      const pendingOT = await this.prisma.overtimeRequest.count({
        where: { approverId: employeeId, status: 'PENDING' }
      });

      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      const todayAttendance = await this.prisma.attendanceLog.count({
        where: {
          date: startOfToday,
          employee: { departmentId: employee.departmentId }
        }
      });

      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      const probationEnding = await this.prisma.contract.count({
        where: {
          endDate: { gte: new Date(), lte: nextMonth },
          status: 'ACTIVE',
          type: 'PROBATION',
          employee: { departmentId: employee.departmentId }
        }
      });

      return {
        teamMembers,
        pendingApprovals: pendingLeaves + pendingOT,
        todayAttendance,
        probationEnding,
      };
    } else {
      // Employee stats
      if (!employeeId) return {};

      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const attendanceLogs = await this.prisma.attendanceLog.count({
        where: {
          employeeId: employeeId,
          date: { gte: startOfMonth }
        }
      });

      // Simple static value for now, or could query leave_balances if implemented
      const leaveBalance = 12; 

      const pendingLeaves = await this.prisma.leaveRequest.count({
        where: { employeeId: employeeId, status: 'PENDING' }
      });

      const pendingOT = await this.prisma.overtimeRequest.count({
        where: { employeeId: employeeId, status: 'PENDING' }
      });

      return {
        workDaysThisMonth: attendanceLogs,
        leaveBalance,
        pendingRequests: pendingLeaves + pendingOT,
      };
    }
  }
}
