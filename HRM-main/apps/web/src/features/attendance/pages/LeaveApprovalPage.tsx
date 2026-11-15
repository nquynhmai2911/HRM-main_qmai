import React, { useState, useEffect, useMemo } from 'react';
import { 
  Card, 
  Table, 
  Typography, 
  Space, 
  Button, 
  message, 
  Tag, 
  Tooltip, 
  Row, 
  Col, 
  Statistic, 
  Input, 
  Select, 
  Popconfirm,
  Modal
} from 'antd';
import { 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  ClockCircleOutlined, 
  SearchOutlined,
  AuditOutlined,
  CalendarOutlined,
  MedicineBoxOutlined,
  EyeOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import apiClient from '../../../lib/api';
import { useAuthStore } from '../../../lib/auth';

const { Title, Text } = Typography;
const { Option } = Select;

const getLeaveTypeTag = (name: string = '') => {
  if (name.includes('ốm') || name.includes('Bệnh')) {
    return <Tag color="error" icon={<MedicineBoxOutlined />}>{name}</Tag>;
  }
  if (name.includes('năm')) {
    return <Tag color="processing" icon={<CalendarOutlined />}>{name}</Tag>;
  }
  if (name.includes('thai sản')) {
    return <Tag color="purple">{name}</Tag>;
  }
  if (name.includes('không lương')) {
    return <Tag color="default">{name}</Tag>;
  }
  if (name.includes('Việc riêng')) {
    return <Tag color="cyan">{name}</Tag>;
  }
  return <Tag color="blue">{name || 'Nghỉ phép'}</Tag>;
};

const getStatusTag = (status: string) => {
  if (status === 'PENDING') {
    return <Tag color="warning" icon={<ClockCircleOutlined />}>Chờ duyệt</Tag>;
  }
  if (status === 'APPROVED') {
    return <Tag color="success" icon={<CheckCircleOutlined />}>Đã duyệt</Tag>;
  }
  if (status === 'REJECTED') {
    return <Tag color="error" icon={<CloseCircleOutlined />}>Từ chối</Tag>;
  }
  return <Tag color="default">{status}</Tag>;
};

const LeaveApprovalPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [approvals, setApprovals] = useState<any[]>([]);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('PENDING');
  const [detailModal, setDetailModal] = useState<{ visible: boolean; record: any | null }>({
    visible: false,
    record: null
  });
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
      message.success(`Đã ${decision === 'APPROVED' ? 'phê duyệt' : 'từ chối'} đơn nghỉ phép thành công!`);
      fetchApprovals();
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Lỗi khi xử lý đơn');
    }
  };

  const filteredApprovals = useMemo(() => {
    return approvals.filter(item => {
      const matchStatus = statusFilter === 'ALL' || item.status === statusFilter;
      const q = searchText.toLowerCase();
      const matchSearch = !searchText ||
        (item.employee?.fullName && item.employee.fullName.toLowerCase().includes(q)) ||
        (item.employee?.employeeCode && item.employee.employeeCode.toLowerCase().includes(q)) ||
        (item.employee?.workEmail && item.employee.workEmail.toLowerCase().includes(q)) ||
        (item.leaveType?.name && item.leaveType.name.toLowerCase().includes(q)) ||
        (item.reason && item.reason.toLowerCase().includes(q));
      return matchStatus && matchSearch;
    });
  }, [approvals, statusFilter, searchText]);

  const pendingCount = approvals.filter(r => r.status === 'PENDING').length;
  const approvedCount = approvals.filter(r => r.status === 'APPROVED').length;
  const rejectedCount = approvals.filter(r => r.status === 'REJECTED').length;

  const columns = [
    {
      title: 'Mã NV',
      dataIndex: ['employee', 'employeeCode'],
      key: 'employeeCode',
      width: 110,
      render: (code: string) => (
        <Tag color="blue" style={{ fontWeight: 600 }}>{code || 'N/A'}</Tag>
      ),
    },
    {
      title: 'Họ và tên',
      dataIndex: ['employee', 'fullName'],
      key: 'fullName',
      width: 180,
      render: (name: string) => (
        <Text strong style={{ color: '#1e3a8a', fontSize: 13 }}>{name || 'N/A'}</Text>
      ),
    },
    {
      title: 'Email',
      dataIndex: ['employee', 'workEmail'],
      key: 'email',
      width: 190,
      render: (email: string) => (
        <Text style={{ fontSize: 13 }}>{email || '-'}</Text>
      ),
    },
    {
      title: 'Số điện thoại',
      dataIndex: ['employee', 'phone'],
      key: 'phone',
      width: 130,
      align: 'center' as const,
      render: (phone: string) => (
        <Text style={{ fontSize: 13, fontFamily: 'monospace' }}>{phone || '-'}</Text>
      ),
    },
    {
      title: 'Phòng ban',
      key: 'department',
      width: 160,
      render: (record: any) => (
        <Text style={{ fontSize: 13 }}>{record.employee?.department?.name || '-'}</Text>
      ),
    },
    {
      title: 'Chức vụ',
      key: 'position',
      width: 150,
      render: (record: any) => (
        <Text style={{ fontSize: 13 }}>{record.employee?.position?.name || '-'}</Text>
      ),
    },
    {
      title: 'Loại nghỉ phép',
      dataIndex: 'leaveType',
      key: 'leaveType',
      width: 160,
      align: 'center' as const,
      render: (type: any) => getLeaveTypeTag(type?.name),
    },
    {
      title: 'Từ ngày',
      dataIndex: 'fromDate',
      key: 'fromDate',
      width: 120,
      align: 'center' as const,
      render: (val: string) => (
        <Text style={{ fontSize: 13 }}>{val ? dayjs(val).format('DD/MM/YYYY') : '-'}</Text>
      ),
    },
    {
      title: 'Đến ngày',
      dataIndex: 'toDate',
      key: 'toDate',
      width: 120,
      align: 'center' as const,
      render: (val: string) => (
        <Text style={{ fontSize: 13 }}>{val ? dayjs(val).format('DD/MM/YYYY') : '-'}</Text>
      ),
    },
    {
      title: 'Số ngày',
      dataIndex: 'days',
      key: 'days',
      width: 110,
      align: 'center' as const,
      render: (val: number) => (
        <Tag color="blue" style={{ fontSize: 13, padding: '2px 8px', fontWeight: 600 }}>
          {val} ngày
        </Tag>
      ),
    },
    {
      title: 'Lý do xin nghỉ',
      dataIndex: 'reason',
      key: 'reason',
      width: 300,
      render: (val: string) => (
        <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.5, wordBreak: 'break-word', whiteSpace: 'normal' }}>
          {val || <Text type="secondary">Không có lý do</Text>}
        </div>
      ),
    },
    {
      title: 'Ngày nộp đơn',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      align: 'center' as const,
      render: (val: string) => (
        <Text style={{ fontSize: 13, color: '#64748b' }}>
          {val ? dayjs(val).format('DD/MM/YYYY HH:mm') : '-'}
        </Text>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      align: 'center' as const,
      render: (status: string) => getStatusTag(status),
    },
    {
      title: 'Hành động',
      key: 'action',
      width: 130,
      align: 'center' as const,
      fixed: 'right' as const,
      render: (record: any) => {
        const isPending = record.status === 'PENDING';
        return (
          <Space size={6} wrap={false} style={{ justifyContent: 'center' }}>
            <Tooltip title="Xem chi tiết đơn nghỉ">
              <Button 
                type="text"
                size="small" 
                icon={<EyeOutlined style={{ color: '#1677ff' }} />} 
                onClick={() => setDetailModal({ visible: true, record })}
              />
            </Tooltip>

            <Tooltip title={isPending ? 'Phê duyệt đơn xin nghỉ' : 'Đơn đã được xử lý'}>
              <span>
                <Popconfirm
                  title="Phê duyệt đơn nghỉ phép?"
                  description={`Bạn có chắc chắn muốn duyệt đơn cho ${record.employee?.fullName}?`}
                  onConfirm={() => handleApprove(record.id, 'APPROVED')}
                  okText="Đồng ý duyệt"
                  cancelText="Hủy"
                  disabled={!isPending}
                >
                  <Button 
                    type="text" 
                    size="small" 
                    disabled={!isPending}
                    icon={<CheckCircleOutlined style={{ color: isPending ? '#52c41a' : undefined }} />} 
                  />
                </Popconfirm>
              </span>
            </Tooltip>

            <Tooltip title={isPending ? 'Từ chối đơn xin nghỉ' : 'Đơn đã được xử lý'}>
              <span>
                <Popconfirm
                  title="Từ chối đơn nghỉ phép?"
                  description={`Bạn có chắc chắn muốn từ chối đơn của ${record.employee?.fullName}?`}
                  onConfirm={() => handleApprove(record.id, 'REJECTED')}
                  okText="Từ chối"
                  cancelText="Hủy"
                  okButtonProps={{ danger: true }}
                  disabled={!isPending}
                >
                  <Button 
                    type="text"
                    danger 
                    size="small" 
                    disabled={!isPending}
                    icon={<CloseCircleOutlined />} 
                  />
                </Popconfirm>
              </span>
            </Tooltip>
          </Space>
        );
      }
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      {/* Metric Cards */}
      <Row gutter={20} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card style={{ borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <Statistic 
              title="Tổng số đơn nhận được" 
              value={approvals.length} 
              prefix={<AuditOutlined style={{ color: '#1677ff' }} />} 
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card style={{ borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <Statistic 
              title="Đơn đang chờ duyệt" 
              value={pendingCount} 
              valueStyle={{ color: '#faad14' }} 
              prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />} 
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card style={{ borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <Statistic 
              title="Đơn đã phê duyệt" 
              value={approvedCount} 
              valueStyle={{ color: '#52c41a' }} 
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />} 
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card style={{ borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <Statistic 
              title="Đơn đã từ chối" 
              value={rejectedCount} 
              valueStyle={{ color: '#ff4d4f' }} 
              prefix={<CloseCircleOutlined style={{ color: '#ff4d4f' }} />} 
            />
          </Card>
        </Col>
      </Row>

      <Card 
        title={
          <Space align="center">
            <div style={{ 
              width: 32, 
              height: 32, 
              borderRadius: 6, 
              backgroundColor: '#f6ffed', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 18 }} />
            </div>
            <div>
              <Title level={4} style={{ margin: 0, color: '#1e3a8a' }}>Duyệt Đơn xin nghỉ phép / Nghỉ ốm</Title>
              <Text type="secondary" style={{ fontSize: 12 }}>Phê duyệt hoặc từ chối các yêu cầu nghỉ phép của nhân sự</Text>
            </div>
          </Space>
        }
        extra={
          <Space size="middle">
            <Input 
              placeholder="Tìm theo Mã NV, Họ tên, Email, Lý do..." 
              prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />} 
              value={searchText} 
              onChange={e => setSearchText(e.target.value)} 
              allowClear 
              style={{ width: 280 }} 
            />
            <Select 
              value={statusFilter} 
              onChange={val => setStatusFilter(val)} 
              style={{ width: 150 }}
            >
              <Option value="ALL">Tất cả trạng thái</Option>
              <Option value="PENDING">Chờ duyệt</Option>
              <Option value="APPROVED">Đã duyệt</Option>
              <Option value="REJECTED">Đã từ chối</Option>
            </Select>
            <Button onClick={fetchApprovals}>Làm mới</Button>
          </Space>
        }
        style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
      >
        <Table 
          columns={columns} 
          dataSource={filteredApprovals} 
          rowKey="id" 
          loading={loading}
          scroll={{ x: 1900 }}
          pagination={{ pageSize: 10, showTotal: (total) => `Tổng cộng ${total} đơn` }}
        />
      </Card>

      {/* Detail Modal */}
      <Modal
        title={
          <Space>
            <AuditOutlined style={{ color: '#1677ff' }} />
            <span>Chi tiết Đơn nghỉ phép của nhân sự</span>
          </Space>
        }
        open={detailModal.visible}
        onCancel={() => setDetailModal({ visible: false, record: null })}
        footer={[
          <Button key="close" type="primary" onClick={() => setDetailModal({ visible: false, record: null })}>
            Đóng
          </Button>
        ]}
        width={600}
      >
        {detailModal.record && (
          <div style={{ marginTop: 16 }}>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Text type="secondary">Mã nhân viên: </Text>
                <div><Tag color="blue">{detailModal.record.employee?.employeeCode}</Tag></div>
              </Col>
              <Col span={12}>
                <Text type="secondary">Họ và tên: </Text>
                <div><Text strong>{detailModal.record.employee?.fullName}</Text></div>
              </Col>
              <Col span={12}>
                <Text type="secondary">Email: </Text>
                <div><Text>{detailModal.record.employee?.workEmail || '-'}</Text></div>
              </Col>
              <Col span={12}>
                <Text type="secondary">Số điện thoại: </Text>
                <div><Text>{detailModal.record.employee?.phone || '-'}</Text></div>
              </Col>
              <Col span={12}>
                <Text type="secondary">Phòng ban: </Text>
                <div><Text>{detailModal.record.employee?.department?.name || '-'}</Text></div>
              </Col>
              <Col span={12}>
                <Text type="secondary">Chức vụ: </Text>
                <div><Text>{detailModal.record.employee?.position?.name || '-'}</Text></div>
              </Col>
              <Col span={12}>
                <Text type="secondary">Loại nghỉ phép: </Text>
                <div>{getLeaveTypeTag(detailModal.record.leaveType?.name)}</div>
              </Col>
              <Col span={12}>
                <Text type="secondary">Trạng thái: </Text>
                <div>{getStatusTag(detailModal.record.status)}</div>
              </Col>
              <Col span={12}>
                <Text type="secondary">Từ ngày: </Text>
                <div><Text strong>{dayjs(detailModal.record.fromDate).format('DD/MM/YYYY')}</Text></div>
              </Col>
              <Col span={12}>
                <Text type="secondary">Đến ngày: </Text>
                <div><Text strong>{dayjs(detailModal.record.toDate).format('DD/MM/YYYY')}</Text></div>
              </Col>
              <Col span={12}>
                <Text type="secondary">Số ngày nghỉ: </Text>
                <div><Tag color="blue">{detailModal.record.days} ngày</Tag></div>
              </Col>
              <Col span={12}>
                <Text type="secondary">Ngày nộp đơn: </Text>
                <div><Text>{dayjs(detailModal.record.createdAt).format('DD/MM/YYYY HH:mm')}</Text></div>
              </Col>
              <Col span={24}>
                <Text type="secondary">Lý do xin nghỉ: </Text>
                <div style={{ 
                  backgroundColor: '#f8fafc', 
                  padding: '10px 14px', 
                  borderRadius: 6, 
                  border: '1px solid #e2e8f0', 
                  marginTop: 6 
                }}>
                  {detailModal.record.reason || 'Không có lý do chi tiết'}
                </div>
              </Col>
            </Row>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default LeaveApprovalPage;
