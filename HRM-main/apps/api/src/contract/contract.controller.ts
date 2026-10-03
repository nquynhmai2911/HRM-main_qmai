import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { ContractService } from './contract.service';
import { Auth, GetUser } from '../auth/decorators';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('contracts')
@ApiBearerAuth()
@Controller('contracts')
export class ContractController {
  constructor(private readonly contractService: ContractService) {}

  @Post('onboard')
  @Auth('ADMIN', 'HR_MANAGER', 'HR_STAFF')
  onboard(@Body() data: any, @GetUser() user: any) {
    return this.contractService.onboard(data, user);
  }

  @Get('probation')
  @Auth()
  getProbationList() {
    return this.contractService.getProbationList();
  }

  @Post('probation/:id/review')
  @Auth('ADMIN', 'HR_MANAGER', 'HR_STAFF', 'MANAGER')
  updateProbationReview(@Param('id') contractId: string, @Body() data: any) {
    return this.contractService.updateProbationReview(contractId, data);
  }

  @Post('probation/:id/decision')
  @Auth('ADMIN', 'HR_MANAGER', 'HR_STAFF')
  decideProbation(@Param('id') contractId: string, @Body() data: any) {
    return this.contractService.decideProbation(contractId, data);
  }

  @Get()
  @Auth()
  findAll() {
    return this.contractService.findAll();
  }

  @Get(':id')
  @Auth()
  findOne(@Param('id') id: string) {
    return this.contractService.findOne(id);
  }

  @Post()
  @Auth('ADMIN', 'HR_MANAGER', 'HR_STAFF')
  create(@Body() data: any) {
    return this.contractService.create(data);
  }

  @Put(':id')
  @Auth('ADMIN', 'HR_MANAGER', 'HR_STAFF')
  update(@Param('id') id: string, @Body() data: any) {
    return this.contractService.update(id, data);
  }

  @Delete(':id')
  @Auth('ADMIN', 'HR_MANAGER', 'HR_STAFF')
  remove(@Param('id') id: string) {
    return this.contractService.remove(id);
  }
}
