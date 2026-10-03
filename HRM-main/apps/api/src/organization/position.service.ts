import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class PositionService {
  constructor(private prisma: PrismaService) {}
  findAll() { return this.prisma.position.findMany({ orderBy: { name: "asc" }, include: { departments: { select: { id: true } } } }); }

  async create(data: any) {
    return this.prisma.position.create({
      data: {
        name: data.name,
        code: data.code,
        levelGroup: data.levelGroup,
        isActive: data.isActive !== undefined ? data.isActive : true,
        departments: data.departmentIds ? { connect: data.departmentIds.map((id: string) => ({ id })) } : undefined,
      }
    });
  }

  async update(id: string, data: any) {
    const position = await this.prisma.position.findUnique({ where: { id } });
    if (!position) throw new NotFoundException('Position not found');
    
    return this.prisma.position.update({
      where: { id },
      data: {
        name: data.name,
        code: data.code,
        levelGroup: data.levelGroup,
        isActive: data.isActive,
        departments: data.departmentIds ? { set: data.departmentIds.map((id: string) => ({ id })) } : undefined,
      }
    });
  }

  async remove(id: string) {
    const position = await this.prisma.position.findUnique({ where: { id } });
    if (!position) throw new NotFoundException('Position not found');
    
    return this.prisma.position.delete({ where: { id } });
  }
}