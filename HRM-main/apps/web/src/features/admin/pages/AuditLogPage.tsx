import React, { useEffect, useState } from 'react';
import { Card, Table, Typography, Space, message, Tag } from 'antd';
import { SafetyCertificateOutlined } from '@ant-design/icons';
import apiClient from '../../../lib/api';

const { Title, Text } = Typography;

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'green',
  POST: 'green',
  UPDATE: 'orange',
  PUT: 'orange',
  PATCH: 'orange',
  DELETE: 'red',
  LOGIN: 'blue',
  APPROVE: 'cyan',
  REJECT: 'volcano',
};

const AuditLogPage: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/admin/audit-logs');
      setData(res.data);
    } catch (error) {
      message.error('Lỗi khi tải nhật ký hệ thống');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const columns = [
    { 
      title: 'Thời gian', 
      dataIndex: 'createdAt', 
      key: 'createdAt', 
      render: (t: string) => <Text type="secondary">{new Date(t).toLocaleString('vi-VN')}</Text> 
    },
    { 
      title: 'Hành động', 
      dataIndex: 'action', 
      key: 'action', 
      render: (action: string) => {
        // e.g. "CREATE", "UPDATE", "LOGIN"
        const act = action.toUpperCase();
        return <Tag color={ACTION_COLORS[act] || 'default'}>{act}</Tag>;
      } 
    },
    { title: 'Tài nguyên', dataIndex: 'resource', key: 'resource', render: (t: string) => <strong>{t}</strong> },
    { title: 'Resource ID', dataIndex: 'resourceId', key: 'resourceId', render: (t: string) => <Text copyable>{t}</Text> },
    { 
      title: 'Người thực hiện', 
      key: 'user', 
      render: (record: any) => {
        if (!record.user) return '-';
        return record.user.employee?.fullName 
          ? `${record.user.employee.fullName} (${record.user.email})` 
          : record.user.email;
      } 
    },
    { title: 'IP', dataIndex: 'ip', key: 'ip' },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card 
        title={
          <Space>
            <SafetyCertificateOutlined style={{ color: '#52c41a' }} />
            <Title level={4} style={{ margin: 0 }}>Nhật ký hệ thống (Audit Logs)</Title>
          </Space>
        }
        style={{ borderRadius: 8 }}
      >
        <Table 
          columns={columns} 
          dataSource={data} 
          rowKey="id" 
          loading={loading} 
          pagination={{ pageSize: 20 }}
          scroll={{ x: 'max-content' }}
        />
      </Card>
    </div>
  );
};

export default AuditLogPage;
