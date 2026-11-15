import React, { useEffect, useState, useMemo } from 'react';
import { 
  Card, 
  Table, 
  Typography, 
  Space, 
  Select, 
  message, 
  Tag, 
  Row, 
  Col, 
  Statistic, 
  Input, 
  Alert, 
  Tooltip, 
  Button, 
  Modal, 
  Form, 
  Switch, 
  Popconfirm, 
  Descriptions,
  Tabs,
  Checkbox,
  Radio,
  Divider,
  Spin
} from 'antd';
import { 
  UserOutlined, 
  CrownOutlined, 
  SafetyCertificateOutlined, 
  TeamOutlined, 
  IdcardOutlined,
  SearchOutlined,
  ReloadOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  KeyOutlined,
  EyeOutlined,
  LockOutlined,
  MailOutlined,
  SettingOutlined,
  ControlOutlined,
  AuditOutlined,
  ApartmentOutlined,
  BankOutlined,
  CheckSquareOutlined,
  FileTextOutlined,
  DollarOutlined
} from '@ant-design/icons';
import apiClient from '../../../lib/api';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;

export const APP_ROLES = [
  { value: 'ADMIN', label: 'Admin', color: 'red', desc: 'Toàn quyền quản trị hệ thống' },
  { value: 'MANAGER', label: 'Quản lý', color: 'blue', desc: 'Phê duyệt & quản lý phòng ban' },
  { value: 'HR_MANAGER', label: 'HR - Kế toán', color: 'purple', desc: 'Quản lý nhân sự, hợp đồng & lương' },
  { value: 'EMPLOYEE', label: 'Nhân viên', color: 'green', desc: 'Nhân viên thao tác thông thường' },
];

export const PERMISSION_GROUPS = [
  {
    key: 'employee',
    title: '1. Hồ sơ & Nhân sự',
    color: '#0284c7',
    items: [
      { key: 'employee:read', label: 'Xem danh sách nhân sự' },
      { key: 'employee:create', label: 'Thêm mới nhân sự' },
      { key: 'employee:update', label: 'Chỉnh sửa thông tin nhân sự' },
      { key: 'employee:delete', label: 'Xóa nhân sự' },
      { key: 'employee:export', label: 'Xuất file Excel nhân sự' },
    ],
  },
  {
    key: 'contract',
    title: '2. Hợp đồng & Thử việc',
    color: '#ea580c',
    items: [
      { key: 'contract:read', label: 'Xem danh sách hợp đồng' },
      { key: 'contract:create', label: 'Tạo hợp đồng lao động' },
      { key: 'contract:update', label: 'Chỉnh sửa hợp đồng' },
      { key: 'contract:probation', label: 'Đánh giá & nghiệm thu thử việc' },
    ],
  },
  {
    key: 'attendance',
    title: '3. Chấm công & Phê duyệt',
    color: '#16a34a',
    items: [
      { key: 'attendance:read', label: 'Xem bảng chấm công toàn công ty' },
      { key: 'attendance:checkin', label: 'Thực hiện Check-in / Check-out' },
      { key: 'attendance:leave_approve', label: 'Phê duyệt đơn xin nghỉ phép' },
      { key: 'attendance:ot_approve', label: 'Phê duyệt làm thêm giờ (OT)' },
    ],
  },
  {
    key: 'payroll',
    title: '4. Bảng lương & Chi trả',
    color: '#7c3aed',
    items: [
      { key: 'payroll:read', label: 'Xem bảng tính lương toàn công ty' },
      { key: 'payroll:compute', label: 'Thực hiện tính toán lương tự động' },
      { key: 'payroll:approve', label: 'Phê duyệt kỳ lương' },
      { key: 'payroll:pay', label: 'Xác nhận chuyển khoản chi trả' },
      { key: 'payroll:export', label: 'Xuất bảng lương ra Excel' },
    ],
  },
  {
    key: 'recruitment',
    title: '5. Tuyển dụng & Đánh giá',
    color: '#d97706',
    items: [
      { key: 'recruitment:read', label: 'Xem yêu cầu tuyển dụng' },
      { key: 'recruitment:create', label: 'Tạo yêu cầu tuyển dụng' },
      { key: 'recruitment:approve', label: 'Phê duyệt yêu cầu tuyển dụng' },
      { key: 'recruitment:pipeline', label: 'Quản lý quy trình ứng viên' },
      { key: 'performance:review', label: 'Đánh giá hiệu suất (KPI)' },
    ],
  },
  {
    key: 'admin',
    title: '6. Quản trị hệ thống',
    color: '#dc2626',
    items: [
      { key: 'admin:users', label: 'Quản lý tài khoản & phân quyền' },
      { key: 'admin:audit', label: 'Xem nhật ký hệ thống (Audit Logs)' },
      { key: 'admin:settings', label: 'Cấu hình tham số hệ thống' },
    ],
  },
];

