import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { JwtPayload } from '../interfaces/jwt-payload.interface';

import { PrismaService } from 'src/prisma/prisma.service';
import { EnvironmentVariables } from '@/common/config/env.config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private prisma: PrismaService,
    private readonly configService: ConfigService<EnvironmentVariables>
  ) {
    super({
      secretOrKey: configService.get('JWT_SECRET') || '',
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    });
  }

  async validate(payload: JwtPayload): Promise<any> {
    const { id } = payload;

    try {
      const user = await this.prisma.user.findUniqueOrThrow({
        where: { id },
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
      
      if (!user.isActive) {
        throw new UnauthorizedException('User is disabled');
      }
      
      const rolePermissions = await this.prisma.rolePermission.findMany({
        where: { role: user.role },
        include: { permission: true },
      });

      const permissions = rolePermissions.map(
        (rp) => `${rp.permission.resource}:${rp.permission.action}`
      );

      return {
        id: user.id,
        email: user.email,
        role: user.role,
        permissions,
        employee: user.employee,
      };
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
