import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  DashboardOutlined,
  TeamOutlined,
  ApartmentOutlined,
  UserAddOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  SettingOutlined,
  LogoutOutlined,
  BellOutlined,
  AuditOutlined,
} from '@ant-design/icons';
import { ProLayout } from '@ant-design/pro-components';
import { Dropdown, Badge, Space, Typography, message } from 'antd';
import type { MenuDataItem } from '@ant-design/pro-components';
import { useAuthStore } from '../lib/auth';
import apiClient from '../lib/api';

const { Text } = Typography;

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Admin hệ thống',
  CEO: 'Ban Giám đốc',
  HR_MANAGER: 'Trưởng phòng NS',
  HR_STAFF: 'Chuyên viên NS',
  ACCOUNTANT: 'Kế toán',
  MANAGER: 'Trưởng phòng',
  EMPLOYEE: 'Nhân viên',
};

type CustomMenuDataItem = MenuDataItem & {
  allowedRoles?: string[];
  children?: CustomMenuDataItem[];
};

const rawMenuData: CustomMenuDataItem[] = [
  {
    path: '/',
    name: 'Dashboard',
    icon: <DashboardOutlined />,
  },
  {
    path: '/organization',
    name: 'Cơ cấu tổ chức',
    icon: <ApartmentOutlined />,
    allowedRoles: ['ADMIN', 'CEO', 'HR_MANAGER', 'HR_STAFF'],
    children: [
      { path: '/organization/branches', name: 'Chi nhánh' },
      { path: '/organization/departments', name: 'Phòng ban' },
      { path: '/organization/positions', name: 'Chức danh' },
    ],
  },
  {
    path: '/employees',
    name: 'Nhân viên',
    icon: <TeamOutlined />,
    allowedRoles: ['ADMIN', 'CEO', 'HR_MANAGER', 'HR_STAFF', 'MANAGER'],
  },
  {
    path: '/recruitment/requisitions',
    name: 'Tuyển dụng',
    icon: <UserAddOutlined />,
    allowedRoles: ['ADMIN', 'CEO', 'HR_MANAGER', 'HR_STAFF', 'MANAGER'],
  },
  {
    path: '/contracts',
    name: 'Hợp đồng',
    icon: <FileTextOutlined />,
    allowedRoles: ['ADMIN', 'CEO', 'HR_MANAGER', 'HR_STAFF'],
    children: [
      { path: '/contracts/list', name: 'Danh sách hợp đồng' },
      { path: '/contracts/probation', name: 'Thử việc' },
    ],
  },
  {
    path: '/attendance',
    name: 'Chấm công',
    icon: <ClockCircleOutlined />,
    children: [
      { path: '/attendance/checkin', name: 'Check-in/out' },
      { path: '/attendance/timesheet', name: 'Bảng công' },
      { path: '/attendance/leave', name: 'Nghỉ phép' },
      { path: '/attendance/leave-approvals', name: 'Duyệt đơn nghỉ', allowedRoles: ['ADMIN', 'CEO', 'HR_MANAGER', 'HR_STAFF', 'MANAGER'] },
      { path: '/attendance/overtime', name: 'Tăng ca (OT)' },
    ],
  },
  {
    path: '/payroll',
    name: 'Lương',
    icon: <DollarOutlined />,
    children: [
      { path: '/payroll/periods', name: 'Kỳ lương', allowedRoles: ['ADMIN', 'CEO', 'HR_MANAGER', 'HR_STAFF', 'ACCOUNTANT'] },
      { path: '/payroll/my-payslips', name: 'Phiếu lương của tôi' },
    ],
  },
  {
    path: '/admin',
    name: 'Quản trị',
    icon: <SettingOutlined />,
    allowedRoles: ['ADMIN'],
    children: [
      { path: '/admin/users', name: 'Tài khoản' },
      { path: '/admin/audit-logs', name: 'Nhật ký hệ thống' },
      { path: '/admin/settings', name: 'Cấu hình' },
    ],
  },
];

