import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { META_ROLES } from '../../decorators/rol-protected.decorator';

@Injectable()
export class UserRoleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector
  ) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const validRol: string[] = this.reflector.getAllAndOverride<string[]>(
      META_ROLES,
      [context.getHandler(), context.getClass()]
    );

    // If no roles specified, then access is allowed for any authenticated user
    if (!validRol || validRol.length === 0) return true;

    const req = context.switchToHttp().getRequest();
    const user = req.user as any;

    if (!user || !user.role) {
      throw new ForbiddenException('User authentication details not found');
    }

    // 1. ADMIN has complete system-wide access
    if (user.role === 'ADMIN') return true;

    // 2. HR - Kế toán (HR_MANAGER) has access to HR, staff, and accountant endpoints
    if (user.role === 'HR_MANAGER' && (
      validRol.includes('HR_MANAGER') || 
      validRol.includes('HR_STAFF') || 
      validRol.includes('ACCOUNTANT')
    )) {
      return true;
    }

    // 3. Quản lý (MANAGER) has access to manager and CEO approval endpoints
    if (user.role === 'MANAGER' && (
      validRol.includes('MANAGER') || 
      validRol.includes('CEO')
    )) {
      return true;
    }

    // 4. Exact role match
    if (validRol.includes(user.role)) return true;

    throw new ForbiddenException(`${user.email} is not authorized for this resource.`);
  }
}
