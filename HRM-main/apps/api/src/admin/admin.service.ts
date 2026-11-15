import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        employeeId: true,
        createdAt: true,
        employee: {
          select: {
            id: true,
            fullName: true,
            employeeCode: true,
            workEmail: true,
            department: { select: { name: true } },
            position: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createUser(data: { email: string; password?: string; role: string; employeeId?: string; isActive?: boolean }) {
    const existing = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new BadRequestException('Email tài khoản này đã tồn tại');

    const pass = data.password || '123456';
    const passwordHash = await bcrypt.hash(pass, 10);

    return this.prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        role: data.role || 'EMPLOYEE',
        employeeId: data.employeeId || null,
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
      include: {
        employee: {
          select: { fullName: true, employeeCode: true }
        }
      }
    });
  }

  async updateUser(id: string, data: { role?: string; isActive?: boolean; employeeId?: string; email?: string }) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    return this.prisma.user.update({
      where: { id },
      data: {
        ...(data.role && { role: data.role }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.employeeId !== undefined && { employeeId: data.employeeId || null }),
      },
      include: {
        employee: {
          select: { fullName: true, employeeCode: true }
        }
      }
    });
  }

  async updateUserRole(id: string, role: string) {
    return this.updateUser(id, { role });
  }

  async resetPassword(id: string, password?: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    const pass = password || '123456';
    const passwordHash = await bcrypt.hash(pass, 10);

    return this.prisma.user.update({
      where: { id },
      data: { passwordHash },
      select: { id: true, email: true }
    });
  }

  async deleteUser(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    return this.prisma.user.delete({ where: { id } });
  }

  async getAuditLogs() {
    return this.prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { email: true, employee: { select: { fullName: true } } } }
      },
      take: 200,
    });
  }

  async getSystemConfigs() {
    return this.prisma.systemConfig.findMany({
      orderBy: { createdAt: 'desc' }
    });
  }

  async saveSystemConfig(data: any) {
    if (data.id) {
      return this.prisma.systemConfig.update({
        where: { id: data.id },
        data: {
          key: data.key,
          value: data.value,
          description: data.description,
          effectiveFrom: data.effectiveFrom ? new Date(data.effectiveFrom) : undefined,
        }
      });
    }

    const existing = await this.prisma.systemConfig.findFirst({
      where: { key: data.key },
      orderBy: { effectiveFrom: 'desc' }
    });

    if (existing) {
      return this.prisma.systemConfig.update({
        where: { id: existing.id },
        data: {
          value: data.value,
          description: data.description,
          effectiveFrom: data.effectiveFrom ? new Date(data.effectiveFrom) : existing.effectiveFrom,
        }
      });
    } else {
      return this.prisma.systemConfig.create({
        data: {
          key: data.key,
          value: data.value,
          description: data.description,
          effectiveFrom: data.effectiveFrom ? new Date(data.effectiveFrom) : new Date(),
        }
      });
    }
  }

  async deleteSystemConfig(id: string) {
    const config = await this.prisma.systemConfig.findUnique({ where: { id } });
    if (!config) throw new NotFoundException('Config not found');

    return this.prisma.systemConfig.delete({ where: { id } });
  }

  async getUserConfig(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        employee: {
          select: {
            fullName: true,
            employeeCode: true,
            department: { select: { id: true, name: true } },
            branch: { select: { id: true, name: true } },
          }
        }
      }
    });
    if (!user) throw new NotFoundException('User not found');

    const configKey = `USER_CONFIG_${id}`;
    const stored = await this.prisma.systemConfig.findFirst({
      where: { key: configKey },
      orderBy: { createdAt: 'desc' }
    });

    if (stored && stored.value) {
      try {
        const parsed = JSON.parse(stored.value);
        return {
          user,
          config: parsed,
          isCustom: true,
        };
      } catch {
        // fallback
      }
    }

    const defaultPermissions = this.getDefaultPermissionsForRole(user.role);
    return {
      user,
      config: {
        permissions: defaultPermissions,
        scopeType: user.role === 'ADMIN' ? 'ALL' : (user.role === 'MANAGER' ? 'DEPARTMENT' : 'ALL'),
        managedDepartmentIds: user.employee?.department?.id ? [user.employee.department.id] : [],
        scopeBranchType: 'ALL',
        managedBranchIds: user.employee?.branch?.id ? [user.employee.branch.id] : [],
        canViewCompanySalary: user.role === 'ADMIN' || user.role === 'HR_MANAGER' || user.role === 'MANAGER',
        canApprovePayroll: user.role === 'ADMIN' || user.role === 'HR_MANAGER',
        canExportReports: user.role !== 'EMPLOYEE',
        receiveEmailNotif: true,
        mustChangePassword: user.mustChangePassword,
        adminNotes: '',
      },
      isCustom: false,
    };
  }

  getDefaultPermissionsForRole(role: string): string[] {
    const all = [
      'employee:read', 'employee:create', 'employee:update', 'employee:delete', 'employee:export',
      'contract:read', 'contract:create', 'contract:update', 'contract:delete', 'contract:probation',
      'attendance:read', 'attendance:checkin', 'attendance:leave_request', 'attendance:leave_approve', 'attendance:ot_approve',
      'payroll:read', 'payroll:compute', 'payroll:approve', 'payroll:pay', 'payroll:export',
      'recruitment:read', 'recruitment:create', 'recruitment:approve', 'recruitment:pipeline', 'performance:review',
      'admin:users', 'admin:audit', 'admin:settings',
    ];

    if (role === 'ADMIN') return all;
    if (role === 'HR_MANAGER') {
      return [
        'employee:read', 'employee:create', 'employee:update', 'employee:export',
        'contract:read', 'contract:create', 'contract:update', 'contract:probation',
        'attendance:read', 'attendance:checkin', 'attendance:leave_request', 'attendance:leave_approve', 'attendance:ot_approve',
        'payroll:read', 'payroll:compute', 'payroll:approve', 'payroll:pay', 'payroll:export',
        'recruitment:read', 'recruitment:create', 'recruitment:approve', 'recruitment:pipeline', 'performance:review',
      ];
    }
    if (role === 'MANAGER') {
      return [
        'employee:read', 'attendance:read', 'attendance:checkin', 'attendance:leave_request', 'attendance:leave_approve', 'attendance:ot_approve',
        'payroll:read',
        'recruitment:read', 'recruitment:create', 'recruitment:approve', 'recruitment:pipeline', 'performance:review',
      ];
    }
    return [
      'employee:read_self', 'attendance:checkin', 'attendance:leave_request', 'payroll:read_self',
    ];
  }

  async updateUserConfig(id: string, configData: any) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    const configKey = `USER_CONFIG_${id}`;
    const valueStr = JSON.stringify(configData);

    const existing = await this.prisma.systemConfig.findFirst({
      where: { key: configKey },
      orderBy: { createdAt: 'desc' }
    });

    if (existing) {
      await this.prisma.systemConfig.update({
        where: { id: existing.id },
        data: { value: valueStr },
      });
    } else {
      await this.prisma.systemConfig.create({
        data: {
          key: configKey,
          value: valueStr,
          description: `Cấu hình chi tiết cho tài khoản: ${user.email}`,
          effectiveFrom: new Date(),
        },
      });
    }

    if (configData.isActive !== undefined || configData.mustChangePassword !== undefined || configData.role) {
      await this.prisma.user.update({
        where: { id },
        data: {
          ...(configData.isActive !== undefined && { isActive: configData.isActive }),
          ...(configData.mustChangePassword !== undefined && { mustChangePassword: configData.mustChangePassword }),
          ...(configData.role && { role: configData.role }),
        }
      });
    }

    return { success: true, message: 'Đã lưu cấu hình tài khoản thành công' };
  }
}
