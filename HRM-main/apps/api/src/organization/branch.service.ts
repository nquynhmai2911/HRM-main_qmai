import { Injectable } from "@nestjs/common";
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
    return this.prisma.branch.create({
      data: {
        name: data.name,
        code: data.code,
        address: data.address,
        region: data.region,
        province: data.province,
        isActive: data.isActive ?? true,
      }
    });
  }

  async update(id: string, data: any) {
    const branch = await this.prisma.branch.findUnique({ where: { id } });
    if (!branch) throw new Error('Branch not found');
    
    return this.prisma.branch.update({
      where: { id },
      data: {
        name: data.name,
        code: data.code,
        address: data.address,
        region: data.region,
        province: data.province,
        isActive: data.isActive,
      }
    });
  }

  async remove(id: string) {
    const branch = await this.prisma.branch.findUnique({ where: { id } });
    if (!branch) throw new Error('Branch not found');
    
    return this.prisma.branch.delete({ where: { id } });
  }
}
