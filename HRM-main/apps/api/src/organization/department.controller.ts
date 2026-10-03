import { Controller, Get } from "@nestjs/common";
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
}