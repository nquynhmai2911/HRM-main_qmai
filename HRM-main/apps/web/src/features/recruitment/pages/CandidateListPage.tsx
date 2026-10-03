import React, { useState, useEffect } from 'react';
import { Table, Card, Typography, Tag, Space, Button, message } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../../lib/api';

const { Title, Text } = Typography;

const CandidateListPage: React.FC = () => {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      // In MVP, we fetch applications which hold candidate data + requisition data
      const appRes = await apiClient.get('/recruitment/applications');
      setCandidates(appRes.data);
    } catch (error) {
      message.error('Lỗi khi tải danh sách ứng viên');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  const columns = [
    {
      title: 'Họ tên',
      dataIndex: ['candidate', 'fullName'],
      key: 'fullName',
      render: (text: string) => <strong>{text}</strong>,
    },
    {
      title: 'Email',
      dataIndex: ['candidate', 'email'],
      key: 'email',
    },
    {
      title: 'Kỹ năng',
      dataIndex: ['candidate', 'skills'],
      key: 'skills',
      render: (skills: string) => skills ? <Tag color="blue">{skills}</Tag> : <Text type="secondary">Chưa cập nhật</Text>,
    },
    {
      title: 'Ứng tuyển vị trí',
      dataIndex: 'requisitionId',
      key: 'requisition',
      render: (_: any, record: any) => (
        <a onClick={() => navigate(`/recruitment/pipeline/${record.requisitionId}`)}>
          {record.requisition?.title || record.requisitionId.substring(0, 8) + '...'}
        </a>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'stage',
      key: 'stage',
      render: (stage: string) => {
        const stageColors: Record<string, string> = {
          NEW: 'blue',
          SCREENING: 'orange',
          INTERVIEW: 'purple',
          OFFER: 'cyan',
          HIRED: 'green',
          REJECTED: 'red',
        };
        const stageTitles: Record<string, string> = {
          NEW: 'Mới ứng tuyển',
          SCREENING: 'Đang sàng lọc',
          INTERVIEW: 'Phỏng vấn',
          OFFER: 'Gửi Offer',
          HIRED: 'Đã nhận việc',
          REJECTED: 'Từ chối',
        };
        return <Tag color={stageColors[stage] || 'default'}>{stageTitles[stage] || stage}</Tag>;
      },
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_: any, record: any) => (
        <Space>
          <Button 
            type="primary" 
            ghost 
            icon={<EyeOutlined />} 
            onClick={() => navigate(`/recruitment/pipeline/${record.requisitionId}`)}
          >
            Đến Pipeline
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Title level={4} style={{ marginBottom: 24 }}>Danh sách Toàn bộ Ứng viên</Title>
        <Table 
          columns={columns} 
          dataSource={candidates} 
          rowKey="id" 
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
};

export default CandidateListPage;
