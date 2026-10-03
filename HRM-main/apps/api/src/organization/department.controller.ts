import { Controller, Get, Post, Put, Delete, Body, Param } from "@nestjs/common";
import { DepartmentService } from "./department.service";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Auth } from "../auth/decorators/auth.decorator";

@ApiTags("organization")
@ApiBearerAuth()
@Controller("organization/departments")
export class DepartmentController {
  constructor(private readonly departmentService: DepartmentService) {}
  
  @Get()
  @Auth()
  findAll() { return this.departmentService.findAll(); }

  @Post()
  @Auth('ADMIN', 'HR_MANAGER', 'HR_STAFF')
  create(@Body() data: any) {
    return this.departmentService.create(data);
  }

  @Put(':id')
  @Auth('ADMIN', 'HR_MANAGER', 'HR_STAFF')
  update(@Param('id') id: string, @Body() data: any) {
    return this.departmentService.update(id, data);
  }

  @Delete(':id')
  @Auth('ADMIN', 'HR_MANAGER')
  remove(@Param('id') id: string) {
    return this.departmentService.remove(id);
  }
}