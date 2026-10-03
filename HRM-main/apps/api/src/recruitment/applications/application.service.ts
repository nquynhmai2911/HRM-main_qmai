import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ApplicationService {
  constructor(private prisma: PrismaService) {}

  async findAll(requisitionId?: string) {
    const where: any = {};
    if (requisitionId) {
      where.requisitionId = requisitionId;
    }

    return this.prisma.application.findMany({
      where,
      include: {
        candidate: true,
        interviews: true,
        offer: true,
        requisition: {
          include: {
            department: true,
            position: true,
          },
        },
      },
      orderBy: { appliedAt: 'desc' },
    });
  }

  async create(data: any) {
    const { requisitionId, fullName, email, phone, cvUrl, source, skills, yearsExperience } = data;
    
    if (!requisitionId) {
      throw new BadRequestException('Mã yêu cầu tuyển dụng là bắt buộc');
    }
    if (!email) {
      throw new BadRequestException('Email ứng viên là bắt buộc');
    }

    const requisition = await this.prisma.jobRequisition.findUnique({
      where: { id: requisitionId },
    });
    if (!requisition) {
      throw new NotFoundException('Không tìm thấy yêu cầu tuyển dụng này');
    }

    // Check if candidate exists by email, else create
    let candidate = await this.prisma.candidate.findFirst({ where: { email } });
    const expNum = yearsExperience !== undefined && yearsExperience !== null && yearsExperience !== '' ? Number(yearsExperience) : null;

    if (!candidate) {
      candidate = await this.prisma.candidate.create({
        data: {
          fullName,
          email,
          phone,
          cvUrl: cvUrl || 'cv_default.pdf',
          source: source || 'OTHER',
          skills,
          yearsExperience: expNum,
        },
      });
    } else {
      // Update candidate with latest contact & skill details
      candidate = await this.prisma.candidate.update({
        where: { id: candidate.id },
        data: {
          fullName: fullName || candidate.fullName,
          phone: phone || candidate.phone,
          skills: skills || candidate.skills,
          cvUrl: cvUrl || candidate.cvUrl,
          yearsExperience: expNum !== null ? expNum : candidate.yearsExperience,
        },
      });
    }

    // Check if application already exists for this candidate & requisition
    const existingApp = await this.prisma.application.findUnique({
      where: {
        candidateId_requisitionId: {
          candidateId: candidate.id,
          requisitionId,
        },
      },
    });

    if (existingApp) {
      throw new BadRequestException(`Ứng viên (${email}) đã có hồ sơ trong vị trí tuyển dụng này rồi!`);
    }

    return this.prisma.application.create({
      data: {
        requisitionId,
        candidateId: candidate.id,
        stage: 'NEW',
      },
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
  }

  async updateStage(id: string, data: any) {
    const { stage, interviewDate, interviewFormat, meetingLink, note, finalSalary, onboardingDate, offerNote, rejectReason } = data;
    const application = await this.prisma.application.findUnique({ where: { id } });
    if (!application) throw new NotFoundException('Không tìm thấy hồ sơ ứng viên');

    if (note) {
      await this.prisma.candidate.update({
        where: { id: application.candidateId },
        data: { note },
      });
    }

    if (stage === 'OFFER' || stage === 'HIRED') {
      const salaryNum = finalSalary ? Number(finalSalary) : 0;
      const startDateVal = onboardingDate ? new Date(onboardingDate) : new Date();

      await this.prisma.offer.upsert({
        where: { applicationId: id },
        create: {
          applicationId: id,
          salary: salaryNum,
          startDate: startDateVal,
          status: stage === 'HIRED' ? 'ACCEPTED' : 'SENT',
          note: offerNote || note || '',
        },
        update: {
          salary: finalSalary ? salaryNum : undefined,
          startDate: onboardingDate ? startDateVal : undefined,
          status: stage === 'HIRED' ? 'ACCEPTED' : 'SENT',
          note: offerNote || note || undefined,
        },
      });
    }

    return this.prisma.application.update({
      where: { id },
      data: {
        stage,
        result: stage === 'HIRED' ? 'HIRED' : stage === 'REJECTED' ? 'REJECTED' : undefined,
      },
      include: {
        candidate: true,
        offer: true,
      },
    });
  }

  async updateBenefits(id: string, data: any) {
    const application = await this.prisma.application.findUnique({ where: { id } });
    if (!application) throw new NotFoundException('Không tìm thấy hồ sơ ứng viên');

    const { salary, probationSalaryPercent, insurancePackage, allowances, note } = data;

    const allowanceMap: Record<string, string> = {
      LUNCH: 'Phụ cấp cơm trưa (1.000.000đ/tháng)',
      PARKING: 'Miễn phí gửi xe tòa nhà văn phòng',
      LAPTOP: 'Cấp Macbook Pro M-Series / ThinkPad X1',
      SIGN_ON: 'Thưởng gia nhập (Sign-on Bonus 10.000.000đ)',
      REMOTE: 'Linh hoạt làm việc (Hybrid Remote 2 ngày/tuần)',
      CERT: 'Hỗ trợ 100% lệ phí thi chứng chỉ quốc tế',
    };

    const readableAllowances = Array.isArray(allowances)
      ? allowances.map((a: string) => allowanceMap[a] || a).join('; ')
      : '';

    const insuranceMap: Record<string, string> = {
      FULL_100: 'Đóng full 100% trên tổng lương thực nhận',
      STATUTORY: 'Đóng BHXH theo mức lương cơ bản quy định nhà nước',
      PREMIUM_PVI: 'Bảo hiểm sức khỏe cao cấp PVI Care (Nội & ngoại trú)',
    };
    const readableInsurance = insurancePackage ? (insuranceMap[insurancePackage] || insurancePackage) : '';

    const benefitsText = [
      `[ĐIỀU CHỈNH QUYỀN LỢI & ƯU ĐÃI]`,
      salary ? `- Mức lương thỏa thuận / Offer: ${Number(salary).toLocaleString()} VNĐ` : '',
      probationSalaryPercent ? `- Tỷ lệ lương thử việc: ${probationSalaryPercent}%` : '',
      readableInsurance ? `- Gói Bảo hiểm: ${readableInsurance}` : '',
      readableAllowances ? `- Chế độ đãi ngộ & Phụ cấp: ${readableAllowances}` : '',
      note ? `- Ghi chú riêng: ${note}` : '',
    ].filter(Boolean).join('\n');

    await this.prisma.candidate.update({
      where: { id: application.candidateId },
      data: { note: benefitsText },
    });

    const salaryNum = salary ? Number(salary) : 0;
    await this.prisma.offer.upsert({
      where: { applicationId: id },
      create: {
        applicationId: id,
        salary: salaryNum,
        startDate: new Date(),
        status: 'DRAFT',
        note: benefitsText,
      },
      update: {
        salary: salaryNum > 0 ? salaryNum : undefined,
        note: benefitsText,
      },
    });

    return this.prisma.application.findUnique({
      where: { id },
      include: {
        candidate: true,
        offer: true,
        requisition: {
          include: {
            department: true,
            position: true,
          },
        },
      },
    });
  }
}


