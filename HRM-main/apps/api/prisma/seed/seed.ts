import * as dotenv from "dotenv";
dotenv.config();
import { PrismaClient } from "@prisma/client";
import * as bcrypt from 'bcryptjs';




// @ts-ignore

// @ts-ignore
// @ts-ignore
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding DTS-HRM database...');

  // ── 1. SYSTEM CONFIG ──────────────────────────────
  const configs = [
    // Giờ làm việc
    { key: 'WORK_HOURS_PER_DAY', value: '8', description: 'Số giờ chuẩn/ngày', effectiveFrom: new Date('2024-01-01') },
    { key: 'WORK_DAYS_PER_WEEK', value: '5', description: 'Số ngày làm/tuần', effectiveFrom: new Date('2024-01-01') },
    { key: 'STANDARD_WORK_DAYS_PER_MONTH', value: '22', description: 'Ngày công chuẩn/tháng', effectiveFrom: new Date('2024-01-01') },
    { key: 'LATE_GRACE_MINUTES', value: '10', description: 'Ân hạn đi muộn (phút)', effectiveFrom: new Date('2024-01-01') },
    { key: 'WORK_START_TIME', value: '08:30', description: 'Giờ bắt đầu', effectiveFrom: new Date('2024-01-01') },
    { key: 'WORK_END_TIME', value: '17:30', description: 'Giờ kết thúc', effectiveFrom: new Date('2024-01-01') },

    // Hệ số OT
    { key: 'OT_RATE_NORMAL', value: '1.5', description: 'Hệ số OT ngày thường (150%)', effectiveFrom: new Date('2024-01-01') },
    { key: 'OT_RATE_WEEKEND', value: '2.0', description: 'Hệ số OT cuối tuần (200%)', effectiveFrom: new Date('2024-01-01') },
    { key: 'OT_RATE_HOLIDAY', value: '3.0', description: 'Hệ số OT ngày lễ (300%)', effectiveFrom: new Date('2024-01-01') },
    { key: 'OT_MAX_HOURS_PER_DAY', value: '4', description: 'OT tối đa/ngày (giờ)', effectiveFrom: new Date('2024-01-01') },
    { key: 'OT_MAX_HOURS_PER_MONTH', value: '40', description: 'OT tối đa/tháng (giờ)', effectiveFrom: new Date('2024-01-01') },
    { key: 'OT_MAX_HOURS_PER_YEAR', value: '200', description: 'OT tối đa/năm (giờ)', effectiveFrom: new Date('2024-01-01') },

    // Bảo hiểm (tỷ lệ 2024 – cần cập nhật theo pháp luật hiện hành)
    { key: 'BHXH_EMPLOYEE_RATE', value: '0.08', description: 'BHXH phần nhân viên (8%)', effectiveFrom: new Date('2024-01-01') },
    { key: 'BHYT_EMPLOYEE_RATE', value: '0.015', description: 'BHYT phần nhân viên (1.5%)', effectiveFrom: new Date('2024-01-01') },
    { key: 'BHTN_EMPLOYEE_RATE', value: '0.01', description: 'BHTN phần nhân viên (1%)', effectiveFrom: new Date('2024-01-01') },
    { key: 'BHXH_COMPANY_RATE', value: '0.175', description: 'BHXH phần công ty (17.5%)', effectiveFrom: new Date('2024-01-01') },
    { key: 'BHYT_COMPANY_RATE', value: '0.03', description: 'BHYT phần công ty (3%)', effectiveFrom: new Date('2024-01-01') },
    { key: 'BHTN_COMPANY_RATE', value: '0.01', description: 'BHTN phần công ty (1%)', effectiveFrom: new Date('2024-01-01') },
    { key: 'INSURANCE_SALARY_CAP', value: '46800000', description: 'Mức lương tối đa đóng BH (20 x lương cơ sở)', effectiveFrom: new Date('2024-07-01') },

    // Thuế TNCN
    { key: 'PIT_PERSONAL_DEDUCTION', value: '11000000', description: 'Giảm trừ gia cảnh bản thân', effectiveFrom: new Date('2024-01-01') },
    { key: 'PIT_DEPENDENT_DEDUCTION', value: '4400000', description: 'Giảm trừ gia cảnh người phụ thuộc', effectiveFrom: new Date('2024-01-01') },
    // Biểu thuế lũy tiến 7 bậc (lưu dạng JSON)
    { key: 'PIT_TAX_BRACKETS', value: JSON.stringify([
      { from: 0, to: 5000000, rate: 0.05 },
      { from: 5000000, to: 10000000, rate: 0.10 },
      { from: 10000000, to: 18000000, rate: 0.15 },
      { from: 18000000, to: 32000000, rate: 0.20 },
      { from: 32000000, to: 52000000, rate: 0.25 },
      { from: 52000000, to: 80000000, rate: 0.30 },
      { from: 80000000, to: null, rate: 0.35 },
    ]), description: 'Biểu thuế TNCN lũy tiến 7 bậc', effectiveFrom: new Date('2024-01-01') },

    // Thử việc
    { key: 'PROBATION_MAX_DAYS_UNIVERSITY', value: '60', description: 'Thử việc tối đa ĐH/CĐ (ngày)', effectiveFrom: new Date('2024-01-01') },
    { key: 'PROBATION_MAX_DAYS_VOCATIONAL', value: '30', description: 'Thử việc tối đa trung cấp (ngày)', effectiveFrom: new Date('2024-01-01') },
    { key: 'PROBATION_MIN_SALARY_PERCENT', value: '85', description: 'Lương thử việc tối thiểu (%)', effectiveFrom: new Date('2024-01-01') },

    // Phép năm
    { key: 'ANNUAL_LEAVE_DAYS', value: '12', description: 'Số ngày phép năm mặc định', effectiveFrom: new Date('2024-01-01') },
    { key: 'LEAVE_CARRY_OVER_MONTHS', value: '3', description: 'Số tháng được mang phép năm trước sang', effectiveFrom: new Date('2024-01-01') },

    // Đăng nhập
    { key: 'MAX_FAILED_LOGIN_ATTEMPTS', value: '5', description: 'Số lần đăng nhập sai tối đa', effectiveFrom: new Date('2024-01-01') },
    { key: 'LOCK_DURATION_MINUTES', value: '15', description: 'Thời gian khóa tài khoản (phút)', effectiveFrom: new Date('2024-01-01') },
  ];

  for (const cfg of configs) {
    await prisma.systemConfig.upsert({
      where: { key_effectiveFrom: { key: cfg.key, effectiveFrom: cfg.effectiveFrom } },
      update: { value: cfg.value, description: cfg.description },
      create: cfg,
    });
  }
  console.log('  ✅ System configs seeded');

  // ── 2. BRANCHES ──────────────────────────────────
  const branchHN = await prisma.branch.upsert({
    where: { code: 'HN' },
    update: {},
    create: { name: 'Trụ sở chính Hà Nội', code: 'HN', address: 'Hà Nội, Việt Nam' },
  });
  const branchHCM = await prisma.branch.upsert({
    where: { code: 'HCM' },
    update: {},
    create: { name: 'Chi nhánh TP. Hồ Chí Minh', code: 'HCM', address: 'TP. Hồ Chí Minh, Việt Nam' },
  });
  const branchDN = await prisma.branch.upsert({
    where: { code: 'DN' },
    update: {},
    create: { name: 'Chi nhánh Đà Nẵng', code: 'DN', address: 'Đà Nẵng, Việt Nam' },
  });
  console.log('  ✅ Branches seeded (HN, HCM, DN)');

  // ── 3. DEPARTMENTS ──────────────────────────────
  // Khối Kỹ thuật
  const deptTech = await prisma.department.upsert({
    where: { code: 'TECH' },
    update: {},
    create: { name: 'Khối Sản xuất / Kỹ thuật', code: 'TECH', branchId: branchHN.id },
  });
  const deptDev = await prisma.department.upsert({
    where: { code: 'DEV' },
    update: {},
    create: { name: 'Phòng Phát triển Phần mềm', code: 'DEV', branchId: branchHN.id, parentId: deptTech.id },
  });
  const deptQA = await prisma.department.upsert({
    where: { code: 'QA' },
    update: {},
    create: { name: 'Phòng Kiểm thử Chất lượng', code: 'QA', branchId: branchHN.id, parentId: deptTech.id },
  });
  const deptPMO = await prisma.department.upsert({
    where: { code: 'PMO' },
    update: {},
    create: { name: 'Phòng Quản lý Dự án', code: 'PMO', branchId: branchHN.id, parentId: deptTech.id },
  });

  // Khối Kinh doanh & Marketing
  const deptBiz = await prisma.department.upsert({
    where: { code: 'BIZ' },
    update: {},
    create: { name: 'Khối Kinh doanh & Marketing', code: 'BIZ', branchId: branchHN.id },
  });
  await prisma.department.upsert({
    where: { code: 'SALES-VN' },
    update: {},
    create: { name: 'Phòng Kinh doanh trong nước', code: 'SALES-VN', branchId: branchHN.id, parentId: deptBiz.id },
  });
  await prisma.department.upsert({
    where: { code: 'SALES-INTL' },
    update: {},
    create: { name: 'Phòng Kinh doanh quốc tế', code: 'SALES-INTL', branchId: branchHN.id, parentId: deptBiz.id },
  });
  await prisma.department.upsert({
    where: { code: 'MKT' },
    update: {},
    create: { name: 'Phòng Marketing', code: 'MKT', branchId: branchHN.id, parentId: deptBiz.id },
  });

  // Khối Hỗ trợ
  const deptSupport = await prisma.department.upsert({
    where: { code: 'SUPPORT' },
    update: {},
    create: { name: 'Khối Hỗ trợ', code: 'SUPPORT', branchId: branchHN.id },
  });
  const deptHR = await prisma.department.upsert({
    where: { code: 'HR' },
    update: {},
    create: { name: 'Phòng Hành chính - Nhân sự', code: 'HR', branchId: branchHN.id, parentId: deptSupport.id },
  });
  await prisma.department.upsert({
    where: { code: 'FIN' },
    update: {},
    create: { name: 'Phòng Tài chính - Kế toán', code: 'FIN', branchId: branchHN.id, parentId: deptSupport.id },
  });
  await prisma.department.upsert({
    where: { code: 'IT-INTERNAL' },
    update: {},
    create: { name: 'Phòng IT Nội bộ', code: 'IT-INTERNAL', branchId: branchHN.id, parentId: deptSupport.id },
  });
  console.log('  ✅ Departments seeded (12 departments, 3 levels)');

  // ── 4. POSITIONS ──────────────────────────────
  const positions = [
    { name: 'Lập trình viên', code: 'DEV', levelGroup: 'Dev' },
    { name: 'Kiểm thử viên', code: 'QA-POS', levelGroup: 'QA' },
    { name: 'Quản lý dự án', code: 'PM', levelGroup: 'PM' },
    { name: 'Business Analyst', code: 'BA', levelGroup: 'Dev' },
    { name: 'Kiến trúc sư hệ thống', code: 'ARCHITECT', levelGroup: 'Dev' },
    { name: 'Nhân viên kinh doanh', code: 'SALES', levelGroup: 'Sales' },
    { name: 'Nhân viên Marketing', code: 'MKT-POS', levelGroup: 'Sales' },
    { name: 'Chuyên viên nhân sự', code: 'HR-STAFF-POS', levelGroup: 'Office' },
    { name: 'Kế toán viên', code: 'ACCOUNTANT-POS', levelGroup: 'Office' },
    { name: 'Chuyên viên IT Helpdesk', code: 'IT-HELPDESK', levelGroup: 'Dev' },
    { name: 'Tổng Giám đốc', code: 'CEO-POS', levelGroup: 'Office' },
    { name: 'Trưởng phòng', code: 'DEPT-MANAGER', levelGroup: 'Office' },
  ];

  for (const pos of positions) {
    await prisma.position.upsert({
      where: { code: pos.code },
      update: {},
      create: pos,
    });
  }
  console.log('  ✅ Positions seeded');

  // ── 5. LEAVE TYPES ──────────────────────────────
  const leaveTypes = [
    { name: 'Phép năm', isPaid: true, defaultDaysPerYear: 12 },
    { name: 'Nghỉ ốm', isPaid: true, defaultDaysPerYear: 30 },
    { name: 'Nghỉ không lương', isPaid: false, defaultDaysPerYear: null },
    { name: 'Nghỉ thai sản', isPaid: true, defaultDaysPerYear: null },
    { name: 'Việc riêng có lương', isPaid: true, defaultDaysPerYear: 3 },
  ];

  for (const lt of leaveTypes) {
    await prisma.leaveType.upsert({
      where: { name: lt.name },
      update: {},
      create: lt,
    });
  }
  console.log('  ✅ Leave types seeded');

  // ── 6. REJECT REASONS ──────────────────────────
  const rejectReasons = [
    'Không đủ kinh nghiệm',
    'Không phù hợp văn hóa',
    'Kỹ năng kỹ thuật không đạt',
    'Kỳ vọng lương quá cao',
    'Ứng viên rút hồ sơ',
    'Đã tuyển đủ',
    'Không đạt bài test',
    'Không đạt phỏng vấn kỹ thuật',
    'Tiếng Anh không đạt yêu cầu',
    'Khác',
  ];

  for (const reason of rejectReasons) {
    await prisma.rejectReason.upsert({
      where: { name: reason },
      update: {},
      create: { name: reason },
    });
  }
  console.log('  ✅ Reject reasons seeded');

  // ── 7. HOLIDAYS 2026 ──────────────────────────
  const holidays2026 = [
    { date: new Date('2026-01-01'), name: 'Tết Dương lịch', year: 2026 },
    { date: new Date('2026-02-14'), name: 'Tất niên (29 Tết)', year: 2026 },
    { date: new Date('2026-02-15'), name: 'Tết Nguyên Đán (30 Tết)', year: 2026 },
    { date: new Date('2026-02-16'), name: 'Tết Nguyên Đán (Mùng 1)', year: 2026 },
    { date: new Date('2026-02-17'), name: 'Tết Nguyên Đán (Mùng 2)', year: 2026 },
    { date: new Date('2026-02-18'), name: 'Tết Nguyên Đán (Mùng 3)', year: 2026 },
    { date: new Date('2026-04-06'), name: 'Giỗ Tổ Hùng Vương', year: 2026 },
    { date: new Date('2026-04-30'), name: 'Ngày Giải phóng miền Nam', year: 2026 },
    { date: new Date('2026-05-01'), name: 'Ngày Quốc tế Lao động', year: 2026 },
    { date: new Date('2026-09-02'), name: 'Quốc khánh', year: 2026 },
    { date: new Date('2026-09-03'), name: 'Nghỉ bù Quốc khánh', year: 2026 },
  ];

  for (const h of holidays2026) {
    await prisma.holiday.upsert({
      where: { date: h.date },
      update: {},
      create: h,
    });
  }
  console.log('  ✅ Holidays 2026 seeded');

  // ── 8. PERMISSIONS (RBAC MATRIX) ──────────────
  const permissionMatrix: { resource: string; action: string; scope: string; roles: string[] }[] = [
    // Account management
    { resource: 'user', action: 'create', scope: 'all', roles: ['ADMIN'] },
    { resource: 'user', action: 'read', scope: 'all', roles: ['ADMIN'] },
    { resource: 'user', action: 'update', scope: 'all', roles: ['ADMIN'] },
    { resource: 'user', action: 'delete', scope: 'all', roles: ['ADMIN'] },

    // Audit log
    { resource: 'audit', action: 'read', scope: 'all', roles: ['ADMIN', 'CEO', 'HR_MANAGER'] },

    // System config
    { resource: 'config', action: 'read', scope: 'all', roles: ['ADMIN', 'CEO'] },
    { resource: 'config', action: 'update', scope: 'all', roles: ['ADMIN'] },

    // Organization (branch, department, position)
    { resource: 'organization', action: 'create', scope: 'all', roles: ['ADMIN', 'HR_MANAGER'] },
    { resource: 'organization', action: 'read', scope: 'all', roles: ['ADMIN', 'CEO', 'HR_MANAGER', 'HR_STAFF', 'ACCOUNTANT', 'MANAGER', 'EMPLOYEE'] },
    { resource: 'organization', action: 'update', scope: 'all', roles: ['ADMIN', 'HR_MANAGER'] },
    { resource: 'organization', action: 'delete', scope: 'all', roles: ['ADMIN', 'HR_MANAGER'] },

    // Employee
    { resource: 'employee', action: 'create', scope: 'all', roles: ['HR_MANAGER', 'HR_STAFF'] },
    { resource: 'employee', action: 'read', scope: 'all', roles: ['CEO', 'HR_MANAGER', 'HR_STAFF'] },
    { resource: 'employee', action: 'read', scope: 'team', roles: ['MANAGER'] },
    { resource: 'employee', action: 'read', scope: 'own', roles: ['EMPLOYEE'] },
    { resource: 'employee', action: 'update', scope: 'all', roles: ['HR_MANAGER', 'HR_STAFF'] },
    { resource: 'employee', action: 'update', scope: 'own', roles: ['EMPLOYEE'] },

    // Requisition
    { resource: 'requisition', action: 'create', scope: 'team', roles: ['MANAGER'] },
    { resource: 'requisition', action: 'read', scope: 'all', roles: ['CEO', 'HR_MANAGER', 'HR_STAFF'] },
    { resource: 'requisition', action: 'read', scope: 'team', roles: ['MANAGER'] },
    { resource: 'requisition', action: 'approve', scope: 'all', roles: ['HR_MANAGER', 'CEO'] },

    // Candidate
    { resource: 'candidate', action: 'create', scope: 'all', roles: ['HR_MANAGER', 'HR_STAFF'] },
    { resource: 'candidate', action: 'read', scope: 'all', roles: ['CEO', 'HR_MANAGER', 'HR_STAFF'] },
    { resource: 'candidate', action: 'update', scope: 'all', roles: ['HR_MANAGER', 'HR_STAFF'] },

    // Interview / Offer
    { resource: 'interview', action: 'create', scope: 'all', roles: ['HR_MANAGER', 'HR_STAFF'] },
    { resource: 'interview', action: 'read', scope: 'all', roles: ['CEO', 'HR_MANAGER', 'HR_STAFF', 'MANAGER'] },
    { resource: 'offer', action: 'approve', scope: 'all', roles: ['HR_MANAGER'] },

    // Contract
    { resource: 'contract', action: 'create', scope: 'all', roles: ['HR_MANAGER', 'HR_STAFF'] },
    { resource: 'contract', action: 'read', scope: 'all', roles: ['CEO', 'HR_MANAGER', 'HR_STAFF'] },
    { resource: 'contract', action: 'read', scope: 'own', roles: ['EMPLOYEE'] },
    { resource: 'contract', action: 'approve', scope: 'all', roles: ['HR_MANAGER'] },

    // Attendance
    { resource: 'attendance', action: 'create', scope: 'own', roles: ['EMPLOYEE', 'MANAGER'] },
    { resource: 'attendance', action: 'create', scope: 'all', roles: ['HR_STAFF'] },
    { resource: 'attendance', action: 'read', scope: 'all', roles: ['HR_MANAGER', 'HR_STAFF'] },
    { resource: 'attendance', action: 'read', scope: 'team', roles: ['MANAGER'] },
    { resource: 'attendance', action: 'read', scope: 'own', roles: ['EMPLOYEE'] },
    { resource: 'attendance', action: 'approve', scope: 'team', roles: ['MANAGER'] },
    { resource: 'attendance', action: 'close', scope: 'all', roles: ['HR_MANAGER'] },

    // Leave
    { resource: 'leave', action: 'create', scope: 'own', roles: ['EMPLOYEE', 'MANAGER'] },
    { resource: 'leave', action: 'read', scope: 'all', roles: ['HR_MANAGER', 'HR_STAFF'] },
    { resource: 'leave', action: 'read', scope: 'own', roles: ['EMPLOYEE'] },
    { resource: 'leave', action: 'approve', scope: 'team', roles: ['MANAGER'] },
    { resource: 'leave', action: 'approve', scope: 'all', roles: ['HR_MANAGER'] },

    // Overtime
    { resource: 'overtime', action: 'create', scope: 'own', roles: ['EMPLOYEE', 'MANAGER'] },
    { resource: 'overtime', action: 'read', scope: 'all', roles: ['HR_MANAGER', 'HR_STAFF'] },
    { resource: 'overtime', action: 'read', scope: 'own', roles: ['EMPLOYEE'] },
    { resource: 'overtime', action: 'approve', scope: 'team', roles: ['MANAGER'] },
    { resource: 'overtime', action: 'approve', scope: 'all', roles: ['HR_MANAGER'] },

    // Payroll – ADMIN explicitly excluded
    { resource: 'payroll', action: 'create', scope: 'all', roles: ['HR_STAFF'] },
    { resource: 'payroll', action: 'read', scope: 'all', roles: ['CEO', 'HR_MANAGER', 'HR_STAFF'] },
    { resource: 'payroll', action: 'read', scope: 'own', roles: ['EMPLOYEE'] },
    { resource: 'payroll', action: 'update', scope: 'all', roles: ['HR_STAFF'] },
    { resource: 'payroll', action: 'approve', scope: 'all', roles: ['HR_MANAGER'] },
    { resource: 'payroll', action: 'pay', scope: 'all', roles: ['ACCOUNTANT'] },

    // Dashboard
    { resource: 'dashboard', action: 'read', scope: 'all', roles: ['CEO', 'HR_MANAGER'] },
    { resource: 'dashboard', action: 'read', scope: 'team', roles: ['MANAGER', 'HR_STAFF'] },
    { resource: 'dashboard', action: 'read', scope: 'own', roles: ['EMPLOYEE'] },
  ];

  for (const perm of permissionMatrix) {
    const permission = await prisma.permission.upsert({
      where: { resource_action_scope: { resource: perm.resource, action: perm.action, scope: perm.scope } },
      update: {},
      create: { resource: perm.resource, action: perm.action, scope: perm.scope },
    });

    for (const role of perm.roles) {
      await prisma.rolePermission.upsert({
        where: { role_permissionId: { role, permissionId: permission.id } },
        update: {},
        create: { role, permissionId: permission.id },
      });
    }
  }
  console.log('  ✅ Permissions & role matrix seeded (7 roles, ~50 permissions)');

  // ── 9. DEFAULT ADMIN USER + EMPLOYEE ──────────
  const devPosition = await prisma.position.findUnique({ where: { code: 'IT-HELPDESK' } });
  const itDept = await prisma.department.findUnique({ where: { code: 'IT-INTERNAL' } });

  const adminEmployee = await prisma.employee.upsert({
    where: { employeeCode: 'DTS0001' },
    update: {},
    create: {
      employeeCode: 'DTS0001',
      fullName: 'System Administrator',
      dob: new Date('1990-01-01'),
      gender: "MALE",
      idNumber: '000000000001',
      phone: '0900000001',
      workEmail: 'admin@dts.com.vn',
      departmentId: itDept!.id,
      positionId: devPosition!.id,
      branchId: branchHN.id,
      level: "SENIOR",
      educationLevel: "UNIVERSITY",
      workMode: "ONSITE",
      joinDate: new Date('2024-01-01'),
      status: "ACTIVE",
    },
  });

  const hashedPassword = await bcrypt.hash('Admin@123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@dts.com.vn' },
    update: {},
    create: {
      email: 'admin@dts.com.vn',
      passwordHash: hashedPassword,
      role: "ADMIN",
      isActive: true,
      mustChangePassword: true,
      employeeId: adminEmployee.id,
    },
  });
  console.log('  ✅ Admin user seeded (admin@dts.com.vn / Admin@123)');

  // ── 10. SAMPLE EMPLOYEES (for demo) ──────────
  const sampleEmployees = [
    { code: 'DTS0002', name: 'Nguyễn Văn Hùng', role: "CEO", email: 'hung.nguyen@dts.com.vn', dept: 'TECH', pos: 'CEO-POS', level: "MANAGER" },
    { code: 'DTS0003', name: 'Trần Thị Mai', role: "HR_MANAGER", email: 'mai.tran@dts.com.vn', dept: 'HR', pos: 'DEPT-MANAGER', level: "MANAGER" },
    { code: 'DTS0004', name: 'Lê Hoàng Nam', role: "HR_STAFF", email: 'nam.le@dts.com.vn', dept: 'HR', pos: 'HR-STAFF-POS', level: "MIDDLE" },
    { code: 'DTS0005', name: 'Phạm Minh Đức', role: "ACCOUNTANT", email: 'duc.pham@dts.com.vn', dept: 'FIN', pos: 'ACCOUNTANT-POS', level: "SENIOR" },
    { code: 'DTS0006', name: 'Hoàng Anh Tuấn', role: "MANAGER", email: 'tuan.hoang@dts.com.vn', dept: 'DEV', pos: 'DEPT-MANAGER', level: "LEAD" },
    { code: 'DTS0007', name: 'Vũ Thị Lan', role: "EMPLOYEE", email: 'lan.vu@dts.com.vn', dept: 'DEV', pos: 'DEV', level: "JUNIOR" },
    { code: 'DTS0008', name: 'Đặng Quốc Bảo', role: "EMPLOYEE", email: 'bao.dang@dts.com.vn', dept: 'QA', pos: 'QA-POS', level: "MIDDLE" },
  ];

  for (let i = 0; i < sampleEmployees.length; i++) {
    const emp = sampleEmployees[i];
    const dept = await prisma.department.findUnique({ where: { code: emp.dept } });
    const pos = await prisma.position.findUnique({ where: { code: emp.pos } });

    const employee = await prisma.employee.upsert({
      where: { employeeCode: emp.code },
      update: {},
      create: {
        employeeCode: emp.code,
        fullName: emp.name,
        dob: new Date(`199${i}-0${i + 1}-15`),
        gender: i % 2 === 0 ? "MALE" : "FEMALE",
        idNumber: `00000000000${i + 2}`,
        phone: `090000000${i + 2}`,
        workEmail: emp.email,
        departmentId: dept!.id,
        positionId: pos!.id,
        branchId: branchHN.id,
        level: emp.level,
        educationLevel: "UNIVERSITY",
        workMode: "HYBRID",
        joinDate: new Date('2024-01-15'),
        status: "ACTIVE",
      },
    });

    const pw = await bcrypt.hash('Dts@123456', 10);
    await prisma.user.upsert({
      where: { email: emp.email },
      update: {},
      create: {
        email: emp.email,
        passwordHash: pw,
        role: emp.role,
        isActive: true,
        mustChangePassword: true,
        employeeId: employee.id,
      },
    });
  }
  console.log('  ✅ Sample employees & users seeded (7 users, one per role)');

  console.log('\n🎉 Seed completed successfully!');
  console.log('   Admin login: admin@dts.com.vn / Admin@123');
  console.log('   Other users: [name]@dts.com.vn / Dts@123456');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
