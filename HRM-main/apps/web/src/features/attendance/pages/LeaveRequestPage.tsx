import React, { useState, useEffect } from 'react';
import { Card, Table, Typography, Space, Button, Modal, Form, Input, DatePicker, Select, InputNumber, message, Tag, Row, Col, Statistic } from 'antd';
import { PlusOutlined, CoffeeOutlined, CheckCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import apiClient from '../../../lib/api';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const LeaveRequestPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState<any[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
  
  const [isModalVisible, setIsModalVisible] = useState(false);
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

  const columns = [
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
      title: 'Người duyệt (Email)',
      key: 'approver',
      render: (record: any) => record.approver?.workEmail || 'N/A'
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
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Row gutter={24} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card style={{ borderRadius: 8 }}>
            <Statistic title="Tổng phép năm (2026)" value={12} suffix="ngày" prefix={<CheckCircleOutlined style={{ color: '#1677ff' }} />} />
          </Card>
        </Col>
        <Col span={8}>
          <Card style={{ borderRadius: 8 }}>
            <Statistic title="Phép đã nghỉ" value={requests.filter(r => r.status === 'APPROVED').reduce((acc, curr) => acc + curr.days, 0)} suffix="ngày" valueStyle={{ color: '#fa8c16' }} />
          </Card>
        </Col>
        <Col span={8}>
          <Card style={{ borderRadius: 8 }}>
            <Statistic title="Phép còn lại" value={12 - requests.filter(r => r.status === 'APPROVED').reduce((acc, curr) => acc + curr.days, 0)} suffix="ngày" valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
      </Row>

      <Card 
        title={
          <Space>
            <Title level={4} style={{ margin: 0, color: '#1e3a8a' }}>Danh sách Đơn xin nghỉ phép</Title>
          </Space>
        }
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalVisible(true)}>
            Viết đơn xin nghỉ
          </Button>
        }
        style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
      >
        <Table 
          columns={columns} 
          dataSource={requests} 
          rowKey="id" 
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title={
          <Space>
            <CoffeeOutlined style={{ color: '#1677ff' }} />
            <span>Viết Đơn Xin Nghỉ Phép</span>
          </Space>
        }
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onOk={handleSubmit}
        okText="Gửi Đơn"
        cancelText="Hủy"
        width={600}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="leaveTypeId" label="Loại nghỉ phép" rules={[{ required: true, message: 'Vui lòng chọn loại nghỉ' }]}>
            <Select placeholder="Chọn loại phép...">
              {leaveTypes.map(t => (
                <Option key={t.id} value={t.id}>{t.name}</Option>
              ))}
            </Select>
          </Form.Item>
          
          <Row gutter={16}>
            <Col span={16}>
              <Form.Item name="dates" label="Thời gian nghỉ" rules={[{ required: true, message: 'Vui lòng chọn ngày nghỉ' }]}>
                <RangePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="days" label="Số ngày nghỉ" rules={[{ required: true }]}>
                <InputNumber min={0.5} step={0.5} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item 
            name="approverEmail" 
            label="Email Quản lý (Người duyệt đơn)" 
            rules={[{ required: true, message: 'Vui lòng nhập email quản lý', type: 'email' }]}
          >
            <Input placeholder="vd: manager@dts.com.vn" />
          </Form.Item>

          <Form.Item name="reason" label="Lý do xin nghỉ" rules={[{ required: true }]}>
            <Input.TextArea rows={3} placeholder="Trình bày lý do..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default LeaveRequestPage;
