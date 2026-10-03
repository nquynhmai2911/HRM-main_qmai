import React, { useState, useEffect } from 'react';
import { Card, Table, Typography, Space, Button, message, Tag, Tooltip } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import apiClient from '../../../lib/api';
import { useAuthStore } from '../../../lib/auth';

const { Title, Text } = Typography;

const LeaveApprovalPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [approvals, setApprovals] = useState<any[]>([]);
  const { user } = useAuthStore();

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/leave/approvals');
      setApprovals(res.data);
    } catch (err) {
      message.error('Lỗi khi tải danh sách đơn cần duyệt');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, []);

  const handleApprove = async (id: string, decision: 'APPROVED' | 'REJECTED') => {
    try {
      await apiClient.post(`/leave/approve/${id}`, { decision });
      message.success(`Đã ${decision === 'APPROVED' ? 'duyệt' : 'từ chối'} đơn nghỉ phép!`);
      fetchApprovals();
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Lỗi khi xử lý đơn');
    }
  };

  const columns = [
    {
      title: 'Người xin nghỉ',
      key: 'employee',
      render: (record: any) => (
        <div>
          <div style={{ fontWeight: 600 }}>{record.employee?.fullName}</div>
          <Text type="secondary" style={{ fontSize: 12 }}>{record.employee?.workEmail}</Text>
        </div>
      ),
    },
    {
      title: 'Loại nghỉ phép',
      dataIndex: 'leaveType',
      key: 'leaveType',
      render: (type: any) => <strong>{type?.name}</strong>,
    },
    {
      title: 'Thời gian',
      key: 'time',
      render: (record: any) => (
        <div>
          <div>Từ: {dayjs(record.fromDate).format('DD/MM/YYYY')}</div>
          <div>Đến: {dayjs(record.toDate).format('DD/MM/YYYY')}</div>
        </div>
      ),
    },
    {
      title: 'Số ngày',
      dataIndex: 'days',
      key: 'days',
      render: (val: number) => <Tag color="blue">{val} ngày</Tag>
    },
    {
      title: 'Lý do',
      dataIndex: 'reason',
      key: 'reason',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        let color = 'default';
        let text = status;
        if (status === 'PENDING') { color = 'warning'; text = 'Chờ duyệt'; }
        else if (status === 'APPROVED') { color = 'success'; text = 'Đã duyệt'; }
        else if (status === 'REJECTED') { color = 'error'; text = 'Từ chối'; }
        return <Tag color={color}>{text}</Tag>;
      }
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (record: any) => {
        if (record.status !== 'PENDING') return null;
        return (
          <Space size="small">
            <Button 
              type="primary" 
              size="small" 
              style={{ background: '#52c41a', borderColor: '#52c41a' }} 
              icon={<CheckCircleOutlined />} 
              onClick={() => handleApprove(record.id, 'APPROVED')}
            >
              Duyệt
            </Button>
            <Button 
              danger 
              size="small" 
              icon={<CloseCircleOutlined />} 
              onClick={() => handleApprove(record.id, 'REJECTED')}
            >
              Từ chối
            </Button>
          </Space>
        );
      }
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card 
        title={
          <Space>
            <Title level={4} style={{ margin: 0, color: '#1e3a8a' }}>Duyệt Đơn xin nghỉ phép</Title>
          </Space>
        }
        style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
      >
        <Table 
          columns={columns} 
          dataSource={approvals} 
          rowKey="id" 
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
};

export default LeaveApprovalPage;
