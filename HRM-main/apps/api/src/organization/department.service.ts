import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class DepartmentService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.department.findMany({
      orderBy: { name: 'asc' },
      include: {
        branch: true,
        parent: true,
        manager: true,
        _count: { select: { employees: true } },
      }
    });
  }

  async create(data: any) {
    try {
      let branchId = data.branchId;
      if (!branchId) {
        const firstBranch = await this.prisma.branch.findFirst();
        branchId = firstBranch?.id;
      }
      if (!branchId) {
        throw new BadRequestException('Chi nhánh không tồn tại');
      }

      return await this.prisma.department.create({
        data: {
          name: data.name,
          code: data.code,
          branchId,
          parentId: data.parentId || null,
          managerId: data.managerId || null,
          isActive: data.isActive ?? true,
        }
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new BadRequestException('Mã phòng ban đã tồn tại trong hệ thống');
      }
      throw error;
    }
  }

  async update(id: string, data: any) {
    const dept = await this.prisma.department.findUnique({ where: { id } });
    if (!dept) throw new NotFoundException('Department not found');
    
    return this.prisma.department.update({
      where: { id },
      data: {
        name: data.name,
        code: data.code,
        branchId: data.branchId || dept.branchId,
        parentId: data.parentId !== undefined ? (data.parentId || null) : dept.parentId,
        managerId: data.managerId !== undefined ? (data.managerId || null) : dept.managerId,
        isActive: data.isActive !== undefined ? data.isActive : dept.isActive,
      }
    });
  }

  async getAllDescendantDepartmentIds(deptId: string): Promise<string[]> {
    const result: string[] = [deptId];
    const queue = [deptId];
    while (queue.length > 0) {
      const currentId = queue.shift()!;
      const children = await this.prisma.department.findMany({
        where: { parentId: currentId },
        select: { id: true },
      });
      for (const child of children) {
        if (!result.includes(child.id)) {
          result.push(child.id);
          queue.push(child.id);
        }
      }
    }
    return result;
  }

  async getDeletionImpact(id: string) {
    const dept = await this.prisma.department.findUnique({
      where: { id },
      include: { children: true },
    });
    if (!dept) throw new NotFoundException('Phòng ban không tồn tại');

    const allDeptIds = await this.getAllDescendantDepartmentIds(id);
    const employees = await this.prisma.employee.findMany({
      where: { departmentId: { in: allDeptIds } },
      select: {
        id: true,
        fullName: true,
        employeeCode: true,
        department: { select: { id: true, name: true } },
      },
    });

    return {
      department: { id: dept.id, name: dept.name, code: dept.code },
      childrenCount: allDeptIds.length - 1,
      employeeCount: employees.length,
      employees,
    };
  }

  private async deleteEmployeeRelations(empId: string, allDeptIds: string[] = []) {
    const fallbackEmp = await this.prisma.employee.findFirst({
      where: { id: { notIn: [empId, ...allDeptIds] } },
      include: { user: true }
    });

    // 1. Unlink managed departments, projects, candidates, subordinates
    await this.prisma.department.updateMany({ where: { managerId: empId }, data: { managerId: null } });
    await this.prisma.employee.updateMany({ where: { managerId: empId }, data: { managerId: null } });
    await this.prisma.project.updateMany({ where: { managerId: empId }, data: { managerId: null } });
    await this.prisma.candidate.updateMany({ where: { referrerEmployeeId: empId }, data: { referrerEmployeeId: null } });

    // 2. Approvals
    await this.prisma.leaveRequest.updateMany({ where: { approverId: empId }, data: { approverId: null } });
    await this.prisma.overtimeRequest.updateMany({ where: { approverId: empId }, data: { approverId: null } });

    // 3. Job Requisitions
    if (fallbackEmp) {
      await this.prisma.jobRequisition.updateMany({ where: { requestedById: empId }, data: { requestedById: fallbackEmp.id } });
    }

    // 4. Probation reviews
    await this.prisma.probationReview.updateMany({ where: { approvedById: empId }, data: { approvedById: null } });
    if (fallbackEmp) {
      await this.prisma.probationReview.updateMany({ where: { reviewerId: empId, employeeId: { not: empId } }, data: { reviewerId: fallbackEmp.id } });
    }
    await this.prisma.probationReview.deleteMany({ where: { employeeId: empId } });

    // 5. Performance reviews
    if (fallbackEmp) {
      await this.prisma.performanceReview.updateMany({ where: { reviewerId: empId, employeeId: { not: empId } }, data: { reviewerId: fallbackEmp.id } });
    }
    await this.prisma.performanceReview.deleteMany({ where: { employeeId: empId } });

    // 6. User relations
    const user = await this.prisma.user.findUnique({ where: { employeeId: empId } });
    if (user) {
      await this.prisma.auditLog.updateMany({ where: { userId: user.id }, data: { userId: null } });
      const fallbackUser = await this.prisma.user.findFirst({ where: { id: { not: user.id } } });
      if (fallbackUser) {
        await this.prisma.interview.updateMany({ where: { interviewerId: user.id }, data: { interviewerId: fallbackUser.id } });
        await this.prisma.scorecard.updateMany({ where: { interviewerId: user.id }, data: { interviewerId: fallbackUser.id } });
      } else {
        await this.prisma.scorecard.deleteMany({ where: { interviewerId: user.id } });
        await this.prisma.interview.deleteMany({ where: { interviewerId: user.id } });
      }
      await this.prisma.user.delete({ where: { id: user.id } });
    }

    // 7. Documents, dependents, histories, salaryProfiles, kpis, contracts
    await this.prisma.employeeKpi.deleteMany({ where: { employeeId: empId } });
    await this.prisma.employeeDocument.deleteMany({ where: { employeeId: empId } });
    await this.prisma.dependent.deleteMany({ where: { employeeId: empId } });
    await this.prisma.employeeHistory.deleteMany({ where: { employeeId: empId } });
    await this.prisma.salaryProfile.deleteMany({ where: { employeeId: empId } });
    await this.prisma.contract.deleteMany({ where: { employeeId: empId } });

    // 8. Attendance & leaves & OT
    await this.prisma.leaveBalance.deleteMany({ where: { employeeId: empId } });
    await this.prisma.leaveRequest.deleteMany({ where: { employeeId: empId } });
    await this.prisma.overtimeRequest.deleteMany({ where: { employeeId: empId } });
    await this.prisma.attendanceLog.deleteMany({ where: { employeeId: empId } });

    // 9. Payslips
    const payslips = await this.prisma.payslip.findMany({ where: { employeeId: empId }, select: { id: true } });
    const pIds = payslips.map(p => p.id);
    if (pIds.length > 0) {
      await this.prisma.payslipItem.deleteMany({ where: { payslipId: { in: pIds } } });
      await this.prisma.payslip.deleteMany({ where: { employeeId: empId } });
    }

    // 10. Delete employee
    await this.prisma.employee.delete({ where: { id: empId } });
  }

  async remove(id: string, cascade: boolean = false) {
    const dept = await this.prisma.department.findUnique({ where: { id } });
    if (!dept) throw new NotFoundException('Phòng ban không tồn tại');

    const allDeptIds = await this.getAllDescendantDepartmentIds(id);
    const employees = await this.prisma.employee.findMany({
      where: { departmentId: { in: allDeptIds } },
      select: { id: true, fullName: true, employeeCode: true },
    });

    const childrenCount = allDeptIds.length - 1;
    const employeeCount = employees.length;

    if (!cascade && (childrenCount > 0 || employeeCount > 0)) {
      throw new BadRequestException({
        code: 'HAS_RELATIONS',
        departmentName: dept.name,
        childrenCount,
        employeeCount,
        message: `Phòng ban "${dept.name}" hiện có ${employeeCount} nhân viên và ${childrenCount} phòng ban trực thuộc. Nếu xóa phòng ban này thì nhân viên thuộc phòng ban sẽ bị mất.`,
      });
    }

    if (cascade) {
      // 1. Delete all employees in all descendant departments
      for (const emp of employees) {
        await this.deleteEmployeeRelations(emp.id, allDeptIds);
      }

      // 2. Re-assign or delete job requisitions
      const fallbackDept = await this.prisma.department.findFirst({
        where: { id: { notIn: allDeptIds } },
      });
      if (fallbackDept) {
        await this.prisma.jobRequisition.updateMany({
          where: { departmentId: { in: allDeptIds } },
          data: { departmentId: fallbackDept.id },
        });
      } else {
        const reqs = await this.prisma.jobRequisition.findMany({
          where: { departmentId: { in: allDeptIds } },
          select: { id: true },
        });
        const rIds = reqs.map(r => r.id);
        if (rIds.length > 0) {
          await this.prisma.recruitmentCost.deleteMany({ where: { requisitionId: { in: rIds } } });
          await this.prisma.application.deleteMany({ where: { requisitionId: { in: rIds } } });
          await this.prisma.jobRequisition.deleteMany({ where: { id: { in: rIds } } });
        }
      }

      // 3. Clear managerId and parentId of these departments
      await this.prisma.department.updateMany({
        where: { id: { in: allDeptIds } },
        data: { managerId: null, parentId: null },
      });

      // 4. Delete child departments (everything except root)
      const childIds = allDeptIds.filter(dId => dId !== id);
      for (const childId of childIds) {
        await this.prisma.department.delete({ where: { id: childId } });
      }

      // 5. Delete root department
      await this.prisma.department.delete({ where: { id } });

      return {
        success: true,
        message: `Đã xóa phòng ban "${dept.name}", ${childrenCount} phòng ban trực thuộc và ${employeeCount} nhân sự.`,
        deletedDepartments: allDeptIds.length,
        deletedEmployees: employeeCount,
      };
    }

    // Direct deletion if no relations
    return this.prisma.department.delete({ where: { id } });
  }
}
