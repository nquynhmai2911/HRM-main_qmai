import React, { useEffect, useState } from 'react';
import { Card, Table, Typography, Space, Button, Modal, Form, Input, DatePicker, message, Tag } from 'antd';
import { SettingOutlined, PlusOutlined, EditOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import apiClient from '../../../lib/api';
import { useAuthStore } from '../../../lib/auth';

const { Title, Text } = Typography;

const SettingsPage: React.FC = () => {
  const user = useAuthStore(state => state.user);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
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
    setEditingId(record.id);
    form.setFieldsValue({
      ...record,
      effectiveFrom: record.effectiveFrom ? dayjs(record.effectiveFrom) : null,
    });
    setIsModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      await apiClient.post('/admin/settings', {
        ...values,
        effectiveFrom: values.effectiveFrom ? values.effectiveFrom.toISOString() : undefined,
      });
      message.success('Lưu cấu hình thành công');
      setIsModalVisible(false);
      setEditingId(null);
      form.resetFields();
      fetchData();
    } catch (error) {
      message.error('Lỗi lưu cấu hình');
    }
  };

  const columns = [
    { title: 'Khóa (Key)', dataIndex: 'key', key: 'key', render: (t: string) => <strong>{t}</strong> },
    { title: 'Giá trị (Value)', dataIndex: 'value', key: 'value', render: (t: string) => <Tag color="blue">{t}</Tag> },
    { title: 'Mô tả', dataIndex: 'description', key: 'description' },
    { 
      title: 'Ngày hiệu lực', 
      dataIndex: 'effectiveFrom', 
      key: 'effectiveFrom', 
      render: (t: string) => <Text>{dayjs(t).format('DD/MM/YYYY')}</Text> 
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (record: any) => (
        <Space size="small">
          <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
        </Space>
      ),
    },
  ];

  if (user?.role !== 'ADMIN' && user?.role !== 'HR_MANAGER') {
    return <div style={{ padding: 24 }}>Bạn không có quyền truy cập trang này.</div>;
  }

  return (
    <div style={{ padding: '24px' }}>
      <Card 
        title={
          <Space>
            <SettingOutlined style={{ color: '#faad14' }} />
            <Title level={4} style={{ margin: 0 }}>Cấu hình tham số hệ thống</Title>
          </Space>
        }
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingId(null); form.resetFields(); setIsModalVisible(true); }}>
            Thêm cấu hình
          </Button>
        }
        style={{ borderRadius: 8 }}
      >
        <Table columns={columns} dataSource={data} rowKey="id" loading={loading} />
      </Card>

      <Modal
        title={editingId ? 'Sửa cấu hình' : 'Thêm cấu hình mới'}
        open={isModalVisible}
        onOk={handleSubmit}
        onCancel={() => setIsModalVisible(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="key" label="Khóa (Ví dụ: DEFAULT_TAX_RATE)" rules={[{ required: true }]}>
            <Input disabled={!!editingId} />
          </Form.Item>
          <Form.Item name="value" label="Giá trị" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Mô tả chi tiết">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="effectiveFrom" label="Ngày hiệu lực">
            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SettingsPage;
