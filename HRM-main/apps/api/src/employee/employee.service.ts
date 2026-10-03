import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EmployeeService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.employee.findMany({
      include: {
        department: true,
        position: true,
        branch: true,
        contracts: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
      include: {
        department: true,
        position: true,
        branch: true,
        contracts: true,
        probationReviews: true,
        salaryProfiles: { orderBy: { effectiveFrom: 'desc' } },
      },
    });
    if (!employee) throw new NotFoundException('Employee not found');
    return employee;
  }

  async create(data: any) {
    try {
      // Find the employee with the highest employeeCode
      const lastEmployee = await this.prisma.employee.findFirst({
        orderBy: { employeeCode: 'desc' },
      });
      
      let nextNumber = 1;
      if (lastEmployee && lastEmployee.employeeCode.startsWith('DTS')) {
        const lastNumber = parseInt(lastEmployee.employeeCode.replace('DTS', ''), 10);
        if (!isNaN(lastNumber)) {
          nextNumber = lastNumber + 1;
        }
      }
      
      const employeeCode = `DTS${String(nextNumber).padStart(4, '0')}`;
      
      // Default password 'Dts@123'
      const bcrypt = require('bcryptjs');
      const passwordHash = await bcrypt.hash('Dts@123', 10);

      const employee = await this.prisma.employee.create({
        data: {
          employeeCode,
          fullName: data.fullName,
          dob: data.dob ? new Date(data.dob) : new Date(),
          gender: data.gender || 'MALE',
          idNumber: data.idNumber,
          phone: data.phone || '',
          personalEmail: data.personalEmail,
          workEmail: data.workEmail,
          address: data.address,
          departmentId: data.departmentId,
          positionId: data.positionId,
          branchId: data.branchId,
          level: data.level || 'FRESHER',
          workMode: data.workMode || 'ONSITE',
          joinDate: data.joinDate ? new Date(data.joinDate) : new Date(),
          status: data.status || 'ACTIVE',
          user: data.createUser ? {
            create: {
              email: data.workEmail,
              passwordHash,
              role: data.role || 'EMPLOYEE',
              mustChangePassword: true,
            }
          } : undefined
        }
      });
      
      return employee;
    } catch (error: any) {
      if (error.code === 'P2002') {
        const target = error.meta?.target?.[0];
        if (target === 'workEmail' || target === 'email') {
          throw new BadRequestException('Email công ty đã tồn tại trong hệ thống. Vui lòng sử dụng email khác.');
        }
        if (target === 'idNumber') {
          throw new BadRequestException('Số CMND/CCCD đã tồn tại trong hệ thống.');
        }
        throw new BadRequestException('Dữ liệu đã tồn tại trong hệ thống (Trùng lặp).');
      }
      throw error;
    }
  }

  async update(id: string, data: any) {
    const emp = await this.prisma.employee.findUnique({ where: { id } });
    if (!emp) throw new NotFoundException('Employee not found');
    
    return this.prisma.employee.update({
      where: { id },
      data: {
        fullName: data.fullName,
        dob: data.dob ? new Date(data.dob) : undefined,
        gender: data.gender,
        idNumber: data.idNumber,
        phone: data.phone,
        personalEmail: data.personalEmail,
        workEmail: data.workEmail,
        address: data.address,
        departmentId: data.departmentId,
        positionId: data.positionId,
        branchId: data.branchId,
        level: data.level,
        workMode: data.workMode,
        joinDate: data.joinDate ? new Date(data.joinDate) : undefined,
        status: data.status,
      }
    });
  }

  async remove(id: string) {
    const emp = await this.prisma.employee.findUnique({ where: { id } });
    if (!emp) throw new NotFoundException('Employee not found');
    return this.prisma.employee.delete({ where: { id } });
  }

  async addSalaryProfile(employeeId: string, data: any) {
    const emp = await this.prisma.employee.findUnique({ where: { id: employeeId } });
    if (!emp) throw new NotFoundException('Employee not found');
    
    return this.prisma.salaryProfile.create({
      data: {
        employeeId,
        baseSalary: data.baseSalary,
        allowances: data.allowances,
        effectiveFrom: new Date(data.effectiveFrom),
      }
    });
  }
}
