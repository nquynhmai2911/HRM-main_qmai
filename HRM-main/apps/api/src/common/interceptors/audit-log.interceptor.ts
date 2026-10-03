import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const method = req.method;
    const url = req.originalUrl;
    
    // Only log mutating requests
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      const user = req.user; // Set by AuthGuard
      const ip = req.ip || req.connection?.remoteAddress || '';
      const body = req.body;
      
      return next.handle().pipe(
        tap(async (resData) => {
          try {
            // Determine resource type from URL (basic parsing)
            const parts = url.split('/').filter(Boolean);
            const resource = parts[0] === 'api' ? parts[1] : parts[0]; 
            
            // For POST/create, the new value is typically the response data
            // For PUT/PATCH, we'd need old value, but we can just log the body as newValue
            let action = 'CREATE';
            if (method === 'PUT' || method === 'PATCH') action = 'UPDATE';
            if (method === 'DELETE') action = 'DELETE';

            await this.prisma.auditLog.create({
              data: {
                action,
                resource: resource || 'unknown',
                oldValue: null, 
                newValue: JSON.stringify(body || resData || {}),
                userId: user?.id || null,
                ip: ip,
              }
            });
          } catch (e) {
            console.error('Failed to log audit:', e);
          }
        }),
      );
    }
    
    return next.handle();
  }
}
