import React, { useState, useEffect } from 'react';
import { Card, Table, Typography, Space, Button, Input, Modal, Form, Switch, message, Popconfirm, Select, Row, Col } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import apiClient from '../../../lib/api';

const { Title, Text } = Typography;
const { Option } = Select;

const PositionListPage: React.FC = () => {
  const [positions, setPositions] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [searchDep, setSearchDep] = useState<string | null>(null);
  
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form] = Form.useForm();

  const fetchPositions = async () => {
    try {
      setLoading(true);
      const [posRes, depRes] = await Promise.all([
        apiClient.get('/organization/positions'),
        apiClient.get('/organization/departments')
      ]);
      setPositions(posRes.data);
      setDepartments(depRes.data);
    } catch (error) {
      console.error('Lỗi khi tải danh sách chức danh', error);
      message.error('Không thể tải danh sách chức danh');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPositions();
  }, []);

  const handleAdd = () => {
    setEditingId(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (record: any) => {
    setEditingId(record.id);
    form.setFieldsValue({
      ...record,
      departmentIds: record.departments?.map((d: any) => d.id) || []
    });
    setIsModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await apiClient.delete(`/organization/positions/${id}`);
      message.success('Đã xoá chức danh');
      fetchPositions();
    } catch (error) {
      message.error('Không thể xoá chức danh này');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editingId) {
        await apiClient.put(`/organization/positions/${editingId}`, values);
        message.success('Cập nhật chức danh thành công');
      } else {
        await apiClient.post('/organization/positions', values);
        message.success('Thêm chức danh thành công');
      }
      setIsModalVisible(false);
      fetchPositions();
    } catch (error) {
      message.error('Có lỗi xảy ra khi lưu chức danh');
    }
  };

  const filteredPositions = positions.filter(p => {
    const matchSearch = !searchText || 
      p.name.toLowerCase().includes(searchText.toLowerCase()) || 
      p.code.toLowerCase().includes(searchText.toLowerCase());
    const matchDep = !searchDep || p.departments?.some((d: any) => d.id === searchDep);
    return matchSearch && matchDep;
  });

  const columns = [
    {
      title: 'Mã chức danh',
      dataIndex: 'code',
      key: 'code',
      width: '15%',
    },
    {
      title: 'Tên chức danh',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Nhóm cấp bậc',
      dataIndex: 'levelGroup',
      key: 'levelGroup',
      render: (val: string) => val || <Text type="secondary">N/A</Text>
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => (
        <span style={{ color: isActive ? '#16a34a' : '#dc2626' }}>
          {isActive ? 'Đang hoạt động' : 'Vô hiệu hóa'}
        </span>
      ),
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_: any, record: any) => (
        <Space size="small">
          <Button type="text" icon={<EditOutlined />} style={{ color: '#1677ff' }} onClick={() => handleEdit(record)} />
          <Popconfirm title="Bạn có chắc chắn muốn xoá?" onConfirm={() => handleDelete(record.id)}>
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card style={{ marginBottom: 20, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Title level={4} style={{ margin: 0, color: '#1e3a8a', fontWeight: 700 }}>
              Quản lý Chức danh (Positions)
            </Title>
            <Text type="secondary" style={{ fontSize: 13 }}>
              Thiết lập danh sách các chức danh, vị trí công việc trong công ty.
            </Text>
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            Thêm Chức danh
          </Button>
        </div>
      </Card>

      <Card bordered={false} style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <div style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={8}>
              <Input 
                placeholder="Tìm theo mã hoặc tên chức danh..." 
                prefix={<SearchOutlined style={{ color: '#94a3b8' }} />} 
                style={{ width: '100%' }}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                allowClear
              />
            </Col>
            <Col span={8}>
              <Select
                placeholder="Lọc theo phòng ban"
                style={{ width: '100%' }}
                allowClear
                onChange={setSearchDep}
              >
                {departments.map(d => <Option key={d.id} value={d.id}>{d.name}</Option>)}
              </Select>
            </Col>
          </Row>
        </div>

        <Table 
          dataSource={filteredPositions} 
          columns={columns} 
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title={editingId ? "Sửa Chức danh" : "Thêm Chức danh Mới"}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit} initialValues={{ isActive: true }}>
          <Form.Item 
            name="code" 
            label="Mã chức danh" 
            rules={[{ required: true, message: 'Vui lòng nhập mã chức danh' }]}
          >
            <Input placeholder="Ví dụ: DEV, PM, QA..." />
          </Form.Item>
          
          <Form.Item 
            name="name" 
            label="Tên chức danh" 
            rules={[{ required: true, message: 'Vui lòng nhập tên chức danh' }]}
          >
            <Input placeholder="Ví dụ: Lập trình viên, Quản lý dự án..." />
          </Form.Item>

          <Form.Item name="levelGroup" label="Nhóm cấp bậc (Tùy chọn)">
            <Input placeholder="Ví dụ: Tech, Business, Office..." />
          </Form.Item>

          <Form.Item name="departmentIds" label="Phòng ban (Có thể chọn nhiều)">
            <Select mode="multiple" placeholder="Chọn các phòng ban sử dụng chức danh này">
              {departments.map(d => <Option key={d.id} value={d.id}>{d.name}</Option>)}
            </Select>
          </Form.Item>

          <Form.Item name="isActive" label="Trạng thái" valuePropName="checked">
            <Switch checkedChildren="Hoạt động" unCheckedChildren="Tạm khóa" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PositionListPage;
