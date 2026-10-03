import { Controller, Get, Post, Body, Param, UseGuards, Query, Req } from '@nestjs/common';
import { RequisitionService } from './requisition.service';
import { CreateRequisitionDto } from './dto/create-requisition.dto';
import { Auth } from '../auth/decorators/auth.decorator';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('recruitment')
@ApiBearerAuth()
@Controller('recruitment/requisitions')
export class RequisitionController {
  constructor(private readonly requisitionService: RequisitionService) {}

  @Post()
  @Auth('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Tạo yêu cầu tuyển dụng mới (Headcount Request)' })
  create(@Req() req, @Body() createRequisitionDto: CreateRequisitionDto) {
    return this.requisitionService.create(req.user.id, createRequisitionDto);
  }

  @Get()
  @Auth('ADMIN', 'MANAGER', 'HR_MANAGER', 'HR_STAFF', 'CEO')
  @ApiOperation({ summary: 'Lấy danh sách yêu cầu tuyển dụng' })
  findAll(@Query('departmentId') departmentId?: string, @Query('search') search?: string) {
    return this.requisitionService.findAll(departmentId, search);
  }

  @Get(':id')
  @Auth('ADMIN', 'MANAGER', 'HR_MANAGER', 'HR_STAFF', 'CEO')
  @ApiOperation({ summary: 'Lấy chi tiết yêu cầu tuyển dụng' })
  findOne(@Param('id') id: string) {
    return this.requisitionService.findOne(id);
  }

  @Post(':id/submit')
  @Auth('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Gửi yêu cầu tuyển dụng để duyệt' })
  submit(@Param('id') id: string) {
    return this.requisitionService.submit(id);
  }

  @Post(':id/approve')
  @Auth('ADMIN', 'HR_MANAGER', 'CEO')
  @ApiOperation({ summary: 'Duyệt/Từ chối yêu cầu tuyển dụng' })
  processApproval(@Param('id') id: string, @Body() data: any, @Req() req: any) {
    return this.requisitionService.processApproval(id, data.action, data, req.user.id);
  }

  @Post(':id/publish')
  @Auth('ADMIN', 'HR_MANAGER')
  @ApiOperation({ summary: 'Mở tuyển/Đăng tin yêu cầu tuyển dụng' })
  publish(@Param('id') id: string) {
    return this.requisitionService.publish(id);
  }

  @Get(':id/edit')
  @Auth('ADMIN', 'MANAGER')
  update(@Param('id') id: string, @Body() dto: any) {
    // Actually this should be PATCH, but I will use PATCH below.
    return this.requisitionService.update(id, dto);
  }
  
  // Real PATCH
  @Post(':id/update') // or use @Patch(':id')
  @Auth('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Cập nhật yêu cầu tuyển dụng' })
  patchUpdate(@Param('id') id: string, @Body() dto: any) {
    return this.requisitionService.update(id, dto);
  }

  @Post(':id/delete')
  @Auth('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Xóa yêu cầu tuyển dụng' })
  remove(@Param('id') id: string) {
    return this.requisitionService.remove(id);
  }
}
