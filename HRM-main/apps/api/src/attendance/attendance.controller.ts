import { Controller, Post, Get, Body, Param, Query } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { Auth, GetUser } from '../auth/decorators';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('attendance')
@ApiBearerAuth()
@Controller()
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('attendance/checkin')
  @Auth()
  checkIn(@GetUser() user: any) {
    return this.attendanceService.checkIn(user);
  }

  @Post('attendance/checkout')
  @Auth()
  checkOut(@GetUser() user: any) {
    return this.attendanceService.checkOut(user);
  }

  @Get('attendance/my-timesheet')
  @Auth()
  getMyTimesheet(@Query('month') month: string, @Query('year') year: string, @GetUser() user: any) {
    return this.attendanceService.getMyTimesheet(Number(month), Number(year), user);
  }

  @Get('leave/types')
  @Auth()
  getLeaveTypes() {
    return this.attendanceService.getLeaveTypes();
  }

  @Get(['attendance/leave-requests', 'leave/all-requests'])
  @Auth()
  getAllLeaveRequests(@GetUser() user: any) {
    return this.attendanceService.getAllLeaveRequests(user);
  }

  @Post('leave/request')
  @Auth()
  createLeaveRequest(@Body() data: any, @GetUser() user: any) {
    return this.attendanceService.createLeaveRequest(data, user);
  }

  @Get('leave/my-requests')
  @Auth()
  getMyLeaveRequests(@GetUser() user: any) {
    return this.attendanceService.getMyLeaveRequests(user);
  }

  @Get('leave/approvals')
  @Auth()
  getPendingApprovals(@GetUser() user: any) {
    return this.attendanceService.getPendingApprovals(user);
  }

  @Post('leave/approve/:id')
  @Auth('MANAGER', 'HR_MANAGER', 'HR_STAFF', 'CEO', 'ADMIN')
  approveLeave(@Param('id') id: string, @Body('decision') decision: 'APPROVED' | 'REJECTED', @GetUser() user: any) {
    return this.attendanceService.approveLeave(id, decision, user);
  }

  // OVERTIME
  @Post(['attendance/overtime/request', 'overtime/request'])
  @Auth()
  createOvertimeRequest(@Body() data: any, @GetUser() user: any) {
    return this.attendanceService.createOvertimeRequest(data, user);
  }

  @Get(['attendance/overtime/my-requests', 'overtime/my-requests'])
  @Auth()
  getMyOvertimeRequests(@GetUser() user: any) {
    return this.attendanceService.getMyOvertimeRequests(user);
  }

  @Get(['attendance/overtime/approvals', 'overtime/approvals'])
  @Auth()
  getPendingOvertimeApprovals(@GetUser() user: any) {
    return this.attendanceService.getPendingOvertimeApprovals(user);
  }

  @Post(['attendance/overtime/approve/:id', 'overtime/approve/:id'])
  @Auth('MANAGER', 'HR_MANAGER', 'HR_STAFF', 'CEO', 'ADMIN')
  approveOvertime(@Param('id') id: string, @Body('decision') decision: 'APPROVED' | 'REJECTED', @GetUser() user: any) {
    return this.attendanceService.approveOvertime(id, decision, user);
  }
}
