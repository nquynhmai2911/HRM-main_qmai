import { Controller, Get, Patch, Param, Body, Post, Delete } from '@nestjs/common';
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

  @Post('users')
  @ApiOperation({ summary: 'Create new user' })
  async createUser(@Body() data: any) {
    return this.adminService.createUser(data);
  }

  @Patch('users/:id')
  @ApiOperation({ summary: 'Update user' })
  async updateUser(@Param('id') id: string, @Body() data: any) {
    return this.adminService.updateUser(id, data);
  }

  @Get('users/:id/config')
  @ApiOperation({ summary: 'Get user account configuration' })
  async getUserConfig(@Param('id') id: string) {
    return this.adminService.getUserConfig(id);
  }

  @Patch('users/:id/config')
  @ApiOperation({ summary: 'Update user account configuration' })
  async updateUserConfig(@Param('id') id: string, @Body() configData: any) {
    return this.adminService.updateUserConfig(id, configData);
  }

  @Patch('users/:id/role')
  @ApiOperation({ summary: 'Update user role' })
  async updateUserRole(@Param('id') id: string, @Body('role') role: string) {
    return this.adminService.updateUserRole(id, role);
  }

  @Patch('users/:id/reset-password')
  @ApiOperation({ summary: 'Reset user password' })
  async resetPassword(@Param('id') id: string, @Body('password') password?: string) {
    return this.adminService.resetPassword(id, password);
  }

  @Delete('users/:id')
  @ApiOperation({ summary: 'Delete user' })
  async deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(id);
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

  @Delete('settings/:id')
  @ApiOperation({ summary: 'Delete system setting' })
  async deleteSetting(@Param('id') id: string) {
    return this.adminService.deleteSystemConfig(id);
  }
}
