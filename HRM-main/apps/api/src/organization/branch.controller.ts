import { Controller, Get } from "@nestjs/common";
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
}
