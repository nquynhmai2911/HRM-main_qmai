import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PerformanceService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.performanceReview.findMany({
      include: {
        employee: { select: { fullName: true, employeeCode: true, department: { select: { name: true } } } },
        reviewer: { select: { fullName: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async create(data: any) {
    const totalScore = ((data.kpiScore || 0) + (data.skillsScore || 0) + (data.attitudeScore || 0)) / 3;
    let result = 'AVERAGE';
    if (totalScore >= 90) result = 'EXCELLENT';
    else if (totalScore >= 75) result = 'GOOD';
    else if (totalScore < 50) result = 'POOR';

    return this.prisma.performanceReview.create({
      data: {
        employeeId: data.employeeId,
        reviewerId: data.reviewerId,
        period: data.period,
        kpiScore: data.kpiScore,
        skillsScore: data.skillsScore,
        attitudeScore: data.attitudeScore,
        totalScore,
        result,
        comment: data.comment,
        status: data.status || 'DRAFT',
      }
    });
  }

  async update(id: string, data: any) {
    const totalScore = ((data.kpiScore || 0) + (data.skillsScore || 0) + (data.attitudeScore || 0)) / 3;
    let result = 'AVERAGE';
    if (totalScore >= 90) result = 'EXCELLENT';
    else if (totalScore >= 75) result = 'GOOD';
    else if (totalScore < 50) result = 'POOR';

    return this.prisma.performanceReview.update({
      where: { id },
      data: {
        kpiScore: data.kpiScore,
        skillsScore: data.skillsScore,
        attitudeScore: data.attitudeScore,
        totalScore,
        result,
        comment: data.comment,
        status: data.status,
      }
    });
  }

  remove(id: string) {
    return this.prisma.performanceReview.delete({ where: { id } });
  }
}
