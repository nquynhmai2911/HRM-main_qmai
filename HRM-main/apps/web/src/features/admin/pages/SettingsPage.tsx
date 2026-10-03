import React, { useEffect, useState } from 'react';
import { Table, Select, message, Spin, Typography, Card, Result } from 'antd';
import apiClient from '../../../lib/api';
import { useAuthStore } from '../../../lib/auth';

const { Title } = Typography;

interface User {
  id: string;
  email: string;
  role: string;
  employee?: {
    fullName: string;
    employeeCode: string;
  };
}

const ROLES = [
  'ADMIN',
  'CEO',
  'HR_MANAGER',
  'HR_STAFF',
  'ACCOUNTANT',
  'MANAGER',
  'EMPLOYEE'
];

const SettingsPage: React.FC = () => {
  const user = useAuthStore(state => state.user);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data } = await apiClient.get('/admin/users');
      setUsers(data);
    } catch (error) {
      message.error('Lỗi khi tải danh sách người dùng!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await apiClient.patch(`/admin/users/${userId}/role`, { role: newRole });
      message.success('Cập nhật quyền thành công!');
      fetchUsers();
    } catch (error) {
      message.error('Lỗi khi cập nhật quyền!');
    }
  };

  const columns = [
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Tên nhân viên',
      key: 'fullName',
      render: (_: any, record: User) => record.employee?.fullName || 'N/A',
    },
    {
      title: 'Mã nhân viên',
      key: 'employeeCode',
      render: (_: any, record: User) => record.employee?.employeeCode || 'N/A',
    },
    {
      title: 'Phân quyền (Role)',
      dataIndex: 'role',
      key: 'role',
      render: (role: string, record: User) => (
        <Select
          value={role}
          style={{ width: 160 }}
          onChange={(value) => handleRoleChange(record.id, value)}
          options={ROLES.map(r => ({ label: r, value: r }))}
        />
      ),
    },
  ];

  if (user?.role !== 'ADMIN') {
    return (
      <Result
        status="403"
        title="403"
        subTitle="Xin lỗi, bạn không có quyền truy cập trang này (Chỉ dành cho Admin)."
      />
    );
  }

  return (
    <Card>
      <Title level={4}>Cấu hình hệ thống - Phân quyền tài khoản</Title>
      {loading ? (
        <Spin />
      ) : (
        <Table
          dataSource={users}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      )}
    </Card>
  );
};

export default SettingsPage;
