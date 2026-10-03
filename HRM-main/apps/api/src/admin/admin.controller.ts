import { Controller, Get, Patch, Param, Body, Post } from '@nestjs/common';
import { AdminService } from './admin.service';
import { Auth } from '../auth/decorators';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Admin')
@ApiBearerAuth()
@Auth('ADMIN')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  @ApiOperation({ summary: 'Get all users' })
  async getUsers() {
    return this.adminService.getAllUsers();
  }

  @Patch('users/:id/role')
  @ApiOperation({ summary: 'Update user role' })
  async updateUserRole(@Param('id') id: string, @Body('role') role: string) {
    return this.adminService.updateUserRole(id, role);
  }

  @Get('audit-logs')
  @ApiOperation({ summary: 'Get audit logs' })
  async getAuditLogs() {
    return this.adminService.getAuditLogs();
  }

  @Get('settings')
  @ApiOperation({ summary: 'Get system settings' })
  async getSettings() {
    return this.adminService.getSystemConfigs();
  }

  @Post('settings')
  @ApiOperation({ summary: 'Save system setting' })
  async saveSetting(@Body() data: any) {
    return this.adminService.saveSystemConfig(data);
  }
}
