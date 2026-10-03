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
  @Auth()
  create(@Body() data: any) {
    return this.positionService.create(data);
  }

  @Put(':id')
  @Auth()
  update(@Param('id') id: string, @Body() data: any) {
    return this.positionService.update(id, data);
  }

  @Delete(':id')
  @Auth()
  remove(@Param('id') id: string) {
    return this.positionService.remove(id);
  }
}