const getRoleConfig = (role: string) => {
  return APP_ROLES.find(r => r.value === role) || {
    value: role,
    label: role,
    color: 'default',
    desc: ''
  };
};

const UserListPage: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isResetPassModalOpen, setIsResetPassModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [configLoading, setConfigLoading] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [configPermissions, setConfigPermissions] = useState<string[]>([]);
  const [activeConfigTab, setActiveConfigTab] = useState('permissions');

  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const [resetPassForm] = Form.useForm();
  const [configForm] = Form.useForm();
  const scopeType = Form.useWatch('scopeType', configForm);
  const scopeBranchType = Form.useWatch('scopeBranchType', configForm);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, empRes, deptRes, branchRes] = await Promise.all([
        apiClient.get('/admin/users'),
        apiClient.get('/employees').catch(() => ({ data: [] })),
        apiClient.get('/organization/departments').catch(() => ({ data: [] })),
        apiClient.get('/organization/branches').catch(() => ({ data: [] }))
      ]);
      setData(usersRes.data);
      setEmployees(empRes.data || []);
      setDepartments(deptRes.data || []);
      setBranches(branchRes.data || []);
    } catch (error) {
      message.error('Lỗi khi tải dữ liệu tài khoản');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // CRUD Actions
  const handleCreateUser = async () => {
    try {
      const values = await createForm.validateFields();
      await apiClient.post('/admin/users', values);
      message.success('Tạo tài khoản mới thành công!');
      setIsCreateModalOpen(false);
      createForm.resetFields();
      fetchData();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Lỗi khi tạo tài khoản');
    }
  };

  const handleUpdateUser = async () => {
    try {
      const values = await editForm.validateFields();
      await apiClient.patch(`/admin/users/${selectedUser.id}`, values);
      message.success('Cập nhật tài khoản thành công!');
      setIsEditModalOpen(false);
      fetchData();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Lỗi khi cập nhật tài khoản');
    }
  };

  const handleResetPassword = async () => {
    try {
      const values = await resetPassForm.validateFields();
      await apiClient.patch(`/admin/users/${selectedUser.id}/reset-password`, { password: values.newPassword });
      message.success(`Đã đổi mật khẩu thành công cho ${selectedUser.email}`);
      setIsResetPassModalOpen(false);
      resetPassForm.resetFields();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Lỗi khi đặt lại mật khẩu');
    }
  };

  const handleDeleteUser = async (id: string) => {
    try {
      await apiClient.delete(`/admin/users/${id}`);
      message.success('Đã xóa tài khoản thành công!');
      fetchData();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Lỗi khi xóa tài khoản');
    }
  };

  const openEditModal = (record: any) => {
    setSelectedUser(record);
    editForm.setFieldsValue({
      email: record.email,
      role: record.role,
      isActive: record.isActive,
      employeeId: record.employeeId || null
    });
    setIsEditModalOpen(true);
  };

  const openResetPassModal = (record: any) => {
    setSelectedUser(record);
    resetPassForm.setFieldsValue({
      email: record.email,
      newPassword: '123456'
    });
    setIsResetPassModalOpen(true);
  };

  const openDetailModal = (record: any) => {
    setSelectedUser(record);
    setIsDetailModalOpen(true);
  };

  const openConfigModal = async (record: any) => {
    setSelectedUser(record);
    setIsConfigModalOpen(true);
    setConfigLoading(true);
    setActiveConfigTab('permissions');
    try {
      const res = await apiClient.get(`/admin/users/${record.id}/config`);
      const cfg = res.data?.config || {};
      setConfigPermissions(cfg.permissions || []);
      configForm.setFieldsValue({
        role: record.role,
        isActive: record.isActive,
        mustChangePassword: record.mustChangePassword || false,
        scopeType: cfg.scopeType || 'ALL',
        managedDepartmentIds: cfg.managedDepartmentIds || [],
        scopeBranchType: cfg.scopeBranchType || 'ALL',
        managedBranchIds: cfg.managedBranchIds || [],
        canViewCompanySalary: cfg.canViewCompanySalary ?? true,
        canApprovePayroll: cfg.canApprovePayroll ?? false,
        canExportReports: cfg.canExportReports ?? true,
        receiveEmailNotif: cfg.receiveEmailNotif ?? true,
        adminNotes: cfg.adminNotes || '',
      });
    } catch {
      message.error('Lỗi khi tải cấu hình tài khoản');
    } finally {
      setConfigLoading(false);
    }
  };

  const applyDefaultRolePermissions = (roleToApply: string) => {
    const all = PERMISSION_GROUPS.flatMap(g => g.items.map(i => i.key));
    if (roleToApply === 'ADMIN') {
      setConfigPermissions(all);
    } else if (roleToApply === 'HR_MANAGER') {
      setConfigPermissions(all.filter(k => !k.startsWith('admin:')));
    } else if (roleToApply === 'MANAGER') {
      setConfigPermissions([
        'employee:read', 'attendance:read', 'attendance:checkin', 
        'attendance:leave_approve', 'attendance:ot_approve', 'payroll:read',
        'recruitment:read', 'recruitment:approve', 'performance:review'
      ]);
    } else {
      setConfigPermissions(['attendance:checkin']);
    }
    message.info(`Đã tải bộ quyền chuẩn cho vai trò ${roleToApply}`);
  };

  const selectAllPermissions = () => {
    const all = PERMISSION_GROUPS.flatMap(g => g.items.map(i => i.key));
    setConfigPermissions(all);
  };

  const clearAllPermissions = () => {
    setConfigPermissions([]);
  };

  const handleSaveConfig = async () => {
    try {
      setSavingConfig(true);
      const values = await configForm.validateFields();
      const payload = {
        ...values,
        permissions: configPermissions,
      };
      await apiClient.patch(`/admin/users/${selectedUser.id}/config`, payload);
      message.success(`Đã lưu cấu hình tài khoản ${selectedUser.email} thành công!`);
      setIsConfigModalOpen(false);
      fetchData();
    } catch (err: any) {
      message.error(err?.response?.data?.message || 'Không thể lưu cấu hình tài khoản');
    } finally {
      setSavingConfig(false);
    }
  };

  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchRole = roleFilter === 'ALL' || item.role === roleFilter;
      const q = searchText.toLowerCase();
      const matchSearch = !searchText || 
        (item.email && item.email.toLowerCase().includes(q)) ||
        (item.employee?.fullName && item.employee.fullName.toLowerCase().includes(q)) ||
        (item.employee?.employeeCode && item.employee.employeeCode.toLowerCase().includes(q));
      return matchRole && matchSearch;
    });
  }, [data, roleFilter, searchText]);

  const adminCount = data.filter(u => u.role === 'ADMIN').length;
  const managerCount = data.filter(u => u.role === 'MANAGER').length;
  const hrCount = data.filter(u => u.role === 'HR_MANAGER').length;
  const employeeCount = data.filter(u => u.role === 'EMPLOYEE').length;

  const columns = [
    {
      title: 'STT',
      key: 'stt',
      width: 60,
      align: 'center' as const,
      render: (_: any, __: any, index: number) => (
        <Text type="secondary" style={{ fontSize: 13 }}>{index + 1}</Text>
      ),
    },
    { 
      title: 'Tài khoản Email', 
      dataIndex: 'email', 
      key: 'email', 
      width: 250,
      render: (t: string) => (
        <Space size={8}>
          <div style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            backgroundColor: '#e6f4ff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#1677ff',
            fontWeight: 600,
            fontSize: 12
          }}>
            {t ? t.charAt(0).toUpperCase() : 'U'}
          </div>
          <Text strong style={{ color: '#0958d9', fontSize: 13 }}>{t}</Text>
        </Space>
      ) 
    },
    { 
      title: 'Mã NV', 
      key: 'empCode', 
      width: 120,
      render: (record: any) => (
        record.employee?.employeeCode ? (
          <Tag color="blue" style={{ fontWeight: 600 }}>{record.employee.employeeCode}</Tag>
        ) : (
          <Text type="secondary">-</Text>
        )
      ) 
    },
    { 
      title: 'Họ tên nhân sự', 
      key: 'empName', 
      width: 220,
      render: (record: any) => (
        <Text strong style={{ fontSize: 13, color: '#1e293b' }}>
          {record.employee?.fullName || 'Chưa liên kết'}
        </Text>
      ) 
    },
    { 
      title: 'Trạng thái', 
      dataIndex: 'isActive', 
      key: 'isActive', 
      width: 130,
      align: 'center' as const,
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'success' : 'error'} style={{ padding: '2px 8px', borderRadius: 4, fontWeight: 500 }}>
          {isActive ? 'Hoạt động' : 'Bị khóa'}
        </Tag>
      ) 
    },
    {
      title: 'Phân quyền',
      key: 'role',
      width: 160,
      render: (record: any) => {
        const curConfig = getRoleConfig(record.role);
        return (
          <Tag color={curConfig.color} style={{ fontWeight: 600, padding: '3px 10px', borderRadius: 4 }}>
            {curConfig.label}
          </Tag>
        );
      },
    },
    {
      title: 'Hành động',
      key: 'action',
      width: 195,
      align: 'center' as const,
      fixed: 'right' as const,
      render: (record: any) => (
        <Space size={4} wrap={false} style={{ justifyContent: 'center' }}>
          <Tooltip title="Xem chi tiết tài khoản">
            <Button 
              type="text" 
              size="small" 
              icon={<EyeOutlined style={{ color: '#1677ff' }} />} 
              onClick={() => openDetailModal(record)} 
            />
          </Tooltip>

          <Tooltip title="Chỉnh sửa cơ bản (Email, Vai trò, Liên kết NV)">
            <Button 
              type="text" 
              size="small" 
              icon={<EditOutlined style={{ color: '#1677ff' }} />} 
              onClick={() => openEditModal(record)} 
            />
          </Tooltip>

          <Tooltip title="Cấu hình tài khoản & Phân quyền nâng cao">
            <Button 
              type="text" 
              size="small" 
              icon={<SettingOutlined style={{ color: '#7c3aed' }} />} 
              onClick={() => openConfigModal(record)} 
            />
          </Tooltip>

          <Tooltip title="Đặt lại mật khẩu">
            <Button 
              type="text" 
              size="small" 
              icon={<KeyOutlined style={{ color: '#fa8c16' }} />} 
              onClick={() => openResetPassModal(record)} 
            />
          </Tooltip>

          <Tooltip title="Xóa tài khoản">
            <span>
              <Popconfirm 
                title="Xóa tài khoản này?" 
                description={`Bạn có chắc muốn xóa tài khoản ${record.email}?`}
                onConfirm={() => handleDeleteUser(record.id)}
                okText="Xóa"
                cancelText="Hủy"
                okButtonProps={{ danger: true }}
              >
                <Button type="text" size="small" danger icon={<DeleteOutlined />} />
              </Popconfirm>
            </span>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      {/* 4 Role Metric Cards */}
      <Row gutter={16} style={{ marginBottom: 20 }}>
        <Col span={6}>
          <Card style={{ borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <Statistic 
              title="1. Admin" 
              value={adminCount} 
              prefix={<CrownOutlined style={{ color: '#ff4d4f' }} />} 
              valueStyle={{ color: '#cf1322', fontWeight: 700 }}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>Toàn quyền cấu hình & quản trị</Text>
          </Card>
        </Col>
        <Col span={6}>
          <Card style={{ borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <Statistic 
              title="2. Quản lý" 
              value={managerCount} 
              prefix={<SafetyCertificateOutlined style={{ color: '#1677ff' }} />} 
              valueStyle={{ color: '#0958d9', fontWeight: 700 }}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>Duyệt đơn, đánh giá nhân viên</Text>
          </Card>
        </Col>
        <Col span={6}>
          <Card style={{ borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <Statistic 
              title="3. HR - Kế toán" 
              value={hrCount} 
              prefix={<IdcardOutlined style={{ color: '#722ed1' }} />} 
              valueStyle={{ color: '#531dab', fontWeight: 700 }}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>Hợp đồng, nhân sự, bảng lương</Text>
          </Card>
        </Col>
        <Col span={6}>
          <Card style={{ borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <Statistic 
              title="4. Nhân viên" 
              value={employeeCount} 
              prefix={<TeamOutlined style={{ color: '#52c41a' }} />} 
              valueStyle={{ color: '#389e0d', fontWeight: 700 }}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>Check-in, nộp đơn, xem phiếu lương</Text>
          </Card>
        </Col>
      </Row>

      {/* Demo Credentials Alert Banner */}
      <Alert
        message={<Text strong style={{ color: '#1e3a8a' }}>Danh sách tài khoản Demo sẵn sàng đăng nhập (Mật khẩu chung: 123456)</Text>}
        description={
          <Row gutter={[16, 8]} style={{ marginTop: 6 }}>
            <Col xs={24} sm={12} md={6}>
              <Tag color="red" style={{ fontWeight: 600 }}>Admin</Tag> 
              <Text code strong>admin@gmail.com</Text>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Tag color="blue" style={{ fontWeight: 600 }}>Quản lý</Tag> 
              <Text code strong>quanly@gmail.com</Text>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Tag color="purple" style={{ fontWeight: 600 }}>HR - Kế toán</Tag> 
              <Text code strong>hr@gmail.com</Text>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Tag color="green" style={{ fontWeight: 600 }}>Nhân viên</Tag> 
              <Text code strong>nhanvien@gmail.com</Text>
            </Col>
          </Row>
        }
        type="info"
        showIcon
        style={{ marginBottom: 20, borderRadius: 8, border: '1px solid #91caff', backgroundColor: '#e6f4ff' }}
      />

      <Card 
        title={
          <Space align="center">
            <div style={{ 
              width: 32, 
              height: 32, 
              borderRadius: 6, 
              backgroundColor: '#e6f4ff', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <UserOutlined style={{ color: '#1677ff', fontSize: 18 }} />
            </div>
            <div>
              <Title level={4} style={{ margin: 0, color: '#1e3a8a' }}>Quản lý Tài khoản & Phân quyền</Title>
              <Text type="secondary" style={{ fontSize: 12 }}>Thiết lập vai trò phân quyền 4 nhóm chức năng chính phục vụ vận hành và demo</Text>
            </div>
          </Space>
        }
        extra={
          <Space size="middle">
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              onClick={() => {
                createForm.resetFields();
                createForm.setFieldsValue({ role: 'EMPLOYEE', password: '123456', isActive: true });
                setIsCreateModalOpen(true);
              }}
            >
              Thêm tài khoản
            </Button>
            <Input 
              placeholder="Tìm theo email, mã NV, họ tên..." 
              prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />} 
              value={searchText} 
              onChange={e => setSearchText(e.target.value)} 
              allowClear 
              style={{ width: 230 }} 
            />
            <Select 
              value={roleFilter} 
              onChange={val => setRoleFilter(val)} 
              style={{ width: 160 }}
            >
              <Option value="ALL">Tất cả vai trò</Option>
              <Option value="ADMIN">Admin</Option>
              <Option value="MANAGER">Quản lý</Option>
              <Option value="HR_MANAGER">HR - Kế toán</Option>
              <Option value="EMPLOYEE">Nhân viên</Option>
            </Select>
            <Tooltip title="Tải lại danh sách">
              <Button icon={<ReloadOutlined />} onClick={fetchData} />
            </Tooltip>
          </Space>
        }
        style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
      >
        <Table 
          columns={columns} 
          dataSource={filteredData} 
          rowKey="id" 
          loading={loading}
          pagination={{ pageSize: 10, showTotal: t => `Tổng cộng ${t} tài khoản` }}
        />
      </Card>

      {/* MODAL 1: THÊM TÀI KHOẢN MỚI */}
      <Modal
        title={
          <Space>
            <PlusOutlined style={{ color: '#1677ff' }} />
            <span>Thêm tài khoản người dùng mới</span>
          </Space>
        }
        open={isCreateModalOpen}
        onOk={handleCreateUser}
        onCancel={() => setIsCreateModalOpen(false)}
        okText="Tạo tài khoản"
        cancelText="Hủy"
        destroyOnClose
      >
        <Form form={createForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item 
            label="Email đăng nhập" 
            name="email" 
            rules={[
              { required: true, message: 'Vui lòng nhập Email' },
              { type: 'email', message: 'Email không đúng định dạng' }
            ]}
          >
            <Input prefix={<MailOutlined style={{ color: '#bfbfbf' }} />} placeholder="vd: user@hrm.com" />
          </Form.Item>

          <Form.Item 
            label="Mật khẩu khởi tạo" 
            name="password" 
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }]}
          >
            <Input.Password prefix={<LockOutlined style={{ color: '#bfbfbf' }} />} placeholder="Mặc định: 123456" />
          </Form.Item>

          <Form.Item 
            label="Phân quyền vai trò" 
            name="role" 
            rules={[{ required: true, message: 'Vui lòng chọn vai trò' }]}
          >
            <Select placeholder="Chọn quyền hệ thống">
              {APP_ROLES.map(r => (
                <Option key={r.value} value={r.value}>
                  <Space>
                    <Tag color={r.color} style={{ margin: 0, fontWeight: 600 }}>{r.label}</Tag>
                    <Text type="secondary" style={{ fontSize: 12 }}>— {r.desc}</Text>
                  </Space>
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="Liên kết Hồ sơ Nhân sự" name="employeeId">
            <Select 
              allowClear 
              placeholder="Chọn nhân viên (nếu có)" 
              showSearch 
              optionFilterProp="children"
            >
              {employees.map(emp => (
                <Option key={emp.id} value={emp.id}>
                  {emp.fullName} ({emp.employeeCode}) — {emp.workEmail || 'Không có email'}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="Trạng thái tài khoản" name="isActive" valuePropName="checked">
            <Switch checkedChildren="Hoạt động" unCheckedChildren="Bị khóa" defaultChecked />
          </Form.Item>
        </Form>
      </Modal>

      {/* MODAL 2: SỬA TÀI KHOẢN */}
      <Modal
        title={
          <Space>
            <EditOutlined style={{ color: '#1677ff' }} />
            <span>Chỉnh sửa tài khoản & phân quyền</span>
          </Space>
        }
        open={isEditModalOpen}
        onOk={handleUpdateUser}
        onCancel={() => setIsEditModalOpen(false)}
        okText="Lưu thay đổi"
        cancelText="Hủy"
        destroyOnClose
      >
        <Form form={editForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item label="Email tài khoản" name="email">
            <Input disabled prefix={<MailOutlined />} />
          </Form.Item>

          <Form.Item 
            label="Phân quyền vai trò" 
            name="role" 
            rules={[{ required: true, message: 'Vui lòng chọn vai trò' }]}
          >
            <Select>
              {APP_ROLES.map(r => (
                <Option key={r.value} value={r.value}>
                  <Space>
                    <Tag color={r.color} style={{ margin: 0, fontWeight: 600 }}>{r.label}</Tag>
                    <Text type="secondary" style={{ fontSize: 12 }}>— {r.desc}</Text>
                  </Space>
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="Liên kết Hồ sơ Nhân sự" name="employeeId">
            <Select 
              allowClear 
              placeholder="Chọn nhân viên liên kết" 
              showSearch 
              optionFilterProp="children"
            >
              {employees.map(emp => (
                <Option key={emp.id} value={emp.id}>
                  {emp.fullName} ({emp.employeeCode})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="Trạng thái tài khoản" name="isActive" valuePropName="checked">
            <Switch checkedChildren="Hoạt động" unCheckedChildren="Bị khóa" />
          </Form.Item>
        </Form>
      </Modal>

      {/* MODAL 3: ĐẶT LẠI MẬT KHẨU */}
      <Modal
        title={
          <Space>
            <KeyOutlined style={{ color: '#fa8c16' }} />
            <span>Đặt lại mật khẩu cho tài khoản</span>
          </Space>
        }
        open={isResetPassModalOpen}
        onOk={handleResetPassword}
        onCancel={() => setIsResetPassModalOpen(false)}
        okText="Xác nhận đổi mật khẩu"
        cancelText="Hủy"
        destroyOnClose
      >
        <Form form={resetPassForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item label="Tài khoản">
            <Input disabled value={selectedUser?.email} prefix={<MailOutlined />} />
          </Form.Item>

          <Form.Item 
            label="Mật khẩu mới" 
            name="newPassword" 
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu mới' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Nhập mật khẩu mới (vd: 123456)" />
          </Form.Item>
        </Form>
      </Modal>

      {/* MODAL 4: XEM CHI TIẾT TÀI KHOẢN */}
      <Modal
        title={
          <Space>
            <EyeOutlined style={{ color: '#1677ff' }} />
            <span>Hồ sơ chi tiết tài khoản</span>
          </Space>
        }
        open={isDetailModalOpen}
        onCancel={() => setIsDetailModalOpen(false)}
        footer={[
          <Button key="close" type="primary" onClick={() => setIsDetailModalOpen(false)}>
            Đóng
          </Button>
        ]}
        width={650}
      >
        {selectedUser && (
          <Descriptions bordered column={1} size="middle" style={{ marginTop: 16 }}>
            <Descriptions.Item label="Email đăng nhập">
              <Text strong style={{ color: '#1677ff' }}>{selectedUser.email}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Vai trò phân quyền">
              <Tag color={getRoleConfig(selectedUser.role).color} style={{ fontWeight: 600, padding: '3px 10px' }}>
                {getRoleConfig(selectedUser.role).label}
              </Tag>
              <Text type="secondary" style={{ fontSize: 12 }}>
                ({getRoleConfig(selectedUser.role).desc})
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              <Tag color={selectedUser.isActive ? 'success' : 'error'}>
                {selectedUser.isActive ? 'Đang hoạt động' : 'Đã bị khóa'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Họ tên nhân viên liên kết">
              <Text strong>{selectedUser.employee?.fullName || 'Chưa liên kết hồ sơ nhân sự'}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Mã nhân viên">
              {selectedUser.employee?.employeeCode ? (
                <Tag color="blue">{selectedUser.employee.employeeCode}</Tag>
              ) : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Phòng ban & Chức danh">
              {selectedUser.employee?.department?.name || 'N/A'} — {selectedUser.employee?.position?.name || 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Ngày tạo tài khoản">
              {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleString('vi-VN') : '-'}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      {/* MODAL 5: CẤU HÌNH TÀI KHOẢN & PHÂN QUYỀN NÂNG CAO */}
      <Modal
        title={
          <Space>
            <SettingOutlined style={{ color: '#7c3aed', fontSize: 18 }} />
            <span style={{ fontWeight: 700 }}>Cấu hình tài khoản: <Text strong style={{ color: '#1e3a8a' }}>{selectedUser?.email}</Text></span>
            {selectedUser && (
              <Tag color={getRoleConfig(selectedUser.role).color} style={{ fontWeight: 600 }}>
                {getRoleConfig(selectedUser.role).label}
              </Tag>
            )}
          </Space>
        }
        open={isConfigModalOpen}
        onOk={handleSaveConfig}
        onCancel={() => setIsConfigModalOpen(false)}
        confirmLoading={savingConfig}
        okText="Lưu cấu hình tài khoản"
        cancelText="Hủy"
        width={920}
        destroyOnClose
        style={{ top: 20 }}
      >
        {configLoading ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <Spin size="large" />
            <div style={{ marginTop: 12 }}><Text type="secondary">Đang tải cấu hình và quyền hạn tài khoản...</Text></div>
          </div>
        ) : (
          <Form form={configForm} layout="vertical" style={{ marginTop: 12 }}>
            <Tabs
              activeKey={activeConfigTab}
              onChange={setActiveConfigTab}
              items={[
                {
                  key: 'permissions',
                  label: (
                    <Space>
                      <SafetyCertificateOutlined style={{ color: '#0284c7' }} />
                      <span>1. Ma trận Phân quyền ({configPermissions.length} quyền)</span>
                    </Space>
                  ),
                  children: (
                    <div style={{ padding: '8px 0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
                        <Text type="secondary" style={{ fontSize: 13 }}>
                          Tích chọn các quyền hạn cụ thể áp dụng cho tài khoản này (ghi đè hoặc bổ sung quyền theo vai trò).
                        </Text>
                        <Space>
                          <Button size="small" onClick={() => applyDefaultRolePermissions(selectedUser?.role)}>
                            Khôi phục quyền theo vai trò ({getRoleConfig(selectedUser?.role).label})
                          </Button>
                          <Button size="small" onClick={selectAllPermissions}>
                            Chọn tất cả
                          </Button>
                          <Button size="small" onClick={clearAllPermissions}>
                            Bỏ chọn hết
                          </Button>
                        </Space>
                      </div>

                      <Row gutter={[16, 16]}>
                        {PERMISSION_GROUPS.map(group => {
                          const groupKeys = group.items.map(i => i.key);
                          const isAllGroupChecked = groupKeys.every(k => configPermissions.includes(k));
                          const isSomeGroupChecked = groupKeys.some(k => configPermissions.includes(k)) && !isAllGroupChecked;

                          const toggleGroup = () => {
                            if (isAllGroupChecked) {
                              setConfigPermissions(prev => prev.filter(k => !groupKeys.includes(k)));
                            } else {
                              setConfigPermissions(prev => Array.from(new Set([...prev, ...groupKeys])));
                            }
                          };

                          return (
                            <Col xs={24} md={12} key={group.key}>
                              <Card
                                size="small"
                                style={{ borderRadius: 8, height: '100%', borderColor: '#e2e8f0', background: '#f8fafc' }}
                                title={
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Text strong style={{ color: group.color, fontSize: 13 }}>{group.title}</Text>
                                    <Checkbox
                                      checked={isAllGroupChecked}
                                      indeterminate={isSomeGroupChecked}
                                      onChange={toggleGroup}
                                    >
                                      <span style={{ fontSize: 11, color: '#64748b' }}>Nhóm này</span>
                                    </Checkbox>
                                  </div>
                                }
                              >
                                <Space direction="vertical" size={6} style={{ width: '100%' }}>
                                  {group.items.map(item => (
                                    <Checkbox
                                      key={item.key}
                                      checked={configPermissions.includes(item.key)}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setConfigPermissions(prev => [...prev, item.key]);
                                        } else {
                                          setConfigPermissions(prev => prev.filter(k => k !== item.key));
                                        }
                                      }}
                                    >
                                      <span style={{ fontSize: 12.5, color: '#334155' }}>{item.label}</span>
                                    </Checkbox>
                                  ))}
                                </Space>
                              </Card>
                            </Col>
                          );
                        })}
                      </Row>
                    </div>
                  )
                },
                {
                  key: 'scope',
                  label: (
                    <Space>
                      <ApartmentOutlined style={{ color: '#16a34a' }} />
                      <span>2. Phạm vi Dữ liệu & Phòng ban</span>
                    </Space>
                  ),
                  children: (
                    <div style={{ padding: '8px 4px' }}>
                      <Card size="small" style={{ marginBottom: 16, borderRadius: 8 }}>
                        <Form.Item
                          label={<Text strong style={{ color: '#1e3a8a' }}>Phạm vi Phòng ban quản lý / xem dữ liệu</Text>}
                          name="scopeType"
                        >
                          <Radio.Group>
                            <Radio value="ALL">Toàn bộ công ty (Tất cả các phòng ban)</Radio>
                            <Radio value="DEPARTMENT">Chỉ các phòng ban được chỉ định cụ thể</Radio>
                          </Radio.Group>
                        </Form.Item>

                        {scopeType === 'DEPARTMENT' && (
                          <Form.Item
                            label="Danh sách phòng ban được phép quản lý & phê duyệt"
                            name="managedDepartmentIds"
                            rules={[{ required: true, message: 'Vui lòng chọn ít nhất 1 phòng ban' }]}
                          >
                            <Select
                              mode="multiple"
                              placeholder="Chọn các phòng ban áp dụng..."
                              style={{ width: '100%' }}
                              options={departments.map(d => ({ label: `${d.name} (${d.code})`, value: d.id }))}
                              showSearch
                              optionFilterProp="label"
                            />
                          </Form.Item>
                        )}
                      </Card>

                      <Card size="small" style={{ borderRadius: 8 }}>
                        <Form.Item
                          label={<Text strong style={{ color: '#1e3a8a' }}>Phạm vi Chi nhánh hoạt động</Text>}
                          name="scopeBranchType"
                        >
                          <Radio.Group>
                            <Radio value="ALL">Toàn bộ chi nhánh</Radio>
                            <Radio value="BRANCH">Chỉ chi nhánh được chỉ định</Radio>
                          </Radio.Group>
                        </Form.Item>

                        {scopeBranchType === 'BRANCH' && (
                          <Form.Item
                            label="Danh sách chi nhánh áp dụng"
                            name="managedBranchIds"
                            rules={[{ required: true, message: 'Vui lòng chọn ít nhất 1 chi nhánh' }]}
                          >
                            <Select
                              mode="multiple"
                              placeholder="Chọn các chi nhánh áp dụng..."
                              style={{ width: '100%' }}
                              options={branches.map(b => ({ label: `${b.name} (${b.code})`, value: b.id }))}
                              showSearch
                              optionFilterProp="label"
                            />
                          </Form.Item>
                        )}
                      </Card>
                    </div>
                  )
                },
                {
                  key: 'security',
                  label: (
                    <Space>
                      <ControlOutlined style={{ color: '#7c3aed' }} />
                      <span>3. Đặc quyền & Bảo mật</span>
                    </Space>
                  ),
                  children: (
                    <div style={{ padding: '8px 4px' }}>
                      <Row gutter={[16, 16]}>
                        <Col xs={24} md={12}>
                          <Card size="small" title={<Text strong>Trạng thái & Mật khẩu</Text>} style={{ borderRadius: 8, height: '100%' }}>
                            <Form.Item label="Trạng thái tài khoản" name="isActive" valuePropName="checked">
                              <Switch checkedChildren="Đang hoạt động" unCheckedChildren="Tạm khóa" />
                            </Form.Item>

                            <Form.Item label="Bắt buộc đổi mật khẩu ở lần đăng nhập tiếp theo" name="mustChangePassword" valuePropName="checked">
                              <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
                            </Form.Item>
                          </Card>
                        </Col>

                        <Col xs={24} md={12}>
                          <Card size="small" title={<Text strong>Đặc quyền mở rộng</Text>} style={{ borderRadius: 8, height: '100%' }}>
                            <Form.Item name="canViewCompanySalary" valuePropName="checked" style={{ marginBottom: 8 }}>
                              <Checkbox>Được quyền xem số liệu bảng lương toàn công ty</Checkbox>
                            </Form.Item>

                            <Form.Item name="canApprovePayroll" valuePropName="checked" style={{ marginBottom: 8 }}>
                              <Checkbox>Được quyền phê duyệt và xác nhận thanh toán kỳ lương</Checkbox>
                            </Form.Item>

                            <Form.Item name="canExportReports" valuePropName="checked" style={{ marginBottom: 8 }}>
                              <Checkbox>Được quyền xuất dữ liệu báo cáo ra file Excel (.csv)</Checkbox>
                            </Form.Item>

                            <Form.Item name="receiveEmailNotif" valuePropName="checked" style={{ marginBottom: 0 }}>
                              <Checkbox>Nhận thông báo đơn từ & phê duyệt qua hệ thống</Checkbox>
                            </Form.Item>
                          </Card>
                        </Col>
                      </Row>

                      <Card size="small" title={<Text strong>Ghi chú cấu hình nội bộ (Admin Note)</Text>} style={{ marginTop: 16, borderRadius: 8 }}>
                        <Form.Item name="adminNotes" style={{ marginBottom: 0 }}>
                          <TextArea rows={3} placeholder="Ghi chú lý do cấp quyền hoặc các ràng buộc đặc biệt cho tài khoản này..." />
                        </Form.Item>
                      </Card>
                    </div>
                  )
                }
              ]}
            />
          </Form>
        )}
      </Modal>
    </div>
  );
};

export default UserListPage;
