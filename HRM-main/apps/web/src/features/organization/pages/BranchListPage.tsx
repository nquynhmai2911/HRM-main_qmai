import React, { useEffect, useState } from 'react';
import { Card, Table, Typography, Space, Button, Modal, Form, Input, Select, message, Tag, Row, Col } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import apiClient from '../../../lib/api';

const { Title } = Typography;
const { Option } = Select;

const BranchListPage: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form] = Form.useForm();

  // Filters
  const [searchCode, setSearchCode] = useState('');
  const [searchRegion, setSearchRegion] = useState<string | null>(null);

  const fetchBranches = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/organization/branches');
      let filtered = res.data;
      if (searchCode) {
        filtered = filtered.filter((b: any) => 
          b.code.toLowerCase().includes(searchCode.toLowerCase()) || 
          b.name.toLowerCase().includes(searchCode.toLowerCase())
        );
      }
      if (searchRegion) {
        filtered = filtered.filter((b: any) => b.region === searchRegion);
      }
      setData(filtered);
    } catch (error) {
      message.error('Lỗi khi tải danh sách chi nhánh');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, [searchCode, searchRegion]);

  const handleEdit = (record: any) => {
    setEditingId(record.id);
    form.setFieldsValue(record);
    setIsModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await apiClient.delete(`/organization/branches/${id}`);
      message.success('Xóa chi nhánh thành công');
      fetchBranches();
    } catch (error) {
      message.error('Lỗi khi xóa chi nhánh');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingId) {
        await apiClient.put(`/organization/branches/${editingId}`, values);
        message.success('Cập nhật chi nhánh thành công');
      } else {
        await apiClient.post('/organization/branches', values);
        message.success('Thêm chi nhánh thành công');
      }
      setIsModalVisible(false);
      setEditingId(null);
      form.resetFields();
      fetchBranches();
    } catch (error) {
      message.error('Lỗi lưu dữ liệu');
    }
  };

  const columns = [
    { title: 'Mã', dataIndex: 'code', key: 'code', render: (t: string) => <strong>{t}</strong> },
    { title: 'Tên chi nhánh', dataIndex: 'name', key: 'name' },
    { title: 'Khu vực (Miền)', dataIndex: 'region', key: 'region', render: (t: string) => t ? <Tag color="blue">{t}</Tag> : 'N/A' },
    { title: 'Tỉnh/Thành phố', dataIndex: 'province', key: 'province', render: (t: string) => t || 'N/A' },
    { title: 'Trạng thái', dataIndex: 'isActive', key: 'isActive', render: (val: boolean) => <Tag color={val ? 'success' : 'default'}>{val ? 'Hoạt động' : 'Đã đóng'}</Tag> },
    {
      title: 'Hành động',
      key: 'action',
      render: (record: any) => (
        <Space size="small">
          <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)} />
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card style={{ borderRadius: 8, marginBottom: 24 }}>
        <Row gutter={16}>
          <Col span={8}>
            <Input 
              placeholder="Tìm kiếm theo mã hoặc tên..." 
              prefix={<SearchOutlined />} 
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value)}
              allowClear
            />
          </Col>
          <Col span={8}>
            <Select 
              placeholder="Lọc theo miền" 
              style={{ width: '100%' }} 
              allowClear 
              onChange={setSearchRegion}
            >
              <Option value="Miền Bắc">Miền Bắc</Option>
              <Option value="Miền Trung">Miền Trung</Option>
              <Option value="Miền Nam">Miền Nam</Option>
            </Select>
          </Col>
        </Row>
      </Card>

      <Card 
        title={<Title level={4} style={{ margin: 0 }}>Danh sách Chi nhánh / Khu vực</Title>}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingId(null); form.resetFields(); setIsModalVisible(true); }}>
            Thêm chi nhánh
          </Button>
        }
        style={{ borderRadius: 8 }}
      >
        <Table columns={columns} dataSource={data} rowKey="id" loading={loading} />
      </Card>

      <Modal
        title={editingId ? 'Cập nhật chi nhánh' : 'Thêm chi nhánh'}
        open={isModalVisible}
        onOk={handleSubmit}
        onCancel={() => setIsModalVisible(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="code" label="Mã chi nhánh" rules={[{ required: true }]}>
            <Input placeholder="VD: HN-01" />
          </Form.Item>
          <Form.Item name="name" label="Tên chi nhánh" rules={[{ required: true }]}>
            <Input placeholder="VD: Hội sở chính Hà Nội" />
          </Form.Item>
          <Form.Item name="region" label="Khu vực (Miền)">
            <Select placeholder="Chọn miền">
              <Option value="Miền Bắc">Miền Bắc</Option>
              <Option value="Miền Trung">Miền Trung</Option>
              <Option value="Miền Nam">Miền Nam</Option>
            </Select>
          </Form.Item>
          <Form.Item name="province" label="Tỉnh/Thành phố">
            <Input placeholder="VD: Hà Nội, TP.HCM, Đà Nẵng..." />
          </Form.Item>
          <Form.Item name="address" label="Địa chỉ cụ thể">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="isActive" label="Trạng thái" valuePropName="checked" initialValue={true}>
            <Select>
              <Option value={true}>Hoạt động</Option>
              <Option value={false}>Đóng cửa</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default BranchListPage;
