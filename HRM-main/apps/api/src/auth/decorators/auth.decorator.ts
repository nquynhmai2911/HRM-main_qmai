import { UseGuards, applyDecorators } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { RolProtected } from './rol-protected.decorator';
import { UserRoleGuard } from '../guards/user-role/user-role.guard';


export function Auth(...roles: string[]) {
  return applyDecorators(RolProtected(...roles), UseGuards(AuthGuard(), UserRoleGuard));
}
