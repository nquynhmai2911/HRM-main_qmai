import React, { useEffect, useState } from 'react';
import { Table, Card, Typography, Spin, message, Tag } from 'antd';
import apiClient from '../../../lib/api';

const { Title } = Typography;

const MyPayslipsPage = () => {
  const [payslips, setPayslips] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchPayslips = async () => {
      try {
        setLoading(true);
        const { data } = await apiClient.get('/payroll/my-payslips');
        setPayslips(data);
      } catch (err) {
        message.error('Không thể tải dữ liệu phiếu lương');
      } finally {
        setLoading(false);
      }
    };
    fetchPayslips();
  }, []);

  const columns = [
    {
      title: 'Kỳ lương',
      key: 'period',
      render: (_: any, record: any) => `Tháng ${record.period.month}/${record.period.year}`,
    },
    {
      title: 'Ngày công',
      dataIndex: 'workDays',
      key: 'workDays',
    },
    {
      title: 'Tổng thu nhập (Gross)',
      dataIndex: 'grossIncome',
      key: 'grossIncome',
      render: (val: number) => <Typography.Text strong>{val?.toLocaleString('vi-VN')} VNĐ</Typography.Text>,
    },
    {
      title: 'Phụ cấp',
      dataIndex: 'allowanceTotal',
      key: 'allowanceTotal',
      render: (val: number) => val ? `${val.toLocaleString('vi-VN')} VNĐ` : '0 VNĐ',
    },
    {
      title: 'Tăng ca (OT)',
      dataIndex: 'otAmount',
      key: 'otAmount',
      render: (val: number) => val ? `${val.toLocaleString('vi-VN')} VNĐ` : '0 VNĐ',
    },
    {
      title: 'Khấu trừ (Thuế + BH)',
      key: 'deductions',
      render: (_: any, record: any) => {
        const d = (record.insuranceEmployee || 0) + (record.personalIncomeTax || 0) + (record.otherDeduction || 0);
        return <span style={{ color: 'red' }}>- {d.toLocaleString('vi-VN')} VNĐ</span>;
      }
    },
    {
      title: 'Thực nhận (Net Pay)',
      dataIndex: 'netPay',
      key: 'netPay',
      render: (val: number) => <strong style={{ color: 'green' }}>{val?.toLocaleString('vi-VN')} VNĐ</strong>,
    },
    {
      title: 'Trạng thái',
      key: 'status',
      render: (_: any, record: any) => {
        const s = record.period.status;
        if (s === 'PAID') return <Tag color="green">Đã thanh toán</Tag>;
        if (s === 'APPROVED') return <Tag color="blue">Đã duyệt</Tag>;
        return <Tag color="orange">Bản nháp</Tag>;
      },
    }
  ];

  return (
    <Card>
      <Title level={4}>Phiếu lương của tôi</Title>
      {loading ? (
        <Spin />
      ) : (
        <Table 
          dataSource={payslips} 
          columns={columns} 
          rowKey="id" 
          pagination={false}
          locale={{ emptyText: 'Chưa có dữ liệu phiếu lương nào' }}
        />
      )}
    </Card>
  );
};

export default MyPayslipsPage;
