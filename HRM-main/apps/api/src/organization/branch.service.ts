import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class BranchService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.branch.findMany({
      orderBy: { name: 'asc' }
    });
  }

  async create(data: any) {
    try {
      return await this.prisma.branch.create({
        data: {
          name: data.name,
          code: data.code,
          address: data.address,
          region: data.region,
          province: data.province,
          isActive: data.isActive ?? true,
        }
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new BadRequestException('Mã chi nhánh đã tồn tại trong hệ thống');
      }
      throw error;
    }
  }

  async update(id: string, data: any) {
    const branch = await this.prisma.branch.findUnique({ where: { id } });
    if (!branch) throw new NotFoundException('Branch not found');
    
    return this.prisma.branch.update({
      where: { id },
      data: {
        name: data.name,
        code: data.code,
        address: data.address,
        region: data.region,
        province: data.province,
        isActive: data.isActive !== undefined ? data.isActive : branch.isActive,
      }
    });
  }

  async remove(id: string) {
    const branch = await this.prisma.branch.findUnique({
      where: { id },
      include: {
        _count: {
          select: { departments: true, employees: true }
        }
      }
    });
    if (!branch) throw new NotFoundException('Branch not found');
    if (branch._count.departments > 0 || branch._count.employees > 0) {
      throw new BadRequestException('Không thể xóa chi nhánh vì vẫn còn phòng ban hoặc nhân viên liên kết.');
    }
    return this.prisma.branch.delete({ where: { id } });
  }
}
