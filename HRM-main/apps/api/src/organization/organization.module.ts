import { PrismaModule } from "../prisma/prisma.module";
import { AuthModule } from "../auth/auth.module";
import { Module } from '@nestjs/common';
import { DepartmentController } from './department.controller';
import { DepartmentService } from './department.service';
import { PositionController } from './position.controller';
import { PositionService } from './position.service';
import { BranchController } from './branch.controller';
import { BranchService } from './branch.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [DepartmentController, PositionController, BranchController],
  providers: [DepartmentService, PositionService, BranchService]
})
export class OrganizationModule {}
