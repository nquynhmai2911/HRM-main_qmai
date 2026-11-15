import React, { useEffect, useState, Suspense } from 'react';
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
  BankOutlined,
  CrownOutlined,
  DownOutlined,
} from '@ant-design/icons';
import { ProLayout } from '@ant-design/pro-components';
import { Dropdown, Badge, Space, Typography, Tag, message, Button } from 'antd';
import type { MenuDataItem } from '@ant-design/pro-components';
import { useAuthStore } from '../lib/auth';
import apiClient from '../lib/api';
import DiamondLogo from '../components/DiamondLogo';
import PageLoader from '../components/PageLoader';

const { Text } = Typography;

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Admin',
  SYSTEM_ADMIN: 'Admin',
  'System Administrator': 'Admin',
  'system administrator': 'Admin',
  MANAGER: 'Quản lý',
  HR_MANAGER: 'HR - Kế toán',
  ACCOUNTANT: 'HR - Kế toán',
  HR_STAFF: 'HR - Kế toán',
  CEO: 'Quản lý',
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
    path: '/about-company',
    name: 'Giới thiệu công ty',
    icon: <BankOutlined />,
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
    children: [
      { path: '/employees/list', name: 'Danh sách nhân viên' },
      { path: '/employees/performance', name: 'Đánh giá năng lực' },
    ],
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
      { path: '/attendance/overtime', name: 'Làm thêm giờ' },
    ],
  },
  {
    path: '/payroll',
    name: 'Lương & KPI',
    icon: <DollarOutlined />,
    children: [
      { path: '/payroll/periods', name: 'Kỳ lương' },
      { path: '/payroll/kpi', name: 'Chỉ tiêu KPI & Doanh số', allowedRoles: ['ADMIN', 'HR_MANAGER', 'ACCOUNTANT', 'MANAGER'] },
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
    .filter(item => {
      if (!item.allowedRoles) return true;
      if (userRole === 'ADMIN') return true;
      return item.allowedRoles.includes(userRole);
    })
    .map(item => ({
      ...item,
      children: item.children ? filterMenuByRole(item.children, userRole) : undefined,
    }));
};

const getSelectedMenuKeys = (pathname: string): string[] => {
  if (pathname === '/employees/performance') return ['/employees/performance'];
  if (pathname === '/employees' || pathname === '/employees/list' || pathname.startsWith('/employees/')) {
    return ['/employees/list'];
  }
  if (pathname === '/contracts' || pathname === '/contracts/list') return ['/contracts/list'];
  if (pathname === '/contracts/probation') return ['/contracts/probation'];
  if (pathname === '/organization' || pathname === '/organization/branches') return ['/organization/branches'];
  if (pathname === '/organization/departments') return ['/organization/departments'];
  if (pathname === '/organization/positions') return ['/organization/positions'];
  if (pathname.startsWith('/recruitment')) return ['/recruitment/requisitions'];
  if (pathname === '/attendance' || pathname === '/attendance/timesheet') return ['/attendance/timesheet'];
  if (pathname === '/payroll/kpi' || pathname === '/kpi') return ['/payroll/kpi'];
  if (pathname === '/payroll' || pathname === '/payroll/periods') return ['/payroll/periods'];
  if (pathname === '/admin' || pathname === '/admin/users') return ['/admin/users'];
  return [pathname];
};

const AppLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);
  const [unreadCount, setUnreadCount] = useState(3);

  useEffect(() => {
    // Fetch user info on mount to ensure user is up to date
    const fetchMe = async () => {
      try {
        const { data } = await apiClient.get('/auth/me');
        useAuthStore.getState().setUser(data);
      } catch (err: any) {
        // Chỉ đăng xuất khi thực sự bị lỗi 401 (token hết hạn / không hợp lệ)
        // Nếu lỗi mạng do server đang khởi động thì KHÔNG đăng xuất để người dùng không bị văng ra
        if (err?.response?.status === 401) {
          logout();
          navigate('/login');
        }
      }
    };

    if (localStorage.getItem('accessToken')) {
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
      title="Công ty HRM - Phần mềm quản lý nhân sự"
      logo={<DiamondLogo size={34} />}
      headerTitleRender={(logo) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => navigate('/')}>
          {logo}
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.25, textAlign: 'left' }}>
            <span style={{ fontWeight: 800, fontSize: 14.5, color: '#0f172a', letterSpacing: '-0.2px' }}>
              Công ty HRM
            </span>
            <span style={{ fontSize: 10.5, color: '#64748b', fontWeight: 500, letterSpacing: '0.1px', whiteSpace: 'nowrap' }}>
              Phần mềm quản lý nhân sự
            </span>
          </div>
        </div>
      )}
      layout="mix"
      fixSiderbar
      fixedHeader
      collapsed={collapsed}
      onCollapse={setCollapsed}
      location={{ pathname: location.pathname }}
      selectedKeys={getSelectedMenuKeys(location.pathname)}
      menuProps={{
        selectedKeys: getSelectedMenuKeys(location.pathname),
      }}
      menuDataRender={() => {
        return filterMenuByRole(rawMenuData, user?.role || 'EMPLOYEE');
      }}
      menuItemRender={(item, dom) => (
        <a
          onClick={(e) => {
            e.preventDefault();
            if (item.path) navigate(item.path);
          }}
        >
          {dom}
        </a>
      )}
      subMenuItemRender={(_, dom) => dom}
      actionsRender={() => {
        const notifList = [
          {
            key: '1',
            path: '/recruitment/requisitions',
            title: 'Yêu cầu tuyển dụng mới',
            desc: 'Tuyển dụng Senior React Developer (3 vị trí)',
            time: '10 phút trước',
          },
          {
            key: '2',
            path: '/attendance/leave-approvals',
            title: 'Đơn xin nghỉ phép cần duyệt',
            desc: 'Nguyễn Văn Hùng xin nghỉ phép năm 1 ngày',
            time: '1 giờ trước',
          },
          {
            key: '3',
            path: '/contracts/probation',
            title: 'Hợp đồng thử việc sắp hết hạn',
            desc: '2 nhân sự sắp kết thúc thời gian thử việc 60 ngày',
            time: '1 ngày trước',
          },
          {
            key: '4',
            path: '/payroll/periods',
            title: 'Kỳ lương toàn công ty',
            desc: 'Kỳ lương tháng hiện tại đã sẵn sàng để tổng hợp',
            time: '2 ngày trước',
          },
        ];

        const notifMenuItems = [
          {
            key: 'header',
            label: (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 4px', minWidth: 280 }}>
                <Text strong style={{ fontSize: 13, color: '#1e293b' }}>Thông báo hệ thống</Text>
                {unreadCount > 0 && (
                  <Button
                    type="link"
                    size="small"
                    style={{ fontSize: 11, padding: 0 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setUnreadCount(0);
                      message.success('Đã đánh dấu tất cả thông báo là đã đọc');
                    }}
                  >
                    Đánh dấu đã đọc
                  </Button>
                )}
              </div>
            ),
          },
          { type: 'divider' as const },
          ...notifList.map(item => ({
            key: item.key,
            label: (
              <div
                style={{
                  padding: '6px 4px',
                  borderRadius: 6,
                  transition: 'all 0.2s',
                  opacity: unreadCount === 0 ? 0.75 : 1
                }}
                onClick={() => {
                  if (item.path) navigate(item.path);
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text strong style={{ fontSize: 12.5, color: '#0958d9' }}>{item.title}</Text>
                  <span style={{ fontSize: 10, color: '#94a3b8' }}>{item.time}</span>
                </div>
                <div style={{ fontSize: 11.5, color: '#475569', marginTop: 2 }}>{item.desc}</div>
              </div>
            ),
          })),
          { type: 'divider' as const },
          {
            key: 'all',
            label: (
              <div
                style={{ textAlign: 'center', color: '#1677ff', fontWeight: 600, fontSize: 12, padding: '4px 0' }}
                onClick={() => navigate('/attendance/leave-approvals')}
              >
                Xem tất cả hoạt động
              </div>
            ),
          },
        ];

        return [
          <Dropdown key="bell" menu={{ items: notifMenuItems }} trigger={['click']} placement="bottomRight">
            <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', padding: '0 4px' }}>
              <Badge count={unreadCount} size="small" offset={[-2, 2]}>
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  color: '#475569'
                }}>
                  <BellOutlined style={{ fontSize: 16 }} />
                </div>
              </Badge>
            </div>
          </Dropdown>,
        ];
      }}
      avatarProps={{
        src: user?.employee?.avatarUrl,
        render: () => {
          const rawName = user?.employee?.fullName;
          const displayName = (!rawName || rawName === 'System Administrator' || rawName === 'system administrator')
            ? (user?.role === 'ADMIN' ? 'Quản trị viên' : (user?.email || 'Người dùng'))
            : rawName;

          return (
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" trigger={['click']}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  cursor: 'pointer',
                  padding: '4px 12px',
                  borderRadius: 20,
                  transition: 'all 0.2s',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  height: 36,
                }}
              >
                {user?.employee?.avatarUrl ? (
                  <img
                    src={user.employee.avatarUrl}
                    alt={displayName}
                    style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }}
                  />
                ) : (
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      backgroundColor: '#1677ff',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    {displayName ? displayName.charAt(0).toUpperCase() : 'U'}
                  </div>
                )}

                <span style={{ fontWeight: 600, fontSize: 13, color: '#1e293b', whiteSpace: 'nowrap' }}>
                  {displayName}
                </span>

                <DownOutlined style={{ fontSize: 10, color: '#94a3b8', marginLeft: 2 }} />
              </div>
            </Dropdown>
          );
        },
      }}
      token={{
        header: {
          colorBgHeader: '#ffffff',
          colorTextMenu: '#475569',
          colorTextMenuSelected: '#0284c7',
          colorBgMenuItemSelected: 'rgba(2, 132, 199, 0.08)',
          colorTextMenuActive: '#0284c7',
          colorBgMenuItemHover: 'rgba(241, 245, 249, 0.6)',
          heightLayoutHeader: 56,
        },
        sider: {
          colorMenuBackground: '#1e293b',
          colorTextMenu: '#cbd5e1',
          colorTextMenuSelected: '#38bdf8',
          colorBgMenuItemSelected: 'rgba(56, 189, 248, 0.12)',
          colorTextMenuActive: '#38bdf8',
          colorTextMenuItemHover: '#ffffff',
          colorBgMenuItemHover: 'rgba(255, 255, 255, 0.05)',
        },
      }}
    >
      <Suspense fallback={<PageLoader />}>
        <Outlet />
      </Suspense>
    </ProLayout>
  );
};

export default AppLayout;
