import React, { useState, useEffect } from 'react';
import { 
  Card, Table, Typography, Space, Button, Tag, Row, Col, Statistic, 
  Input, Select, message, Modal, Descriptions, Tooltip, Divider, Popconfirm
} from 'antd';

import { 
  PlusOutlined, EditOutlined, DeleteOutlined, TeamOutlined, 
  CheckCircleOutlined, ClockCircleOutlined, UserOutlined, 
  SearchOutlined, EyeOutlined, AuditOutlined, PhoneOutlined, MailOutlined
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
      title: 'Mã NV & Họ tên',
      key: 'employee',
      render: (record: any) => (
        <div>
          <div style={{ fontWeight: 600, color: '#1e3a8a', fontSize: 14 }}>
            {record.fullName}
          </div>
          <Space size={6} style={{ marginTop: 2 }}>
            <Tag color="blue" style={{ fontSize: 11 }}>{record.employeeCode}</Tag>
            {record.gender === 'FEMALE' ? <Tag color="magenta">Nữ</Tag> : <Tag color="geekblue">Nam</Tag>}
          </Space>
        </div>
      ),
    },
    {
      title: 'Liên hệ',
      key: 'contact',
      render: (record: any) => (
        <div style={{ fontSize: 12 }}>
          <div><MailOutlined style={{ marginRight: 5, color: '#64748b' }} />{record.workEmail}</div>
          {record.phone && (
            <div style={{ color: '#64748b', marginTop: 2 }}>
              <PhoneOutlined style={{ marginRight: 5 }} />{record.phone}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Phòng ban & Chức danh',
      key: 'position',
      render: (record: any) => (
        <div>
          <div style={{ fontWeight: 500 }}>{record.position?.name || 'N/A'}</div>
          <Text type="secondary" style={{ fontSize: 12 }}>{record.department?.name || 'N/A'}</Text>
        </div>
      ),
    },
    {
      title: 'Hợp đồng hiện tại',
      key: 'contract',
      render: (record: any) => {
        const contract = record.contracts?.[0];
        if (!contract) return <Text type="secondary" style={{ fontSize: 12 }}>Chưa có HĐ</Text>;
        
        let typeName = 'HĐLĐ';
        let color = 'cyan';
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
          <div>
            <Tag color={color}>{typeName}</Tag>
            <div style={{ fontSize: 12, color: '#16a34a', fontWeight: 600, marginTop: 2 }}>
              {contract.baseSalary ? `${contract.baseSalary.toLocaleString()} VNĐ` : ''}
            </div>
          </div>
        );
      },
    },
    {
      title: 'Ngày vào làm',
      dataIndex: 'joinDate',
      key: 'joinDate',
      render: (date: any) => date ? dayjs(date).format('DD/MM/YYYY') : 'Chưa xác định',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => renderStatusTag(status),
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (record: any) => (
        <Space size="small">
          <Tooltip title="Xem thông tin chi tiết">
            <Button 
              type="text" 
              icon={<EyeOutlined />} 
              onClick={() => {
                setSelectedEmp(record);
                setIsDetailModalVisible(true);
              }} 
            />
          </Tooltip>
          {record.status === 'PROBATION' && (
            <Tooltip title="Đến màn Đánh giá Thử việc">
              <Button 
                type="text" 
                icon={<AuditOutlined />} 
                style={{ color: '#d97706' }}
                onClick={() => navigate('/contracts/probation')}
              />
            </Tooltip>
          )}
          <PermissionGate resource="employee" action="update">
            <Button 
              type="text" 
              icon={<EditOutlined />} 
              style={{ color: '#1677ff' }} 
              onClick={() => {
                setEditingEmployee(record);
                setIsFormModalVisible(true);
              }}
            />
          </PermissionGate>
          <PermissionGate resource="employee" action="delete">
            <Popconfirm title="Bạn có chắc chắn muốn xoá nhân viên này?" onConfirm={() => handleDelete(record.id)}>
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </PermissionGate>
        </Space>
      ),
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

          <Button onClick={fetchEmployees}>
            Làm mới danh sách
          </Button>
        </div>

        <Table 
          dataSource={filteredEmployees} 
          columns={columns} 
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10, showTotal: (total) => `Tổng cộng ${total} nhân viên` }}
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
