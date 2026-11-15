import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Card, Typography, Table, Spin, message, Tag, Button, Modal,
  Form, DatePicker, InputNumber, Input, Result, Space, Popconfirm,
  Divider, Row, Col, Statistic, Tooltip, Alert, Badge, Tabs, Select,
  Descriptions,
} from 'antd';
import {
  CalculatorOutlined, CheckCircleOutlined, DollarOutlined,
  PlusOutlined, EyeOutlined, UserOutlined, FileTextOutlined,
  ClockCircleOutlined, WarningOutlined, ExclamationCircleOutlined,
  SearchOutlined, CalendarOutlined, TeamOutlined, BankOutlined,
  PrinterOutlined, ReloadOutlined, SafetyCertificateOutlined,
  FileExcelOutlined,
} from '@ant-design/icons';
import apiClient from '../../../lib/api';
import { useAuthStore } from '../../../lib/auth';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

const statusConfig: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
  DRAFT:    { color: 'warning', label: 'Bản nháp', icon: <ClockCircleOutlined /> },
  APPROVED: { color: 'processing', label: 'Đã duyệt', icon: <CheckCircleOutlined /> },
  PAID:     { color: 'success', label: 'Đã thanh toán', icon: <DollarOutlined /> },
};

const fmtVND = (v: number) =>
  v != null ? Number(v).toLocaleString('vi-VN') + ' ₫' : '0 ₫';

// ─────────────────────── INDIVIDUAL PAYSLIP POPUP MODAL ───────────────────────
const IndividualPayslipModal = ({
  open, onClose, payslip,
}: { open: boolean; onClose: () => void; payslip: any }) => {
  if (!payslip) return null;

  return (
    <Modal
      title={
        <Space>
          <FileTextOutlined style={{ color: '#1677ff' }} />
          <span>Phiếu lương chi tiết — {payslip.employee?.fullName} ({payslip.employee?.employeeCode})</span>
        </Space>
      }
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="print" icon={<PrinterOutlined />} onClick={() => window.print()}>
          In phiếu lương
        </Button>,
        <Button key="close" type="primary" onClick={onClose}>
          Đóng
        </Button>
      ]}
      width={780}
    >
      <div style={{ padding: '8px 4px' }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <Title level={4} style={{ margin: 0, color: '#1e3a8a' }}>PHIẾU LƯƠNG NHÂN VIÊN</Title>
          <Text type="secondary">Kỳ lương: Tháng {payslip.period?.month}/{payslip.period?.year}</Text>
        </div>

        {/* Thông tin nhân sự */}
        <Descriptions bordered size="small" column={2} style={{ marginBottom: 16 }}>
          <Descriptions.Item label="Họ và tên">{payslip.employee?.fullName}</Descriptions.Item>
          <Descriptions.Item label="Mã nhân viên"><Tag color="blue">{payslip.employee?.employeeCode}</Tag></Descriptions.Item>
          <Descriptions.Item label="Phòng ban">{payslip.employee?.department?.name || '—'}</Descriptions.Item>
          <Descriptions.Item label="Chức danh">{payslip.employee?.position?.name || '—'}</Descriptions.Item>
        </Descriptions>

        {/* Chi tiết phân tích ngày công & nghỉ phép */}
        <Divider orientation="left" style={{ margin: '12px 0', fontSize: 13, color: '#0284c7' }}>
          TỔNG HỢP NGÀY CÔNG & NGHỈ PHÉP
        </Divider>
        <Descriptions bordered size="small" column={3} style={{ marginBottom: 16 }}>
          <Descriptions.Item label="Công chuẩn">{payslip.standardWorkDays || 22} ngày</Descriptions.Item>
          <Descriptions.Item label="Chấm công">{payslip.actualWorkDays ?? payslip.workDays} ngày</Descriptions.Item>
          <Descriptions.Item label="Nghỉ có phép">
            <span style={{ color: payslip.paidLeaveDays > 0 ? '#1677ff' : 'inherit' }}>
              {payslip.paidLeaveDays || 0} ngày
            </span>
          </Descriptions.Item>
          <Descriptions.Item label="Nghỉ lễ tết">{payslip.holidayDays || 0} ngày</Descriptions.Item>
          <Descriptions.Item label="Nghỉ chế độ">{payslip.regimeLeaveDays || 0} ngày</Descriptions.Item>
          <Descriptions.Item label="Không phép">
            <span style={{ color: payslip.unpaidLeaveDays > 0 ? '#dc2626' : 'inherit' }}>
              {payslip.unpaidLeaveDays || 0} ngày
            </span>
          </Descriptions.Item>
          <Descriptions.Item label="Phép còn lại">
            <Tag color="green" style={{ fontWeight: 600 }}>
              {payslip.remainingAnnualLeave ?? 12} / 12 ngày
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Tổng công tính lương" span={2}>
            <Tag color="cyan" style={{ fontWeight: 700 }}>
              {payslip.workDays} ngày
            </Tag>
          </Descriptions.Item>
        </Descriptions>

        <Divider orientation="left" style={{ margin: '12px 0', fontSize: 13, color: '#52c41a' }}>
          I. CÁC KHOẢN THU NHẬP
        </Divider>
        <Descriptions bordered size="small" column={2} style={{ marginBottom: 16 }}>
          <Descriptions.Item label="Lương theo ngày công">{fmtVND(payslip.baseIncome)}</Descriptions.Item>
          <Descriptions.Item label="Tiền làm thêm giờ">{fmtVND(payslip.otAmount)}</Descriptions.Item>
          <Descriptions.Item label="Tổng phụ cấp">{fmtVND(payslip.allowanceTotal)}</Descriptions.Item>
          <Descriptions.Item label="Tiền thưởng (nếu có)">
            {payslip.bonus > 0 ? (
              <Text strong style={{ color: '#d97706' }}>{fmtVND(payslip.bonus)}</Text>
            ) : (
              '0 ₫'
            )}
          </Descriptions.Item>
          <Descriptions.Item label="TỔNG THU NHẬP" span={2}>
            <Text strong style={{ color: '#52c41a', fontSize: 15 }}>{fmtVND(payslip.grossIncome)}</Text>
          </Descriptions.Item>
        </Descriptions>

        <Divider orientation="left" style={{ margin: '12px 0', fontSize: 13, color: '#ff4d4f' }}>
          II. CÁC KHOẢN KHẤU TRỪ VÀ THUẾ
        </Divider>
        <Descriptions bordered size="small" column={2} style={{ marginBottom: 16 }}>
          <Descriptions.Item label="Bảo hiểm NLĐ đóng (10.5%)">{fmtVND(payslip.insuranceEmployee)}</Descriptions.Item>
          <Descriptions.Item label="Bảo hiểm DN đóng (21.5%)">{fmtVND(payslip.insuranceCompany)}</Descriptions.Item>
          <Descriptions.Item label="Thuế TNCN khấu trừ">{fmtVND(payslip.personalIncomeTax)}</Descriptions.Item>
          <Descriptions.Item label="Khấu trừ khác">{fmtVND(payslip.otherDeduction)}</Descriptions.Item>
          <Descriptions.Item label="TỔNG CÁC KHOẢN KHẤU TRỪ" span={2}>
            <Text strong style={{ color: '#ff4d4f' }}>
              - {fmtVND((payslip.insuranceEmployee || 0) + (payslip.personalIncomeTax || 0) + (payslip.otherDeduction || 0))}
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
            SỐ TIỀN THỰC LĨNH CHUYỂN KHOẢN
          </Text>
          <Title level={2} style={{ margin: 0, color: '#16a34a' }}>
            {fmtVND(payslip.netPay)}
          </Title>
        </div>
      </div>
    </Modal>
  );
};

