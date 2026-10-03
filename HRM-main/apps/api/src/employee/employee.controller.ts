import { Controller, Get, Param, Post, Put, Delete, Body } from '@nestjs/common';
import { EmployeeService } from './employee.service';
import { Auth } from '../auth/decorators/auth.decorator';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('employees')
@ApiBearerAuth()
@Controller('employees')
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {}

  @Get()
  @Auth()
  findAll() {
    return this.employeeService.findAll();
  }

  @Get(':id')
  @Auth()
  findOne(@Param('id') id: string) {
    return this.employeeService.findOne(id);
  }

  @Post()
  @Auth('ADMIN', 'HR_MANAGER', 'HR_STAFF')
  create(@Body() data: any) {
    return this.employeeService.create(data);
  }

  @Put(':id')
  @Auth('ADMIN', 'HR_MANAGER', 'HR_STAFF')
  update(@Param('id') id: string, @Body() data: any) {
    return this.employeeService.update(id, data);
  }

  @Delete(':id')
  @Auth('ADMIN', 'HR_MANAGER')
  remove(@Param('id') id: string) {
    return this.employeeService.remove(id);
  }

  @Post(':id/salary')
  @Auth('ADMIN', 'HR_MANAGER', 'ACCOUNTANT')
  addSalaryProfile(@Param('id') id: string, @Body() data: any) {
    return this.employeeService.addSalaryProfile(id, data);
  }
}
