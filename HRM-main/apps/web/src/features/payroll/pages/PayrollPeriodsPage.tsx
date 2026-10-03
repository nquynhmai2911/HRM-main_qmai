import React, { useEffect, useState } from 'react';
import { Card, Typography, Table, Spin, message, Tag, Button, Modal, Form, DatePicker, InputNumber, Input, Result } from 'antd';
import apiClient from '../../../lib/api';
import { useAuthStore } from '../../../lib/auth';
import dayjs from 'dayjs';

const { Title } = Typography;

const PayrollPeriodsPage = () => {
  const [periods, setPeriods] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();

  const user = useAuthStore(state => state.user);
  const canReviewSalary = user?.role === 'ADMIN' || user?.role === 'HR_MANAGER' || user?.role === 'CEO';

  const fetchData = async () => {
    try {
      setLoading(true);
      const [periodsRes, empRes] = await Promise.all([
        apiClient.get('/payroll/periods'),
        apiClient.get('/employees')
      ]);
      setPeriods(periodsRes.data);
      
      const empData = Array.isArray(empRes.data?.data) ? empRes.data.data : empRes.data;
      setEmployees(empData || []);
    } catch (err) {
      message.error('Lỗi khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = () => {
    setIsModalOpen(true);
    // Tự động điền danh sách toàn bộ nhân viên vào form
    const initialEmployees = employees.map(emp => ({
      employeeId: emp.id,
      fullName: emp.fullName,
      employeeCode: emp.employeeCode,
      baseSalary: null,
      note: ''
    }));
    form.setFieldsValue({
      effectiveDate: dayjs(),
      employees: initialEmployees
    });
  };

  const handleSalaryReview = async (values: any) => {
    try {
      // Chỉ lấy những nhân viên có nhập mức lương mới
      const reviewedEmployees = values.employees.filter((emp: any) => emp.baseSalary != null && emp.baseSalary > 0);
      
      if (reviewedEmployees.length === 0) {
        message.warning('Bạn chưa nhập mức lương mới cho nhân viên nào!');
        return;
      }

      const data = {
        effectiveDate: values.effectiveDate.toISOString(),
        employees: reviewedEmployees.map((emp: any) => ({
          id: emp.employeeId,
          baseSalary: emp.baseSalary,
          note: emp.note || 'Xét duyệt tăng lương định kỳ'
        }))
      };

      await apiClient.post('/payroll/salary-review', data);
      message.success('Đã hoàn tất xét duyệt tăng lương!');
      setIsModalOpen(false);
      form.resetFields();
    } catch (error) {
      message.error('Có lỗi xảy ra khi xét duyệt lương');
    }
  };

  const handleComputePayroll = async (periodId: string) => {
    try {
      setLoading(true);
      await apiClient.post(`/payroll/periods/${periodId}/compute`);
      message.success('Đã tính toán xong bảng lương cho kỳ này!');
      fetchData();
    } catch (error) {
      message.error('Có lỗi khi tính lương');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Kỳ lương',
      key: 'period',
      render: (_: any, record: any) => `Tháng ${record.month}/${record.year}`,
    },
    {
      title: 'Ghi chú',
      dataIndex: 'note',
      key: 'note',
    },
    {
      title: 'Số phiếu lương',
      key: 'payslipsCount',
      render: (_: any, record: any) => record._count?.payslips || 0,
    },
    {
      title: 'Trạng thái',
      key: 'status',
      render: (_: any, record: any) => {
        const s = record.status;
        if (s === 'PAID') return <Tag color="green">Đã thanh toán</Tag>;
        if (s === 'APPROVED') return <Tag color="blue">Đã duyệt</Tag>;
        return <Tag color="orange">Bản nháp</Tag>;
      },
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_: any, record: any) => (
        <Button size="small" type="dashed" onClick={() => handleComputePayroll(record.id)}>
          Tính lương (Gộp Phụ cấp & OT)
        </Button>
      ),
    },
  ];

  if (!canReviewSalary) {
    return (
      <Result
        status="403"
        title="403"
        subTitle="Xin lỗi, chỉ có Admin, CEO và HR Manager mới có quyền quản lý và xét duyệt lương."
      />
    );
  }

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>Quản lý Kỳ lương</Title>
        <Button type="primary" style={{ background: '#52c41a' }} onClick={handleOpenModal}>
          Xét tăng lương định kỳ (2 kỳ/năm)
        </Button>
      </div>

      {loading ? (
        <Spin style={{ display: 'block', margin: '50px auto' }} />
      ) : (
        <Table 
          dataSource={periods} 
          columns={columns} 
          rowKey="id" 
          pagination={{ pageSize: 10 }}
          locale={{ emptyText: 'Chưa có kỳ lương nào' }}
        />
      )}

      <Modal
        title="Đợt xét duyệt tăng lương định kỳ"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={800}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSalaryReview}>
          <Form.Item 
            name="effectiveDate" 
            label="Ngày bắt đầu áp dụng mức lương mới" 
            rules={[{ required: true, message: 'Vui lòng chọn ngày áp dụng!' }]}
          >
            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
          </Form.Item>

          <Form.List name="employees">
            {(fields) => (
              <>
                <div style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '8px' }}>
                  {fields.map(({ key, name, ...restField }) => {
                    const empName = form.getFieldValue(['employees', name, 'fullName']);
                    const empCode = form.getFieldValue(['employees', name, 'employeeCode']);
                    return (
                      <div key={key} style={{ display: 'flex', gap: 16, marginBottom: 16, alignItems: 'center', padding: '12px', background: '#f5f5f5', borderRadius: '8px' }}>
                        <div style={{ flex: 1, minWidth: '200px' }}>
                          <Typography.Text strong>{empName}</Typography.Text>
                          <br />
                          <Typography.Text type="secondary">{empCode}</Typography.Text>
                          {/* Hidden inputs to keep ids */}
                          <Form.Item {...restField} name={[name, 'employeeId']} hidden><Input /></Form.Item>
                          <Form.Item {...restField} name={[name, 'fullName']} hidden><Input /></Form.Item>
                          <Form.Item {...restField} name={[name, 'employeeCode']} hidden><Input /></Form.Item>
                        </div>
                        <Form.Item
                          {...restField}
                          name={[name, 'baseSalary']}
                          label="Mức lương mới (VNĐ)"
                          style={{ flex: 1, marginBottom: 0 }}
                        >
                          <InputNumber 
                            placeholder="Bỏ trống nếu không tăng" 
                            style={{ width: '100%' }} 
                            formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            parser={value => value!.replace(/\$\s?|(,*)/g, '') as any}
                          />
                        </Form.Item>
                        <Form.Item
                          {...restField}
                          name={[name, 'note']}
                          label="Ghi chú"
                          style={{ flex: 1, marginBottom: 0 }}
                        >
                          <Input placeholder="Ví dụ: Thưởng hiệu suất" />
                        </Form.Item>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </Form.List>

          <Form.Item style={{ marginTop: 24, textAlign: 'right' }}>
            <Button onClick={() => setIsModalOpen(false)} style={{ marginRight: 8 }}>Hủy bỏ</Button>
            <Button type="primary" htmlType="submit">Lưu kết quả xét duyệt</Button>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default PayrollPeriodsPage;