const filterMenuByRole = (menuList: CustomMenuDataItem[], userRole: string): MenuDataItem[] => {
  return menuList
    .filter(item => !item.allowedRoles || item.allowedRoles.includes(userRole))
    .map(item => ({
      ...item,
      children: item.children ? filterMenuByRole(item.children, userRole) : undefined,
    }));
};

const AppLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    // Fetch user info on mount if we have a token but no user
    const fetchMe = async () => {
      try {
        const { data } = await apiClient.get('/auth/me');
        useAuthStore.getState().setUser(data);
      } catch {
        logout();
        navigate('/login');
      }
    };

    if (!user && localStorage.getItem('accessToken')) {
      fetchMe();
    }
  }, []);

  const handleLogout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // ignore
    }
    logout();
    message.success('Đã đăng xuất');
    navigate('/login');
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <TeamOutlined />,
      label: 'Thông tin cá nhân',
      onClick: () => navigate('/profile'),
    },
    {
      key: 'change-password',
      icon: <SettingOutlined />,
      label: 'Đổi mật khẩu',
      onClick: () => navigate('/change-password'),
    },
    { type: 'divider' as const },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Đăng xuất',
      onClick: handleLogout,
      danger: true,
    },
  ];

  return (
    <ProLayout
      title="DTS-HRM"
      logo={
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <AuditOutlined style={{ color: '#fff', fontSize: 18 }} />
        </div>
      }
      layout="mix"
      fixSiderbar
      fixedHeader
      collapsed={collapsed}
      onCollapse={setCollapsed}
      location={{ pathname: location.pathname }}
      menuDataRender={() => {
        return filterMenuByRole(rawMenuData, user?.role || 'EMPLOYEE');
      }}
      menuItemRender={(item, dom) => (
        <a onClick={() => item.path && navigate(item.path)}>{dom}</a>
      )}
      subMenuItemRender={(_, dom) => dom}
      actionsRender={() => {
        const notifItems = [
          { key: '1', label: <div style={{ width: 250, padding: 8 }}><strong>Yêu cầu tuyển dụng mới</strong><div style={{ fontSize: 12, color: 'gray' }}>Vừa xong</div></div> },
          { key: '2', label: <div style={{ width: 250, padding: 8 }}><strong>Đơn xin nghỉ phép của Nguyễn Văn A</strong><div style={{ fontSize: 12, color: 'gray' }}>2 giờ trước</div></div> },
          { key: '3', label: <div style={{ width: 250, padding: 8 }}><strong>Hợp đồng thử việc sắp hết hạn</strong><div style={{ fontSize: 12, color: 'gray' }}>1 ngày trước</div></div> },
          { type: 'divider' as const },
          { key: 'all', label: <div style={{ textAlign: 'center', color: '#1677ff' }}>Xem tất cả</div> }
        ];

        return [
          <Dropdown key="bell" menu={{ items: notifItems }} trigger={['click']} placement="bottomRight">
            <Badge count={3} size="small" style={{ cursor: 'pointer' }}>
              <BellOutlined style={{ fontSize: 18, cursor: 'pointer' }} />
            </Badge>
          </Dropdown>,
        ];
      }}
      avatarProps={{
        src: user?.employee?.avatarUrl,
        title: user?.employee?.fullName || user?.email,
        render: (_, dom) => (
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Space style={{ cursor: 'pointer' }}>
              {dom}
              <div style={{ lineHeight: 1.2 }}>
                <Text strong style={{ fontSize: 13, display: 'block' }}>
                  {user?.employee?.fullName || user?.email}
                </Text>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  {ROLE_LABELS[user?.role || ''] || user?.role}
                </Text>
              </div>
            </Space>
          </Dropdown>
        ),
      }}
      token={{
        header: {
          colorBgHeader: '#fff',
          heightLayoutHeader: 56,
        },
        sider: {
          colorMenuBackground: '#001529',
          colorTextMenu: 'rgba(255,255,255,0.75)',
          colorTextMenuSelected: '#fff',
          colorBgMenuItemSelected: '#1677ff',
          colorTextMenuActive: '#fff',
        },
      }}
    >
      <Outlet />
    </ProLayout>
  );
};

export default AppLayout;
