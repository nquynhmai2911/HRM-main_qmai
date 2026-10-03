import { Controller, Get, Post, Body, Query, Param } from '@nestjs/common';
import { ApplicationService } from './application.service';
import { Auth } from '../../auth/decorators/auth.decorator';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('recruitment')
@ApiBearerAuth()
@Controller('recruitment/applications')
export class ApplicationController {
  constructor(private readonly applicationService: ApplicationService) {}

  @Get()
  @Auth()
  findAll(@Query('requisitionId') requisitionId: string) {
    return this.applicationService.findAll(requisitionId);
  }

  @Post()
  @Auth('ADMIN', 'HR_MANAGER', 'HR_STAFF', 'MANAGER')
  create(@Body() data: any) {
    return this.applicationService.create(data);
  }

  @Post(':id/stage')
  @Auth('ADMIN', 'HR_MANAGER', 'HR_STAFF', 'MANAGER')
  updateStage(@Param('id') id: string, @Body() data: any) {
    return this.applicationService.updateStage(id, data);
  }

  @Post(':id/benefits')
  @Auth('ADMIN', 'HR_MANAGER', 'HR_STAFF', 'MANAGER')
  updateBenefits(@Param('id') id: string, @Body() data: any) {
    return this.applicationService.updateBenefits(id, data);
  }
}

