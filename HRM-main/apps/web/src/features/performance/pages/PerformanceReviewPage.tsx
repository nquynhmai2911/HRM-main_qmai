import React, { useEffect, useState } from 'react';
import { Card, Table, Typography, Space, Button, Modal, Form, Input, InputNumber, Select, message, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, StarOutlined } from '@ant-design/icons';
import apiClient from '../../../lib/api';

const { Title } = Typography;
const { Option } = Select;

const PerformanceReviewPage: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [reviewRes, empRes] = await Promise.all([
        apiClient.get('/performance/reviews'),
        apiClient.get('/employees')
      ]);
      setData(reviewRes.data);
      setEmployees(empRes.data);
    } catch (error) {
      message.error('Lỗi khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEdit = (record: any) => {
    setEditingId(record.id);
    form.setFieldsValue(record);
    setIsModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await apiClient.delete(`/performance/reviews/${id}`);
      message.success('Xóa bản đánh giá thành công');
      fetchData();
    } catch (error) {
      message.error('Lỗi khi xóa bản đánh giá');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingId) {
        await apiClient.put(`/performance/reviews/${editingId}`, values);
        message.success('Cập nhật bản đánh giá thành công');
      } else {
        await apiClient.post('/performance/reviews', values);
        message.success('Tạo bản đánh giá thành công');
      }
      setIsModalVisible(false);
      setEditingId(null);
      form.resetFields();
      fetchData();
    } catch (error) {
      message.error('Lỗi lưu dữ liệu');
    }
  };

  const renderResult = (result: string) => {
    switch (result) {
      case 'EXCELLENT': return <Tag color="gold">Xuất sắc</Tag>;
      case 'GOOD': return <Tag color="green">Tốt</Tag>;
      case 'AVERAGE': return <Tag color="blue">Trung bình</Tag>;
      case 'POOR': return <Tag color="red">Yếu kém</Tag>;
      default: return <Tag>{result}</Tag>;
    }
  };

  const columns = [
    { title: 'Kỳ đánh giá', dataIndex: 'period', key: 'period', render: (t: string) => <strong>{t}</strong> },
    { title: 'Mã NV', key: 'empCode', render: (record: any) => record.employee?.employeeCode },
    { title: 'Tên Nhân viên', key: 'empName', render: (record: any) => record.employee?.fullName },
    { title: 'Phòng ban', key: 'dept', render: (record: any) => record.employee?.department?.name || '-' },
    { title: 'Người đánh giá', key: 'reviewer', render: (record: any) => record.reviewer?.fullName },
    { title: 'Điểm KPI', dataIndex: 'kpiScore', key: 'kpiScore' },
    { title: 'Điểm kỹ năng', dataIndex: 'skillsScore', key: 'skillsScore' },
    { title: 'Thái độ', dataIndex: 'attitudeScore', key: 'attitudeScore' },
    { title: 'Tổng điểm', dataIndex: 'totalScore', key: 'totalScore', render: (val: number) => <strong>{val?.toFixed(2)}</strong> },
    { title: 'Kết quả', dataIndex: 'result', key: 'result', render: renderResult },
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
      <Card 
        title={
          <Space>
            <StarOutlined style={{ color: '#faad14' }} />
            <Title level={4} style={{ margin: 0 }}>Đánh Giá Năng Lực (Performance Review)</Title>
          </Space>
        }
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingId(null); form.resetFields(); setIsModalVisible(true); }}>
            Tạo bản đánh giá
          </Button>
        }
        style={{ borderRadius: 8 }}
      >
        <Table columns={columns} dataSource={data} rowKey="id" loading={loading} scroll={{ x: 'max-content' }} />
      </Card>

      <Modal
        title={editingId ? 'Cập nhật đánh giá' : 'Thêm đánh giá mới'}
        open={isModalVisible}
        onOk={handleSubmit}
        onCancel={() => setIsModalVisible(false)}
        width={700}
      >
        <Form form={form} layout="vertical">
          <div style={{ display: 'flex', gap: '16px' }}>
            <Form.Item name="employeeId" label="Nhân viên được đánh giá" rules={[{ required: true }]} style={{ flex: 1 }}>
              <Select
                showSearch
                placeholder="Chọn nhân viên"
                optionFilterProp="children"
                disabled={!!editingId} // Disable editing the employee after creation
              >
                {employees.map(e => (
                  <Option key={e.id} value={e.id}>{e.employeeCode} - {e.fullName}</Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="reviewerId" label="Người đánh giá" rules={[{ required: true }]} style={{ flex: 1 }}>
              <Select
                showSearch
                placeholder="Chọn người đánh giá"
                optionFilterProp="children"
              >
                {employees.map(e => (
                  <Option key={`rev-${e.id}`} value={e.id}>{e.employeeCode} - {e.fullName}</Option>
                ))}
              </Select>
            </Form.Item>
          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
            <Form.Item name="period" label="Kỳ đánh giá" rules={[{ required: true }]} style={{ flex: 1 }}>
              <Input placeholder="VD: Q1-2026, 2026" />
            </Form.Item>
          </div>
          
          <div style={{ display: 'flex', gap: '16px' }}>
            <Form.Item name="kpiScore" label="Điểm KPI (0-100)" rules={[{ required: true }]} style={{ flex: 1 }}>
              <InputNumber min={0} max={100} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="skillsScore" label="Điểm Kỹ năng (0-100)" rules={[{ required: true }]} style={{ flex: 1 }}>
              <InputNumber min={0} max={100} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="attitudeScore" label="Điểm Thái độ (0-100)" rules={[{ required: true }]} style={{ flex: 1 }}>
              <InputNumber min={0} max={100} style={{ width: '100%' }} />
            </Form.Item>
          </div>

          <Form.Item name="comment" label="Nhận xét chi tiết">
            <Input.TextArea rows={4} placeholder="Nhập nhận xét của người quản lý..." />
          </Form.Item>
          
          <Form.Item name="status" label="Trạng thái" initialValue="DRAFT">
            <Select>
              <Option value="DRAFT">Bản nháp</Option>
              <Option value="SUBMITTED">Chờ duyệt</Option>
              <Option value="APPROVED">Đã duyệt</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PerformanceReviewPage;
