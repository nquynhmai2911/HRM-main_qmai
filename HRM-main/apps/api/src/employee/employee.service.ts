import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EmployeeService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.employee.findMany({
      include: {
        department: true,
        position: true,
        branch: true,
        contracts: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
      include: {
        department: true,
        position: true,
        branch: true,
        contracts: true,
        probationReviews: true,
        salaryProfiles: { orderBy: { effectiveFrom: 'desc' } },
      },
    });
    if (!employee) throw new NotFoundException('Employee not found');
    return employee;
  }

  async create(data: any) {
    try {
      // Find all DTS employee codes to get actual max number
      const dtsEmployees = await this.prisma.employee.findMany({
        where: { employeeCode: { startsWith: 'DTS' } },
        select: { employeeCode: true },
      });
      let maxNum = 0;
      for (const e of dtsEmployees) {
        const num = parseInt(e.employeeCode.replace('DTS', ''), 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
      const employeeCode = data.employeeCode || `DTS${String(maxNum + 1).padStart(4, '0')}`;
      const idNumber = data.idNumber || `CCCD_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

      let branchId = data.branchId;
      if (!branchId) {
        const b = await this.prisma.branch.findFirst();
        branchId = b?.id;
      }

      let departmentId = data.departmentId;
      if (!departmentId) {
        const d = await this.prisma.department.findFirst();
        departmentId = d?.id;
      }

      let positionId = data.positionId;
      if (!positionId) {
        const p = await this.prisma.position.findFirst();
        positionId = p?.id;
      }

      // Default password 'Dts@123'
      const bcrypt = require('bcryptjs');
      const passwordHash = await bcrypt.hash('Dts@123', 10);

      const shouldCreateUser = data.createUser !== false && !!data.workEmail;

      const employee = await this.prisma.employee.create({
        data: {
          employeeCode,
          fullName: data.fullName,
          dob: data.dob ? new Date(data.dob) : new Date(1995, 0, 1),
          gender: data.gender || 'MALE',
          idNumber,
          phone: data.phone || '',
          personalEmail: data.personalEmail,
          workEmail: data.workEmail,
          address: data.address,
          departmentId,
          positionId,
          branchId,
          level: data.level || 'FRESHER',
          workMode: data.workMode || 'ONSITE',
          joinDate: data.joinDate ? new Date(data.joinDate) : new Date(),
          status: data.status || 'ACTIVE',
          user: shouldCreateUser ? {
            create: {
              email: data.workEmail,
              passwordHash,
              role: data.role || 'EMPLOYEE',
              mustChangePassword: true,
            }
          } : undefined
        }
      });
      
      return employee;
    } catch (error: any) {
      if (error.code === 'P2002') {
        const target = error.meta?.target?.[0];
        if (target === 'workEmail' || target === 'email') {
          throw new BadRequestException('Email công ty đã tồn tại trong hệ thống. Vui lòng sử dụng email khác.');
        }
        if (target === 'idNumber') {
          throw new BadRequestException('Số CMND/CCCD đã tồn tại trong hệ thống.');
        }
        throw new BadRequestException('Dữ liệu đã tồn tại trong hệ thống (Trùng lặp).');
      }
      throw error;
    }
  }

  async update(id: string, data: any) {
    const emp = await this.prisma.employee.findUnique({
      where: { id },
      include: { user: true },
    });
    if (!emp) throw new NotFoundException('Employee not found');
    
    const updatedEmp = await this.prisma.employee.update({
      where: { id },
      data: {
        fullName: data.fullName,
        dob: data.dob ? new Date(data.dob) : undefined,
        gender: data.gender,
        idNumber: data.idNumber,
        phone: data.phone,
        personalEmail: data.personalEmail,
        workEmail: data.workEmail,
        address: data.address,
        departmentId: data.departmentId,
        positionId: data.positionId,
        branchId: data.branchId,
        level: data.level,
        workMode: data.workMode,
        joinDate: data.joinDate ? new Date(data.joinDate) : undefined,
        status: data.status,
      }
    });

    // Handle User account creation or update
    const bcrypt = require('bcryptjs');
    if (data.createUser && !emp.user) {
      const email = data.workEmail || emp.workEmail;
      const passwordHash = await bcrypt.hash('Dts@123', 10);
      await this.prisma.user.create({
        data: {
          email,
          passwordHash,
          role: data.role || 'EMPLOYEE',
          employeeId: id,
          mustChangePassword: true,
        },
      });
    } else if (emp.user) {
      const updateData: any = {};
      if (data.workEmail && data.workEmail !== emp.user.email) {
        updateData.email = data.workEmail;
      }
      if (data.role && data.role !== emp.user.role) {
        updateData.role = data.role;
      }
      if (Object.keys(updateData).length > 0) {
        await this.prisma.user.update({
          where: { id: emp.user.id },
          data: updateData,
        });
      }
    }

    return updatedEmp;
  }

  async remove(id: string) {
    const emp = await this.prisma.employee.findUnique({ where: { id } });
    if (!emp) throw new NotFoundException('Employee not found');

    const fallbackEmp = await this.prisma.employee.findFirst({
      where: { id: { not: id } },
      include: { user: true }
    });

    return this.prisma.$transaction(async (tx) => {
      // 1. Unlink managed departments
      await tx.department.updateMany({ where: { managerId: id }, data: { managerId: null } });

      // 2. Unlink subordinates
      await tx.employee.updateMany({ where: { managerId: id }, data: { managerId: null } });

      // 3. Unlink managed projects
      await tx.project.updateMany({ where: { managerId: id }, data: { managerId: null } });

      // 4. Candidate referrer
      await tx.candidate.updateMany({ where: { referrerEmployeeId: id }, data: { referrerEmployeeId: null } });

      // 5. Approvals on Leave & OT
      await tx.leaveRequest.updateMany({ where: { approverId: id }, data: { approverId: null } });
      await tx.overtimeRequest.updateMany({ where: { approverId: id }, data: { approverId: null } });

      // 6. Job Requisitions requested by this employee
      if (fallbackEmp) {
        await tx.jobRequisition.updateMany({ where: { requestedById: id }, data: { requestedById: fallbackEmp.id } });
      }

      // 7. Probation reviews where this employee is reviewer or approver
      await tx.probationReview.updateMany({ where: { approvedById: id }, data: { approvedById: null } });
      if (fallbackEmp) {
        await tx.probationReview.updateMany({ where: { reviewerId: id, employeeId: { not: id } }, data: { reviewerId: fallbackEmp.id } });
      }

      // 8. Performance reviews where this employee is reviewer
      if (fallbackEmp) {
        await tx.performanceReview.updateMany({ where: { reviewerId: id, employeeId: { not: id } }, data: { reviewerId: fallbackEmp.id } });
      }

      // 9. User relations
      const user = await tx.user.findUnique({ where: { employeeId: id } });
      if (user) {
        await tx.auditLog.updateMany({ where: { userId: user.id }, data: { userId: null } });
        if (fallbackEmp?.user) {
          await tx.interview.updateMany({ where: { interviewerId: user.id }, data: { interviewerId: fallbackEmp.user.id } });
          await tx.scorecard.updateMany({ where: { interviewerId: user.id }, data: { interviewerId: fallbackEmp.user.id } });
        }
        await tx.user.delete({ where: { id: user.id } });
      }

      // 10. Employee documents, history, dependents, salaryProfile
      await tx.employeeDocument.deleteMany({ where: { employeeId: id } });
      await tx.dependent.deleteMany({ where: { employeeId: id } });
      await tx.employeeHistory.deleteMany({ where: { employeeId: id } });
      await tx.salaryProfile.deleteMany({ where: { employeeId: id } });

      // 11. Probation reviews for this employee
      await tx.probationReview.deleteMany({ where: { employeeId: id } });

      // 12. Performance reviews for this employee
      await tx.performanceReview.deleteMany({ where: { employeeId: id } });

      // 13. Contracts (after probation review deleted since contract is referenced by probationReview)
      await tx.contract.deleteMany({ where: { employeeId: id } });

      // 14. Attendance & Leaves
      await tx.leaveBalance.deleteMany({ where: { employeeId: id } });
      await tx.leaveRequest.deleteMany({ where: { employeeId: id } });
      await tx.overtimeRequest.deleteMany({ where: { employeeId: id } });
      await tx.attendanceLog.deleteMany({ where: { employeeId: id } });

      // 15. Payslips & PayslipItems
      const payslipIds = (await tx.payslip.findMany({ where: { employeeId: id }, select: { id: true } })).map(p => p.id);
      if (payslipIds.length > 0) {
        await tx.payslipItem.deleteMany({ where: { payslipId: { in: payslipIds } } });
      }
      await tx.payslip.deleteMany({ where: { employeeId: id } });

      // 16. Finally delete employee
      return tx.employee.delete({ where: { id } });
    });
  }

  async addSalaryProfile(employeeId: string, data: any) {
    const emp = await this.prisma.employee.findUnique({ where: { id: employeeId } });
    if (!emp) throw new NotFoundException('Employee not found');

    const effectiveDate = data.effectiveFrom || data.effectiveDate;
    const parsedDate = effectiveDate ? new Date(effectiveDate) : new Date();
    const allowancesStr = data.allowances !== undefined
      ? (typeof data.allowances === 'string' ? data.allowances : JSON.stringify(data.allowances))
      : null;

    return this.prisma.salaryProfile.create({
      data: {
        employeeId,
        baseSalary: Number(data.baseSalary) || 0,
        allowances: allowancesStr,
        effectiveFrom: isNaN(parsedDate.getTime()) ? new Date() : parsedDate,
      }
    });
  }
}
