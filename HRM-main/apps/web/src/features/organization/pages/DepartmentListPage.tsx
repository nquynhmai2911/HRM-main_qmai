import React, { useEffect, useState } from 'react';
import { Card, Table, Typography, Space, Button, Modal, Form, Input, Select, message, Row, Col } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import apiClient from '../../../lib/api';

const { Title } = Typography;
const { Option } = Select;

const DepartmentListPage: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form] = Form.useForm();

  const [searchCode, setSearchCode] = useState('');
  const [searchBranch, setSearchBranch] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [depRes, branchRes] = await Promise.all([
        apiClient.get('/organization/departments'),
        apiClient.get('/organization/branches')
      ]);
      setBranches(branchRes.data);
      
      let filtered = depRes.data;
      if (searchCode) {
        filtered = filtered.filter((d: any) => 
          d.code.toLowerCase().includes(searchCode.toLowerCase()) || 
          d.name.toLowerCase().includes(searchCode.toLowerCase())
        );
      }
      if (searchBranch) {
        filtered = filtered.filter((d: any) => d.branchId === searchBranch);
      }
      setData(filtered);
    } catch (error) {
      message.error('Lỗi khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [searchCode, searchBranch]);

  const handleEdit = (record: any) => {
    setEditingId(record.id);
    form.setFieldsValue(record);
    setIsModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await apiClient.delete(`/organization/departments/${id}`);
      message.success('Xóa phòng ban thành công');
      fetchData();
    } catch (error) {
      message.error('Lỗi khi xóa phòng ban');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingId) {
        await apiClient.put(`/organization/departments/${editingId}`, values);
        message.success('Cập nhật phòng ban thành công');
      } else {
        await apiClient.post('/organization/departments', values);
        message.success('Thêm phòng ban thành công');
      }
      setIsModalVisible(false);
      setEditingId(null);
      form.resetFields();
      fetchData();
    } catch (error) {
      message.error('Lỗi lưu dữ liệu');
    }
  };

  const columns = [
    { title: 'Mã PB', dataIndex: 'code', key: 'code', render: (t: string) => <strong>{t}</strong> },
    { title: 'Tên phòng ban', dataIndex: 'name', key: 'name' },
    { title: 'Trực thuộc chi nhánh', key: 'branch', render: (record: any) => record.branch?.name || 'N/A' },
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
              placeholder="Lọc theo chi nhánh" 
              style={{ width: '100%' }} 
              allowClear 
              onChange={setSearchBranch}
            >
              {branches.map(b => (
                <Option key={b.id} value={b.id}>{b.name}</Option>
              ))}
            </Select>
          </Col>
        </Row>
      </Card>

      <Card 
        title={<Title level={4} style={{ margin: 0 }}>Danh sách Phòng ban</Title>}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingId(null); form.resetFields(); setIsModalVisible(true); }}>
            Thêm phòng ban
          </Button>
        }
        style={{ borderRadius: 8 }}
      >
        <Table columns={columns} dataSource={data} rowKey="id" loading={loading} />
      </Card>

      <Modal
        title={editingId ? 'Cập nhật phòng ban' : 'Thêm phòng ban'}
        open={isModalVisible}
        onOk={handleSubmit}
        onCancel={() => setIsModalVisible(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="code" label="Mã phòng ban" rules={[{ required: true }]}>
            <Input placeholder="VD: HR" />
          </Form.Item>
          <Form.Item name="name" label="Tên phòng ban" rules={[{ required: true }]}>
            <Input placeholder="VD: Phòng Nhân sự" />
          </Form.Item>
          <Form.Item name="branchId" label="Trực thuộc chi nhánh" rules={[{ required: true }]}>
            <Select placeholder="Chọn chi nhánh">
              {branches.map(b => (
                <Option key={b.id} value={b.id}>{b.name}</Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DepartmentListPage;
