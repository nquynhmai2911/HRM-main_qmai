import React, { useState, useEffect, useMemo } from 'react';
import { 
  Card, 
  Table, 
  Typography, 
  Space, 
  Button, 
  Modal, 
  Form, 
  Input, 
  DatePicker, 
  Select, 
  InputNumber, 
  message, 
  Tag, 
  Row, 
  Col, 
  Statistic,
  Tooltip
} from 'antd';
import { 
  PlusOutlined, 
  CoffeeOutlined, 
  CheckCircleOutlined, 
  ClockCircleOutlined, 
  CloseCircleOutlined,
  CalendarOutlined,
  SearchOutlined,
  EyeOutlined,
  MedicineBoxOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import apiClient from '../../../lib/api';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

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

const LeaveRequestPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState<any[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [detailModal, setDetailModal] = useState<{ visible: boolean; record: any | null }>({
    visible: false,
    record: null,
  });
  const [form] = Form.useForm();

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/leave/my-requests');
      setRequests(res.data);
    } catch (err) {
      message.error('Lỗi khi tải danh sách đơn nghỉ phép');
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaveTypes = async () => {
    try {
      const res = await apiClient.get('/leave/types');
      setLeaveTypes(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchRequests();
    fetchLeaveTypes();
  }, []);

  const handleDateChange = (dates: any) => {
    if (dates && dates[0] && dates[1]) {
      const diffDays = Math.max(1, dates[1].diff(dates[0], 'day') + 1);
      form.setFieldsValue({ days: diffDays });
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      const payload = {
        ...values,
        fromDate: values.dates[0].toDate(),
        toDate: values.dates[1].toDate(),
      };
      
      await apiClient.post('/leave/request', payload);
      message.success('Đã gửi đơn xin nghỉ phép thành công!');
      setIsModalVisible(false);
      form.resetFields();
      fetchRequests();
    } catch (error: any) {
      if (error.errorFields) return;
      message.error(error.response?.data?.message || 'Lỗi khi tạo đơn');
    }
  };

  const filteredRequests = useMemo(() => {
    return requests.filter(item => {
      const matchStatus = filterStatus === 'ALL' || item.status === filterStatus;
      const q = searchText.toLowerCase();
      const matchSearch = !searchText || 
        (item.leaveType?.name && item.leaveType.name.toLowerCase().includes(q)) ||
        (item.reason && item.reason.toLowerCase().includes(q)) ||
        (item.approver?.fullName && item.approver.fullName.toLowerCase().includes(q)) ||
        (item.approver?.workEmail && item.approver.workEmail.toLowerCase().includes(q));
      return matchStatus && matchSearch;
    });
  }, [requests, filterStatus, searchText]);

  const totalUsedDays = requests
    .filter(r => r.status === 'APPROVED')
    .reduce((acc, curr) => acc + (curr.days || 0), 0);
  const pendingDays = requests
    .filter(r => r.status === 'PENDING')
    .reduce((acc, curr) => acc + (curr.days || 0), 0);

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
      title: 'Loại nghỉ phép',
      dataIndex: 'leaveType',
      key: 'leaveType',
      width: 170,
      render: (type: any) => getLeaveTypeTag(type?.name),
    },
    {
      title: 'Từ ngày',
      dataIndex: 'fromDate',
      key: 'fromDate',
      width: 80,
      render: (val: string) => (
        <Text style={{ fontSize: 13 }}>{val ? dayjs(val).format('DD/MM/YYYY') : '-'}</Text>
      ),
    },
    {
      title: 'Đến ngày',
      dataIndex: 'toDate',
      key: 'toDate',
      width: 80,
      render: (val: string) => (
        <Text style={{ fontSize: 13 }}>{val ? dayjs(val).format('DD/MM/YYYY') : '-'}</Text>
      ),
    },
    {
      title: 'Số ngày nghỉ',
      dataIndex: 'days',
      key: 'days',
      width: 80,
      align: 'center' as const,
      render: (val: number) => (
        <Tag color="blue" style={{ fontSize: 13, padding: '2px 8px', fontWeight: 600 }}>
          {val} ngày
        </Tag>
      ),
    },
    {
      title: 'Lý do nghỉ',
      dataIndex: 'reason',
      key: 'reason',
      width: 280,
      render: (val: string) => (
        <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.5, wordBreak: 'break-word', whiteSpace: 'normal' }}>
          {val || <Text type="secondary">Không có lý do</Text>}
        </div>
      ),
    },
    {
      title: 'Người duyệt đơn',
      key: 'approverName',
      width: 170,
      render: (record: any) => (
        <Text strong style={{ fontSize: 13, color: '#1e3a8a' }}>
          {record.approver?.fullName || 'Chưa chỉ định'}
        </Text>
      ),
    },
    {
      title: 'Email người duyệt',
      key: 'approverEmail',
      width: 200,
      render: (record: any) => (
        <Text type="secondary" style={{ fontSize: 13 }}>
          {record.approver?.workEmail || '-'}
        </Text>
      ),
    },
    {
      title: 'Ngày nộp đơn',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
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
      width: 80,
      align: 'center' as const,
      render: (record: any) => (
        <Tooltip title="Xem chi tiết đơn nghỉ phép">
          <Button 
            type="text" 
            size="small" 
            icon={<EyeOutlined style={{ color: '#1677ff' }} />} 
            onClick={() => setDetailModal({ visible: true, record })}
          />
        </Tooltip>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Row gutter={20} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card style={{ borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <Statistic 
              title="Tổng phép năm (2026)" 
              value={12} 
              suffix="ngày" 
              prefix={<CalendarOutlined style={{ color: '#1677ff' }} />} 
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card style={{ borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <Statistic 
              title="Phép đã sử dụng" 
              value={totalUsedDays} 
              suffix="ngày" 
              valueStyle={{ color: '#fa8c16' }} 
              prefix={<CheckCircleOutlined style={{ color: '#fa8c16' }} />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card style={{ borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <Statistic 
              title="Đang chờ phê duyệt" 
              value={pendingDays} 
              suffix="ngày" 
              valueStyle={{ color: '#faad14' }} 
              prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card style={{ borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <Statistic 
              title="Phép năm còn lại" 
              value={Math.max(0, 12 - totalUsedDays)} 
              suffix="ngày" 
              valueStyle={{ color: '#52c41a' }} 
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
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
              backgroundColor: '#e6f4ff', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <CoffeeOutlined style={{ color: '#1677ff', fontSize: 18 }} />
            </div>
            <div>
              <Title level={4} style={{ margin: 0, color: '#1e3a8a' }}>Danh sách Đơn xin nghỉ phép</Title>
              <Text type="secondary" style={{ fontSize: 12 }}>Theo dõi ngày nghỉ phép, nghỉ ốm, việc riêng và tiến trình xét duyệt</Text>
            </div>
          </Space>
        }
        extra={
          <Space size="middle">
            <Input 
              placeholder="Tìm theo loại nghỉ, lý do, người duyệt..." 
              prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />} 
              value={searchText} 
              onChange={e => setSearchText(e.target.value)} 
              allowClear 
              style={{ width: 260 }} 
            />
            <Select 
              value={filterStatus} 
              onChange={val => setFilterStatus(val)} 
              style={{ width: 140 }}
            >
              <Option value="ALL">Tất cả trạng thái</Option>
              <Option value="PENDING">Chờ duyệt</Option>
              <Option value="APPROVED">Đã duyệt</Option>
              <Option value="REJECTED">Từ chối</Option>
            </Select>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalVisible(true)}>
              Viết đơn xin nghỉ
            </Button>
          </Space>
        }
        style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
      >
        <Table 
          columns={columns} 
          dataSource={filteredRequests} 
          rowKey="id" 
          loading={loading}
          scroll={{ x: 1550 }}
          pagination={{ pageSize: 10, showTotal: (total) => `Tổng cộng ${total} đơn xin nghỉ` }}
        />
      </Card>

      {/* Modal Viết Đơn */}
      <Modal
        title={
          <Space>
            <CoffeeOutlined style={{ color: '#1677ff' }} />
            <span>Viết Đơn Xin Nghỉ Phép / Nghỉ Ốm</span>
          </Space>
        }
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onOk={handleSubmit}
        okText="Gửi đơn phê duyệt"
        cancelText="Hủy bỏ"
        width={600}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item 
            name="leaveTypeId" 
            label="Loại nghỉ phép" 
            rules={[{ required: true, message: 'Vui lòng chọn loại nghỉ phép' }]}
          >
            <Select placeholder="Chọn loại phép (Phép năm, Nghỉ ốm, Việc riêng...)...">
              {leaveTypes.map(t => (
                <Option key={t.id} value={t.id}>
                  {t.name} {t.isPaid ? '(Hưởng lương)' : '(Không lương)'}
                </Option>
              ))}
            </Select>
          </Form.Item>
          
          <Row gutter={16}>
            <Col span={16}>
              <Form.Item 
                name="dates" 
                label="Thời gian nghỉ (Từ ngày - Đến ngày)" 
                rules={[{ required: true, message: 'Vui lòng chọn khoảng thời gian nghỉ' }]}
              >
                <RangePicker 
                  style={{ width: '100%' }} 
                  format="DD/MM/YYYY" 
                  onChange={handleDateChange} 
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item 
                name="days" 
                label="Số ngày nghỉ" 
                rules={[{ required: true, message: 'Vui lòng nhập số ngày' }]}
              >
                <InputNumber min={0.5} step={0.5} style={{ width: '100%' }} placeholder="Số ngày" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item 
            name="approverEmail" 
            label="Email Quản lý / Người duyệt đơn" 
            rules={[{ required: true, message: 'Vui lòng nhập email quản lý', type: 'email' }]}
            extra="Nhập email của trưởng phòng hoặc cấp quản lý trực tiếp duyệt đơn."
          >
            <Input placeholder="Ví dụ: admin@dts.com.vn" />
          </Form.Item>

          <Form.Item 
            name="reason" 
            label="Lý do xin nghỉ" 
            rules={[{ required: true, message: 'Vui lòng ghi rõ lý do xin nghỉ' }]}
          >
            <Input.TextArea rows={3} placeholder="Ghi rõ lý do xin nghỉ (ốm đau khám bệnh, việc gia đình, du lịch...)..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* Detail Modal */}
      <Modal
        title={
          <Space>
            <CalendarOutlined style={{ color: '#1677ff' }} />
            <span>Chi tiết Đơn xin nghỉ phép</span>
          </Space>
        }
        open={detailModal.visible}
        onCancel={() => setDetailModal({ visible: false, record: null })}
        footer={[
          <Button key="close" type="primary" onClick={() => setDetailModal({ visible: false, record: null })}>
            Đóng
          </Button>
        ]}
        width={580}
      >
        {detailModal.record && (
          <div style={{ marginTop: 16 }}>
            <Row gutter={[16, 16]}>
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
                <Text type="secondary">Người duyệt đơn: </Text>
                <div>
                  <Text strong>{detailModal.record.approver?.fullName || 'Chưa chỉ định'}</Text>
                  {detailModal.record.approver?.workEmail && (
                    <Text type="secondary"> ({detailModal.record.approver.workEmail})</Text>
                  )}
                </div>
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

export default LeaveRequestPage;
