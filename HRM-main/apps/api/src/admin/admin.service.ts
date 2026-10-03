import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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
        employee: {
          select: {
            fullName: true,
            employeeCode: true,
          },
        },
      },
    });
  }

  async updateUserRole(id: string, role: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    
    return this.prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        email: true,
        role: true,
      }
    });
  }

  async getAuditLogs() {
    return this.prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { email: true, employee: { select: { fullName: true } } } }
      },
      take: 200, // limit to latest 200 for performance
    });
  }

  async getSystemConfigs() {
    return this.prisma.systemConfig.findMany({
      orderBy: { createdAt: 'desc' }
    });
  }

  async saveSystemConfig(data: any) {
    // If it exists, create a new history record or update? 
    // Since unique is [key, effectiveFrom], we can just create a new one with now() if we want history, 
    // or just upsert based on key. For simplicity let's just find first and update, or create.
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
}
