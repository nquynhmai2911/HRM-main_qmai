import React, { useState, useEffect } from 'react';
import { 
  Card, Col, Row, Statistic, Typography, Space, Tag, Button, 
  Table, Progress, Divider, Tooltip, Badge 
} from 'antd';
import {
  TeamOutlined,
  UserAddOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ThunderboltOutlined,
  CalendarOutlined,
  DollarOutlined,
  UsergroupAddOutlined,
  AuditOutlined,
  RightOutlined,
  CheckSquareOutlined,
  NotificationOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../lib/auth';
import apiClient from '../../../lib/api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const ROLE_DISPLAY_NAMES: Record<string, { label: string; color: string }> = {
  ADMIN: { label: 'Admin (Quản trị)', color: 'red' },
  MANAGER: { label: 'Quản lý phòng ban', color: 'blue' },
  HR_MANAGER: { label: 'HR - Kế toán', color: 'purple' },
  EMPLOYEE: { label: 'Nhân viên', color: 'green' },
};

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const role = user?.role || 'EMPLOYEE';

  const [stats, setStats] = useState<any>({
    totalEmployees: 12,
    newThisMonth: 2,
    resignedThisMonth: 0,
    openRequisitions: 3,
    pendingLeaves: 2,
    pendingOT: 1,
    contractsExpiring: 1,
    probationEnding: 2,
  });
  const [loading, setLoading] = useState(false);
  const [recentRequests, setRecentRequests] = useState<any[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const [statsRes, leavesRes] = await Promise.all([
          apiClient.get('/dashboard/stats').catch(() => ({ data: {} })),
          apiClient.get('/attendance/leave-requests').catch(() => ({ data: [] }))
        ]);
        if (statsRes.data && Object.keys(statsRes.data).length > 0) {
          setStats((prev: any) => ({ ...prev, ...statsRes.data }));
        }
        if (Array.isArray(leavesRes.data) && leavesRes.data.length > 0) {
          setRecentRequests(leavesRes.data.slice(0, 5));
        } else {
          // Fallback recent demo items
          setRecentRequests([
            { id: '1', type: 'Nghỉ phép năm', empName: 'Nguyễn Văn Hùng', code: 'DTS0002', date: '15/11/2026', days: 1, status: 'PENDING' },
            { id: '2', type: 'Làm thêm giờ (OT)', empName: 'Trần Thị Mai', code: 'DTS0003', date: '14/11/2026', days: 2, status: 'APPROVED' },
            { id: '3', type: 'Nghỉ chế độ / ốm', empName: 'Lê Hoàng Nam', code: 'DTS0004', date: '13/11/2026', days: 1, status: 'APPROVED' },
            { id: '4', type: 'Nghỉ không lương', empName: 'Phạm Minh Đức', code: 'DTS0005', date: '12/11/2026', days: 0.5, status: 'PENDING' },
          ]);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const curRoleInfo = ROLE_DISPLAY_NAMES[role] || { label: role, color: 'default' };

  // Alignment columns: STT (center), Loại đơn (left), Nhân viên (left), Ngày (center), Trạng thái (center), Hành động (center)
  const recentColumns = [
    {
      title: 'STT',
      key: 'stt',
      width: 50,
      align: 'center' as const,
      render: (_: any, __: any, idx: number) => idx + 1,
    },
    {
      title: 'Loại đơn / Hoạt động',
      key: 'type',
      width: 170,
      render: (r: any) => (
        <Space size={6}>
          <FileTextOutlined style={{ color: '#1677ff' }} />
          <Text strong style={{ fontSize: 13, color: '#1e293b' }}>
            {r.leaveType?.name || r.type || 'Đơn xin nghỉ phép'}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Nhân viên gửi',
      key: 'employee',
      width: 180,
      render: (r: any) => (
        <div>
          <Text strong style={{ fontSize: 13 }}>{r.employee?.fullName || r.empName || 'Nhân sự'}</Text>
          <div style={{ fontSize: 11, color: '#64748b' }}>{r.employee?.employeeCode || r.code || 'DTS'}</div>
        </div>
      ),
    },
    {
      title: 'Thời gian',
      key: 'time',
      width: 120,
      align: 'center' as const,
      render: (r: any) => (
        <Text type="secondary" style={{ fontSize: 12 }}>
          {r.createdAt ? dayjs(r.createdAt).format('DD/MM/YYYY') : (r.date || '15/11/2026')}
        </Text>
      ),
    },
    {
      title: 'Trạng thái',
      key: 'status',
      width: 120,
      align: 'center' as const,
      render: (r: any) => {
        const st = r.status || 'PENDING';
        if (st === 'APPROVED') return <Tag color="success" style={{ fontWeight: 600 }}>Đã duyệt</Tag>;
        if (st === 'REJECTED') return <Tag color="error" style={{ fontWeight: 600 }}>Từ chối</Tag>;
        return <Tag color="warning" style={{ fontWeight: 600 }}>Chờ duyệt</Tag>;
      },
    },
    {
      title: 'Hành động',
      key: 'action',
      width: 90,
      align: 'center' as const,
      render: () => (
        <Tooltip title="Xem chi tiết trên trang duyệt đơn">
          <Button
            type="text"
            size="small"
            icon={<EyeOutlined style={{ color: '#1677ff' }} />}
            onClick={() => navigate('/attendance/leave-approvals')}
          />
        </Tooltip>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Space direction="vertical" size={20} style={{ width: '100%' }}>
        
        {/* 1. Welcome Header Banner */}
        <div
          style={{
            padding: '24px 30px',
            borderRadius: 12,
            background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #0369a1 100%)',
            color: '#fff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 16,
            boxShadow: '0 4px 16px rgba(15, 23, 42, 0.15)',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <Title level={3} style={{ color: '#fff', margin: 0, fontWeight: 700 }}>
                Xin chào, {user?.employee?.fullName || (role === 'ADMIN' ? 'Quản trị viên' : user?.email)}! 👋
              </Title>
              <Tag color={curRoleInfo.color} style={{ fontWeight: 600, padding: '2px 10px', fontSize: 12, borderRadius: 20 }}>
                {curRoleInfo.label}
              </Tag>
            </div>
            <Text style={{ color: '#cbd5e1', fontSize: 13 }}>
              Hệ thống Quản trị Nhân sự & Tiền lương HRM — {dayjs().format('DD/MM/YYYY')} (Năm 2026)
            </Text>
          </div>

          <Space size={12}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.12)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              borderRadius: 8,
              padding: '6px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              color: '#fff',
              fontSize: 12
            }}>
              <Badge status="processing" color="#52c41a" />
              <span>Máy chủ hoạt động 100%</span>
            </div>
            <Button
              type="primary"
              icon={<CheckSquareOutlined />}
              style={{
                background: '#22c55e',
                borderColor: '#22c55e',
                fontWeight: 600,
                borderRadius: 6,
                height: 38
              }}
              onClick={() => navigate('/attendance/checkin')}
            >
              Chấm công ngay
            </Button>
          </Space>
        </div>

        {/* 2. Top Statistic Cards */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <Card
              hoverable
              style={{ borderRadius: 10, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
              bodyStyle={{ padding: '18px 20px' }}
              onClick={() => navigate('/employees/list')}
            >
              <Statistic
                title={<Text strong style={{ color: '#64748b', fontSize: 13 }}>Tổng nhân sự công ty</Text>}
                value={stats.totalEmployees || 12}
                prefix={<TeamOutlined style={{ color: '#0284c7', marginRight: 6 }} />}
                valueStyle={{ color: '#0f172a', fontWeight: 800, fontSize: 24 }}
              />
              <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
                <Tag color="green" icon={<ArrowUpOutlined />} style={{ margin: 0, fontSize: 11 }}>
                  +{stats.newThisMonth || 2} mới
                </Tag>
                <Tag color="default" style={{ margin: 0, fontSize: 11 }}>
                  100% chính thức
                </Tag>
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card
              hoverable
              style={{ borderRadius: 10, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
              bodyStyle={{ padding: '18px 20px' }}
              onClick={() => navigate('/recruitment/requisitions')}
            >
              <Statistic
                title={<Text strong style={{ color: '#64748b', fontSize: 13 }}>Yêu cầu tuyển dụng</Text>}
                value={stats.openRequisitions || 3}
                prefix={<UserAddOutlined style={{ color: '#8b5cf6', marginRight: 6 }} />}
                valueStyle={{ color: '#0f172a', fontWeight: 800, fontSize: 24 }}
                suffix={<span style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>vị trí đang tuyển</span>}
              />
              <div style={{ marginTop: 8 }}>
                <Tag color="purple" style={{ margin: 0, fontSize: 11 }}>
                  IT, Marketing, Kế toán
                </Tag>
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card
              hoverable
              style={{ borderRadius: 10, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
              bodyStyle={{ padding: '18px 20px' }}
              onClick={() => navigate('/attendance/leave-approvals')}
            >
              <Statistic
                title={<Text strong style={{ color: '#64748b', fontSize: 13 }}>Đơn từ chờ duyệt</Text>}
                value={(stats.pendingLeaves || 2) + (stats.pendingOT || 1)}
                prefix={<ClockCircleOutlined style={{ color: '#f59e0b', marginRight: 6 }} />}
                valueStyle={{ color: '#d97706', fontWeight: 800, fontSize: 24 }}
              />
              <div style={{ marginTop: 8 }}>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  {stats.pendingLeaves || 2} nghỉ phép · {stats.pendingOT || 1} làm thêm giờ
                </Text>
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card
              hoverable
              style={{ borderRadius: 10, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
              bodyStyle={{ padding: '18px 20px' }}
              onClick={() => navigate('/contracts/probation')}
            >
              <Statistic
                title={<Text strong style={{ color: '#64748b', fontSize: 13 }}>Cảnh báo hợp đồng</Text>}
                value={(stats.contractsExpiring || 1) + (stats.probationEnding || 2)}
                prefix={<ExclamationCircleOutlined style={{ color: '#ef4444', marginRight: 6 }} />}
                valueStyle={{ color: '#dc2626', fontWeight: 800, fontSize: 24 }}
              />
              <div style={{ marginTop: 8 }}>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  {stats.contractsExpiring || 1} HĐ sắp hết · {stats.probationEnding || 2} sắp hết thử việc
                </Text>
              </div>
            </Card>
          </Col>
        </Row>

        {/* 3. Quick Action Toolbar */}
        <Card
          size="small"
          style={{ borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0' }}
          bodyStyle={{ padding: '14px 20px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <Space size={8}>
              <ThunderboltOutlined style={{ color: '#f59e0b', fontSize: 16 }} />
              <Text strong style={{ color: '#1e293b', fontSize: 13 }}>Truy cập tác vụ nhanh:</Text>
            </Space>
            
            <Space size={10} wrap>
              <Button
                icon={<CalendarOutlined />}
                onClick={() => navigate('/attendance/checkin')}
                style={{ borderRadius: 6, fontWeight: 500 }}
              >
                Bảng chấm công
              </Button>
              <Button
                icon={<FileTextOutlined />}
                onClick={() => navigate('/attendance/leave')}
                style={{ borderRadius: 6, fontWeight: 500 }}
              >
                Tạo đơn nghỉ phép
              </Button>
              <Button
                icon={<DollarOutlined />}
                onClick={() => navigate('/payroll/my-payslips')}
                style={{ borderRadius: 6, fontWeight: 500 }}
              >
                Phiếu lương của tôi
              </Button>
              {(role === 'ADMIN' || role === 'HR_MANAGER' || role === 'MANAGER') && (
                <>
                  <Button
                    type="primary"
                    ghost
                    icon={<AuditOutlined />}
                    onClick={() => navigate('/attendance/leave-approvals')}
                    style={{ borderRadius: 6, fontWeight: 500 }}
                  >
                    Duyệt đơn nghỉ phép
                  </Button>
                  <Button
                    type="primary"
                    ghost
                    icon={<DollarOutlined />}
                    onClick={() => navigate('/payroll/periods')}
                    style={{ borderRadius: 6, fontWeight: 500 }}
                  >
                    Kỳ lương toàn công ty
                  </Button>
                </>
              )}
              {(role === 'ADMIN' || role === 'HR_MANAGER') && (
                <Button
                  icon={<UsergroupAddOutlined />}
                  onClick={() => navigate('/employees/list')}
                  style={{ borderRadius: 6, fontWeight: 500 }}
                >
                  Thêm nhân sự mới
                </Button>
              )}
            </Space>
          </div>
        </Card>

        {/* 4. Main Content: 2 Columns */}
        <Row gutter={[20, 20]}>
          
          {/* Left Column: Recent Activities & Department Distribution */}
          <Col xs={24} lg={15}>
            <Space direction="vertical" size={20} style={{ width: '100%' }}>
              
              {/* Recent Requests Table */}
              <Card
                title={
                  <Space>
                    <ClockCircleOutlined style={{ color: '#1677ff' }} />
                    <span style={{ fontWeight: 600 }}>Đơn từ & Hoạt động cần xử lý gần đây</span>
                  </Space>
                }
                extra={
                  <Button
                    type="link"
                    size="small"
                    onClick={() => navigate('/attendance/leave-approvals')}
                  >
                    Xem tất cả <RightOutlined style={{ fontSize: 11 }} />
                  </Button>
                }
                style={{ borderRadius: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}
                bodyStyle={{ padding: 0 }}
              >
                <Table
                  dataSource={recentRequests}
                  columns={recentColumns}
                  rowKey="id"
                  pagination={false}
                  size="small"
                  bordered={false}
                />
              </Card>

              {/* Department Headcount Breakdown */}
              <Card
                title={
                  <Space>
                    <TeamOutlined style={{ color: '#0284c7' }} />
                    <span style={{ fontWeight: 600 }}>Cơ cấu nhân sự theo 4 Khối phòng ban</span>
                  </Space>
                }
                extra={
                  <Button type="link" size="small" onClick={() => navigate('/about-company')}>
                    Sơ đồ tổ chức <RightOutlined style={{ fontSize: 11 }} />
                  </Button>
                }
                style={{ borderRadius: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}
              >
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <div style={{ marginBottom: 6, display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                      <Text strong style={{ color: '#0284c7' }}>1. Khối Công nghệ & Sản phẩm (CTO)</Text>
                      <Text strong>45% (38 NV)</Text>
                    </div>
                    <Progress percent={45} strokeColor="#0284c7" showInfo={false} size="small" />
                  </Col>

                  <Col span={12}>
                    <div style={{ marginBottom: 6, display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                      <Text strong style={{ color: '#16a34a' }}>2. Khối Kinh doanh & Khách hàng (CCO)</Text>
                      <Text strong>28% (24 NV)</Text>
                    </div>
                    <Progress percent={28} strokeColor="#16a34a" showInfo={false} size="small" />
                  </Col>

                  <Col span={12}>
                    <div style={{ marginBottom: 6, display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                      <Text strong style={{ color: '#ea580c' }}>3. Khối Nhân sự & Vận hành (COO)</Text>
                      <Text strong>15% (12 NV)</Text>
                    </div>
                    <Progress percent={15} strokeColor="#ea580c" showInfo={false} size="small" />
                  </Col>

                  <Col span={12}>
                    <div style={{ marginBottom: 6, display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                      <Text strong style={{ color: '#7c3aed' }}>4. Khối Tài chính & Kế toán (CFO)</Text>
                      <Text strong>12% (10 NV)</Text>
                    </div>
                    <Progress percent={12} strokeColor="#7c3aed" showInfo={false} size="small" />
                  </Col>
                </Row>
              </Card>

            </Space>
          </Col>

          {/* Right Column: Work Schedule & Internal Company Directory */}
          <Col xs={24} lg={9}>
            <Space direction="vertical" size={20} style={{ width: '100%' }}>
              
              {/* Weekly Work Events */}
              <Card
                title={
                  <Space>
                    <CalendarOutlined style={{ color: '#107c41' }} />
                    <span style={{ fontWeight: 600 }}>Lịch công tác & Sự kiện tuần này</span>
                  </Space>
                }
                style={{ borderRadius: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <Tag color="blue" style={{ minWidth: 62, textAlign: 'center', margin: 0, fontWeight: 600 }}>
                      Thứ 2
                    </Tag>
                    <div>
                      <Text strong style={{ fontSize: 13, color: '#1e293b' }}>Họp giao ban toàn công ty</Text>
                      <div style={{ fontSize: 11, color: '#64748b' }}>09:00 — 10:00 • Hội trường tầng 3</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <Tag color="purple" style={{ minWidth: 62, textAlign: 'center', margin: 0, fontWeight: 600 }}>
                      Thứ 4
                    </Tag>
                    <div>
                      <Text strong style={{ fontSize: 13, color: '#1e293b' }}>Phỏng vấn vòng 2: Senior React</Text>
                      <div style={{ fontSize: 11, color: '#64748b' }}>14:30 — 15:30 • Phòng Họp Online</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <Tag color="gold" style={{ minWidth: 62, textAlign: 'center', margin: 0, fontWeight: 600 }}>
                      Thứ 6
                    </Tag>
                    <div>
                      <Text strong style={{ fontSize: 13, color: '#1e293b' }}>Sinh nhật nhân sự tháng & Happy Hour</Text>
                      <div style={{ fontSize: 11, color: '#64748b' }}>16:30 — 17:30 • Khu Pantry trung tâm</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <Tag color="green" style={{ minWidth: 62, textAlign: 'center', margin: 0, fontWeight: 600 }}>
                      Ngày 25
                    </Tag>
                    <div>
                      <Text strong style={{ fontSize: 13, color: '#1e293b' }}>Chốt bảng chấm công & Tính lương</Text>
                      <div style={{ fontSize: 11, color: '#64748b' }}>Toàn bộ phòng ban chốt ngày công</div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Internal Support Directory */}
              <Card
                title={
                  <Space>
                    <NotificationOutlined style={{ color: '#ea580c' }} />
                    <span style={{ fontWeight: 600 }}>Đầu mối hỗ trợ nội bộ</span>
                  </Space>
                }
                style={{ borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0' }}
              >
                <div style={{ fontSize: 12, lineHeight: 1.8, color: '#475569' }}>
                  <div>📞 <strong>Hotline nội bộ:</strong> 1900 6868 (Nhánh 1: HR, Nhánh 2: IT)</div>
                  <div>✉️ <strong>Phòng Nhân sự:</strong> hr@hrm-company.com</div>
                  <div>🏢 <strong>Khu vực làm việc:</strong> Tầng 8, Tòa nhà Công nghệ</div>
                  <Divider style={{ margin: '10px 0' }} />
                  <div style={{ color: '#64748b', fontSize: 11 }}>
                    Hệ thống HRM phiên bản 2.5 • Chuẩn hóa dữ liệu nội bộ phục vụ quản lý & vận hành.
                  </div>
                </div>
              </Card>

            </Space>
          </Col>

        </Row>

      </Space>
    </div>
  );
};

export default DashboardPage;
