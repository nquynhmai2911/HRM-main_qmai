import React, { useEffect, useState } from 'react';
import { Card, Table, Typography, Space, Select, message, Tag } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import apiClient from '../../../lib/api';

const { Title } = Typography;
const { Option } = Select;

const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'red',
  CEO: 'purple',
  HR_MANAGER: 'magenta',
  HR_STAFF: 'pink',
  MANAGER: 'blue',
  EMPLOYEE: 'default',
  ACCOUNTANT: 'cyan',
};

const UserListPage: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/admin/users');
      setData(res.data);
    } catch (error) {
      message.error('Lỗi khi tải dữ liệu tài khoản');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRoleChange = async (userId: string, role: string) => {
    try {
      await apiClient.patch(`/admin/users/${userId}/role`, { role });
      message.success('Cập nhật quyền thành công');
      fetchData();
    } catch (error) {
      message.error('Lỗi khi cập nhật quyền');
    }
  };

  const columns = [
    { title: 'Email', dataIndex: 'email', key: 'email', render: (t: string) => <strong>{t}</strong> },
    { title: 'Mã NV', key: 'empCode', render: (record: any) => record.employee?.employeeCode || '-' },
    { title: 'Họ tên', key: 'empName', render: (record: any) => record.employee?.fullName || '-' },
    { 
      title: 'Trạng thái', 
      dataIndex: 'isActive', 
      key: 'isActive', 
      render: (isActive: boolean) => <Tag color={isActive ? 'green' : 'red'}>{isActive ? 'Hoạt động' : 'Bị khóa'}</Tag> 
    },
    {
      title: 'Phân quyền',
      key: 'role',
      render: (record: any) => (
        <Select 
          value={record.role} 
          style={{ width: 150 }} 
          onChange={(val) => handleRoleChange(record.id, val)}
        >
          <Option value="ADMIN">Admin</Option>
          <Option value="CEO">CEO</Option>
          <Option value="HR_MANAGER">HR Manager</Option>
          <Option value="HR_STAFF">HR Staff</Option>
          <Option value="MANAGER">Manager</Option>
          <Option value="ACCOUNTANT">Accountant</Option>
          <Option value="EMPLOYEE">Employee</Option>
        </Select>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card 
        title={
          <Space>
            <UserOutlined style={{ color: '#1890ff' }} />
            <Title level={4} style={{ margin: 0 }}>Quản lý Tài khoản & Phân quyền</Title>
          </Space>
        }
        style={{ borderRadius: 8 }}
      >
        <Table columns={columns} dataSource={data} rowKey="id" loading={loading} />
      </Card>
    </div>
  );
};

export default UserListPage;
