import { Module } from '@nestjs/common';
import { RequisitionController } from './requisition.controller';
import { RequisitionService } from './requisition.service';
import { ApplicationController } from './applications/application.controller';
import { ApplicationService } from './applications/application.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [RequisitionController, ApplicationController],
  providers: [RequisitionService, ApplicationService]
})
export class RecruitmentModule {}
