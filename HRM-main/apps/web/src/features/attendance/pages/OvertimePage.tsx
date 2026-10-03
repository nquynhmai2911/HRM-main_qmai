import React, { useEffect, useState } from 'react';
import { Card, Typography, Table, Button, Tag, Modal, Form, DatePicker, Select, InputNumber, Input, message, Tabs } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import apiClient from '../../../lib/api';
import dayjs from 'dayjs';

const { Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { TabPane } = Tabs;

const OvertimePage = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [approvals, setApprovals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState('1');

  const fetchRequests = async () => {
    setLoading(true);
    try {
      if (activeTab === '1') {
        const res = await apiClient.get('/attendance/overtime/my-requests');
        setRequests(res.data);
      } else {
        const res = await apiClient.get('/attendance/overtime/approvals');
        setApprovals(res.data);
      }
    } catch (err) {
      message.error('Lỗi khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [activeTab]);

  const handleSubmit = async (values: any) => {
    try {
      const payload = {
        ...values,
        date: values.date.format('YYYY-MM-DD'),
        startTime: values.timeRange[0].toISOString(),
        endTime: values.timeRange[1].toISOString(),
      };
      await apiClient.post('/attendance/overtime/request', payload);
      message.success('Đã gửi đơn làm thêm giờ (OT)');
      setIsModalOpen(false);
      form.resetFields();
      fetchRequests();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleApprove = async (id: string, decision: 'APPROVED' | 'REJECTED') => {
    try {
      await apiClient.post(`/attendance/overtime/approve/${id}`, { decision });
      message.success('Đã cập nhật trạng thái duyệt');
      fetchRequests();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Lỗi khi duyệt');
    }
  };

  const statusColors: any = {
    PENDING: 'orange',
    APPROVED: 'green',
    REJECTED: 'red'
  };

  const columns = [
    {
      title: 'Ngày làm thêm',
      dataIndex: 'date',
      render: (val: string) => dayjs(val).format('DD/MM/YYYY'),
    },
    {
      title: 'Thời gian',
      key: 'time',
      render: (_: any, r: any) => `${dayjs(r.startTime).format('HH:mm')} - ${dayjs(r.endTime).format('HH:mm')}`,
    },
    {
      title: 'Số giờ',
      dataIndex: 'hours',
      render: (val: number) => <strong>{val}h</strong>
    },
    {
      title: 'Loại ngày',
      dataIndex: 'dayType',
      render: (val: string) => {
        if (val === 'HOLIDAY') return <Tag color="red">Ngày lễ (x3.0)</Tag>;
        if (val === 'WEEKEND') return <Tag color="blue">Cuối tuần (x2.0)</Tag>;
        return <Tag color="default">Ngày thường (x1.5)</Tag>;
      }
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      render: (val: string) => <Tag color={statusColors[val]}>{val}</Tag>
    },
    {
      title: 'Lý do',
      dataIndex: 'reason',
    }
  ];

  const approvalColumns = [
    {
      title: 'Nhân viên',
      dataIndex: ['employee', 'fullName'],
    },
    ...columns.slice(0, 4),
    {
      title: 'Lý do',
      dataIndex: 'reason',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      render: (val: string) => <Tag color={statusColors[val]}>{val}</Tag>
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_: any, r: any) => {
        if (r.status !== 'PENDING') return null;
        return (
          <div style={{ display: 'flex', gap: 8 }}>
            <Button type="primary" size="small" onClick={() => handleApprove(r.id, 'APPROVED')}>Duyệt</Button>
            <Button danger size="small" onClick={() => handleApprove(r.id, 'REJECTED')}>Từ chối</Button>
          </div>
        );
      }
    }
  ];

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>Tăng ca (OT)</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
          Đăng ký OT
        </Button>
      </div>

      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="Đơn của tôi" key="1">
          <Table 
            dataSource={requests} 
            columns={columns} 
            rowKey="id" 
            loading={loading}
          />
        </TabPane>
        <TabPane tab="Đơn cần duyệt" key="2">
          <Table 
            dataSource={approvals} 
            columns={approvalColumns} 
            rowKey="id" 
            loading={loading}
          />
        </TabPane>
      </Tabs>

      <Modal
        title="Đăng ký làm thêm giờ (OT)"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item 
            name="date" 
            label="Ngày OT" 
            rules={[{ required: true, message: 'Vui lòng chọn ngày!' }]}
          >
            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
          </Form.Item>

          <Form.Item 
            name="timeRange" 
            label="Thời gian (Từ - Đến)" 
            rules={[{ required: true, message: 'Vui lòng chọn thời gian!' }]}
          >
            <DatePicker.RangePicker showTime format="HH:mm" style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item 
            name="hours" 
            label="Số giờ OT" 
            rules={[{ required: true, message: 'Vui lòng nhập số giờ!' }]}
          >
            <InputNumber min={0.5} step={0.5} style={{ width: '100%' }} placeholder="Ví dụ: 2.5" />
          </Form.Item>

          <Form.Item 
            name="dayType" 
            label="Loại ngày" 
            rules={[{ required: true, message: 'Vui lòng chọn loại ngày!' }]}
            initialValue="NORMAL"
          >
            <Select>
              <Option value="NORMAL">Ngày thường (x1.5)</Option>
              <Option value="WEEKEND">Cuối tuần (x2.0)</Option>
              <Option value="HOLIDAY">Ngày lễ (x3.0)</Option>
            </Select>
          </Form.Item>

          <Form.Item 
            name="approverEmail" 
            label="Email Quản lý duyệt" 
            rules={[{ required: true, message: 'Vui lòng nhập email quản lý!' }, { type: 'email' }]}
          >
            <Input placeholder="ví dụ: manager@dts.com.vn" />
          </Form.Item>

          <Form.Item name="reason" label="Lý do / Công việc thực hiện">
            <TextArea rows={3} placeholder="Mô tả công việc OT..." />
          </Form.Item>

          <div style={{ textAlign: 'right' }}>
            <Button onClick={() => setIsModalOpen(false)} style={{ marginRight: 8 }}>Hủy</Button>
            <Button type="primary" htmlType="submit">Gửi yêu cầu</Button>
          </div>
        </Form>
      </Modal>
    </Card>
  );
};

export default OvertimePage;
