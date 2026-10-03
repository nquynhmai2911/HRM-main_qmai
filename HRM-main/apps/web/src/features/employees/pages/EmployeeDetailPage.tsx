import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, Typography, Spin, message, Tabs, Table, Button, Modal, Form, InputNumber, DatePicker, Row, Col, Input } from 'antd';
import apiClient from '../../../lib/api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const EmployeeDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [employee, setEmployee] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();

  const fetchEmployee = async () => {
    try {
      setLoading(true);
      const { data } = await apiClient.get(`/employees/${id}`);
      setEmployee(data);
    } catch (err) {
      message.error('Không thể tải thông tin nhân viên');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchEmployee();
  }, [id]);

  const handleAdjustSalary = async (values: any) => {
    try {
      await apiClient.post(`/employees/${id}/salary`, {
        baseSalary: values.baseSalary,
        allowances: JSON.stringify({ note: values.note }),
        effectiveFrom: values.effectiveFrom.toISOString(),
      });
      message.success('Đã cập nhật mức lương mới!');
      setIsModalOpen(false);
      form.resetFields();
      fetchEmployee();
    } catch (err) {
      message.error('Lỗi khi cập nhật lương');
    }
  };

  if (loading || !employee) return <Spin style={{ marginTop: 50, display: 'block', textAlign: 'center' }} />;

  const salaryColumns = [
    {
      title: 'Mức lương cơ bản',
      dataIndex: 'baseSalary',
      key: 'baseSalary',
      render: (val: number) => <strong style={{ color: 'green' }}>{val?.toLocaleString('vi-VN')} VNĐ</strong>,
    },
    {
      title: 'Phụ cấp / Ghi chú',
      dataIndex: 'allowances',
      key: 'allowances',
      render: (val: string) => {
        try {
          return JSON.parse(val || '{}').note || 'Không có';
        } catch { return val || 'Không có'; }
      }
    },
    {
      title: 'Ngày áp dụng',
      dataIndex: 'effectiveFrom',
      key: 'effectiveFrom',
      render: (val: string) => dayjs(val).format('DD/MM/YYYY'),
    }
  ];

  return (
    <Card>
      <Title level={4}>Chi tiết nhân viên: {employee.fullName} ({employee.employeeCode})</Title>
      <Tabs defaultActiveKey="salary">
        <Tabs.TabPane tab="Thông tin cá nhân" key="info">
          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            <Col span={12}><Text strong>Email: </Text>{employee.workEmail}</Col>
            <Col span={12}><Text strong>SĐT: </Text>{employee.phone}</Col>
            <Col span={12}><Text strong>Phòng ban: </Text>{employee.department?.name}</Col>
            <Col span={12}><Text strong>Vị trí: </Text>{employee.position?.name}</Col>
            <Col span={12}><Text strong>Ngày vào làm: </Text>{dayjs(employee.joinDate).format('DD/MM/YYYY')}</Col>
          </Row>
        </Tabs.TabPane>
        <Tabs.TabPane tab="Lương & Phụ cấp" key="salary">
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
            <Button type="primary" onClick={() => setIsModalOpen(true)}>
              Điều chỉnh lương
            </Button>
          </div>
          <Table 
            dataSource={employee.salaryProfiles || []} 
            columns={salaryColumns} 
            rowKey="id" 
            pagination={false}
            locale={{ emptyText: 'Chưa có hồ sơ lương' }}
          />
        </Tabs.TabPane>
      </Tabs>

      <Modal
        title="Điều chỉnh lương nhân viên"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleAdjustSalary}>
          <Form.Item 
            name="baseSalary" 
            label="Mức lương cơ bản mới (VNĐ)" 
            rules={[{ required: true, message: 'Vui lòng nhập mức lương!' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value!.replace(/\$\s?|(,*)/g, '') as any}
              min={0}
            />
          </Form.Item>
          <Form.Item 
            name="effectiveFrom" 
            label="Ngày bắt đầu áp dụng" 
            rules={[{ required: true, message: 'Vui lòng chọn ngày!' }]}
          >
            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
          </Form.Item>
          <Form.Item name="note" label="Ghi chú / Lý do điều chỉnh">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Lưu thay đổi
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default EmployeeDetailPage;
