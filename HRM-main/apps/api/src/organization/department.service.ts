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

  async remove(id: string) {
    const dept = await this.prisma.department.findUnique({
      where: { id },
      include: {
        _count: {
          select: { children: true, employees: true }
        }
      }
    });
    if (!dept) throw new NotFoundException('Department not found');
    if (dept._count.children > 0 || dept._count.employees > 0) {
      throw new BadRequestException('Không thể xóa phòng ban vì vẫn còn phòng ban trực thuộc hoặc nhân viên.');
    }
    return this.prisma.department.delete({ where: { id } });
  }
}
