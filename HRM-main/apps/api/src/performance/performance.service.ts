import { Injectable, NotFoundException } from '@nestjs/common';
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
    const kpiScore = Number(data.kpiScore || 0);
    const skillsScore = Number(data.skillsScore || 0);
    const attitudeScore = Number(data.attitudeScore || 0);
    const totalScore = Math.round(((kpiScore + skillsScore + attitudeScore) / 3) * 10) / 10;
    
    let result = 'AVERAGE';
    if (totalScore >= 90) result = 'EXCELLENT';
    else if (totalScore >= 75) result = 'GOOD';
    else if (totalScore < 50) result = 'POOR';

    return this.prisma.performanceReview.create({
      data: {
        employeeId: data.employeeId,
        reviewerId: data.reviewerId,
        period: data.period || '2026',
        kpiScore,
        skillsScore,
        attitudeScore,
        totalScore,
        result: data.result || result,
        comment: data.comment || data.feedback || '',
        status: data.status || 'DRAFT',
      }
    });
  }

  async update(id: string, data: any) {
    const review = await this.prisma.performanceReview.findUnique({ where: { id } });
    if (!review) throw new NotFoundException('Performance review not found');

    const kpiScore = data.kpiScore !== undefined ? Number(data.kpiScore) : (review.kpiScore || 0);
    const skillsScore = data.skillsScore !== undefined ? Number(data.skillsScore) : (review.skillsScore || 0);
    const attitudeScore = data.attitudeScore !== undefined ? Number(data.attitudeScore) : (review.attitudeScore || 0);
    const totalScore = Math.round(((kpiScore + skillsScore + attitudeScore) / 3) * 10) / 10;

    let result = 'AVERAGE';
    if (totalScore >= 90) result = 'EXCELLENT';
    else if (totalScore >= 75) result = 'GOOD';
    else if (totalScore < 50) result = 'POOR';

    return this.prisma.performanceReview.update({
      where: { id },
      data: {
        kpiScore,
        skillsScore,
        attitudeScore,
        totalScore,
        result: data.result || result,
        comment: data.comment !== undefined ? data.comment : review.comment,
        status: data.status !== undefined ? data.status : review.status,
      }
    });
  }

  async remove(id: string) {
    const review = await this.prisma.performanceReview.findUnique({ where: { id } });
    if (!review) throw new NotFoundException('Performance review not found');
    return this.prisma.performanceReview.delete({ where: { id } });
  }
}
