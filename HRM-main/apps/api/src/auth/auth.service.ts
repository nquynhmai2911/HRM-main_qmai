import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { LoginUserDto } from './dto/login-user.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger('AuthService');

  constructor(
    private prisma: PrismaService,
    private readonly jwtService: JwtService
  ) {}

  async loginUser(dto: LoginUserDto) {
    this.logger.log(`POST: auth/login: Login iniciado: ${dto.email}`);
    const { email, password } = dto;

    try {
      const user = await this.prisma.user.findUnique({
        where: { email },
        include: {
          employee: {
            select: {
              id: true,
              employeeCode: true,
              fullName: true,
              avatarUrl: true,
              departmentId: true,
            },
          },
        },
      });

      if (!user) {
        throw new BadRequestException('Wrong credentials');
      }

      if (!user.isActive) {
        throw new BadRequestException('Account is disabled');
      }

      if (user.lockedUntil && user.lockedUntil > new Date()) {
        throw new BadRequestException('Account is temporarily locked. Please try again later.');
      }

      const passwordMatch = await bcrypt.compare(password, user.passwordHash);

      if (!passwordMatch) {
        await this.prisma.user.update({
          where: { id: user.id },
          data: {
            failedLoginCount: { increment: 1 },
            lockedUntil:
              user.failedLoginCount + 1 >= 5
                ? new Date(Date.now() + 15 * 60 * 1000) // lock 15 mins
                : null,
          },
        });
        throw new BadRequestException('Wrong credentials');
      }

      // Reset failed login count on success
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginCount: 0,
          lockedUntil: null,
          lastLoginAt: new Date(),
        },
      });

      // Get permissions
      const rolePermissions = await this.prisma.rolePermission.findMany({
        where: { role: user.role },
        include: { permission: true },
      });

      const permissions = rolePermissions.map(
        (rp) => `${rp.permission.resource}:${rp.permission.action}`
      );

      const userInfo = {
        id: user.id,
        email: user.email,
        role: user.role,
        permissions,
        employee: user.employee,
      };

      const payload = { id: user.id };
      const accessToken = this.jwtService.sign(payload);
      
      // For refresh token, we use a separate strategy/secret usually, but we keep it simple here
      const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

      // Save refresh token to db
      await this.prisma.user.update({
        where: { id: user.id },
        data: { refreshToken },
      });

      return {
        user: userInfo,
        accessToken,
        refreshToken,
        mustChangePassword: user.mustChangePassword,
      };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error(`POST: auth/login: error: ${error}`);
      throw new InternalServerErrorException('Server error');
    }
  }

  async refreshWithToken(token: string) {
    if (!token) {
      throw new UnauthorizedException('Refresh token is required');
    }
    try {
      const decoded: any = this.jwtService.verify(token);
      const user = await this.prisma.user.findUnique({
        where: { id: decoded.id },
      });
      if (!user || !user.isActive) {
        throw new UnauthorizedException('User not found or inactive');
      }

      const payload = { id: user.id };
      const accessToken = this.jwtService.sign(payload);
      const refreshToken = this.jwtService.sign(payload, { expiresIn: '30d' });

      await this.prisma.user.update({
        where: { id: user.id },
        data: { refreshToken },
      });

      return {
        accessToken,
        refreshToken,
      };
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async refreshToken(user: any) {
    const payload = { id: user.id };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '30d' });

    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    });

    return {
      accessToken,
      refreshToken,
    };
  }
  
  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
    return { success: true };
  }
}
