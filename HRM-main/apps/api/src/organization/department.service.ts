import { Injectable } from "@nestjs/common";
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
    return this.prisma.department.create({
      data: {
        name: data.name,
        code: data.code,
        branchId: data.branchId,
        parentId: data.parentId || null,
        managerId: data.managerId || null,
        isActive: data.isActive ?? true,
      }
    });
  }

  async update(id: string, data: any) {
    const dept = await this.prisma.department.findUnique({ where: { id } });
    if (!dept) throw new Error('Department not found');
    
    return this.prisma.department.update({
      where: { id },
      data: {
        name: data.name,
        code: data.code,
        branchId: data.branchId,
        parentId: data.parentId || null,
        managerId: data.managerId || null,
        isActive: data.isActive,
      }
    });
  }

  async remove(id: string) {
    const dept = await this.prisma.department.findUnique({ where: { id } });
    if (!dept) throw new Error('Department not found');
    
    return this.prisma.department.delete({ where: { id } });
  }
}