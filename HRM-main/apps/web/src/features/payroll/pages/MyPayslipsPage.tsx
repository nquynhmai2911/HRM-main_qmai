import React, { useEffect, useState, useMemo } from 'react';
import { 
  Table, 
  Card, 
  Typography, 
  Spin, 
  message, 
  Tag, 
  Button, 
  Space, 
  Row, 
  Col, 
  Statistic, 
  Modal, 
  Descriptions, 
  Divider,
  Alert,
  Tooltip
} from 'antd';
import { 
  DollarOutlined, 
  EyeOutlined, 
  PrinterOutlined, 
  CalendarOutlined, 
  CheckCircleOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  UserOutlined
} from '@ant-design/icons';
import apiClient from '../../../lib/api';
import { useAuthStore } from '../../../lib/auth';

const { Title, Text } = Typography;

const fmtVND = (v: number) =>
  v != null ? Number(v).toLocaleString('vi-VN') + ' ₫' : '0 ₫';

const MyPayslipsPage = () => {
  const [payslips, setPayslips] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPayslip, setSelectedPayslip] = useState<any>(null);
  const { user } = useAuthStore();

  const fetchPayslips = async () => {
    try {
      setLoading(true);
      const { data } = await apiClient.get('/payroll/my-payslips');
      setPayslips(data || []);
    } catch (err) {
      message.error('Không thể tải dữ liệu phiếu lương cá nhân');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayslips();
  }, []);

  const latestPayslip = payslips[0];
  const totalNetThisYear = useMemo(() => {
    return payslips.reduce((acc, curr) => acc + (curr.netPay || 0), 0);
  }, [payslips]);

  const columns = [
    {
      title: 'STT',
      key: 'stt',
      width: 60,
      align: 'center' as const,
      render: (_: any, __: any, idx: number) => idx + 1,
    },
    {
      title: 'Kỳ lương',
      key: 'period',
      width: 150,
      render: (_: any, record: any) => (
        <Space size={8}>
          <CalendarOutlined style={{ color: '#1677ff' }} />
          <Text strong style={{ color: '#1e3a8a', fontSize: 13 }}>
            Tháng {record.period?.month}/{record.period?.year}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Chấm công',
      key: 'actualWork',
      width: 90,
      align: 'center' as const,
      render: (_: any, r: any) => <b>{r.actualWorkDays ?? r.workDays}</b>,
    },
    {
      title: 'Có phép',
      key: 'paidLeave',
      width: 80,
      align: 'center' as const,
      render: (_: any, r: any) => r.paidLeaveDays > 0 ? <Tag color="blue">{r.paidLeaveDays}</Tag> : <Text type="secondary">0</Text>,
    },
    {
      title: 'Lễ tết',
      key: 'holiday',
      width: 75,
      align: 'center' as const,
      render: (_: any, r: any) => r.holidayDays > 0 ? <Tag color="red">{r.holidayDays}</Tag> : <Text type="secondary">0</Text>,
    },
    {
      title: 'Chế độ',
      key: 'regime',
      width: 80,
      align: 'center' as const,
      render: (_: any, r: any) => r.regimeLeaveDays > 0 ? <Tag color="purple">{r.regimeLeaveDays}</Tag> : <Text type="secondary">0</Text>,
    },
    {
      title: 'Không phép',
      key: 'unpaid',
      width: 90,
      align: 'center' as const,
      render: (_: any, r: any) => r.unpaidLeaveDays > 0 ? <Tag color="error">{r.unpaidLeaveDays}</Tag> : <Text type="secondary">0</Text>,
    },
    {
      title: 'Phép còn lại',
      key: 'remainingLeave',
      width: 95,
      align: 'center' as const,
      render: (_: any, r: any) => <Tag color="green">{r.remainingAnnualLeave ?? 12}/12</Tag>,
    },
    {
      title: 'Tổng công',
      key: 'workDays',
      width: 95,
      align: 'center' as const,
      render: (_: any, r: any) => (
        <Tag color="cyan" style={{ fontWeight: 600 }}>
          {r.workDays}/{r.standardWorkDays || 22}
        </Tag>
      ),
    },
    {
      title: 'Lương công',
      dataIndex: 'baseIncome',
      key: 'baseIncome',
      width: 125,
      align: 'right' as const,
      render: fmtVND,
    },
    {
      title: 'Phụ cấp',
      dataIndex: 'allowanceTotal',
      key: 'allowanceTotal',
      width: 110,
      align: 'right' as const,
      render: fmtVND,
    },
    {
      title: 'Làm thêm giờ',
      dataIndex: 'otAmount',
      key: 'otAmount',
      width: 115,
      align: 'right' as const,
      render: fmtVND,
    },
    {
      title: 'Thưởng',
      dataIndex: 'bonus',
      key: 'bonus',
      width: 110,
      align: 'right' as const,
      render: (v: number) => v > 0 ? <Text strong style={{ color: '#d97706' }}>{fmtVND(v)}</Text> : <span style={{ color: '#94a3b8' }}>0 ₫</span>,
    },
    {
      title: 'Tổng thu nhập',
      dataIndex: 'grossIncome',
      key: 'grossIncome',
      width: 145,
      align: 'right' as const,
      render: (val: number) => (
        <Text strong style={{ color: '#52c41a', fontSize: 13 }}>
          {fmtVND(val)}
        </Text>
      ),
    },
    {
      title: 'Khấu trừ BH & Thuế',
      key: 'deductions',
      width: 140,
      align: 'right' as const,
      render: (_: any, record: any) => {
        const d = (record.insuranceEmployee || 0) + (record.personalIncomeTax || 0) + (record.otherDeduction || 0);
        return <Text strong style={{ color: '#ff4d4f' }}>- {fmtVND(d)}</Text>;
      }
    },
    {
      title: 'Tiền thực lĩnh',
      dataIndex: 'netPay',
      key: 'netPay',
      width: 150,
      align: 'right' as const,
      render: (val: number) => (
        <Text strong style={{ color: '#1677ff', fontSize: 14 }}>
          {fmtVND(val)}
        </Text>
      ),
    },
    {
      title: 'Trạng thái',
      key: 'status',
      width: 140,
      align: 'center' as const,
      render: (_: any, record: any) => {
        const s = record.period?.status;
        if (s === 'PAID') return <Tag color="success" icon={<CheckCircleOutlined />}>Đã thanh toán</Tag>;
        if (s === 'APPROVED') return <Tag color="processing" icon={<ClockCircleOutlined />}>Đã duyệt</Tag>;
        return <Tag color="warning" icon={<ClockCircleOutlined />}>Bản nháp</Tag>;
      },
    },
    {
      title: 'Hành động',
      key: 'action',
      width: 80,
      align: 'center' as const,
      fixed: 'right' as const,
      render: (_: any, record: any) => (
        <Tooltip title="Xem chi tiết phiếu lương">
          <Button 
            type="text" 
            size="small" 
            icon={<EyeOutlined style={{ color: '#1677ff' }} />} 
            onClick={() => setSelectedPayslip(record)}
          />
        </Tooltip>
      ),
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      {/* Metrics Row */}
      <Row gutter={16} style={{ marginBottom: 20 }}>
        <Col span={6}>
          <Card style={{ borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <Statistic 
              title="Thực lĩnh kỳ gần nhất" 
              value={latestPayslip?.netPay || 0} 
              formatter={v => fmtVND(Number(v))} 
              valueStyle={{ color: '#1677ff', fontWeight: 700 }}
              prefix={<DollarOutlined style={{ color: '#1677ff' }} />}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              Tháng {latestPayslip?.period?.month}/{latestPayslip?.period?.year || '—'}
            </Text>
          </Card>
        </Col>
        <Col span={6}>
          <Card style={{ borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <Statistic 
              title="Tổng thực lĩnh năm nay" 
              value={totalNetThisYear} 
              formatter={v => fmtVND(Number(v))} 
              valueStyle={{ color: '#52c41a', fontWeight: 700 }}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>Lũy kế các kỳ lương</Text>
          </Card>
        </Col>
        <Col span={6}>
          <Card style={{ borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <Statistic 
              title="Tổng số kỳ đã nhận" 
              value={payslips.length} 
              prefix={<CalendarOutlined style={{ color: '#fa8c16' }} />}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>Phiếu lương đã phát hành</Text>
          </Card>
        </Col>
        <Col span={6}>
          <Card style={{ borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <Statistic 
              title="Bảo hiểm đã trích đóng" 
              value={payslips.reduce((s, p) => s + (p.insuranceEmployee || 0), 0)} 
              formatter={v => fmtVND(Number(v))} 
              valueStyle={{ color: '#722ed1', fontWeight: 700 }}
              prefix={<FileTextOutlined style={{ color: '#722ed1' }} />}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>10.5% lương đóng BH</Text>
          </Card>
        </Col>
      </Row>

      <Card 
        title={
          <Space align="center">
            <div style={{ 
              width: 32, 
              height: 32, 
              borderRadius: 6, 
              backgroundColor: '#f0fdf4', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <DollarOutlined style={{ color: '#16a34a', fontSize: 18 }} />
            </div>
            <div>
              <Title level={4} style={{ margin: 0, color: '#1e3a8a' }}>Phiếu lương của tôi</Title>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Tra cứu chi tiết tiền lương, phụ cấp, tiền làm thêm giờ và các khoản khấu trừ từng kỳ
              </Text>
            </div>
          </Space>
        }
        extra={
          <Button onClick={fetchPayslips}>Làm mới</Button>
        }
        style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
      >
        <Alert
          type="info"
          showIcon
          icon={<UserOutlined />}
          message="Bảo mật tiền lương: Chỉ bạn và bộ phận Kế toán mới có quyền xem nội dung chi tiết các phiếu lương này."
          style={{ marginBottom: 16, borderRadius: 6 }}
        />

        <Table 
          dataSource={payslips} 
          columns={columns} 
          rowKey="id" 
          loading={loading}
          scroll={{ x: 1750 }}
          pagination={{ pageSize: 10, showTotal: t => `Tổng cộng ${t} phiếu lương` }}
          locale={{ emptyText: 'Chưa có dữ liệu phiếu lương nào.' }}
        />
      </Card>

      {/* Individual Payslip Modal */}
      {selectedPayslip && (
        <Modal
          title={
            <Space>
              <FileTextOutlined style={{ color: '#1677ff' }} />
              <span>Phiếu Lương Chi Tiết — Tháng {selectedPayslip.period?.month}/{selectedPayslip.period?.year}</span>
            </Space>
          }
          open={!!selectedPayslip}
          onCancel={() => setSelectedPayslip(null)}
          footer={[
            <Button key="print" icon={<PrinterOutlined />} onClick={() => window.print()}>
              In phiếu lương
            </Button>,
            <Button key="close" type="primary" onClick={() => setSelectedPayslip(null)}>
              Đóng
            </Button>
          ]}
          width={760}
        >
          <div style={{ padding: '8px 4px' }}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <Title level={4} style={{ margin: 0, color: '#1e3a8a' }}>PHIẾU LƯƠNG NHÂN VIÊN</Title>
              <Text type="secondary">Kỳ tính lương: Tháng {selectedPayslip.period?.month}/{selectedPayslip.period?.year}</Text>
            </div>

            <Descriptions bordered size="small" column={2} style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Nhân viên">{selectedPayslip.employee?.fullName || user?.employee?.fullName || user?.email}</Descriptions.Item>
              <Descriptions.Item label="Mã nhân viên"><Tag color="blue">{selectedPayslip.employee?.employeeCode || user?.employee?.employeeCode || 'DTS'}</Tag></Descriptions.Item>
            </Descriptions>

            {/* Chi tiết ngày công & phép */}
            <Divider orientation="left" style={{ margin: '12px 0', fontSize: 13, color: '#0284c7' }}>
              TỔNG HỢP NGÀY CÔNG & NGHỈ PHÉP
            </Divider>
            <Descriptions bordered size="small" column={3} style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Công chuẩn">{selectedPayslip.standardWorkDays || 22} ngày</Descriptions.Item>
              <Descriptions.Item label="Chấm công">{selectedPayslip.actualWorkDays ?? selectedPayslip.workDays} ngày</Descriptions.Item>
              <Descriptions.Item label="Nghỉ có phép">
                <span style={{ color: selectedPayslip.paidLeaveDays > 0 ? '#1677ff' : 'inherit' }}>
                  {selectedPayslip.paidLeaveDays || 0} ngày
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="Nghỉ lễ tết">{selectedPayslip.holidayDays || 0} ngày</Descriptions.Item>
              <Descriptions.Item label="Nghỉ chế độ">{selectedPayslip.regimeLeaveDays || 0} ngày</Descriptions.Item>
              <Descriptions.Item label="Không phép">
                <span style={{ color: selectedPayslip.unpaidLeaveDays > 0 ? '#dc2626' : 'inherit' }}>
                  {selectedPayslip.unpaidLeaveDays || 0} ngày
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="Phép còn lại">
                <Tag color="green" style={{ fontWeight: 600 }}>
                  {selectedPayslip.remainingAnnualLeave ?? 12} / 12 ngày
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Tổng công tính lương" span={2}>
                <Tag color="cyan" style={{ fontWeight: 700 }}>
                  {selectedPayslip.workDays} ngày
                </Tag>
              </Descriptions.Item>
            </Descriptions>

            <Divider orientation="left" style={{ margin: '12px 0', fontSize: 13, color: '#52c41a' }}>
              I. CÁC KHOẢN THU NHẬP
            </Divider>
            <Descriptions bordered size="small" column={2} style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Lương theo ngày công">{fmtVND(selectedPayslip.baseIncome)}</Descriptions.Item>
              <Descriptions.Item label="Làm thêm giờ (Tăng ca)">{fmtVND(selectedPayslip.otAmount)}</Descriptions.Item>
              <Descriptions.Item label="Tổng phụ cấp">{fmtVND(selectedPayslip.allowanceTotal)}</Descriptions.Item>
              <Descriptions.Item label="Tiền thưởng">
                {selectedPayslip.bonus > 0 ? (
                  <Text strong style={{ color: '#d97706' }}>{fmtVND(selectedPayslip.bonus)}</Text>
                ) : (
                  '0 ₫'
                )}
              </Descriptions.Item>
              <Descriptions.Item label="TỔNG THU NHẬP" span={2}>
                <Text strong style={{ color: '#52c41a', fontSize: 15 }}>{fmtVND(selectedPayslip.grossIncome)}</Text>
              </Descriptions.Item>
            </Descriptions>

            <Divider orientation="left" style={{ margin: '12px 0', fontSize: 13, color: '#ff4d4f' }}>
              II. CÁC KHOẢN GIẢM TRỪ VÀ THUẾ
            </Divider>
            <Descriptions bordered size="small" column={2} style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Bảo hiểm trừ lương (10.5%)">{fmtVND(selectedPayslip.insuranceEmployee)}</Descriptions.Item>
              <Descriptions.Item label="Bảo hiểm công ty nộp (21.5%)">{fmtVND(selectedPayslip.insuranceCompany)}</Descriptions.Item>
              <Descriptions.Item label="Thuế TNCN khấu trừ">{fmtVND(selectedPayslip.personalIncomeTax)}</Descriptions.Item>
              <Descriptions.Item label="Khấu trừ khác">{fmtVND(selectedPayslip.otherDeduction)}</Descriptions.Item>
              <Descriptions.Item label="TỔNG CÁC KHOẢN GIẢM TRỪ" span={2}>
                <Text strong style={{ color: '#ff4d4f' }}>
                  - {fmtVND((selectedPayslip.insuranceEmployee || 0) + (selectedPayslip.personalIncomeTax || 0) + (selectedPayslip.otherDeduction || 0))}
                </Text>
              </Descriptions.Item>
            </Descriptions>

            <div style={{
              backgroundColor: '#f0fdf4',
              border: '1px solid #86efac',
              borderRadius: 8,
              padding: '16px',
              textAlign: 'center',
              marginTop: 16
            }}>
              <Text type="secondary" style={{ fontSize: 13, display: 'block', marginBottom: 4 }}>
                SỐ TIỀN THỰC LĨNH CHI TRẢ
              </Text>
              <Title level={2} style={{ margin: 0, color: '#16a34a' }}>
                {fmtVND(selectedPayslip.netPay)}
              </Title>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default MyPayslipsPage;
