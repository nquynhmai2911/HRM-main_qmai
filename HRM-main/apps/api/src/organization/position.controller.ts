import { Controller, Get, Post, Put, Delete, Body, Param } from "@nestjs/common";
import { PositionService } from "./position.service";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Auth } from "../auth/decorators/auth.decorator";

@ApiTags("organization")
@ApiBearerAuth()
@Controller("organization/positions")
export class PositionController {
  constructor(private readonly positionService: PositionService) {}
  
  @Get()
  @Auth()
  findAll() { return this.positionService.findAll(); }

  @Post()
  @Auth('ADMIN', 'HR_MANAGER', 'HR_STAFF')
  create(@Body() data: any) {
    return this.positionService.create(data);
  }

  @Put(':id')
  @Auth('ADMIN', 'HR_MANAGER', 'HR_STAFF')
  update(@Param('id') id: string, @Body() data: any) {
    return this.positionService.update(id, data);
  }

  @Delete(':id')
  @Auth('ADMIN', 'HR_MANAGER')
  remove(@Param('id') id: string) {
    return this.positionService.remove(id);
  }
}