// ─────────────────────── EXCEL EXPORT HELPER ───────────────────────
const exportPayslipsToExcel = (payslips: any[], period: any) => {
  if (!payslips || !payslips.length) {
    message.warning('Không có dữ liệu phiếu lương để xuất file');
    return;
  }

  const headers = [
    'STT',
    'Mã NV',
    'Họ và tên',
    'Phòng ban',
    'Chức vụ',
    'Ngày công chuẩn',
    'Chấm công thực tế',
    'Nghỉ có phép',
    'Nghỉ lễ tết',
    'Nghỉ chế độ',
    'Nghỉ không phép',
    'Phép năm còn lại',
    'Tổng ngày công tính lương',
    'Lương theo ngày công',
    'Phụ cấp',
    'Tiền làm thêm giờ',
    'Tiền thưởng (nếu có)',
    'Tổng thu nhập',
    'BHXH NLĐ (10.5%)',
    'BHXH Doanh nghiệp (21.5%)',
    'Thuế TNCN',
    'Khấu trừ khác',
    'Tổng các khoản khấu trừ',
    'Tiền thực lĩnh chi trả',
    'Số tài khoản',
    'Ngân hàng',
  ];

  const rows = payslips.map((p, idx) => {
    const totalDeduct = (p.insuranceEmployee || 0) + (p.personalIncomeTax || 0) + (p.otherDeduction || 0);
    return [
      idx + 1,
      `"${p.employee?.employeeCode || ''}"`,
      `"${p.employee?.fullName || ''}"`,
      `"${p.employee?.department?.name || ''}"`,
      `"${p.employee?.position?.name || ''}"`,
      p.standardWorkDays || 22,
      p.actualWorkDays ?? p.workDays ?? 0,
      p.paidLeaveDays ?? 0,
      p.holidayDays ?? 0,
      p.regimeLeaveDays ?? 0,
      p.unpaidLeaveDays ?? 0,
      p.remainingAnnualLeave ?? 12,
      p.workDays || 0,
      p.baseIncome || 0,
      p.allowanceTotal || 0,
      p.otAmount || 0,
      p.bonus || 0,
      p.grossIncome || 0,
      p.insuranceEmployee || 0,
      p.insuranceCompany || 0,
      p.personalIncomeTax || 0,
      p.otherDeduction || 0,
      totalDeduct,
      p.netPay || 0,
      `"\t${p.employee?.bankAccount || ''}"`,
      `"${p.employee?.bankName || ''}"`,
    ].join(',');
  });

  const sumGross = payslips.reduce((s, p) => s + (p.grossIncome || 0), 0);
  const sumBase = payslips.reduce((s, p) => s + (p.baseIncome || 0), 0);
  const sumAllow = payslips.reduce((s, p) => s + (p.allowanceTotal || 0), 0);
  const sumOT = payslips.reduce((s, p) => s + (p.otAmount || 0), 0);
  const sumBonus = payslips.reduce((s, p) => s + (p.bonus || 0), 0);
  const sumInsEmp = payslips.reduce((s, p) => s + (p.insuranceEmployee || 0), 0);
  const sumInsComp = payslips.reduce((s, p) => s + (p.insuranceCompany || 0), 0);
  const sumTax = payslips.reduce((s, p) => s + (p.personalIncomeTax || 0), 0);
  const sumOtherDed = payslips.reduce((s, p) => s + (p.otherDeduction || 0), 0);
  const sumTotalDed = payslips.reduce((s, p) => s + ((p.insuranceEmployee || 0) + (p.personalIncomeTax || 0) + (p.otherDeduction || 0)), 0);
  const sumNet = payslips.reduce((s, p) => s + (p.netPay || 0), 0);

  const summaryRow = [
    '"TỔNG CỘNG"',
    '""',
    `"${payslips.length} nhân viên"`,
    '""',
    '""',
    '""',
    '""',
    '""',
    '""',
    '""',
    '""',
    '""',
    '""',
    sumBase,
    sumAllow,
    sumOT,
    sumBonus,
    sumGross,
    sumInsEmp,
    sumInsComp,
    sumTax,
    sumOtherDed,
    sumTotalDed,
    sumNet,
    '""',
    '""',
  ].join(',');

  const csvContent = '\uFEFF' + [headers.join(','), ...rows, summaryRow].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `Bang_Tinh_Luong_Thang_${period?.month}_${period?.year}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  message.success('Đã xuất file Excel (.csv) bảng lương thành công!');
};

// ─────────────────────── PAYSLIP DETAIL MODAL (EXCEL SHEET STYLE) ───────────────
const PayslipDetailModal = ({
  open, onClose, period,
}: { open: boolean; onClose: () => void; period: any }) => {
  const [payslips, setPayslips] = useState<any[]>([]);
  const [loading, setLoading]   = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedPayslip, setSelectedPayslip] = useState<any>(null);

  useEffect(() => {
    if (!open || !period) return;
    setLoading(true);
    apiClient.get(`/payroll/periods/${period.id}/payslips`)
      .then(({ data }) => setPayslips(data || []))
      .catch(() => message.error('Lỗi khi tải danh sách phiếu lương'))
      .finally(() => setLoading(false));
  }, [open, period]);

  const filteredPayslips = useMemo(() => {
    if (!searchText.trim()) return payslips;
    const q = searchText.toLowerCase();
    return payslips.filter(p =>
      (p.employee?.fullName && p.employee.fullName.toLowerCase().includes(q)) ||
      (p.employee?.employeeCode && p.employee.employeeCode.toLowerCase().includes(q)) ||
      (p.employee?.department?.name && p.employee.department.name.toLowerCase().includes(q))
    );
  }, [payslips, searchText]);

  const summary = useMemo(() => ({
    totalGross:      filteredPayslips.reduce((s: number, r: any) => s + (r.grossIncome || 0), 0),
    totalBase:       filteredPayslips.reduce((s: number, r: any) => s + (r.baseIncome || 0), 0),
    totalAllow:      filteredPayslips.reduce((s: number, r: any) => s + (r.allowanceTotal || 0), 0),
    totalOT:         filteredPayslips.reduce((s: number, r: any) => s + (r.otAmount || 0), 0),
    totalBonus:      filteredPayslips.reduce((s: number, r: any) => s + (r.bonus || 0), 0),
    totalNet:        filteredPayslips.reduce((s: number, r: any) => s + (r.netPay || 0), 0),
    totalTax:        filteredPayslips.reduce((s: number, r: any) => s + (r.personalIncomeTax || 0), 0),
    totalInsurance:  filteredPayslips.reduce((s: number, r: any) => s + (r.insuranceEmployee || 0), 0),
    totalCompanyIns: filteredPayslips.reduce((s: number, r: any) => s + (r.insuranceCompany || 0), 0),
    totalDeductions: filteredPayslips.reduce((s: number, r: any) => s + ((r.insuranceEmployee || 0) + (r.personalIncomeTax || 0) + (r.otherDeduction || 0)), 0),
  }), [filteredPayslips]);

  return (
    <Modal
      title={null}
      open={open}
      onCancel={onClose}
      footer={[
        <Space key="footer-actions" style={{ width: '100%', justifyContent: 'space-between' }}>
          <Space>
            <Tag color="green" icon={<FileExcelOutlined />}>Định dạng Bảng tính Excel</Tag>
            <Text type="secondary" style={{ fontSize: 13 }}>
              Tổng cộng: <Text strong>{filteredPayslips.length}</Text> nhân sự trong kỳ lương
            </Text>
          </Space>
          <Space>
            <Button
              icon={<FileExcelOutlined style={{ color: '#107c41' }} />}
              onClick={() => exportPayslipsToExcel(filteredPayslips, period)}
            >
              Xuất file Excel (.csv)
            </Button>
            <Button icon={<PrinterOutlined />} onClick={() => window.print()}>
              In bảng lương
            </Button>
            <Button type="primary" onClick={onClose}>
              Đóng bảng tính
            </Button>
          </Space>
        </Space>
      ]}
      width={1580}
      style={{ top: 16 }}
      bodyStyle={{ padding: 0 }}
    >
      {/* Excel Ribbon Top Bar */}
      <div style={{
        background: 'linear-gradient(135deg, #107c41 0%, #0d5f32 100%)',
        padding: '14px 24px',
        color: '#ffffff',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
      }}>
        <Space size={14} align="center">
          <div style={{
            width: 42,
            height: 42,
            borderRadius: 8,
            background: 'rgba(255,255,255,0.18)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(255,255,255,0.3)',
          }}>
            <FileExcelOutlined style={{ fontSize: 24, color: '#ffffff' }} />
          </div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#ffffff', letterSpacing: 0.3 }}>
              BẢNG TÍNH LƯƠNG TOÀN DOANH NGHIỆP — THÁNG {period?.month}/{period?.year}
            </div>
            <div style={{ fontSize: 12, color: '#dcfce7', marginTop: 2 }}>
              Dữ liệu chi tiết: Chấm công, nghỉ có phép, lễ tết, chế độ, không phép, phép còn lại, thưởng và tiền thực lĩnh
            </div>
          </div>
          <Tag color={statusConfig[period?.status]?.color} style={{ marginLeft: 12, fontWeight: 600 }}>
            {statusConfig[period?.status]?.label}
          </Tag>
        </Space>

        <Space size={10}>
          <Button
            icon={<FileExcelOutlined />}
            style={{
              background: '#ffffff',
              color: '#107c41',
              borderColor: '#ffffff',
              fontWeight: 600,
            }}
            onClick={() => exportPayslipsToExcel(filteredPayslips, period)}
          >
            Xuất file Excel (.csv)
          </Button>
          <Button
            icon={<PrinterOutlined />}
            style={{
              background: 'rgba(255,255,255,0.15)',
              borderColor: 'rgba(255,255,255,0.35)',
              color: '#ffffff',
            }}
            onClick={() => window.print()}
          >
            In bảng lương
          </Button>
        </Space>
      </div>

      <div style={{ padding: '20px 24px' }}>
        {loading ? (
          <Spin style={{ display: 'block', margin: '60px auto' }} />
        ) : (
          <>
            {/* Metric Summary Cards styled like Excel Dashboard */}
            <Row gutter={14} style={{ marginBottom: 18 }}>
              <Col span={6}>
                <Card size="small" style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8 }}>
                  <Statistic
                    title={<Text strong style={{ color: '#166534', fontSize: 13 }}>I. Tổng quỹ thu nhập</Text>}
                    value={summary.totalGross}
                    formatter={v => fmtVND(Number(v))}
                    valueStyle={{ color: '#15803d', fontSize: 18, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}
                  />
                  <Text type="secondary" style={{ fontSize: 11 }}>Lương công, phụ cấp, OT & tiền thưởng</Text>
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small" style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8 }}>
                  <Statistic
                    title={<Text strong style={{ color: '#1e40af', fontSize: 13 }}>II. Tiền làm thêm giờ</Text>}
                    value={summary.totalOT}
                    formatter={v => fmtVND(Number(v))}
                    valueStyle={{ color: '#2563eb', fontSize: 18, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}
                  />
                  <Text type="secondary" style={{ fontSize: 11 }}>Tổng tiền làm thêm / tăng ca toàn công ty</Text>
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small" style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 8 }}>
                  <Statistic
                    title={<Text strong style={{ color: '#b45309', fontSize: 13 }}>III. Tiền thưởng (nếu có)</Text>}
                    value={summary.totalBonus}
                    formatter={v => fmtVND(Number(v))}
                    valueStyle={{ color: '#d97706', fontSize: 18, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}
                  />
                  <Text type="secondary" style={{ fontSize: 11 }}>Thưởng KPI, hiệu quả & khen thưởng định kỳ</Text>
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small" style={{ background: '#ecfeff', border: '2px solid #0284c7', borderRadius: 8 }}>
                  <Statistic
                    title={<Text strong style={{ color: '#0369a1', fontSize: 13 }}>IV. TỔNG THỰC LĨNH CHI TRẢ</Text>}
                    value={summary.totalNet}
                    formatter={v => fmtVND(Number(v))}
                    valueStyle={{ color: '#0284c7', fontSize: 19, fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}
                  />
                  <Text type="secondary" style={{ fontSize: 11 }}>Số tiền thực chuyển khoản tới nhân viên</Text>
                </Card>
              </Col>
            </Row>

            {/* Excel Sheet Controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Space>
                <Input
                  placeholder="Lọc theo Mã NV, Họ tên hoặc Phòng ban..."
                  prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                  value={searchText}
                  onChange={e => setSearchText(e.target.value)}
                  allowClear
                  style={{ width: 340 }}
                />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  (Bảng tính gồm chi tiết chấm công, các diện nghỉ phép, thưởng và tiền thực lĩnh)
                </Text>
              </Space>
              <Text type="secondary" style={{ fontSize: 13 }}>
                Đang hiển thị: <Text strong style={{ color: '#107c41' }}>{filteredPayslips.length}</Text> / {payslips.length} dòng dữ liệu
              </Text>
            </div>

            {/* Excel-like Table */}
            <Table
              dataSource={filteredPayslips}
              rowKey="id"
              pagination={{ pageSize: 12, showTotal: t => `Tổng cộng ${t} dòng bảng tính` }}
              scroll={{ x: 1950 }}
              size="small"
              bordered
              className="excel-payroll-table"
              locale={{ emptyText: 'Chưa có dữ liệu phiếu lương cho kỳ này.' }}
              summary={() => filteredPayslips.length > 0 ? (
                <Table.Summary.Row style={{
                  background: '#f8fafc',
                  fontWeight: 700,
                  borderTop: '2px solid #0f172a',
                  borderBottom: '3px double #0f172a',
                }}>
                  <Table.Summary.Cell index={0} colSpan={11} align="center">
                    <Text strong style={{ color: '#0f172a', fontSize: 13, letterSpacing: 0.5 }}>
                      TỔNG CỘNG ({filteredPayslips.length} NHÂN VIÊN)
                    </Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={11} align="right">
                    <Text strong style={{ fontVariantNumeric: 'tabular-nums' }}>{fmtVND(summary.totalBase)}</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={12} align="right">
                    <Text strong style={{ fontVariantNumeric: 'tabular-nums' }}>{fmtVND(summary.totalAllow)}</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={13} align="right">
                    <Text strong style={{ color: '#2563eb', fontVariantNumeric: 'tabular-nums' }}>{fmtVND(summary.totalOT)}</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={14} align="right">
                    <Text strong style={{ color: '#d97706', fontVariantNumeric: 'tabular-nums' }}>{fmtVND(summary.totalBonus)}</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={15} align="right">
                    <Text strong style={{ color: '#16a34a', fontSize: 14, fontVariantNumeric: 'tabular-nums' }}>{fmtVND(summary.totalGross)}</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={16} align="right">
                    <Text strong style={{ color: '#dc2626', fontVariantNumeric: 'tabular-nums' }}>{fmtVND(summary.totalInsurance)}</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={17} align="right">
                    <Text strong style={{ color: '#dc2626', fontVariantNumeric: 'tabular-nums' }}>{fmtVND(summary.totalTax)}</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={18} align="right">
                    <Text strong style={{ color: '#0284c7', fontSize: 15, fontVariantNumeric: 'tabular-nums' }}>{fmtVND(summary.totalNet)}</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={19} />
                </Table.Summary.Row>
              ) : undefined}
            >
              {/* Nhóm 1: Nhân sự & Ngày công */}
              <Table.ColumnGroup title={
                <div style={{
                  textAlign: 'center',
                  background: '#f1f5f9',
                  padding: '4px 0',
                  color: '#334155',
                  fontWeight: 700,
                  fontSize: 12,
                  letterSpacing: 0.3,
                }}>
                  1. THÔNG TIN NHÂN SỰ & NGÀY CÔNG (CHI TIẾT CHẤM CÔNG & NGHỈ PHÉP)
                </div>
              }>
                <Table.Column
                  title="STT"
                  key="stt"
                  width={50}
                  align="center"
                  render={(_: any, __: any, idx: number) => idx + 1}
                />
                <Table.Column
                  title="Mã NV"
                  key="empCode"
                  width={90}
                  align="center"
                  render={(_: any, r: any) => <Tag color="blue">{r.employee?.employeeCode}</Tag>}
                />
                <Table.Column
                  title="Họ và tên"
                  key="empName"
                  width={160}
                  render={(_: any, r: any) => <Text strong style={{ color: '#0f172a' }}>{r.employee?.fullName}</Text>}
                />
                <Table.Column
                  title="Phòng ban"
                  key="dept"
                  width={125}
                  render={(_: any, r: any) => r.employee?.department?.name || '—'}
                />
                <Table.Column
                  title="Chấm công"
                  key="actualWork"
                  width={80}
                  align="center"
                  render={(_: any, r: any) => (
                    <span style={{ fontWeight: 600 }}>{r.actualWorkDays ?? r.workDays}</span>
                  )}
                />
                <Table.Column
                  title="Có phép"
                  key="paidLeave"
                  width={75}
                  align="center"
                  render={(_: any, r: any) => (
                    r.paidLeaveDays > 0 ? <Tag color="blue">{r.paidLeaveDays}</Tag> : <Text type="secondary">0</Text>
                  )}
                />
                <Table.Column
                  title="Lễ tết"
                  key="holiday"
                  width={70}
                  align="center"
                  render={(_: any, r: any) => (
                    r.holidayDays > 0 ? <Tag color="red">{r.holidayDays}</Tag> : <Text type="secondary">0</Text>
                  )}
                />
                <Table.Column
                  title="Chế độ"
                  key="regime"
                  width={75}
                  align="center"
                  render={(_: any, r: any) => (
                    r.regimeLeaveDays > 0 ? <Tag color="purple">{r.regimeLeaveDays}</Tag> : <Text type="secondary">0</Text>
                  )}
                />
                <Table.Column
                  title="Không phép"
                  key="unpaid"
                  width={85}
                  align="center"
                  render={(_: any, r: any) => (
                    r.unpaidLeaveDays > 0 ? <Tag color="error">{r.unpaidLeaveDays}</Tag> : <Text type="secondary">0</Text>
                  )}
                />
                <Table.Column
                  title="Phép còn lại"
                  key="remainingLeave"
                  width={90}
                  align="center"
                  render={(_: any, r: any) => (
                    <Tag color="green" style={{ fontWeight: 600 }}>
                      {r.remainingAnnualLeave ?? 12}/12
                    </Tag>
                  )}
                />
                <Table.Column
                  title="Tổng công"
                  key="wd"
                  width={90}
                  align="center"
                  render={(_: any, r: any) => (
                    <Tag color="cyan" style={{ fontWeight: 700 }}>
                      {r.workDays}/{r.standardWorkDays || 22}
                    </Tag>
                  )}
                />
              </Table.ColumnGroup>

              {/* Nhóm 2: Thu nhập */}
              <Table.ColumnGroup title={
                <div style={{
                  textAlign: 'center',
                  background: '#f0fdf4',
                  padding: '4px 0',
                  color: '#166534',
                  fontWeight: 700,
                  fontSize: 12,
                  letterSpacing: 0.3,
                }}>
                  2. CÁC KHOẢN THU NHẬP
                </div>
              }>
                <Table.Column
                  title="Lương theo công"
                  dataIndex="baseIncome"
                  key="base"
                  width={125}
                  align="right"
                  render={fmtVND}
                />
                <Table.Column
                  title="Phụ cấp"
                  dataIndex="allowanceTotal"
                  key="allow"
                  width={105}
                  align="right"
                  render={fmtVND}
                />
                <Table.Column
                  title="Làm thêm giờ"
                  dataIndex="otAmount"
                  key="ot"
                  width={110}
                  align="right"
                  render={fmtVND}
                />
                <Table.Column
                  title="Thưởng (nếu có)"
                  dataIndex="bonus"
                  key="bonus"
                  width={115}
                  align="right"
                  render={(v: number) => (
                    v > 0 ? (
                      <Text strong style={{ color: '#d97706', fontVariantNumeric: 'tabular-nums' }}>
                        {fmtVND(v)}
                      </Text>
                    ) : (
                      <span style={{ color: '#94a3b8' }}>0 ₫</span>
                    )
                  )}
                />
                <Table.Column
                  title="Tổng thu nhập"
                  dataIndex="grossIncome"
                  key="gross"
                  width={140}
                  align="right"
                  render={(v: number) => (
                    <Text strong style={{ color: '#16a34a', fontVariantNumeric: 'tabular-nums' }}>
                      {fmtVND(v)}
                    </Text>
                  )}
                />
              </Table.ColumnGroup>

              {/* Nhóm 3: Khấu trừ */}
              <Table.ColumnGroup title={
                <div style={{
                  textAlign: 'center',
                  background: '#fef2f2',
                  padding: '4px 0',
                  color: '#991b1b',
                  fontWeight: 700,
                  fontSize: 12,
                  letterSpacing: 0.3,
                }}>
                  3. CÁC KHOẢN GIẢM TRỪ VÀ THUẾ
                </div>
              }>
                <Table.Column
                  title="BHXH (10.5%)"
                  dataIndex="insuranceEmployee"
                  key="ins"
                  width={115}
                  align="right"
                  render={fmtVND}
                />
                <Table.Column
                  title="Thuế TNCN"
                  dataIndex="personalIncomeTax"
                  key="tax"
                  width={110}
                  align="right"
                  render={fmtVND}
                />
              </Table.ColumnGroup>

              {/* Nhóm 4: Thực lĩnh */}
              <Table.ColumnGroup title={
                <div style={{
                  textAlign: 'center',
                  background: '#eff6ff',
                  padding: '4px 0',
                  color: '#1e40af',
                  fontWeight: 700,
                  fontSize: 12,
                  letterSpacing: 0.3,
                }}>
                  4. TIỀN THỰC LĨNH CHI TRẢ
                </div>
              }>
                <Table.Column
                  title="Tiền thực lĩnh"
                  dataIndex="netPay"
                  key="net"
                  width={145}
                  align="right"
                  render={(v: number) => (
                    <Text strong style={{ color: '#0284c7', fontSize: 14, fontVariantNumeric: 'tabular-nums' }}>
                      {fmtVND(v)}
                    </Text>
                  )}
                />
                <Table.Column
                  title="Chi tiết"
                  key="action"
                  width={65}
                  align="center"
                  render={(_: any, r: any) => (
                    <Tooltip title="Xem chi tiết phiếu lương cá nhân">
                      <Button
                        type="text"
                        size="small"
                        icon={<EyeOutlined style={{ color: '#1677ff' }} />}
                        onClick={() => setSelectedPayslip(r)}
                      />
                    </Tooltip>
                  )}
                />
              </Table.ColumnGroup>
            </Table>

            {/* Individual Payslip Modal */}
            <IndividualPayslipModal
              open={!!selectedPayslip}
              onClose={() => setSelectedPayslip(null)}
              payslip={selectedPayslip}
            />
          </>
        )}
      </div>
    </Modal>
  );
};

// ─────────────────────── COMPUTE PREVIEW MODAL (GROUPED COLUMNS) ───────────────
const ComputePreviewModal = ({
  open, onClose, period, onConfirmComputed,
}: { open: boolean; onClose: () => void; period: any; onConfirmComputed: () => void }) => {
  const [rows, setRows]         = useState<any[]>([]);
  const [loading, setLoading]   = useState(false);
  const [computing, setComputing] = useState(false);
  const [summary, setSummary]   = useState({ totalGross: 0, totalNet: 0, totalTax: 0, totalInsurance: 0, noProfile: 0 });

  useEffect(() => {
    if (!open || !period) return;
    setLoading(true);
    apiClient.get(`/payroll/periods/${period.id}/preview`)
      .then(({ data }) => {
        const r = data.rows || [];
        setRows(r);
        const valid = r.filter((x: any) => x.hasSalaryProfile);
        setSummary({
          totalGross:     valid.reduce((s: number, x: any) => s + (x.grossIncome || 0), 0),
          totalNet:       valid.reduce((s: number, x: any) => s + (x.netPay || 0), 0),
          totalTax:       valid.reduce((s: number, x: any) => s + (x.personalIncomeTax || 0), 0),
          totalInsurance: valid.reduce((s: number, x: any) => s + (x.insuranceEmployee || 0), 0),
          noProfile:      r.filter((x: any) => !x.hasSalaryProfile).length,
        });
      })
      .catch(() => message.error('Lỗi khi tải dữ liệu xem trước'))
      .finally(() => setLoading(false));
  }, [open, period]);

  const handleConfirm = async () => {
    try {
      setComputing(true);
      const { data } = await apiClient.post(`/payroll/periods/${period.id}/compute`);
      message.success(
        `✅ Đã tính lương ${data.count} nhân viên thành công!` +
        (data.skipped?.length ? ` Bỏ qua ${data.skipped.length} NV chưa có hồ sơ lương.` : '')
      );
      onClose();
      onConfirmComputed();
    } catch (err: any) {
      message.error(err?.response?.data?.message || 'Lỗi khi tính lương');
    } finally {
      setComputing(false);
    }
  };

  const validCount = rows.filter(r => r.hasSalaryProfile).length;

  return (
    <Modal
      title={
        <Space>
          <CalculatorOutlined style={{ color: '#1677ff' }} />
          <span>Dự toán & Tính lương tự động — Tháng {period?.month}/{period?.year}</span>
          <Badge count={`${validCount} NV đủ điều kiện`} style={{ background: '#52c41a' }} />
        </Space>
      }
      open={open}
      onCancel={onClose}
      width={1400}
      style={{ top: 16 }}
      footer={
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Text type="secondary">
            {summary.noProfile > 0 && (
              <span style={{ color: '#ff4d4f' }}>
                <ExclamationCircleOutlined /> {summary.noProfile} nhân viên chưa có hồ sơ lương sẽ bị bỏ qua.
              </span>
            )}
          </Text>
          <Space>
            <Button onClick={onClose}>Hủy bỏ</Button>
            <Button
              type="primary"
              icon={<CalculatorOutlined />}
              loading={computing}
              disabled={validCount === 0}
              onClick={handleConfirm}
              size="large"
            >
              Xác nhận tính lương ({validCount} nhân viên)
            </Button>
          </Space>
        </Space>
      }
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>
            <Text type="secondary">Đang phân tích bảng chấm công & hồ sơ lương nhân viên...</Text>
          </div>
        </div>
      ) : (
        <>
          <Row gutter={16} style={{ marginBottom: 16 }}>
            {[
              { title: 'Tổng thu nhập ước tính', val: summary.totalGross, color: '#52c41a', bg: '#f6ffed', border: '#b7eb8f' },
              { title: 'Tổng bảo hiểm NLĐ',       val: summary.totalInsurance, color: '#fa8c16', bg: '#fff7e6', border: '#ffd591' },
              { title: 'Tổng thuế TNCN',           val: summary.totalTax,   color: '#eb2f96', bg: '#fff0f6', border: '#ffadd2' },
              { title: 'Tổng tiền thực lĩnh chi trả', val: summary.totalNet, color: '#1677ff', bg: '#e6f4ff', border: '#91caff' },
            ].map(({ title, val, color, bg, border }) => (
              <Col span={6} key={title}>
                <Card size="small" style={{ background: bg, border: `1px solid ${border}`, borderRadius: 8 }}>
                  <Statistic title={title} value={val} formatter={v => fmtVND(Number(v))} valueStyle={{ color, fontSize: 16, fontWeight: 700 }} />
                </Card>
              </Col>
            ))}
          </Row>

          {summary.noProfile > 0 && (
            <Alert
              type="warning"
              showIcon
              icon={<WarningOutlined />}
              message={`${summary.noProfile} nhân viên chưa thiết lập mức lương cơ bản trong hợp đồng — sẽ bị bỏ qua khi tính tự động.`}
              style={{ marginBottom: 12, borderRadius: 6 }}
            />
          )}

          <Table
            dataSource={rows}
            rowKey="employeeId"
            pagination={{ pageSize: 12, showSizeChanger: false }}
            scroll={{ x: 1450 }}
            size="small"
            bordered
          >
            <Table.ColumnGroup title={<div style={{ textAlign: 'center', color: '#1e3a8a', fontWeight: 700 }}>1. NHÂN SỰ & CÔNG</div>}>
              <Table.Column title="STT" key="idx" width={50} align="center" render={(_: any, __: any, idx: number) => idx + 1} />
              <Table.Column
                title="Nhân viên"
                key="emp"
                width={190}
                render={(_: any, r: any) => (
                  <Space>
                    {!r.hasSalaryProfile && <Tooltip title="Chưa có hồ sơ lương"><WarningOutlined style={{ color: '#ff4d4f' }} /></Tooltip>}
                    <div>
                      <Text strong style={{ color: r.hasSalaryProfile ? 'inherit' : '#ff4d4f' }}>{r.fullName}</Text><br />
                      <Text type="secondary" style={{ fontSize: 12 }}>{r.employeeCode}</Text>
                    </div>
                  </Space>
                )}
              />
              <Table.Column title="Phòng ban" dataIndex="department" key="dept" width={130} />
              <Table.Column
                title="Ngày công"
                key="wd"
                width={90}
                align="center"
                render={(_: any, r: any) => r.hasSalaryProfile ? `${r.workDays}/22` : '—'}
              />
            </Table.ColumnGroup>

            <Table.ColumnGroup title={<div style={{ textAlign: 'center', color: '#15803d', fontWeight: 700 }}>2. CÁC KHOẢN THU NHẬP DỰ TÍNH</div>}>
              <Table.Column
                title="Lương cơ bản"
                dataIndex="baseSalary"
                key="base"
                width={130}
                align="right"
                render={(v: number, r: any) => r.hasSalaryProfile ? fmtVND(v) : <Tag color="red">Chưa có</Tag>}
              />
              <Table.Column
                title="Phụ cấp"
                dataIndex="allowanceTotal"
                key="allow"
                width={110}
                align="right"
                render={(v: number, r: any) => r.hasSalaryProfile ? fmtVND(v) : '—'}
              />
              <Table.Column
                title="Làm thêm giờ"
                dataIndex="otAmount"
                key="ot"
                width={110}
                align="right"
                render={(v: number, r: any) => r.hasSalaryProfile ? fmtVND(v) : '—'}
              />
              <Table.Column
                title="Tổng thu nhập"
                dataIndex="grossIncome"
                key="gross"
                width={140}
                align="right"
                render={(v: number, r: any) => r.hasSalaryProfile ? <Text strong style={{ color: '#52c41a' }}>{fmtVND(v)}</Text> : '—'}
              />
            </Table.ColumnGroup>

            <Table.ColumnGroup title={<div style={{ textAlign: 'center', color: '#b91c1c', fontWeight: 700 }}>3. KHẤU TRỪ DỰ TÍNH</div>}>
              <Table.Column
                title="BH (10.5%)"
                dataIndex="insuranceEmployee"
                key="ins"
                width={120}
                align="right"
                render={(v: number, r: any) => r.hasSalaryProfile ? fmtVND(v) : '—'}
              />
              <Table.Column
                title="Thuế TNCN"
                dataIndex="personalIncomeTax"
                key="tax"
                width={110}
                align="right"
                render={(v: number, r: any) => r.hasSalaryProfile ? fmtVND(v) : '—'}
              />
            </Table.ColumnGroup>

            <Table.ColumnGroup title={<div style={{ textAlign: 'center', color: '#1d4ed8', fontWeight: 700 }}>4. TIỀN THỰC LĨNH</div>}>
              <Table.Column
                title="Tiền thực lĩnh"
                dataIndex="netPay"
                key="net"
                width={140}
                align="right"
                render={(v: number, r: any) => r.hasSalaryProfile ? <Text strong style={{ color: '#1677ff', fontSize: 14 }}>{fmtVND(v)}</Text> : '—'}
              />
            </Table.ColumnGroup>
          </Table>
        </>
      )}
    </Modal>
  );
};

// ─────────────────────── PAYROLL APPROVAL REVIEW MODAL ───────────────────────
const PayrollApprovalModal = ({
  open, onClose, period, onApproved,
}: { open: boolean; onClose: () => void; period: any; onApproved: () => void }) => {
  const [payslips, setPayslips] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [approving, setApproving] = useState(false);
  const [approvalNote, setApprovalNote] = useState('');

  useEffect(() => {
    if (!open || !period) return;
    setApprovalNote(`Đã kiểm tra đối soát bảng công và bảng lương tháng ${period.month}/${period.year}. Đồng ý phê duyệt.`);
    setLoading(true);
    apiClient.get(`/payroll/periods/${period.id}/payslips`)
      .then(({ data }) => setPayslips(data || []))
      .catch(() => message.error('Lỗi khi tải dữ liệu phiếu lương'))
      .finally(() => setLoading(false));
  }, [open, period]);

  const summary = useMemo(() => {
    const count = payslips.length;
    const totalGross = payslips.reduce((s, p) => s + (p.grossIncome || 0), 0);
    const totalOT = payslips.reduce((s, p) => s + (p.otAmount || 0), 0);
    const totalTax = payslips.reduce((s, p) => s + (p.personalIncomeTax || 0), 0);
    const totalIns = payslips.reduce((s, p) => s + (p.insuranceEmployee || 0), 0);
    const totalDeduct = payslips.reduce((s, p) => s + ((p.insuranceEmployee || 0) + (p.personalIncomeTax || 0) + (p.otherDeduction || 0)), 0);
    const totalNet = payslips.reduce((s, p) => s + (p.netPay || 0), 0);
    return { count, totalGross, totalOT, totalIns, totalTax, totalDeduct, totalNet };
  }, [payslips]);

  const handleConfirmApprove = async () => {
    try {
      setApproving(true);
      await apiClient.patch(`/payroll/periods/${period.id}/approve`, {
        note: approvalNote,
      });
      message.success(`Đã phê duyệt kỳ lương tháng ${period.month}/${period.year} thành công!`);
      onClose();
      onApproved();
    } catch (err: any) {
      message.error(err?.response?.data?.message || 'Lỗi khi phê duyệt kỳ lương');
    } finally {
      setApproving(false);
    }
  };

  if (!period) return null;

  return (
    <Modal
      title={
        <Space align="center">
          <CheckCircleOutlined style={{ color: '#16a34a', fontSize: 20 }} />
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#1e3a8a' }}>
              Xem Xét & Phê Duyệt Kỳ Lương — Tháng {period.month}/{period.year}
            </div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Rà soát tổng quỹ thu nhập, giảm trừ thuế, bảo hiểm và tiền thực lĩnh trước khi phê duyệt
            </Text>
          </div>
        </Space>
      }
      open={open}
      onCancel={onClose}
      width={1000}
      footer={[
        <Button key="cancel" onClick={onClose} disabled={approving}>
          Hủy / Xem lại sau
        </Button>,
        <Button
          key="approve"
          type="primary"
          icon={<CheckCircleOutlined />}
          loading={approving}
          onClick={handleConfirmApprove}
          style={{ background: '#16a34a', borderColor: '#16a34a', fontWeight: 600 }}
        >
          Xác nhận phê duyệt kỳ lương
        </Button>,
      ]}
    >
      {loading ? (
        <Spin style={{ display: 'block', margin: '40px auto' }} />
      ) : (
        <div style={{ marginTop: 8 }}>
          <Alert
            type="info"
            showIcon
            message={
              <div style={{ fontSize: 13 }}>
                <b>Lưu ý nghiệp vụ:</b> Sau khi phê duyệt, số liệu kỳ lương tháng <b>{period.month}/{period.year}</b> sẽ được chốt chính thức để bộ phận Kế toán thực hiện lập lệnh chi tiền / chuyển khoản thực lĩnh cho nhân sự.
              </div>
            }
            style={{ marginBottom: 16, borderRadius: 8 }}
          />

          {/* Metrics */}
          <Row gutter={12} style={{ marginBottom: 16 }}>
            <Col span={6}>
              <Card size="small" style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 8 }}>
                <Statistic
                  title={<Text style={{ fontSize: 12, color: '#64748b' }}>Tổng số nhân sự</Text>}
                  value={summary.count}
                  suffix="nhân viên"
                  valueStyle={{ fontSize: 17, fontWeight: 700, color: '#1e293b' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8 }}>
                <Statistic
                  title={<Text style={{ fontSize: 12, color: '#166534' }}>Tổng thu nhập</Text>}
                  value={summary.totalGross}
                  formatter={v => fmtVND(Number(v))}
                  valueStyle={{ fontSize: 17, fontWeight: 700, color: '#16a34a' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small" style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8 }}>
                <Statistic
                  title={<Text style={{ fontSize: 12, color: '#991b1b' }}>Tổng giảm trừ & Thuế</Text>}
                  value={summary.totalDeduct}
                  formatter={v => fmtVND(Number(v))}
                  valueStyle={{ fontSize: 17, fontWeight: 700, color: '#dc2626' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small" style={{ background: '#eff6ff', border: '2px solid #3b82f6', borderRadius: 8 }}>
                <Statistic
                  title={<Text strong style={{ fontSize: 12, color: '#1e40af' }}>TỔNG THỰC LĨNH CHI TRẢ</Text>}
                  value={summary.totalNet}
                  formatter={v => fmtVND(Number(v))}
                  valueStyle={{ fontSize: 18, fontWeight: 800, color: '#2563eb' }}
                />
              </Card>
            </Col>
          </Row>

          {/* Bảng rà soát rút gọn */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 8 }}>
              Danh sách nhân sự & Số tiền chi trả ({payslips.length} nhân viên):
            </div>
            <Table
              dataSource={payslips}
              rowKey="id"
              size="small"
              bordered
              pagination={{ pageSize: 5, size: 'small', showTotal: t => `Tổng ${t} nhân sự` }}
              scroll={{ y: 220 }}
              columns={[
                { title: 'STT', key: 'stt', width: 50, align: 'center', render: (_: any, __: any, idx: number) => idx + 1 },
                { title: 'Mã NV', key: 'code', width: 90, align: 'center', render: (_: any, r: any) => <Tag color="blue">{r.employee?.employeeCode}</Tag> },
                { title: 'Họ và tên', key: 'name', render: (_: any, r: any) => <Text strong>{r.employee?.fullName}</Text> },
                { title: 'Phòng ban', key: 'dept', width: 140, render: (_: any, r: any) => r.employee?.department?.name || '—' },
                { title: 'Ngày công', key: 'wd', width: 90, align: 'center', render: (_: any, r: any) => `${r.workDays}/${r.standardWorkDays || 22}` },
                { title: 'Tổng thu nhập', dataIndex: 'grossIncome', key: 'gross', width: 130, align: 'right', render: fmtVND },
                {
                  title: 'Các khoản giảm trừ',
                  key: 'deduct',
                  width: 140,
                  align: 'right',
                  render: (_: any, r: any) => fmtVND((r.insuranceEmployee || 0) + (r.personalIncomeTax || 0) + (r.otherDeduction || 0)),
                },
                {
                  title: 'Tiền thực lĩnh',
                  dataIndex: 'netPay',
                  key: 'net',
                  width: 140,
                  align: 'right',
                  render: (v: number) => <Text strong style={{ color: '#2563eb' }}>{fmtVND(v)}</Text>,
                },
              ]}
            />
          </div>

          {/* Ý kiến phê duyệt */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
              Ý kiến / Ghi chú phê duyệt:
            </div>
            <Input.TextArea
              rows={3}
              value={approvalNote}
              onChange={e => setApprovalNote(e.target.value)}
              placeholder="Nhập ghi chú hoặc ý kiến chỉ đạo phê duyệt kỳ lương..."
              maxLength={300}
              showCount
            />
          </div>
        </div>
      )}
    </Modal>
  );
};

// ─────────────────────── MAIN PAGE ───────────────────────
const PayrollPeriodsPage = () => {
  const [periods, setPeriods]     = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading]     = useState(false);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchText, setSearchText] = useState('');

  // Modals
  const [createPeriodOpen, setCreatePeriodOpen] = useState(false);
  const [salaryReviewOpen, setSalaryReviewOpen] = useState(false);
  const [payslipModal, setPayslipModal] = useState<{ open: boolean; period: any }>({ open: false, period: null });
  const [computeModal, setComputeModal] = useState<{ open: boolean; period: any }>({ open: false, period: null });
  const [approvalModal, setApprovalModal] = useState<{ open: boolean; period: any }>({ open: false, period: null });
  const [viewMyPayslipModal, setViewMyPayslipModal] = useState<{ open: boolean; payslip: any }>({ open: false, payslip: null });

  const [createForm] = Form.useForm();
  const [reviewForm] = Form.useForm();

  const { user } = useAuthStore();
  const role = user?.role;

  // Roles Definition
  const isAccountant = role === 'ACCOUNTANT' || role === 'HR_MANAGER';
  const isAdmin      = role === 'ADMIN';
  const isManager    = role === 'MANAGER';
  const isEmployee   = role === 'EMPLOYEE';

  // Privileges
  const canViewCompanyPayroll = isAdmin || isAccountant || isManager;
  const canManageCompanyPayroll = isAdmin || isAccountant;
  const canCompute  = isAdmin || isAccountant;
  const canCreate   = isAdmin || isAccountant;
  const canApprove  = isAdmin || isAccountant;
  const canMarkPaid = isAdmin || isAccountant;
  const canReview   = isAdmin || isAccountant;

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [pRes, eRes] = await Promise.all([
        apiClient.get('/payroll/periods'),
        canViewCompanyPayroll ? apiClient.get('/employees') : Promise.resolve({ data: [] }),
      ]);
      setPeriods(pRes.data || []);
      const empData = Array.isArray(eRes.data?.data) ? eRes.data.data : eRes.data;
      setEmployees(Array.isArray(empData) ? empData : []);
    } catch {
      message.error('Lỗi khi tải dữ liệu kỳ lương');
    } finally {
      setLoading(false);
    }
  }, [canViewCompanyPayroll]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Handle open my personal payslip from a period
  const handleOpenMyPayslip = async (period: any) => {
    if (period.myPayslip) {
      setViewMyPayslipModal({ open: true, payslip: { ...period.myPayslip, period } });
      return;
    }
    try {
      setLoading(true);
      const { data } = await apiClient.get(`/payroll/periods/${period.id}/payslips`);
      if (data && data.length > 0) {
        setViewMyPayslipModal({ open: true, payslip: { ...data[0], period } });
      } else {
        message.info('Kỳ lương này bạn chưa có phiếu lương.');
      }
    } catch (e) {
      message.error('Không thể tải phiếu lương cá nhân');
    } finally {
      setLoading(false);
    }
  };

  // ── CREATE PERIOD ──
  const handleCreatePeriod = async (values: any) => {
    try {
      const month = values.period.month() + 1;
      const year  = values.period.year();
      await apiClient.post('/payroll/periods', { month, year, note: values.note });
      message.success(`Đã tạo kỳ lương tháng ${month}/${year}!`);
      setCreatePeriodOpen(false);
      createForm.resetFields();
      fetchData();
    } catch (err: any) {
      message.error(err?.response?.data?.message || 'Không thể tạo kỳ lương');
    }
  };

  // ── APPROVE ──
  const handleApprove = async (periodId: string) => {
    try {
      await apiClient.patch(`/payroll/periods/${periodId}/approve`);
      message.success('Đã phê duyệt kỳ lương thành công!');
      fetchData();
    } catch (err: any) {
      message.error(err?.response?.data?.message || 'Không thể duyệt kỳ lương');
    }
  };

  // ── MARK PAID ──
  const handleMarkPaid = async (periodId: string) => {
    try {
      await apiClient.patch(`/payroll/periods/${periodId}/mark-paid`);
      message.success('Đã xác nhận thanh toán kỳ lương thành công!');
      fetchData();
    } catch (err: any) {
      message.error(err?.response?.data?.message || 'Không thể cập nhật trạng thái');
    }
  };

  // ── SALARY REVIEW ──
  const handleOpenSalaryReview = () => {
    setSalaryReviewOpen(true);
    reviewForm.setFieldsValue({
      effectiveDate: dayjs(),
      employees: employees.map(emp => ({
        employeeId: emp.id, fullName: emp.fullName,
        employeeCode: emp.employeeCode, baseSalary: null, note: '',
      })),
    });
  };

  const handleSalaryReview = async (values: any) => {
    const reviewed = values.employees.filter((e: any) => e.baseSalary != null && e.baseSalary > 0);
    if (!reviewed.length) { message.warning('Chưa nhập mức lương mới cho nhân viên nào!'); return; }
    try {
      await apiClient.post('/payroll/salary-review', {
        effectiveDate: values.effectiveDate.toISOString(),
        employees: reviewed.map((e: any) => ({ id: e.employeeId, baseSalary: e.baseSalary, note: e.note || 'Xét duyệt tăng lương định kỳ' })),
      });
      message.success('Đã cập nhật mức lương mới!');
      setSalaryReviewOpen(false);
      reviewForm.resetFields();
    } catch {
      message.error('Lỗi khi cập nhật lương');
    }
  };

  const filteredPeriods = useMemo(() => {
    if (!searchText.trim()) return periods;
    const q = searchText.toLowerCase();
    return periods.filter(p =>
      (p.note && p.note.toLowerCase().includes(q)) ||
      `tháng ${p.month}/${p.year}`.includes(q)
    );
  }, [periods, searchText]);

  // ── TABLE COLUMNS ──
  const columns = [
    {
      title: 'STT',
      key: 'stt',
      width: 60,
      align: 'center' as const,
      render: (_: any, __: any, idx: number) => idx + 1,
    },
    {
      title: 'Kỳ lương (Tháng/Năm)',
      key: 'period',
      width: 180,
      render: (_: any, r: any) => (
        <Space size={8}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: 6,
            backgroundColor: '#eff6ff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#1d4ed8'
          }}>
            <CalendarOutlined style={{ fontSize: 16 }} />
          </div>
          <div>
            <Text strong style={{ fontSize: 14, color: '#1e3a8a' }}>Tháng {r.month}/{r.year}</Text>
            {r.isPersonalOnly && <div style={{ fontSize: 11, color: '#16a34a' }}>● Kỳ lương của bạn</div>}
          </div>
        </Space>
      ),
    },
    {
      title: 'Tên đợt lương / Ghi chú',
      dataIndex: 'note',
      key: 'note',
      width: 220,
      render: (note: string) => (
        <div style={{ fontSize: 13, color: '#334155', wordBreak: 'break-word', whiteSpace: 'normal', lineHeight: 1.4 }}>
          {note || <Text type="secondary">Kỳ lương định kỳ</Text>}
        </div>
      ),
    },
    {
      title: 'Chu kỳ tính công',
      key: 'cycle',
      width: 190,
      render: (_: any, r: any) => {
        const start = `01/${r.month < 10 ? '0' + r.month : r.month}/${r.year}`;
        const end = dayjs(`${r.year}-${r.month}-01`).endOf('month').format('DD/MM/YYYY');
        return (
          <Text style={{ fontSize: 12, color: '#475569' }}>
            {start} — {end}
          </Text>
        );
      }
    },
    {
      title: 'Số nhân sự',
      key: 'count',
      width: 130,
      align: 'center' as const,
      render: (_: any, r: any) => (
        canViewCompanyPayroll ? (
          <Tag color="blue" icon={<TeamOutlined />} style={{ fontWeight: 600 }}>
            {r._count?.payslips || 0} nhân sự
          </Tag>
        ) : (
          <Tag color="green">Phiếu lương của tôi</Tag>
        )
      ),
    },
    {
      title: 'Trạng thái quy trình',
      key: 'status',
      width: 170,
      render: (_: any, r: any) => {
        const cfg = statusConfig[r.status] || { color: 'default', label: r.status, icon: <ClockCircleOutlined /> };
        return (
          <Tag color={cfg.color} icon={cfg.icon} style={{ padding: '3px 10px', borderRadius: 4, fontWeight: 600 }}>
            {cfg.label}
          </Tag>
        );
      },
    },
    {
      title: 'Ngày lập',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (v: string) => dayjs(v).format('DD/MM/YYYY'),
    },
    {
      title: 'Hành động',
      key: 'action',
      width: canViewCompanyPayroll ? 190 : 80,
      align: 'center' as const,
      fixed: 'right' as const,
      render: (_: any, r: any) => {
        const isPaid      = r.status === 'PAID';
        const isDraft     = r.status === 'DRAFT';
        const isApproved  = r.status === 'APPROVED';
        const hasPayslips = (r._count?.payslips || 0) > 0;

        // Regular employee view
        if (!canViewCompanyPayroll) {
          return (
            <Tooltip title="Xem chi tiết phiếu lương cá nhân">
              <Button
                type="text"
                size="small"
                icon={<EyeOutlined style={{ color: '#1677ff' }} />}
                onClick={() => handleOpenMyPayslip(r)}
              />
            </Tooltip>
          );
        }

        // Accountant / Admin / Manager view: Cả Quản lý, Kế toán, Admin đều xem được chi tiết bảng tính
        return (
          <Space size={6} wrap={false} style={{ justifyContent: 'center' }}>
            {/* 1. Xem bảng lương */}
            <Tooltip title={hasPayslips ? `Xem bảng tính lương chi tiết (${r._count?.payslips} NV)` : 'Chưa tính lương kỳ này'}>
              <span>
                <Button
                  type="text"
                  icon={<EyeOutlined style={{ color: hasPayslips ? '#1677ff' : undefined }} />}
                  size="small"
                  disabled={!hasPayslips}
                  onClick={() => setPayslipModal({ open: true, period: r })}
                />
              </span>
            </Tooltip>

            {/* 2. Tính lương */}
            <Tooltip title={!canCompute ? 'Chỉ Kế toán / Quản trị viên mới có quyền tính lương' : isPaid ? 'Kỳ lương đã khóa (Đã chi trả)' : 'Tính toán lương tự động'}>
              <span>
                <Button
                  type="text"
                  icon={<CalculatorOutlined style={{ color: (canCompute && !isPaid) ? '#1677ff' : undefined }} />}
                  size="small"
                  disabled={!canCompute || isPaid}
                  onClick={() => setComputeModal({ open: true, period: r })}
                />
              </span>
            </Tooltip>

            {/* 3. Duyệt */}
            <Tooltip title={
              !canApprove
                ? 'Chỉ Kế toán / Quản trị viên mới có quyền phê duyệt'
                : !hasPayslips 
                  ? 'Cần tính lương trước khi duyệt' 
                  : !isDraft 
                    ? 'Kỳ lương đã được phê duyệt' 
                    : 'Xem xét và phê duyệt kỳ lương'
            }>
              <span>
                <Button 
                  type="text"
                  size="small" 
                  disabled={!canApprove || !isDraft || !hasPayslips}
                  icon={<CheckCircleOutlined style={{ color: (canApprove && isDraft && hasPayslips) ? '#52c41a' : undefined }} />}
                  onClick={() => setApprovalModal({ open: true, period: r })}
                />
              </span>
            </Tooltip>

            {/* 4. Xác nhận chi trả */}
            <Tooltip title={
              !canMarkPaid
                ? 'Chỉ Kế toán / Quản trị viên mới có quyền xác nhận chi trả'
                : isPaid 
                  ? 'Đã hoàn tất thanh toán' 
                  : !isApproved 
                    ? 'Cần phê duyệt kỳ lương trước khi trả' 
                    : 'Xác nhận đã chuyển khoản chi trả'
            }>
              <span>
                <Popconfirm
                  title="Xác nhận đã thanh toán toàn bộ lương?"
                  description="Kỳ lương sẽ được khóa trạng thái HOÀN TẤT."
                  onConfirm={() => handleMarkPaid(r.id)}
                  okText="Xác nhận chi trả"
                  cancelText="Hủy"
                  okButtonProps={{ danger: true }}
                  disabled={!canMarkPaid || !isApproved}
                  icon={<WarningOutlined style={{ color: '#fa8c16' }} />}
                >
                  <Button 
                    type="text"
                    size="small" 
                    disabled={!canMarkPaid || !isApproved}
                    icon={<DollarOutlined style={{ color: (canMarkPaid && isApproved) ? '#fa8c16' : undefined }} />}
                  />
                </Popconfirm>
              </span>
            </Tooltip>

            {/* 5. Xem phiếu cá nhân của chính người dùng */}
            <Tooltip title="Xem phiếu lương cá nhân của bạn">
              <Button
                type="text"
                size="small"
                icon={<UserOutlined style={{ color: '#6366f1' }} />}
                onClick={() => handleOpenMyPayslip(r)}
              />
            </Tooltip>
          </Space>
        );
      },
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      {/* Header Metric Cards */}
      <Row gutter={16} style={{ marginBottom: 20 }}>
        <Col span={6}>
          <Card style={{ borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <Statistic
              title="Tổng số kỳ lương"
              value={periods.length}
              prefix={<CalendarOutlined style={{ color: '#1677ff' }} />}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {canManageCompanyPayroll ? 'Toàn bộ chu kỳ trong hệ thống' : 'Kỳ lương bạn tham gia'}
            </Text>
          </Card>
        </Col>
        <Col span={6}>
          <Card style={{ borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <Statistic
              title="Kỳ đã hoàn tất chi trả"
              value={periods.filter(p => p.status === 'PAID').length}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>Đã chuyển khoản thành công</Text>
          </Card>
        </Col>
        <Col span={6}>
          <Card style={{ borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <Statistic
              title="Kỳ đã duyệt (Chờ chi)"
              value={periods.filter(p => p.status === 'APPROVED').length}
              valueStyle={{ color: '#1677ff' }}
              prefix={<DollarOutlined style={{ color: '#1677ff' }} />}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>Đã chốt danh sách và số tiền</Text>
          </Card>
        </Col>
        <Col span={6}>
          <Card style={{ borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <Statistic
              title="Kỳ đang tính nháp"
              value={periods.filter(p => p.status === 'DRAFT').length}
              valueStyle={{ color: '#fa8c16' }}
              prefix={<ClockCircleOutlined style={{ color: '#fa8c16' }} />}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>Đang tổng hợp ngày công và làm thêm giờ</Text>
          </Card>
        </Col>
      </Row>

      {/* Main Container Card */}
      <Card
        title={
          <Space align="center">
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 6,
              backgroundColor: '#e6f4ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <DollarOutlined style={{ color: '#1677ff', fontSize: 18 }} />
            </div>
            <div>
              <Title level={4} style={{ margin: 0, color: '#1e3a8a' }}>
                {canViewCompanyPayroll ? 'Quản lý Kỳ lương & Bảng lương Toàn Công ty' : 'Kỳ lương & Phiếu lương của tôi'}
              </Title>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {canManageCompanyPayroll
                  ? 'Phân hệ Kế toán — Tạo kỳ lương, tính lương tự động, phê duyệt và xác nhận chi trả toàn bộ nhân sự'
                  : isManager
                    ? 'Phân hệ Quản lý — Giám sát, kiểm tra chi tiết bảng tính lương, ngày công, phép và thu nhập toàn bộ nhân sự'
                    : 'Bảo mật cá nhân — Xem danh sách các kỳ lương và chi tiết phiếu lương cá nhân của bạn'}
              </Text>
            </div>
          </Space>
        }
        extra={
          <Space size="middle">
            <Input
              placeholder="Tìm theo tháng, năm, ghi chú..."
              prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              allowClear
              style={{ width: 250 }}
            />
            <Button icon={<ReloadOutlined />} onClick={fetchData}>Làm mới</Button>
            {canCreate && (
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreatePeriodOpen(true)}>
                Tạo kỳ lương mới
              </Button>
            )}
            {canReview && (
              <Button type="primary" style={{ background: '#52c41a' }} icon={<DollarOutlined />} onClick={handleOpenSalaryReview}>
                Xét tăng lương định kỳ
              </Button>
            )}
          </Space>
        }
        style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
      >
        {/* Banner phân quyền */}
        {canManageCompanyPayroll ? (
          <Alert
            type="info"
            showIcon
            icon={<SafetyCertificateOutlined />}
            style={{ marginBottom: 16, borderRadius: 6 }}
            message={
              <Space split={<span style={{ color: '#bbb' }}>|</span>}>
                <Text strong style={{ color: '#1e3a8a' }}>Quyền hạn Kế toán / Quản trị viên:</Text>
                <span>Xem, tính toán, phê duyệt và chi trả bảng lương toàn bộ hệ thống</span>
                <span>Quy trình: 1. Tạo kỳ → 2. Tính lương → 3. Phê duyệt → 4. Xác nhận chi trả</span>
              </Space>
            }
          />
        ) : isManager ? (
          <Alert
            type="info"
            showIcon
            icon={<SafetyCertificateOutlined />}
            style={{ marginBottom: 16, borderRadius: 6 }}
            message={
              <Space split={<span style={{ color: '#bbb' }}>|</span>}>
                <Text strong style={{ color: '#1e3a8a' }}>Quyền hạn Quản lý (Manager):</Text>
                <span>Được quyền xem và kiểm tra chi tiết bảng tính lương toàn công ty, ngày công, phép và các khoản thu nhập</span>
              </Space>
            }
          />
        ) : (
          <Alert
            type="success"
            showIcon
            icon={<UserOutlined />}
            style={{ marginBottom: 16, borderRadius: 6 }}
            message="Chế độ bảo mật cá nhân: Dữ liệu kỳ lương hiển thị bên dưới chỉ thuộc về tài khoản của bạn."
          />
        )}

        <Table
          dataSource={filteredPeriods}
          columns={columns}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1350 }}
          pagination={{ pageSize: 10, showTotal: t => `Tổng cộng ${t} kỳ lương` }}
          locale={{ emptyText: 'Chưa có kỳ lương nào.' }}
        />
      </Card>

      {/* ── MODAL: TẠO KỲ LƯƠNG MỚI ── */}
      <Modal
        title={
          <Space>
            <PlusOutlined style={{ color: '#1677ff' }} />
            <span>Tạo Kỳ Lương Mới</span>
          </Space>
        }
        open={createPeriodOpen}
        onCancel={() => { setCreatePeriodOpen(false); createForm.resetFields(); }}
        footer={null}
        width={460}
      >
        <Form form={createForm} layout="vertical" onFinish={handleCreatePeriod} style={{ marginTop: 16 }}>
          <Form.Item
            name="period"
            label="Chọn tháng / năm"
            rules={[{ required: true, message: 'Vui lòng chọn tháng tính lương!' }]}
          >
            <DatePicker
              picker="month"
              style={{ width: '100%' }}
              format="MM/YYYY"
              placeholder="Chọn tháng tính lương"
              disabledDate={(d) => d && d.isAfter(dayjs(), 'month')}
            />
          </Form.Item>
          <Form.Item name="note" label="Tên đợt lương / Ghi chú">
            <Input placeholder="Ví dụ: Kỳ lương tháng 11/2026" />
          </Form.Item>
          <Form.Item style={{ textAlign: 'right', marginBottom: 0, marginTop: 24 }}>
            <Space>
              <Button onClick={() => setCreatePeriodOpen(false)}>Hủy</Button>
              <Button type="primary" htmlType="submit">Tạo kỳ lương</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* ── MODAL: XÉT TĂNG LƯƠNG ── */}
      <Modal
        title="Đợt xét duyệt tăng lương định kỳ"
        open={salaryReviewOpen}
        onCancel={() => setSalaryReviewOpen(false)}
        footer={null}
        width={860}
        destroyOnHidden
      >
        <Form form={reviewForm} layout="vertical" onFinish={handleSalaryReview}>
          <Form.Item
            name="effectiveDate"
            label="Ngày bắt đầu áp dụng mức lương mới"
            rules={[{ required: true, message: 'Vui lòng chọn ngày áp dụng!' }]}
          >
            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
          </Form.Item>
          <Divider>Danh sách nhân viên — Bỏ trống nếu không thay đổi lương</Divider>
          <Form.List name="employees">
            {(fields) => (
              <div style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: 8 }}>
                {fields.map(({ key, name, ...rest }) => {
                  const empName = reviewForm.getFieldValue(['employees', name, 'fullName']);
                  const empCode = reviewForm.getFieldValue(['employees', name, 'employeeCode']);
                  return (
                    <div key={key} style={{
                      display: 'flex', gap: 12, marginBottom: 12, alignItems: 'center',
                      padding: 12, background: '#fafafa', borderRadius: 8, border: '1px solid #f0f0f0',
                    }}>
                      <div style={{ minWidth: 180 }}>
                        <Text strong>{empName}</Text><br />
                        <Text type="secondary" style={{ fontSize: 12 }}>{empCode}</Text>
                        <Form.Item {...rest} name={[name, 'employeeId']} hidden><Input /></Form.Item>
                        <Form.Item {...rest} name={[name, 'fullName']} hidden><Input /></Form.Item>
                        <Form.Item {...rest} name={[name, 'employeeCode']} hidden><Input /></Form.Item>
                      </div>
                      <Form.Item {...rest} name={[name, 'baseSalary']} label="Mức lương mới (₫)" style={{ flex: 1, marginBottom: 0 }}>
                        <InputNumber
                          placeholder="Bỏ trống nếu không đổi"
                          style={{ width: '100%' }}
                          formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                          parser={v => v!.replace(/,*/g, '') as any}
                          min={0}
                        />
                      </Form.Item>
                      <Form.Item {...rest} name={[name, 'note']} label="Ghi chú" style={{ flex: 1, marginBottom: 0 }}>
                        <Input placeholder="Lý do tăng lương" />
                      </Form.Item>
                    </div>
                  );
                })}
              </div>
            )}
          </Form.List>
          <Form.Item style={{ marginTop: 20, textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setSalaryReviewOpen(false)}>Hủy bỏ</Button>
              <Button type="primary" htmlType="submit">Lưu kết quả xét duyệt</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* ── MODAL: XEM TRƯỚC & TÍNH LƯƠNG ── */}
      <ComputePreviewModal
        open={computeModal.open}
        onClose={() => setComputeModal({ open: false, period: null })}
        period={computeModal.period}
        onConfirmComputed={fetchData}
      />

      {/* ── MODAL: XEM BẢNG LƯƠNG TOÀN CÔNG TY (ĐÃ TÍNH) ── */}
      <PayslipDetailModal
        open={payslipModal.open}
        onClose={() => setPayslipModal({ open: false, period: null })}
        period={payslipModal.period}
      />

      {/* ── MODAL: XEM XÉT & PHÊ DUYỆT KỲ LƯƠNG ── */}
      <PayrollApprovalModal
        open={approvalModal.open}
        onClose={() => setApprovalModal({ open: false, period: null })}
        period={approvalModal.period}
        onApproved={fetchData}
      />

      {/* ── MODAL: XEM PHIẾU LƯƠNG CÁ NHÂN ── */}
      <IndividualPayslipModal
        open={viewMyPayslipModal.open}
        onClose={() => setViewMyPayslipModal({ open: false, payslip: null })}
        payslip={viewMyPayslipModal.payslip}
      />
    </div>
  );
};

export default PayrollPeriodsPage;
