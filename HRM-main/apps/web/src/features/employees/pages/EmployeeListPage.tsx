import React, { useState, useEffect } from 'react';
import { 
  Card, Table, Typography, Space, Button, Tag, Row, Col, Statistic, 
  Input, Select, message, Modal, Descriptions, Tooltip, Divider, Popconfirm
} from 'antd';

import { 
  PlusOutlined, EditOutlined, DeleteOutlined, TeamOutlined, 
  CheckCircleOutlined, ClockCircleOutlined, UserOutlined, 
  SearchOutlined, EyeOutlined, AuditOutlined, PhoneOutlined, MailOutlined,
  FileExcelOutlined, ReloadOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import apiClient from '../../../lib/api';
import { PermissionGate } from '../../../components/PermissionGate';
import EmployeeFormModal from '../components/EmployeeFormModal';

const { Title, Text } = Typography;

const EmployeeListPage: React.FC = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedEmp, setSelectedEmp] = useState<any>(null);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  
  // States for Add/Edit Modal
  const [isFormModalVisible, setIsFormModalVisible] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<any>(null);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/employees');
      setEmployees(res.data);
    } catch (error) {
      console.error('Lỗi khi tải danh sách nhân viên', error);
      message.error('Không thể tải danh sách nhân viên');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await apiClient.delete(`/employees/${id}`);
      message.success('Đã xoá nhân viên thành công');
      fetchEmployees();
    } catch (error) {
      console.error('Lỗi khi xoá nhân viên', error);
      message.error('Không thể xoá nhân viên này');
    }
  };

  const exportToExcel = () => {
    try {
      const headers = ['STT', 'Mã NV', 'Họ và tên', 'Giới tính', 'Email', 'SĐT', 'Phòng ban', 'Chức vụ', 'Mức lương (VNĐ)', 'Ngày vào làm', 'Trạng thái'];
      const rows = filteredEmployees.map((e: any, idx: number) => [
        idx + 1,
        e.employeeCode || '',
        `"${(e.fullName || '').replace(/"/g, '""')}"`,
        e.gender === 'FEMALE' ? 'Nữ' : e.gender === 'MALE' ? 'Nam' : 'Khác',
        e.workEmail || e.personalEmail || '',
        `"${e.phone || ''}"`,
        `"${(e.department?.name || '').replace(/"/g, '""')}"`,
        `"${(e.position?.name || '').replace(/"/g, '""')}"`,
        e.contracts?.[0]?.baseSalary || 0,
        e.joinDate ? dayjs(e.joinDate).format('DD/MM/YYYY') : '',
        e.status === 'ACTIVE' ? 'Chính thức' : e.status === 'PROBATION' ? 'Thử việc' : e.status === 'ONBOARDING' ? 'Tiếp nhận' : 'Đã nghỉ'
      ]);

      const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Danh_sach_nhan_vien_${dayjs().format('YYYYMMDD_HHmm')}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      message.success('Đã xuất danh sách nhân sự ra file Excel (.csv) thành công!');
    } catch {
      message.error('Lỗi khi xuất file Excel');
    }
  };

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch = 
      !searchText ||
      emp.fullName?.toLowerCase().includes(searchText.toLowerCase()) ||
      emp.employeeCode?.toLowerCase().includes(searchText.toLowerCase()) ||
      emp.workEmail?.toLowerCase().includes(searchText.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || emp.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalEmployees = employees.length;
  const activeCount = employees.filter(e => e.status === 'ACTIVE').length;
  const probationCount = employees.filter(e => e.status === 'PROBATION').length;
  const onboardingCount = employees.filter(e => e.status === 'ONBOARDING').length;

  const renderStatusTag = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Tag color="success" icon={<CheckCircleOutlined />}>Chính thức</Tag>;
      case 'PROBATION':
        return <Tag color="warning" icon={<ClockCircleOutlined />}>Thử việc</Tag>;
      case 'ONBOARDING':
        return <Tag color="processing">Tiếp nhận</Tag>;
      case 'RESIGNED':
        return <Tag color="error">Đã nghỉ việc</Tag>;
      default:
        return <Tag>{status}</Tag>;
    }
  };

  const columns = [
    {
      title: 'Mã NV',
      dataIndex: 'employeeCode',
      key: 'employeeCode',
      width: 105,
      fixed: 'left' as const,
      render: (code: string) => (
        <Tag
          color="blue"
          style={{
            fontFamily: 'monospace',
            fontWeight: 700,
            fontSize: 12,
            borderRadius: 4,
            padding: '1px 8px',
          }}
        >
          {code}
        </Tag>
      ),
    },
    {
      title: 'Họ và tên',
      dataIndex: 'fullName',
      key: 'fullName',
      width: 175,
      fixed: 'left' as const,
      render: (name: string, record: any) => (
        <span
          style={{
            fontWeight: 600,
            color: '#0f172a',
            fontSize: 13.5,
            cursor: 'pointer',
          }}
          onClick={() => {
            setSelectedEmp(record);
            setIsDetailModalVisible(true);
          }}
        >
          {name}
        </span>
      ),
    },
    {
      title: 'Ngày sinh',
      dataIndex: 'dob',
      key: 'dob',
      width: 115,
      align: 'center' as const,
      render: (date: any) => (
        <span style={{ fontSize: 13, color: '#475569' }}>
          {date ? dayjs(date).format('DD/MM/YYYY') : <span style={{ color: '#94a3b8' }}>-</span>}
        </span>
      ),
    },
    {
      title: 'Giới tính',
      dataIndex: 'gender',
      key: 'gender',
      width: 95,
      align: 'center' as const,
      render: (gender: string) => {
        if (gender === 'FEMALE') {
          return (
            <Tag color="magenta" bordered={false} style={{ fontWeight: 600, fontSize: 11.5, borderRadius: 4 }}>
              Nữ
            </Tag>
          );
        }
        if (gender === 'MALE') {
          return (
            <Tag color="geekblue" bordered={false} style={{ fontWeight: 600, fontSize: 11.5, borderRadius: 4 }}>
              Nam
            </Tag>
          );
        }
        return <Tag bordered={false}>Khác</Tag>;
      },
    },
    {
      title: 'Email',
      key: 'email',
      width: 205,
      render: (record: any) => {
        const email = record.workEmail || record.personalEmail;
        if (!email) return <span style={{ color: '#94a3b8' }}>-</span>;
        return (
          <span style={{ fontSize: 12.5, color: '#334155' }}>
            <MailOutlined style={{ marginRight: 6, color: '#94a3b8' }} />
            {email}
          </span>
        );
      },
    },
    {
      title: 'SĐT',
      dataIndex: 'phone',
      key: 'phone',
      width: 135,
      align: 'center' as const,
      render: (phone: string) => (
        <span style={{ fontSize: 12.5, color: '#334155', fontFamily: 'monospace' }}>
          {phone ? (
            <>
              <PhoneOutlined style={{ marginRight: 5, color: '#94a3b8' }} />
              {phone}
            </>
          ) : (
            <span style={{ color: '#94a3b8' }}>-</span>
          )}
        </span>
      ),
    },
    {
      title: 'Phòng ban',
      key: 'department',
      width: 185,
      render: (record: any) => {
        const deptName = record.department?.name;
        if (!deptName) return <span style={{ color: '#94a3b8' }}>-</span>;
        return (
          <Tag color="cyan" style={{ borderRadius: 4, fontWeight: 500, fontSize: 12, padding: '2px 8px' }}>
            {deptName}
          </Tag>
        );
      },
    },
    {
      title: 'Chức vụ',
      key: 'position',
      width: 175,
      render: (record: any) => (
        <span style={{ fontWeight: 600, color: '#1e293b', fontSize: 13 }}>
          {record.position?.name || <span style={{ color: '#94a3b8', fontWeight: 400 }}>-</span>}
        </span>
      ),
    },
    {
      title: 'Loại hợp đồng',
      key: 'contractType',
      width: 165,
      align: 'center' as const,
      render: (record: any) => {
        const contract = record.contracts?.[0];
        if (!contract) return <Text type="secondary" style={{ fontSize: 12 }}>Chưa có HĐ</Text>;

        let typeName = 'HĐ Lao động';
        let color = 'default';
        if (contract.type === 'PROBATION') {
          typeName = `Thử việc (${contract.probationSalaryPercent || 85}%)`;
          color = 'orange';
        } else if (contract.type === 'DEFINITE_1Y') {
          typeName = 'Chính thức 1 năm';
          color = 'green';
        } else if (contract.type === 'INDEFINITE') {
          typeName = 'Không xác định TH';
          color = 'purple';
        }

        return (
          <Tag color={color} bordered={false} style={{ fontWeight: 600, fontSize: 11.5, borderRadius: 4 }}>
            {typeName}
          </Tag>
        );
      },
    },
    {
      title: 'Mức lương',
      key: 'salary',
      width: 145,
      align: 'right' as const,
      render: (record: any) => {
        const contract = record.contracts?.[0];
        if (!contract?.baseSalary) return <span style={{ color: '#94a3b8' }}>-</span>;
        return (
          <span
            style={{
              color: '#059669',
              fontWeight: 700,
              fontSize: 13,
              fontFamily: 'monospace',
            }}
          >
            {contract.baseSalary.toLocaleString('vi-VN')} đ
          </span>
        );
      },
    },
    {
      title: 'Ngày vào làm',
      dataIndex: 'joinDate',
      key: 'joinDate',
      width: 125,
      align: 'center' as const,
      render: (date: any) => (
        <span style={{ fontSize: 13, color: '#475569' }}>
          {date ? dayjs(date).format('DD/MM/YYYY') : <span style={{ color: '#94a3b8' }}>Chưa rõ</span>}
        </span>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      align: 'center' as const,
      render: (status: string) => renderStatusTag(status),
    },
    {
      title: 'Hành động',
      key: 'action',
      width: 150,
      fixed: 'right' as const,
      align: 'center' as const,
      render: (record: any) => {
        const isProbation = record.status === 'PROBATION';
        return (
          <Space size={4} wrap={false} style={{ justifyContent: 'center' }}>
            <Tooltip title="Xem thông tin chi tiết">
              <Button 
                type="text"
                size="small"
                icon={<EyeOutlined style={{ color: '#1677ff' }} />} 
                onClick={() => {
                  setSelectedEmp(record);
                  setIsDetailModalVisible(true);
                }} 
              />
            </Tooltip>
            
            <Tooltip title={isProbation ? 'Đến màn Đánh giá Thử việc' : 'Nhân viên không trong diện thử việc'}>
              <span>
                <Button 
                  type="text" 
                  size="small"
                  disabled={!isProbation}
                  icon={<AuditOutlined style={{ color: isProbation ? '#d97706' : undefined }} />} 
                  onClick={() => navigate('/contracts/probation')}
                />
              </span>
            </Tooltip>

            <PermissionGate resource="employee" action="update">
              <Tooltip title="Chỉnh sửa thông tin nhân viên">
                <Button 
                  type="text" 
                  size="small"
                  icon={<EditOutlined style={{ color: '#1677ff' }} />} 
                  onClick={() => {
                    setEditingEmployee(record);
                    setIsFormModalVisible(true);
                  }}
                />
              </Tooltip>
            </PermissionGate>

            <PermissionGate resource="employee" action="delete">
              <Popconfirm title="Bạn có chắc chắn muốn xoá nhân viên này?" onConfirm={() => handleDelete(record.id)}>
                <Tooltip title="Xoá nhân viên">
                  <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                </Tooltip>
              </Popconfirm>
            </PermissionGate>
          </Space>
        );
      },
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      {/* Top Banner & Stats */}
      <Card style={{ marginBottom: 20, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <Title level={4} style={{ margin: 0, color: '#1e3a8a', fontWeight: 700 }}>
              Danh sách Hồ sơ Nhân viên
            </Title>
            <Text type="secondary" style={{ fontSize: 13 }}>
              Quản lý toàn bộ nhân sự chính thức, thử việc và nhân sự mới tiếp nhận trong doanh nghiệp.
            </Text>
          </div>

          <Space>
            <Button 
              icon={<AuditOutlined />} 
              onClick={() => navigate('/contracts/probation')}
              style={{ borderColor: '#d97706', color: '#d97706' }}
            >
              Màn Thử việc & Đánh giá
            </Button>
            <PermissionGate resource="employee" action="create">
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={() => {
                  setEditingEmployee(null);
                  setIsFormModalVisible(true);
                }}
              >
                Thêm Nhân sự
              </Button>
            </PermissionGate>
          </Space>
        </div>

        <Divider style={{ margin: '16px 0' }} />

        <Row gutter={16}>
          <Col span={6}>
            <Statistic 
              title="Tổng số Nhân sự" 
              value={totalEmployees} 
              prefix={<TeamOutlined style={{ color: '#1677ff' }} />} 
            />
          </Col>
          <Col span={6}>
            <Statistic 
              title="Nhân viên Chính thức" 
              value={activeCount} 
              valueStyle={{ color: '#16a34a' }}
              prefix={<CheckCircleOutlined />} 
            />
          </Col>
          <Col span={6}>
            <Statistic 
              title="Đang Thử việc" 
              value={probationCount} 
              valueStyle={{ color: '#d97706' }}
              prefix={<ClockCircleOutlined />} 
            />
          </Col>
          <Col span={6}>
            <Statistic 
              title="Tiếp nhận Onboarding" 
              value={onboardingCount} 
              valueStyle={{ color: '#0284c7' }}
              prefix={<UserOutlined />} 
            />
          </Col>
        </Row>
      </Card>

      {/* Filter and Table Card */}
      <Card bordered={false} style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
          <Space>
            <Input 
              placeholder="Tìm theo Tên, Mã NV, Email..." 
              prefix={<SearchOutlined style={{ color: '#94a3b8' }} />} 
              style={{ width: 280 }}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
            <Select 
              value={statusFilter} 
              onChange={setStatusFilter} 
              style={{ width: 180 }}
              options={[
                { label: 'Tất cả trạng thái', value: 'ALL' },
                { label: 'Chính thức (ACTIVE)', value: 'ACTIVE' },
                { label: 'Thử việc (PROBATION)', value: 'PROBATION' },
                { label: 'Tiếp nhận (ONBOARDING)', value: 'ONBOARDING' },
                { label: 'Đã nghỉ (RESIGNED)', value: 'RESIGNED' },
              ]}
            />
          </Space>

          <Space size={10}>
            <Button
              icon={<FileExcelOutlined />}
              style={{
                background: '#107c41',
                color: '#fff',
                borderColor: '#107c41',
                fontWeight: 600,
                borderRadius: 6
              }}
              onClick={exportToExcel}
            >
              Xuất file Excel (.csv)
            </Button>
            <Button icon={<ReloadOutlined />} onClick={fetchEmployees} style={{ borderRadius: 6 }}>
              Làm mới danh sách
            </Button>
          </Space>
        </div>

        <Table 
          dataSource={filteredEmployees} 
          columns={columns} 
          rowKey="id"
          loading={loading}
          scroll={{ x: 2000 }}
          pagination={{ 
            pageSize: 10, 
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50', '100'],
            showTotal: (total) => `Tổng cộng ${total} nhân viên` 
          }}
        />
      </Card>

      {/* Modal Chi tiết Nhân viên */}
      <Modal
        title={
          <Space>
            <UserOutlined style={{ color: '#1677ff' }} />
            <span>Hồ sơ Chi tiết Nhân sự - {selectedEmp?.fullName}</span>
          </Space>
        }
        open={isDetailModalVisible}
        onCancel={() => setIsDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsDetailModalVisible(false)}>
            Đóng
          </Button>,
          selectedEmp?.status === 'PROBATION' && (
            <Button 
              key="probation" 
              type="primary" 
              icon={<AuditOutlined />}
              onClick={() => {
                setIsDetailModalVisible(false);
                navigate('/contracts/probation');
              }}
            >
              Đến Đánh giá Thử việc
            </Button>
          ),
        ]}
        width={700}
      >
        {selectedEmp && (
          <div>
            <Descriptions bordered size="small" column={2} style={{ marginTop: 12 }}>
              <Descriptions.Item label="Mã Nhân viên">
                <Tag color="blue">{selectedEmp.employeeCode}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Họ và tên">
                <strong>{selectedEmp.fullName}</strong>
              </Descriptions.Item>
              <Descriptions.Item label="Phòng ban">
                {selectedEmp.department?.name || 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Chức danh / Vị trí">
                {selectedEmp.position?.name || 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Email công việc">
                {selectedEmp.workEmail}
              </Descriptions.Item>
              <Descriptions.Item label="Số điện thoại">
                {selectedEmp.phone || 'Chưa cập nhật'}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày gia nhập">
                {selectedEmp.joinDate ? dayjs(selectedEmp.joinDate).format('DD/MM/YYYY') : 'Chưa cập nhật'}
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái hồ sơ">
                {renderStatusTag(selectedEmp.status)}
              </Descriptions.Item>
            </Descriptions>

            <Divider orientation="left" style={{ margin: '16px 0 12px 0' }}>Thông tin Hợp đồng & Chế độ</Divider>

            {selectedEmp.contracts?.[0] ? (
              <Descriptions bordered size="small" column={2}>
                <Descriptions.Item label="Loại hợp đồng">
                  <Tag color={selectedEmp.contracts[0].type === 'PROBATION' ? 'orange' : 'green'}>
                    {selectedEmp.contracts[0].type === 'PROBATION' ? 'Hợp đồng Thử việc' : 'Hợp đồng Chính thức'}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Mức lương cơ sở">
                  <strong style={{ color: '#16a34a' }}>
                    {selectedEmp.contracts[0].baseSalary?.toLocaleString()} VNĐ
                  </strong>
                </Descriptions.Item>
                <Descriptions.Item label="Tỷ lệ lương">
                  {selectedEmp.contracts[0].probationSalaryPercent || 100}%
                </Descriptions.Item>
                <Descriptions.Item label="Thời hạn Hợp đồng">
                  {dayjs(selectedEmp.contracts[0].startDate).format('DD/MM/YYYY')} - {selectedEmp.contracts[0].endDate ? dayjs(selectedEmp.contracts[0].endDate).format('DD/MM/YYYY') : 'Vô thời hạn'}
                </Descriptions.Item>
              </Descriptions>
            ) : (
              <Text type="secondary">Chưa thiết lập hợp đồng lao động.</Text>
            )}
          </div>
        )}
      </Modal>
      <EmployeeFormModal 
        visible={isFormModalVisible}
        onCancel={() => setIsFormModalVisible(false)}
        onSuccess={() => {
          setIsFormModalVisible(false);
          fetchEmployees();
        }}
        employeeData={editingEmployee}
      />
    </div>
  );
};

export default EmployeeListPage;
