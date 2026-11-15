import React, { useEffect, useState, useMemo } from 'react';
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
  message, 
  Tag, 
  Tooltip, 
  Row, 
  Col, 
  Statistic,
  Popconfirm
} from 'antd';
import { 
  SettingOutlined, 
  PlusOutlined, 
  EditOutlined, 
  SearchOutlined, 
  CalendarOutlined, 
  CopyOutlined,
  EyeOutlined,
  DeleteOutlined,
  ReloadOutlined,
  AppstoreOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import apiClient from '../../../lib/api';
import { useAuthStore } from '../../../lib/auth';

const { Title, Text } = Typography;

const getCategory = (key: string) => {
  if (key.startsWith('WORK_') || key.startsWith('LATE_') || key.startsWith('STANDARD_') || key.startsWith('OVERTIME_')) {
    return { label: 'Chấm công & Ca làm', color: 'orange' };
  }
  if (key.startsWith('TAX_') || key.startsWith('INSURANCE_') || key.startsWith('SALARY_') || key.startsWith('PAYROLL_')) {
    return { label: 'Lương & Bảo hiểm', color: 'green' };
  }
  if (key.startsWith('LEAVE_') || key.startsWith('HOLIDAY_') || key.startsWith('ANNUAL_')) {
    return { label: 'Nghỉ phép & Lễ', color: 'purple' };
  }
  if (key.startsWith('PROBATION_') || key.startsWith('CONTRACT_')) {
    return { label: 'Hợp đồng & Thử việc', color: 'blue' };
  }
  return { label: 'Cấu hình chung', color: 'cyan' };
};

const SettingsPage: React.FC = () => {
  const user = useAuthStore(state => state.user);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [viewDetailModal, setViewDetailModal] = useState<{ visible: boolean; record: any | null }>({
    visible: false,
    record: null
  });
  const [editingRecord, setEditingRecord] = useState<any | null>(null);
  const [form] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/admin/settings');
      setData(res.data);
    } catch (error) {
      message.error('Lỗi khi tải cấu hình hệ thống');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEdit = (record: any) => {
    setEditingRecord(record);
    form.setFieldsValue({
      key: record.key,
      value: record.value,
      description: record.description,
      effectiveFrom: record.effectiveFrom ? dayjs(record.effectiveFrom) : null,
    });
    setIsModalVisible(true);
  };

  const handleCreate = () => {
    setEditingRecord(null);
    form.resetFields();
    form.setFieldsValue({ effectiveFrom: dayjs() });
    setIsModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      await apiClient.post('/admin/settings', {
        ...(editingRecord?.id ? { id: editingRecord.id } : {}),
        ...values,
        effectiveFrom: values.effectiveFrom ? values.effectiveFrom.toISOString() : undefined,
      });
      message.success(editingRecord ? 'Cập nhật cấu hình thành công!' : 'Tạo cấu hình mới thành công!');
      setIsModalVisible(false);
      setEditingRecord(null);
      form.resetFields();
      fetchData();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Lỗi khi lưu cấu hình');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiClient.delete(`/admin/settings/${id}`);
      message.success('Đã xóa tham số cấu hình thành công!');
      fetchData();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Lỗi khi xóa cấu hình');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    message.success('Đã sao chép vào bộ nhớ tạm');
  };

  const filteredData = useMemo(() => {
    if (!searchText.trim()) return data;
    const q = searchText.toLowerCase();
    return data.filter(item => 
      (item.key && item.key.toLowerCase().includes(q)) ||
      (item.description && item.description.toLowerCase().includes(q)) ||
      (item.value && item.value.toLowerCase().includes(q))
    );
  }, [data, searchText]);

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
      title: 'Mã tham số (Key)', 
      dataIndex: 'key', 
      key: 'key', 
      width: 260,
      render: (t: string) => (
        <Space>
          <Text code strong style={{ color: '#0958d9', fontSize: 13, background: '#e6f4ff', borderColor: '#91caff' }}>
            {t}
          </Text>
          <Tooltip title="Sao chép tên khóa">
            <Button 
              type="text" 
              size="small" 
              icon={<CopyOutlined style={{ fontSize: 12, color: '#8c8c8c' }} />} 
              onClick={() => copyToClipboard(t)} 
            />
          </Tooltip>
        </Space>
      )
    },
    {
      title: 'Nhóm phân loại',
      key: 'category',
      width: 170,
      render: (record: any) => {
        const cat = getCategory(record.key);
        return (
          <Tag color={cat.color} style={{ fontWeight: 600, padding: '2px 8px', borderRadius: 4 }}>
            {cat.label}
          </Tag>
        );
      }
    },
    { 
      title: 'Mô tả cấu hình', 
      dataIndex: 'description', 
      key: 'description',
      minWidth: 280,
      render: (desc: string) => (
        <div style={{ lineHeight: 1.5, color: '#1e293b', fontSize: 13, wordBreak: 'break-word', whiteSpace: 'normal' }}>
          {desc || <Text type="secondary">Chưa có mô tả</Text>}
        </div>
      )
    },
    { 
      title: 'Ngày hiệu lực', 
      dataIndex: 'effectiveFrom', 
      key: 'effectiveFrom', 
      width: 140,
      render: (t: string) => (
        <Space size={6}>
          <CalendarOutlined style={{ color: '#1677ff' }} />
          <Text style={{ fontSize: 13 }}>{t ? dayjs(t).format('DD/MM/YYYY') : '-'}</Text>
        </Space>
      )
    },
    {
      title: 'Hành động',
      key: 'action',
      width: 120,
      align: 'center' as const,
      fixed: 'right' as const,
      render: (record: any) => (
        <Space size={4} wrap={false} style={{ justifyContent: 'center' }}>
          <Tooltip title="Xem chi tiết giá trị cấu hình">
            <Button 
              type="text" 
              size="small" 
              icon={<EyeOutlined style={{ color: '#1677ff' }} />} 
              onClick={() => setViewDetailModal({ visible: true, record })} 
            />
          </Tooltip>

          <Tooltip title="Chỉnh sửa tham số cấu hình">
            <Button 
              type="text" 
              size="small" 
              icon={<EditOutlined style={{ color: '#1677ff' }} />} 
              onClick={() => handleEdit(record)} 
            />
          </Tooltip>

          <Tooltip title="Xóa tham số cấu hình">
            <span>
              <Popconfirm
                title="Xóa tham số này?"
                description={`Bạn có chắc muốn xóa tham số "${record.key}"?`}
                onConfirm={() => handleDelete(record.id)}
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

  if (user?.role !== 'ADMIN' && user?.role !== 'HR_MANAGER') {
    return <div style={{ padding: 24 }}>Bạn không có quyền truy cập trang này.</div>;
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* Header Metric Cards */}
      <Row gutter={16} style={{ marginBottom: 20 }}>
        <Col span={6}>
          <Card style={{ borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <Statistic 
              title="Tổng tham số cấu hình" 
              value={data.length} 
              prefix={<SettingOutlined style={{ color: '#1677ff' }} />} 
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card style={{ borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <Statistic 
              title="Chấm công & Ca làm" 
              value={data.filter(d => d.key.startsWith('WORK_') || d.key.startsWith('LATE_') || d.key.startsWith('STANDARD_')).length} 
              prefix={<AppstoreOutlined style={{ color: '#fa8c16' }} />} 
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card style={{ borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <Statistic 
              title="Lương & Bảo hiểm" 
              value={data.filter(d => d.key.startsWith('TAX_') || d.key.startsWith('INSURANCE_') || d.key.startsWith('SALARY_')).length} 
              prefix={<AppstoreOutlined style={{ color: '#52c41a' }} />} 
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card style={{ borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <Statistic 
              title="Nghỉ phép & Khác" 
              value={data.filter(d => !d.key.startsWith('WORK_') && !d.key.startsWith('TAX_') && !d.key.startsWith('INSURANCE_')).length} 
              prefix={<AppstoreOutlined style={{ color: '#722ed1' }} />} 
            />
          </Card>
        </Col>
      </Row>

      <Card 
        title={
          <Space>
            <SettingOutlined style={{ color: '#1677ff' }} />
            <Title level={4} style={{ margin: 0 }}>Cấu hình Tham số Hệ thống</Title>
          </Space>
        }
        extra={
          <Space>
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              onClick={handleCreate}
            >
              Thêm cấu hình
            </Button>
            <Input 
              placeholder="Tìm theo mã khóa, mô tả, giá trị..." 
              prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />} 
              value={searchText} 
              onChange={e => setSearchText(e.target.value)} 
              allowClear 
              style={{ width: 280 }} 
            />
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
          pagination={{ pageSize: 10, showTotal: (t) => `Tổng cộng ${t} tham số cấu hình` }}
        />
      </Card>

      {/* MODAL 1: TẠO / SỬA CẤU HÌNH */}
      <Modal
        title={
          <Space>
            {editingRecord ? <EditOutlined style={{ color: '#1677ff' }} /> : <PlusOutlined style={{ color: '#1677ff' }} />}
            <span>{editingRecord ? `Cập nhật tham số: ${editingRecord.key}` : 'Thêm tham số cấu hình mới'}</span>
          </Space>
        }
        open={isModalVisible}
        onOk={handleSubmit}
        onCancel={() => {
          setIsModalVisible(false);
          setEditingRecord(null);
        }}
        okText="Lưu cấu hình"
        cancelText="Hủy"
        destroyOnClose
        width={650}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item 
            name="key" 
            label="Mã tham số (Khóa / Key)" 
            rules={[{ required: true, message: 'Vui lòng nhập mã khóa' }]}
          >
            <Input 
              disabled={!!editingRecord} 
              placeholder="vd: STANDARD_WORKING_DAYS, LATE_GRACE_PERIOD_MINUTES..." 
              style={{ fontFamily: 'monospace' }}
            />
          </Form.Item>

          <Form.Item 
            name="value" 
            label="Giá trị cấu hình (Value - Chuỗi, Số hoặc JSON)" 
            rules={[{ required: true, message: 'Vui lòng nhập giá trị cấu hình' }]}
          >
            <Input.TextArea 
              rows={5} 
              placeholder="Nhập giá trị tham số cấu hình (chuỗi văn bản, số hoặc JSON định dạng)" 
              style={{ fontFamily: 'Consolas, Monaco, monospace' }}
            />
          </Form.Item>

          <Form.Item name="description" label="Mô tả tham số & Hướng dẫn sử dụng">
            <Input.TextArea rows={2} placeholder="Mô tả chi tiết mục đích và phạm vi áp dụng của tham số này..." />
          </Form.Item>

          <Form.Item 
            name="effectiveFrom" 
            label="Ngày bắt đầu có hiệu lực" 
            rules={[{ required: true, message: 'Vui lòng chọn ngày hiệu lực' }]}
          >
            <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      {/* MODAL 2: XEM CHI TIẾT GIÁ TRỊ CẤU HÌNH */}
      <Modal
        title={
          <Space>
            <EyeOutlined style={{ color: '#1677ff' }} />
            <span>Chi tiết tham số cấu hình: {viewDetailModal.record?.key}</span>
          </Space>
        }
        open={viewDetailModal.visible}
        onCancel={() => setViewDetailModal({ visible: false, record: null })}
        footer={[
          <Button 
            key="copy" 
            icon={<CopyOutlined />} 
            onClick={() => {
              if (viewDetailModal.record?.value) {
                copyToClipboard(viewDetailModal.record.value);
              }
            }}
          >
            Sao chép giá trị
          </Button>,
          <Button 
            key="close" 
            type="primary" 
            onClick={() => setViewDetailModal({ visible: false, record: null })}
          >
            Đóng
          </Button>
        ]}
        width={700}
      >
        {viewDetailModal.record && (
          <div style={{ marginTop: 16 }}>
            <div style={{ marginBottom: 12 }}>
              <Text strong>Khóa cấu hình: </Text>
              <Text code strong style={{ color: '#0958d9', fontSize: 13 }}>{viewDetailModal.record.key}</Text>
              <Tag color={getCategory(viewDetailModal.record.key).color} style={{ marginLeft: 8 }}>
                {getCategory(viewDetailModal.record.key).label}
              </Tag>
            </div>
            <div style={{ marginBottom: 12 }}>
              <Text strong>Mô tả: </Text>
              <Text>{viewDetailModal.record.description || 'Chưa có mô tả'}</Text>
            </div>
            <div style={{ marginBottom: 12 }}>
              <Text strong>Ngày hiệu lực: </Text>
              <Text>{viewDetailModal.record.effectiveFrom ? dayjs(viewDetailModal.record.effectiveFrom).format('DD/MM/YYYY') : '-'}</Text>
            </div>
            <div>
              <Text strong>Toàn bộ giá trị chi tiết (Value): </Text>
              <pre style={{ 
                backgroundColor: '#f8fafc', 
                padding: '14px', 
                borderRadius: 8, 
                border: '1px solid #e2e8f0',
                maxHeight: 380, 
                overflowY: 'auto',
                fontSize: 13,
                fontFamily: 'Consolas, Monaco, monospace',
                marginTop: 8,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
                color: '#1e293b'
              }}>
                {(() => {
                  try {
                    const parsed = JSON.parse(viewDetailModal.record.value);
                    return JSON.stringify(parsed, null, 2);
                  } catch {
                    return viewDetailModal.record.value;
                  }
                })()}
              </pre>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default SettingsPage;
