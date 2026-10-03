import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ContractService {
  constructor(private prisma: PrismaService) {}

  async onboard(data: any, currentUser: any) {
    const { applicationId, type, startDate, baseSalary, probationSalaryPercent, benefits } = data;

    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        candidate: true,
        requisition: {
          include: {
            department: true,
            position: true,
          },
        },
      },
    });

    if (!application) {
      throw new NotFoundException('Không tìm thấy hồ sơ ứng viên');
    }

    const { candidate, requisition } = application;

    // Determine branchId
    let branchId = requisition.department?.branchId;
    if (!branchId) {
      const defaultBranch = await this.prisma.branch.findFirst();
      branchId = defaultBranch?.id || '';
    }

    // Determine reviewer employee
    let reviewerId = currentUser?.employee?.id;
    if (!reviewerId) {
      const firstAdminEmployee = await this.prisma.employee.findFirst({
        where: { workEmail: 'admin@dts.com.vn' },
      });
      reviewerId = firstAdminEmployee?.id;
    }

    // Auto-generate employeeCode
    const countEmployees = await this.prisma.employee.count();
    const employeeCode = `DTS${String(countEmployees + 1).padStart(4, '0')}`;
    const idNumber = `0012${Date.now().toString().slice(-8)}`;

    const isDirectOfficial = type === 'DIRECT_OFFICIAL';
    const parsedStartDate = startDate ? new Date(startDate) : new Date();

    // Check if employee already exists by email
    let employee = await this.prisma.employee.findFirst({
      where: { workEmail: candidate.email },
    });

    if (!employee) {
      employee = await this.prisma.employee.create({
        data: {
          employeeCode,
          fullName: candidate.fullName,
          dob: new Date('1995-01-01'),
          gender: 'MALE',
          idNumber,
          phone: candidate.phone || '0900000000',
          workEmail: candidate.email,
          departmentId: requisition.departmentId,
          positionId: requisition.positionId,
          branchId,
          status: isDirectOfficial ? 'ACTIVE' : 'PROBATION',
          joinDate: parsedStartDate,
        },
      });
    } else {
      employee = await this.prisma.employee.update({
        where: { id: employee.id },
        data: {
          status: isDirectOfficial ? 'ACTIVE' : 'PROBATION',
          joinDate: parsedStartDate,
        },
      });
    }

    // Create Contract
    const endDate = isDirectOfficial
      ? new Date(parsedStartDate.getTime() + 365 * 24 * 60 * 60 * 1000)
      : new Date(parsedStartDate.getTime() + 60 * 24 * 60 * 60 * 1000);

    const contract = await this.prisma.contract.create({
      data: {
        employeeId: employee.id,
        type: isDirectOfficial ? 'DEFINITE_1Y' : 'PROBATION',
        startDate: parsedStartDate,
        endDate,
        baseSalary: Number(baseSalary || 15000000),
        probationSalaryPercent: isDirectOfficial ? 100 : Number(probationSalaryPercent || 85),
        status: 'ACTIVE',
      },
    });

    // If Probation, create initial review milestones structure
    if (!isDirectOfficial && reviewerId) {
      const initialMilestones = {
        week2: {
          status: 'PENDING',
          technicalScore: null,
          attitudeScore: null,
          comment: '',
          result: null,
          evaluatedAt: null,
        },
        week4: {
          status: 'PENDING',
          technicalScore: null,
          attitudeScore: null,
          comment: '',
          result: null,
          evaluatedAt: null,
        },
        week8: {
          status: 'PENDING',
          technicalScore: null,
          attitudeScore: null,
          comment: '',
          result: null,
          evaluatedAt: null,
        },
      };

      await this.prisma.probationReview.create({
        data: {
          employeeId: employee.id,
          contractId: contract.id,
          reviewerId,
          technicalScore: null,
          attitudeScore: null,
          result: 'IN_PROGRESS',
          comment: JSON.stringify(initialMilestones),
        },
      });
    }

    // Update application stage to HIRED
    await this.prisma.application.update({
      where: { id: applicationId },
      data: { stage: 'HIRED', result: 'HIRED' },
    });

    return {
      success: true,
      type,
      employee,
      contract,
    };
  }

  async getProbationList() {
    return this.prisma.contract.findMany({
      where: {
        type: 'PROBATION',
      },
      include: {
        employee: {
          include: {
            department: true,
            position: true,
            branch: true,
          },
        },
        probationReview: {
          include: {
            reviewer: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateProbationReview(contractId: string, data: any) {
    const { milestone, technicalScore, attitudeScore, comment, result } = data;

    const review = await this.prisma.probationReview.findUnique({
      where: { contractId },
    });

    if (!review) {
      throw new NotFoundException('Không tìm thấy bản ghi đánh giá thử việc');
    }

    let milestones: any = {};
    try {
      milestones = review.comment ? JSON.parse(review.comment) : {};
    } catch {
      milestones = {};
    }

    milestones[milestone] = {
      status: 'EVALUATED',
      technicalScore: Number(technicalScore),
      attitudeScore: Number(attitudeScore),
      comment: comment || '',
      result: result || 'PASS',
      evaluatedAt: new Date().toISOString(),
    };

    return this.prisma.probationReview.update({
      where: { contractId },
      data: {
        technicalScore: Number(technicalScore),
        attitudeScore: Number(attitudeScore),
        result: milestone === 'week8' ? result : review.result,
        comment: JSON.stringify(milestones),
      },
      include: {
        employee: {
          include: {
            department: true,
            position: true,
          },
        },
      },
    });
  }

  async decideProbation(contractId: string, data: any) {
    const { decision, officialSalary, reason } = data;

    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
      include: { employee: true },
    });

    if (!contract) {
      throw new NotFoundException('Không tìm thấy hợp đồng thử việc');
    }

    if (decision === 'ACCEPT') {
      // 1. Update employee status to ACTIVE
      await this.prisma.employee.update({
        where: { id: contract.employeeId },
        data: { status: 'ACTIVE' },
      });

      // 2. Mark probation contract as COMPLETED
      await this.prisma.contract.update({
        where: { id: contractId },
        data: { status: 'COMPLETED' },
      });

      // 3. Create Official Contract (1 year)
      const officialContract = await this.prisma.contract.create({
        data: {
          employeeId: contract.employeeId,
          type: 'DEFINITE_1Y',
          startDate: new Date(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          baseSalary: Number(officialSalary || contract.baseSalary),
          probationSalaryPercent: 100,
          status: 'ACTIVE',
        },
      });

      // 4. Update ProbationReview result
      await this.prisma.probationReview.update({
        where: { contractId },
        data: { result: 'PASS' },
      });

      return {
        success: true,
        decision: 'ACCEPT',
        officialContract,
      };
    } else {
      // Reject probation
      await this.prisma.employee.update({
        where: { id: contract.employeeId },
        data: { status: 'RESIGNED' },
      });

      await this.prisma.contract.update({
        where: { id: contractId },
        data: { status: 'TERMINATED' },
      });

      await this.prisma.probationReview.update({
        where: { contractId },
        data: { result: 'FAIL' },
      });

      return {
        success: true,
        decision: 'REJECT',
        reason,
      };
    }
  }

  async findAll() {
    return this.prisma.contract.findMany({
      include: {
        employee: {
          include: { department: true, position: true }
        }
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const contract = await this.prisma.contract.findUnique({
      where: { id },
      include: { employee: true },
    });
    if (!contract) throw new NotFoundException('Contract not found');
    return contract;
  }

  async create(data: any) {
    return this.prisma.contract.create({
      data: {
        employeeId: data.employeeId,
        type: data.type,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        baseSalary: Number(data.baseSalary),
        probationSalaryPercent: Number(data.probationSalaryPercent || 100),
        status: data.status || 'ACTIVE',
        fileUrl: data.fileUrl,
      }
    });
  }

  async update(id: string, data: any) {
    const contract = await this.prisma.contract.findUnique({ where: { id } });
    if (!contract) throw new NotFoundException('Contract not found');
    return this.prisma.contract.update({
      where: { id },
      data: {
        type: data.type,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        baseSalary: data.baseSalary ? Number(data.baseSalary) : undefined,
        probationSalaryPercent: data.probationSalaryPercent ? Number(data.probationSalaryPercent) : undefined,
        status: data.status,
        fileUrl: data.fileUrl,
      }
    });
  }

  async remove(id: string) {
    const contract = await this.prisma.contract.findUnique({ where: { id } });
    if (!contract) throw new NotFoundException('Contract not found');
    
    // Check if probation review exists before deleting
    const review = await this.prisma.probationReview.findUnique({ where: { contractId: id } });
    if (review) {
      await this.prisma.probationReview.delete({ where: { contractId: id } });
    }

    return this.prisma.contract.delete({ where: { id } });
  }
}
