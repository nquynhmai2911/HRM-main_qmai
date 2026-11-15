import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRequisitionDto } from './dto/create-requisition.dto';

@Injectable()
export class RequisitionService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateRequisitionDto) {
    // Determine who is requesting
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { employee: true },
    });

    let requesterEmployeeId = user?.employee?.id;
    if (!requesterEmployeeId) {
      const firstEmp = await this.prisma.employee.findFirst();
      requesterEmployeeId = firstEmp?.id;
    }

    // Auto-generate code e.g. REQ-2026-001
    const count = await this.prisma.jobRequisition.count();
    const code = `REQ-${new Date().getFullYear()}-${(count + 1).toString().padStart(3, '0')}`;

    return this.prisma.jobRequisition.create({
      data: {
        code,
        title: dto.title,
        departmentId: dto.departmentId,
        positionId: dto.positionId || (await this.prisma.position.findFirst())?.id || '',
        level: dto.level,
        quantity: dto.quantity,
        reason: dto.reason,
        salaryMin: dto.salaryMin,
        salaryMax: dto.salaryMax,
        requiredSkills: dto.requiredSkills,
        minExperienceYears: dto.minExperienceYears,
        description: dto.description,
        targetDate: dto.targetDate ? new Date(dto.targetDate) : null,
        requestedById: requesterEmployeeId,
        status: 'DRAFT',
      },
    });
  }

  async findAll(departmentId?: string, search?: string) {
    const where: any = {};
    if (departmentId) where.departmentId = departmentId;
    if (search) {
      where.OR = [
        { code: { contains: search } },
        { title: { contains: search } }
      ];
    }
    return this.prisma.jobRequisition.findMany({
      where,
      include: {
        department: true,
        position: true,
        requestedBy: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const req = await this.prisma.jobRequisition.findUnique({
      where: { id },
      include: {
        department: true,
        position: true,
        requestedBy: true,
      },
    });
    if (!req) throw new NotFoundException('Requisition not found');
    return req;
  }

  async update(id: string, dto: any) {
    return this.prisma.jobRequisition.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    return this.prisma.jobRequisition.delete({
      where: { id },
    });
  }

  async submit(id: string) {
    return this.prisma.jobRequisition.update({
      where: { id },
      data: { status: 'PENDING_HR_APPROVAL' },
    });
  }

  async processApproval(id: string, action: string, data: any, userId: string) {
    const req = await this.findOne(id);
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    
    if (action === 'REJECT') {
      return this.prisma.jobRequisition.update({
        where: { id },
        data: { 
          status: 'REJECTED', 
          approvalComment: data.comment,
          rejectReason: data.comment,
        }
      });
    }

    if (action === 'REVISE') {
      return this.prisma.jobRequisition.update({
        where: { id },
        data: { 
          status: 'NEEDS_REVISION', 
          approvalComment: data.comment,
        }
      });
    }

    if (action === 'APPROVE') {
      let nextStatus = 'APPROVED';
      const updateData: any = {
        approvalComment: data.comment,
        salaryMin: data.salaryMin ?? req.salaryMin,
        salaryMax: data.salaryMax ?? req.salaryMax,
      };

      const isAdmin = user?.role === 'ADMIN' || user?.role === 'CEO';

      if (req.status === 'PENDING_HR_APPROVAL' && !isAdmin) {
        nextStatus = 'PENDING_CEO_APPROVAL';
        updateData.hrApprovedAt = new Date();
      } else {
        nextStatus = 'APPROVED';
        updateData.ceoApprovedAt = new Date();
        updateData.approvedAt = new Date();
      }

      updateData.status = nextStatus;

      return this.prisma.jobRequisition.update({
        where: { id },
        data: updateData,
      });
    }
    
    throw new BadRequestException('Invalid action');
  }

  async publish(id: string) {
    const req = await this.findOne(id);
    if (req.status === 'OPEN') {
      return req;
    }
    return this.prisma.jobRequisition.update({
      where: { id },
      data: { status: 'OPEN' },
    });
  }
}
