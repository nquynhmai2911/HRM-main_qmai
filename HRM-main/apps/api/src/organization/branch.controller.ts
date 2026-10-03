import { Controller, Get, Post, Put, Delete, Body, Param } from "@nestjs/common";
import { BranchService } from "./branch.service";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Auth } from "../auth/decorators/auth.decorator";

@ApiTags("organization")
@ApiBearerAuth()
@Controller("organization/branches")
export class BranchController {
  constructor(private readonly branchService: BranchService) {}
  
  @Get()
  @Auth()
  findAll() {
    return this.branchService.findAll();
  }

  @Post()
  @Auth('ADMIN', 'HR_MANAGER', 'HR_STAFF')
  create(@Body() data: any) {
    return this.branchService.create(data);
  }

  @Put(':id')
  @Auth('ADMIN', 'HR_MANAGER', 'HR_STAFF')
  update(@Param('id') id: string, @Body() data: any) {
    return this.branchService.update(id, data);
  }

  @Delete(':id')
  @Auth('ADMIN', 'HR_MANAGER')
  remove(@Param('id') id: string) {
    return this.branchService.remove(id);
  }
}
