import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Spin } from 'antd';
import { useAuthStore } from '../lib/auth';
import AppLayout from './AppLayout';

// Lazy-loaded pages
const LoginPage = lazy(() => import('../features/auth/pages/LoginPage'));
const DashboardPage = lazy(() => import('../features/dashboard/pages/DashboardPage'));
const EmployeeListPage = lazy(() => import('../features/employees/pages/EmployeeListPage'));
const EmployeeDetailPage = lazy(() => import('../features/employees/pages/EmployeeDetailPage'));
const ProfilePage = lazy(() => import('../features/employees/pages/ProfilePage'));
const RequisitionListPage = lazy(() => import('../features/recruitment/pages/RequisitionListPage'));
const CandidatePipelinePage = lazy(() => import('../features/recruitment/pages/CandidatePipelinePage'));
const ProbationListPage = lazy(() => import('../features/contracts/pages/ProbationListPage'));
const ContractListPage = lazy(() => import('../features/contracts/pages/ContractListPage'));
const PositionListPage = lazy(() => import('../features/organization/pages/PositionListPage'));
const BranchListPage = lazy(() => import('../features/organization/pages/BranchListPage'));
const DepartmentListPage = lazy(() => import('../features/organization/pages/DepartmentListPage'));
const AboutCompanyPage = lazy(() => import('../features/company/pages/AboutCompanyPage'));
const PerformanceReviewPage = lazy(() => import('../features/performance/pages/PerformanceReviewPage'));
const MyTimesheetPage = lazy(() => import('../features/attendance/pages/MyTimesheetPage'));
const LeaveRequestPage = lazy(() => import('../features/attendance/pages/LeaveRequestPage'));
const LeaveApprovalPage = lazy(() => import('../features/attendance/pages/LeaveApprovalPage'));
const OvertimePage = lazy(() => import('../features/attendance/pages/OvertimePage'));
const SettingsPage = lazy(() => import('../features/admin/pages/SettingsPage'));
const UserListPage = lazy(() => import('../features/admin/pages/UserListPage'));
const AuditLogPage = lazy(() => import('../features/admin/pages/AuditLogPage'));
const MyPayslipsPage = lazy(() => import('../features/payroll/pages/MyPayslipsPage'));
const PayrollPeriodsPage = lazy(() => import('../features/payroll/pages/PayrollPeriodsPage'));

const PageLoader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
    <Spin size="large" tip="Đang tải..." />
  </div>
);

// Protected route wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

// Public route (redirect to home if already logged in)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public routes */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />

          {/* Protected routes with layout */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />

            {/* Company Info */}
            <Route path="/about-company" element={<AboutCompanyPage />} />

            {/* Organization */}
            <Route path="/organization/branches" element={<BranchListPage />} />
            <Route path="/organization/departments" element={<DepartmentListPage />} />
            <Route path="/organization/positions" element={<PositionListPage />} />

            {/* Employees */}
            <Route path="/employees" element={<EmployeeListPage />} />
            <Route path="/employees/:id" element={<EmployeeDetailPage />} />
            <Route path="/employees/performance" element={<PerformanceReviewPage />} />
            
            {/* User Profile */}
            <Route path="/profile" element={<ProfilePage />} />

            {/* Recruitment */}
            <Route path="/recruitment" element={<Navigate to="/recruitment/requisitions" replace />} />
            <Route path="/recruitment/requisitions" element={<RequisitionListPage />} />
            <Route path="/recruitment/candidates" element={<Navigate to="/recruitment/requisitions" replace />} />
            <Route path="/recruitment/pipeline" element={<Navigate to="/recruitment/requisitions" replace />} />
            <Route path="/recruitment/pipeline/:id" element={<CandidatePipelinePage />} />

            {/* Contracts */}
            <Route path="/contracts/list" element={<ContractListPage />} />
            <Route path="/contracts/probation" element={<ProbationListPage />} />

            {/* Attendance */}
            <Route path="/attendance/checkin" element={<MyTimesheetPage />} />
            <Route path="/attendance/timesheet" element={<MyTimesheetPage />} />
            <Route path="/attendance/leave" element={<LeaveRequestPage />} />
            <Route path="/attendance/leave-approvals" element={<LeaveApprovalPage />} />
            <Route path="/attendance/overtime" element={<OvertimePage />} />

            {/* Payroll */}
            <Route path="/payroll/periods" element={<PayrollPeriodsPage />} />
            <Route path="/payroll/my-payslips" element={<MyPayslipsPage />} />

            {/* Admin */}
            <Route path="/admin/users" element={<UserListPage />} />
            <Route path="/admin/audit-logs" element={<AuditLogPage />} />
            <Route path="/admin/settings" element={<SettingsPage />} />

            {/* Profile */}
            <Route path="/profile" element={<div>Thông tin cá nhân (coming soon)</div>} />
            <Route path="/change-password" element={<div>Đổi mật khẩu (coming soon)</div>} />
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

export default AppRouter;
