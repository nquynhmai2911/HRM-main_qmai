import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Card, Typography, Table, Spin, message, Tag, Button, Modal,
  Form, DatePicker, InputNumber, Input, Result, Space, Popconfirm,
  Divider, Row, Col, Statistic, Tooltip, Alert, Badge, Tabs, Select,
  Descriptions, Empty, Segmented,
} from 'antd';
import {
  CalculatorOutlined, CheckCircleOutlined, DollarOutlined,
  PlusOutlined, EyeOutlined, UserOutlined, FileTextOutlined,
  ClockCircleOutlined, WarningOutlined, ExclamationCircleOutlined,
  SearchOutlined, CalendarOutlined, TeamOutlined, BankOutlined,
  PrinterOutlined, ReloadOutlined, SafetyCertificateOutlined,
  FileExcelOutlined, EditOutlined, TrophyOutlined, LaptopOutlined,
  FilterOutlined, DownloadOutlined, DeleteOutlined,
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

// Format seniority from hireDate
const formatSeniority = (hireDate?: string) => {
  if (!hireDate) return 'Chưa cập nhật';
  const hire = dayjs(hireDate);
  const now = dayjs();
  const diffMonths = Math.max(0, now.diff(hire, 'month'));
  if (diffMonths < 1) return 'Mới vào (< 1 tháng)';
  const years = Math.floor(diffMonths / 12);
  const months = diffMonths % 12;
  if (years === 0) return `${months} tháng`;
  if (months === 0) return `${years} năm`;
  return `${years} năm ${months} tháng`;
};

// Check if an employee belongs to Sales / Business Development
const isSalesEmployee = (employee: any) => {
  if (!employee) return false;
  const code = (employee.department?.code || '').toUpperCase();
  const deptName = (employee.department?.name || '').toLowerCase();
  const posName = (employee.position?.name || '').toLowerCase();
  return (
    code.includes('SALES') ||
    code === 'BIZ' ||
    code === 'MKT' ||
    deptName.includes('kinh doanh') ||
    deptName.includes('sales') ||
    deptName.includes('bán hàng') ||
    deptName.includes('marketing') ||
    posName.includes('sales') ||
    posName.includes('kinh doanh')
  );
};

// Extract Sales KPI data from payslip.items or defaults
const getSalesKpi = (payslip: any) => {
  const getItem = (type: string) => payslip?.items?.find((i: any) => i.type === type)?.amount;
  const target = getItem('KPI_TARGET') != null ? Number(getItem('KPI_TARGET')) : 100000000;
  const actual = getItem('SALES_ACTUAL') != null ? Number(getItem('SALES_ACTUAL')) : (payslip?.bonus ? payslip.bonus * 10 : 0);
  const rate = getItem('COMMISSION_RATE') != null ? Number(getItem('COMMISSION_RATE')) : 5;
  const isMetItem = payslip?.items?.find((i: any) => i.type === 'KPI_STATUS');
  const isMet = isMetItem != null ? (isMetItem.amount === 1) : (target > 0 ? actual >= target : actual > 0);
  const commission = getItem('COMMISSION') != null ? Number(getItem('COMMISSION')) : (isMet ? Math.round(actual * (rate / 100)) : 0);
  const percent = target > 0 ? Math.round((actual / target) * 100) : 0;
  return { target, actual, rate, commission, isMet, percent };
};

// ─────────────────────── INDIVIDUAL PAYSLIP POPUP MODAL ───────────────────────
const IndividualPayslipModal = ({
  open, onClose, payslip,
}: { open: boolean; onClose: () => void; payslip: any }) => {
  if (!payslip) return null;

  const isSales = isSalesEmployee(payslip.employee);
  const kpi = getSalesKpi(payslip);
  const seniority = formatSeniority(payslip.employee?.hireDate);

  return (
    <Modal
      title={
        <Space>
          <FileTextOutlined style={{ color: '#1677ff' }} />
          <span>Phiếu lương chi tiết — {payslip.employee?.fullName}</span>
          <Tag color="blue">{payslip.employee?.employeeCode}</Tag>
        </Space>
      }
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="csv" icon={<DownloadOutlined />} onClick={() => exportIndividualPayslipToCsv(payslip)}>
          Xuất file CSV
        </Button>,
        <Button key="print" icon={<PrinterOutlined />} onClick={() => window.print()}>
          In phiếu lương (A4)
        </Button>,
        <Button key="close" type="primary" onClick={onClose}>
          Đóng
        </Button>
      ]}
      width={780}
      style={{ top: 24 }}
    >
      <div style={{ padding: '4px 0' }} className="printable-payslip">
        <div style={{ textAlign: 'center', marginBottom: 18 }}>
          <div style={{ fontSize: 13, textTransform: 'uppercase', color: '#64748b', letterSpacing: 0.5 }}>
            CÔNG TY CỔ PHẦN CÔNG NGHỆ DTS VIỆT NAM
          </div>
          <Title level={4} style={{ margin: '4px 0 2px', color: '#1e3a8a' }}>
            PHIẾU LƯƠNG NHÂN VIÊN
          </Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            Kỳ lương: Tháng {payslip.period?.month}/{payslip.period?.year}
          </Text>
        </div>

        {/* Thông tin nhân sự */}
        <Descriptions bordered size="small" column={2} style={{ marginBottom: 14 }}>
          <Descriptions.Item label="Họ và tên">{payslip.employee?.fullName}</Descriptions.Item>
          <Descriptions.Item label="Mã nhân viên">{payslip.employee?.employeeCode}</Descriptions.Item>
          <Descriptions.Item label="Phòng ban">{payslip.employee?.department?.name || '—'}</Descriptions.Item>
          <Descriptions.Item label="Chức danh">{payslip.employee?.position?.name || '—'}</Descriptions.Item>
          <Descriptions.Item label="Thâm niên công tác">{seniority}</Descriptions.Item>
          <Descriptions.Item label="Tài khoản nhận lương">
            {payslip.employee?.bankAccount ? `${payslip.employee?.bankAccount} (${payslip.employee?.bankName || ''})` : '—'}
          </Descriptions.Item>
        </Descriptions>

        {/* Tổng hợp ngày công & nghỉ phép */}
        <Divider orientation="left" style={{ margin: '10px 0', fontSize: 13 }}>
          1. Tổng hợp ngày công & nghỉ phép
        </Divider>
        <Descriptions bordered size="small" column={3} style={{ marginBottom: 14 }}>
          <Descriptions.Item label="Công chuẩn">{payslip.standardWorkDays || 22} ngày</Descriptions.Item>
          <Descriptions.Item label="Chấm công">{payslip.actualWorkDays ?? payslip.workDays} ngày</Descriptions.Item>
          <Descriptions.Item label="Nghỉ có phép">{payslip.paidLeaveDays || 0} ngày</Descriptions.Item>
          <Descriptions.Item label="Nghỉ lễ tết">{payslip.holidayDays || 0} ngày</Descriptions.Item>
          <Descriptions.Item label="Nghỉ chế độ">{payslip.regimeLeaveDays || 0} ngày</Descriptions.Item>
          <Descriptions.Item label="Không phép">{payslip.unpaidLeaveDays || 0} ngày</Descriptions.Item>
          <Descriptions.Item label="Phép năm còn lại">{payslip.remainingAnnualLeave ?? 12} / 12 ngày</Descriptions.Item>
          <Descriptions.Item label="Tổng công tính lương" span={2}>
            <Text strong style={{ color: '#1677ff' }}>{payslip.workDays} ngày</Text>
          </Descriptions.Item>
        </Descriptions>

        {/* Khối KPI & Hoa hồng nếu có */}
        {(isSales || kpi.target > 0 || kpi.actual > 0) && (
          <>
            <Divider orientation="left" style={{ margin: '10px 0', fontSize: 13 }}>
              2. Đánh giá KPI & Hoa hồng doanh số
            </Divider>
            <Descriptions bordered size="small" column={2} style={{ marginBottom: 14 }}>
              <Descriptions.Item label="Chỉ tiêu KPI">{fmtVND(kpi.target)}</Descriptions.Item>
              <Descriptions.Item label="Doanh số thực tế">
                <Text strong>{fmtVND(kpi.actual)}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Tỷ lệ hoàn thành">
                <Space size={6}>
                  <Text strong>{kpi.percent}%</Text>
                  {kpi.isMet ? (
                    <Tag color="success">Đạt chỉ tiêu (≥ 100%)</Tag>
                  ) : (
                    <Tag color="error">Chưa đạt (&lt; 100%)</Tag>
                  )}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="Tỷ lệ hoa hồng">{kpi.rate}%</Descriptions.Item>
              <Descriptions.Item label="Tiền hoa hồng chiết khấu" span={2}>
                {kpi.isMet ? (
                  <Text strong style={{ color: '#16a34a' }}>
                    +{fmtVND(kpi.commission)} (Đạt KPI =&gt; Nhận đủ lương cơ bản + Tiền hoa hồng)
                  </Text>
                ) : (
                  <Text type="secondary">
                    0 ₫ (Chưa đạt KPI =&gt; Chỉ nhận lương cơ bản theo ngày công)
                  </Text>
                )}
              </Descriptions.Item>
            </Descriptions>
          </>
        )}

        {/* Các khoản thu nhập */}
        <Divider orientation="left" style={{ margin: '10px 0', fontSize: 13 }}>
          {isSales ? '3' : '2'}. Các khoản thu nhập
        </Divider>
        <Descriptions bordered size="small" column={2} style={{ marginBottom: 14 }}>
          <Descriptions.Item label="Lương theo ngày công">{fmtVND(payslip.baseIncome)}</Descriptions.Item>
          <Descriptions.Item label="Tiền làm thêm giờ">{fmtVND(payslip.otAmount)}</Descriptions.Item>
          <Descriptions.Item label="Tổng phụ cấp">{fmtVND(payslip.allowanceTotal)}</Descriptions.Item>
          <Descriptions.Item label="Tiền thưởng / Hoa hồng">
            {payslip.bonus > 0 ? (
              <Text strong style={{ color: '#16a34a' }}>{fmtVND(payslip.bonus)}</Text>
            ) : (
              '0 ₫'
            )}
          </Descriptions.Item>
          <Descriptions.Item label="TỔNG THU NHẬP (GROSS)" span={2}>
            <Text strong style={{ color: '#1677ff' }}>{fmtVND(payslip.grossIncome)}</Text>
          </Descriptions.Item>
        </Descriptions>

        {/* Các khoản khấu trừ */}
        <Divider orientation="left" style={{ margin: '10px 0', fontSize: 13 }}>
          {isSales ? '4' : '3'}. Các khoản giảm trừ & Thuế
        </Divider>
        <Descriptions bordered size="small" column={2} style={{ marginBottom: 14 }}>
          <Descriptions.Item label="BHXH NLĐ đóng (10.5%)">{fmtVND(payslip.insuranceEmployee)}</Descriptions.Item>
          <Descriptions.Item label="BHXH Doanh nghiệp (21.5%)">{fmtVND(payslip.insuranceCompany)}</Descriptions.Item>
          <Descriptions.Item label="Thuế TNCN khấu trừ">{fmtVND(payslip.personalIncomeTax)}</Descriptions.Item>
          <Descriptions.Item label="Khấu trừ khác">{fmtVND(payslip.otherDeduction)}</Descriptions.Item>
          <Descriptions.Item label="TỔNG CÁC KHOẢN GIẢM TRỪ" span={2}>
            <Text strong style={{ color: '#ff4d4f' }}>
              - {fmtVND((payslip.insuranceEmployee || 0) + (payslip.personalIncomeTax || 0) + (payslip.otherDeduction || 0))}
            </Text>
          </Descriptions.Item>
        </Descriptions>

        {/* Thực lĩnh */}
        <div style={{
          backgroundColor: '#fafafa',
          border: '1px solid #e2e8f0',
          borderRadius: 6,
          padding: '12px 16px',
          textAlign: 'center',
          marginTop: 14
        }}>
          <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 2 }}>
            SỐ TIỀN THỰC LĨNH CHUYỂN KHOẢN
          </Text>
          <Title level={3} style={{ margin: 0, color: '#1677ff' }}>
            {fmtVND(payslip.netPay)}
          </Title>
        </div>
      </div>
    </Modal>
  );
};

// ─────────────────────── EXPORT INDIVIDUAL PAYSLIP TO CSV ───────────────────────
const exportIndividualPayslipToCsv = (payslip: any) => {
  if (!payslip) return;
  const isSales = isSalesEmployee(payslip.employee);
  const kpi = getSalesKpi(payslip);
  const seniority = formatSeniority(payslip.employee?.hireDate);
  const totalDeduct = (payslip.insuranceEmployee || 0) + (payslip.personalIncomeTax || 0) + (payslip.otherDeduction || 0);

  const lines = [
    `PHIẾU LƯƠNG NHÂN VIÊN - THÁNG ${payslip.period?.month || ''}/${payslip.period?.year || ''}`,
    `Mã nhân viên:,"${payslip.employee?.employeeCode || ''}"`,
    `Họ và tên:,"${payslip.employee?.fullName || ''}"`,
    `Phòng ban:,"${payslip.employee?.department?.name || ''}"`,
    `Chức danh:,"${payslip.employee?.position?.name || ''}"`,
    `Thâm niên công tác:,"${seniority}"`,
    `Số tài khoản:,"\t${payslip.employee?.bankAccount || ''}"`,
    `Ngân hàng:,"${payslip.employee?.bankName || ''}"`,
    '',
    '1. NGÀY CÔNG VÀ CHẤM CÔNG',
    `Ngày công chuẩn:,"${payslip.standardWorkDays || 22} ngày"`,
    `Chấm công thực tế:,"${payslip.actualWorkDays ?? payslip.workDays ?? 0} ngày"`,
    `Nghỉ có phép:,"${payslip.paidLeaveDays || 0} ngày"`,
    `Nghỉ lễ tết:,"${payslip.holidayDays || 0} ngày"`,
    `Nghỉ không phép:,"${payslip.unpaidLeaveDays || 0} ngày"`,
    `Tổng ngày công tính lương:,"${payslip.workDays || 0} ngày"`,
    '',
  ];

  if (isSales || kpi.target > 0 || kpi.actual > 0) {
    lines.push(
      '2. ĐÁNH GIÁ KPI & HOA HỒNG DOANH SỐ',
      `Chỉ tiêu KPI:,"${kpi.target.toLocaleString('vi-VN')} ₫"`,
      `Doanh số thực tế:,"${kpi.actual.toLocaleString('vi-VN')} ₫"`,
      `Tỷ lệ đạt KPI:,"${kpi.percent}%"`,
      `Trạng thái:,"${kpi.isMet ? 'Đạt chỉ tiêu (>= 100%)' : 'Chưa đạt (< 100%)'}"`,
      `Tỷ lệ hoa hồng:,"${kpi.rate}%"`,
      `Tiền hoa hồng chiết khấu:,"${(kpi.isMet ? kpi.commission : 0).toLocaleString('vi-VN')} ₫"`,
      '',
    );
  }

  lines.push(
    '3. CÁC KHOẢN THU NHẬP',
    `Lương theo ngày công:,"${(payslip.baseIncome || 0).toLocaleString('vi-VN')} ₫"`,
    `Phụ cấp:,"${(payslip.allowanceTotal || 0).toLocaleString('vi-VN')} ₫"`,
    `Tiền làm thêm giờ:,"${(payslip.otAmount || 0).toLocaleString('vi-VN')} ₫"`,
    `Tiền thưởng / Hoa hồng:,"${(payslip.bonus || 0).toLocaleString('vi-VN')} ₫"`,
    `TỔNG THU NHẬP (GROSS):,"${(payslip.grossIncome || 0).toLocaleString('vi-VN')} ₫"`,
    '',
    '4. CÁC KHOẢN GIẢM TRỪ VÀ THUẾ',
    `BHXH NLĐ (10.5%):,"${(payslip.insuranceEmployee || 0).toLocaleString('vi-VN')} ₫"`,
    `Bảo hiểm DN đóng (21.5%):,"${(payslip.insuranceCompany || 0).toLocaleString('vi-VN')} ₫"`,
    `Thuế TNCN khấu trừ:,"${(payslip.personalIncomeTax || 0).toLocaleString('vi-VN')} ₫"`,
    `Khấu trừ khác:,"${(payslip.otherDeduction || 0).toLocaleString('vi-VN')} ₫"`,
    `TỔNG GIẢM TRỪ:,"${totalDeduct.toLocaleString('vi-VN')} ₫"`,
    '',
    '5. THỰC LĨNH CHUYỂN KHOẢN',
    `SỐ TIỀN THỰC LĨNH:,"${(payslip.netPay || 0).toLocaleString('vi-VN')} ₫"`,
  );

  const csvContent = '\uFEFF' + lines.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `Phieu_Luong_${payslip.employee?.employeeCode}_Thang_${payslip.period?.month}_${payslip.period?.year}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  message.success(`Đã xuất phiếu lương cá nhân của ${payslip.employee?.fullName}!`);
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
    'Thâm niên',
    'Chỉ tiêu KPI (₫)',
    'Doanh số thực tế (₫)',
    'Tỷ lệ đạt KPI (%)',
    'Trạng thái KPI',
    '% Hoa hồng',
    'Tiền hoa hồng (₫)',
    'Ngày công',
    'Lương theo công (₫)',
    'Phụ cấp (₫)',
    'Làm thêm giờ (₫)',
    'Tổng thu nhập (₫)',
    'BHXH NLĐ (10.5%)',
    'Thuế TNCN',
    'Tổng giảm trừ',
    'Thực lĩnh (₫)',
    'Số tài khoản',
    'Ngân hàng',
  ];

  const rows = payslips.map((p, idx) => {
    const kpi = getSalesKpi(p);
    const seniority = formatSeniority(p.employee?.hireDate);
    const totalDeduct = (p.insuranceEmployee || 0) + (p.personalIncomeTax || 0) + (p.otherDeduction || 0);
    return [
      idx + 1,
      `"${p.employee?.employeeCode || ''}"`,
      `"${p.employee?.fullName || ''}"`,
      `"${p.employee?.department?.name || ''}"`,
      `"${p.employee?.position?.name || ''}"`,
      `"${seniority}"`,
      kpi.target,
      kpi.actual,
      `${kpi.percent}%`,
      `"${kpi.isMet ? 'Đạt' : 'Chưa đạt'}"`,
      `${kpi.rate}%`,
      kpi.commission,
      p.workDays || 0,
      p.baseIncome || 0,
      p.allowanceTotal || 0,
      p.otAmount || 0,
      p.grossIncome || 0,
      p.insuranceEmployee || 0,
      p.personalIncomeTax || 0,
      totalDeduct,
      p.netPay || 0,
      `"\t${p.employee?.bankAccount || ''}"`,
      `"${p.employee?.bankName || ''}"`,
    ].join(',');
  });

  const sumGross = payslips.reduce((s, p) => s + (p.grossIncome || 0), 0);
  const sumBase = payslips.reduce((s, p) => s + (p.baseIncome || 0), 0);
  const sumComm = payslips.reduce((s, p) => s + getSalesKpi(p).commission, 0);
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
    sumComm,
    '""',
    sumBase,
    '""',
    '""',
    sumGross,
    '""',
    '""',
    '""',
    sumNet,
    '""',
    '""',
  ].join(',');

  const csvContent = '\uFEFF' + [headers.join(','), ...rows, summaryRow].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `Bang_Luong_Thang_${period?.month}_${period?.year}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  message.success('Đã xuất file Excel (.csv) bảng lương thành công!');
};

// ─────────────────────── SALES KPI & COMMISSION CONFIG MODAL ───────────────────────
const SalesKpiConfigModal = ({
  open, onClose, payslip, onSaved,
}: {
  open: boolean;
  onClose: () => void;
  payslip: any;
  onSaved: (updatedPayslip: any) => void;
}) => {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  const [calcTarget, setCalcTarget] = useState<number>(100000000);
  const [calcActual, setCalcActual] = useState<number>(0);
  const [calcRate, setCalcRate] = useState<number>(5);
  const [calcExtraBonus, setCalcExtraBonus] = useState<number>(0);

  useEffect(() => {
    if (!open || !payslip) return;
    const kpi = getSalesKpi(payslip);
    setCalcTarget(kpi.target);
    setCalcActual(kpi.actual);
    setCalcRate(kpi.rate);
    const extra = Math.max(0, (payslip.bonus || 0) - kpi.commission);
    setCalcExtraBonus(extra);

    form.setFieldsValue({
      kpiTarget: kpi.target,
      salesActual: kpi.actual,
      commissionRate: kpi.rate,
      extraBonus: extra,
    });
  }, [open, payslip, form]);

  if (!payslip) return null;

  const seniority = formatSeniority(payslip.employee?.hireDate);
  const isKpiMet = calcTarget > 0 ? calcActual >= calcTarget : calcActual > 0;
  const percentAchieved = calcTarget > 0 ? Math.round((calcActual / calcTarget) * 100) : 0;
  const commissionAmount = isKpiMet ? Math.round(calcActual * (calcRate / 100)) : 0;
  const totalBonus = commissionAmount + (calcExtraBonus || 0);

  const diffBonus = totalBonus - (payslip.bonus || 0);
  const estNet = Math.max(0, (payslip.netPay || 0) + diffBonus);

  const handleFinish = async (values: any) => {
    try {
      setSaving(true);
      const { data } = await apiClient.patch(`/payroll/payslips/${payslip.id}/sales-kpi`, {
        kpiTarget: values.kpiTarget,
        salesActual: values.salesActual,
        commissionRate: values.commissionRate,
        extraBonus: values.extraBonus,
      });
      message.success(`Đã cập nhật KPI & hoa hồng cho ${payslip.employee?.fullName}!`);
      onSaved(data);
      onClose();
    } catch (err: any) {
      message.error(err?.response?.data?.message || 'Lỗi khi lưu cấu hình KPI');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={
        <Space>
          <EditOutlined style={{ color: '#1677ff' }} />
          <span>Thiết lập KPI & Hoa hồng — {payslip.employee?.fullName}</span>
          <Tag color="purple">Thâm niên: {seniority}</Tag>
        </Space>
      }
      open={open}
      onCancel={onClose}
      width={680}
      footer={null}
      destroyOnHidden
    >
      <Text type="secondary" style={{ fontSize: 13, display: 'block', marginBottom: 16 }}>
        Đủ KPI (≥ 100%): Nhận lương đúng + tiền hoa hồng chiết khấu. Chưa đủ KPI (&lt; 100%): Chỉ nhận lương cơ bản theo ngày công (hoa hồng = 0 ₫).
      </Text>

      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="kpiTarget"
              label="Chỉ tiêu KPI doanh số (₫)"
              rules={[{ required: true, message: 'Vui lòng nhập chỉ tiêu KPI!' }]}
            >
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                step={10000000}
                formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={v => (v ? v.replace(/,*/g, '') : '') as any}
                onChange={v => setCalcTarget(Number(v) || 0)}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="salesActual"
              label="Doanh số thực tế (₫)"
              rules={[{ required: true, message: 'Vui lòng nhập doanh số thực tế!' }]}
            >
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                step={10000000}
                formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={v => (v ? v.replace(/,*/g, '') : '') as any}
                onChange={v => setCalcActual(Number(v) || 0)}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="commissionRate"
              label="Tỷ lệ hoa hồng chiết khấu (%)"
              rules={[{ required: true, message: 'Vui lòng nhập tỷ lệ hoa hồng!' }]}
            >
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                max={100}
                step={0.5}
                suffix="%"
                onChange={v => setCalcRate(Number(v) || 0)}
              />
            </Form.Item>
            <Space size={4} style={{ marginTop: -12, marginBottom: 12 }}>
              {[3, 5, 8, 10].map(r => (
                <Button
                  key={r}
                  size="small"
                  type="dashed"
                  onClick={() => {
                    form.setFieldsValue({ commissionRate: r });
                    setCalcRate(r);
                  }}
                >
                  {r}%
                </Button>
              ))}
            </Space>
          </Col>
          <Col span={12}>
            <Form.Item
              name="extraBonus"
              label="Thưởng khác (₫)"
            >
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                step={500000}
                formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={v => (v ? v.replace(/,*/g, '') : '') as any}
                onChange={v => setCalcExtraBonus(Number(v) || 0)}
              />
            </Form.Item>
          </Col>
        </Row>

        {/* Kết quả tính toán tóm tắt */}
        <div style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: 6,
          padding: '12px 16px',
          marginBottom: 18,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 13, color: '#334155' }}>Đánh giá kết quả:</span>
            {isKpiMet ? (
              <Tag color="success" style={{ fontWeight: 600 }}>Đạt chỉ tiêu ({percentAchieved}%)</Tag>
            ) : (
              <Tag color="error" style={{ fontWeight: 600 }}>Chưa đạt KPI ({percentAchieved}%)</Tag>
            )}
          </div>
          <Row gutter={12}>
            <Col span={8}>
              <div style={{ fontSize: 11, color: '#64748b' }}>Tiền hoa hồng:</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: isKpiMet ? '#16a34a' : '#94a3b8' }}>
                {isKpiMet ? fmtVND(commissionAmount) : '0 ₫'}
              </div>
            </Col>
            <Col span={8}>
              <div style={{ fontSize: 11, color: '#64748b' }}>Lương cơ bản theo công:</div>
              <div style={{ fontSize: 16, fontWeight: 600 }}>
                {fmtVND(payslip.baseIncome)}
              </div>
            </Col>
            <Col span={8}>
              <div style={{ fontSize: 11, color: '#64748b' }}>Thực lĩnh ước tính:</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#1677ff' }}>
                {fmtVND(estNet)}
              </div>
            </Col>
          </Row>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button onClick={onClose} disabled={saving}>Hủy</Button>
          <Button type="primary" htmlType="submit" loading={saving}>
            Lưu kết quả
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

// ─────────────────────── PAYSLIP DETAIL MODAL (MAIN PAYROLL SHEET) ───────────────
const PayslipDetailModal = ({
  open, onClose, period,
}: { open: boolean; onClose: () => void; period: any }) => {
  const [payslips, setPayslips] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading]   = useState(false);
  const [checkingKpi, setCheckingKpi] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedDeptId, setSelectedDeptId] = useState<string>('ALL');
  const [kpiFilter, setKpiFilter] = useState<'ALL' | 'MET' | 'UNMET'>('ALL');

  const [selectedPayslip, setSelectedPayslip] = useState<any>(null);
  const [salesKpiModal, setSalesKpiModal] = useState<{ open: boolean; payslip: any }>({ open: false, payslip: null });

  useEffect(() => {
    if (!open || !period) return;
    setLoading(true);
    Promise.all([
      apiClient.get(`/payroll/periods/${period.id}/payslips`),
      apiClient.get('/organization/departments'),
    ])
      .then(([psRes, deptRes]) => {
        setPayslips(psRes.data || []);
        setDepartments(deptRes.data || []);
      })
      .catch(() => message.error('Lỗi khi tải danh sách phiếu lương & phòng ban'))
      .finally(() => setLoading(false));
  }, [open, period]);

  // Handle Quick Check KPI button
  const handleQuickCheckKpi = async () => {
    try {
      setCheckingKpi(true);
      const { data } = await apiClient.post(`/payroll/periods/${period.id}/check-kpi`, {
        departmentId: selectedDeptId,
      });
      if (data?.payslips) {
        setPayslips(data.payslips);
      }
      message.success(`Đã kiểm tra nhanh KPI: ${data.metCount} nhân sự đạt chỉ tiêu, ${data.unmetCount} nhân sự chưa đạt.`);
    } catch (err: any) {
      message.error(err?.response?.data?.message || 'Lỗi khi kiểm tra KPI');
    } finally {
      setCheckingKpi(false);
    }
  };

  // Filter by department
  const deptPayslips = useMemo(() => {
    if (selectedDeptId === 'ALL') return payslips;
    return payslips.filter(p =>
      p.employee?.departmentId === selectedDeptId ||
      p.employee?.department?.id === selectedDeptId
    );
  }, [payslips, selectedDeptId]);

  // Counts of Met & Unmet in currently selected department
  const { metCount, unmetCount } = useMemo(() => {
    let met = 0;
    let unmet = 0;
    deptPayslips.forEach(p => {
      const kpi = getSalesKpi(p);
      if (kpi.isMet) met++;
      else unmet++;
    });
    return { metCount: met, unmetCount: unmet };
  }, [deptPayslips]);

  // Final filtered list based on department, kpiFilter (2 groups), and search text
  const filteredPayslips = useMemo(() => {
    let result = deptPayslips;

    // Filter by KPI group
    if (kpiFilter === 'MET') {
      result = result.filter(p => getSalesKpi(p).isMet);
    } else if (kpiFilter === 'UNMET') {
      result = result.filter(p => !getSalesKpi(p).isMet);
    }

    if (!searchText.trim()) return result;
    const q = searchText.toLowerCase();
    return result.filter(p =>
      (p.employee?.fullName && p.employee.fullName.toLowerCase().includes(q)) ||
      (p.employee?.employeeCode && p.employee.employeeCode.toLowerCase().includes(q)) ||
      (p.employee?.department?.name && p.employee.department.name.toLowerCase().includes(q)) ||
      (p.employee?.position?.name && p.employee.position.name.toLowerCase().includes(q))
    );
  }, [deptPayslips, kpiFilter, searchText]);

  const summary = useMemo(() => ({
    totalGross:      filteredPayslips.reduce((s: number, r: any) => s + (r.grossIncome || 0), 0),
    totalBase:       filteredPayslips.reduce((s: number, r: any) => s + (r.baseIncome || 0), 0),
    totalNet:        filteredPayslips.reduce((s: number, r: any) => s + (r.netPay || 0), 0),
    totalCommission: filteredPayslips.reduce((s: number, r: any) => s + getSalesKpi(r).commission, 0),
    metInView:       filteredPayslips.filter(r => getSalesKpi(r).isMet).length,
  }), [filteredPayslips]);

  const handleUpdatePayslip = (updated: any) => {
    setPayslips(prev => prev.map(p => (p.id === updated.id ? { ...p, ...updated } : p)));
  };

  return (
    <Modal
      title={
        <Space size={8}>
          <CalculatorOutlined style={{ color: '#1677ff', fontSize: 18 }} />
          <span style={{ fontSize: 16, fontWeight: 600 }}>Bảng tính lương tháng {period?.month}/{period?.year}</span>
          <Tag color={statusConfig[period?.status]?.color} style={{ marginLeft: 6 }}>
            {statusConfig[period?.status]?.label}
          </Tag>
        </Space>
      }
      open={open}
      onCancel={onClose}
      footer={[
        <Space key="footer-actions" style={{ width: '100%', justifyContent: 'space-between' }}>
          <Text type="secondary" style={{ fontSize: 13 }}>
            Hiển thị: <Text strong>{filteredPayslips.length}</Text> / {payslips.length} nhân sự
          </Text>
          <Space>
            <Button
              icon={<FileExcelOutlined style={{ color: '#107c41' }} />}
              onClick={() => exportPayslipsToExcel(filteredPayslips, period)}
            >
              Xuất Excel (.csv)
            </Button>
            <Button icon={<PrinterOutlined />} onClick={() => window.print()}>
              In bảng lương
            </Button>
            <Button type="primary" onClick={onClose}>
              Đóng
            </Button>
          </Space>
        </Space>
      ]}
      width={1500}
      style={{ top: 20 }}
    >
      {loading ? (
        <Spin style={{ display: 'block', margin: '50px auto' }} />
      ) : (
        <>
          {/* Controls Bar: Chọn phòng ban + Nút Kiểm tra nhanh KPI + Phân 2 nhóm KPI */}
          <div style={{
            background: '#fafafa',
            border: '1px solid #f0f0f0',
            borderRadius: 6,
            padding: '10px 14px',
            marginBottom: 14,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 10,
          }}>
            <Space size={10} wrap>
              {/* Dropdown phòng ban */}
              <Space size={6}>
                <Text style={{ fontSize: 13, color: '#334155' }}>Phòng ban:</Text>
                <Select
                  style={{ width: 230 }}
                  value={selectedDeptId}
                  onChange={v => setSelectedDeptId(v)}
                  placeholder="Chọn phòng ban"
                >
                  <Option value="ALL">Tất cả phòng ban ({payslips.length} NV)</Option>
                  {departments.map((dept: any) => {
                    const count = payslips.filter(
                      p => p.employee?.departmentId === dept.id || p.employee?.department?.id === dept.id
                    ).length;
                    return (
                      <Option key={dept.id} value={dept.id}>
                        {dept.name} ({count} NV)
                      </Option>
                    );
                  })}
                </Select>
              </Space>

              {/* Nút Kiểm tra nhanh KPI */}
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                loading={checkingKpi}
                onClick={handleQuickCheckKpi}
              >
                Kiểm tra nhanh KPI
              </Button>

              {/* Bộ lọc 2 nhóm: Đạt KPI vs Chưa đạt KPI */}
              <Segmented
                value={kpiFilter}
                onChange={(val: any) => setKpiFilter(val)}
                options={[
                  { label: `Tất cả (${deptPayslips.length})`, value: 'ALL' },
                  {
                    label: (
                      <Space size={4}>
                        <Badge status="success" />
                        <span>Đạt KPI ({metCount})</span>
                      </Space>
                    ),
                    value: 'MET'
                  },
                  {
                    label: (
                      <Space size={4}>
                        <Badge status="error" />
                        <span>Chưa đạt KPI ({unmetCount})</span>
                      </Space>
                    ),
                    value: 'UNMET'
                  },
                ]}
              />
            </Space>

            {/* Tìm kiếm */}
            <Space size={8}>
              <Input
                placeholder="Tìm mã NV, họ tên..."
                prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                allowClear
                style={{ width: 190 }}
              />
              <Button
                icon={<FileExcelOutlined />}
                onClick={() => exportPayslipsToExcel(filteredPayslips, period)}
              >
                Xuất Excel
              </Button>
            </Space>
          </div>

          {/* Kiểm tra phòng ban rỗng (phòng mới tạo chưa có nhân viên) */}
          {selectedDeptId !== 'ALL' && deptPayslips.length === 0 ? (
            <div style={{ padding: '48px 0', textAlign: 'center' }}>
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <div>
                    <Text strong style={{ fontSize: 15, color: '#334155' }}>
                      Phòng ban này hiện chưa có nhân viên nào
                    </Text>
                    <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
                      Phòng mới tạo hoặc chưa có nhân sự tính lương trong kỳ này.
                    </div>
                  </div>
                }
              >
                <Button type="primary" onClick={() => setSelectedDeptId('ALL')}>
                  Xem tất cả phòng ban
                </Button>
              </Empty>
            </div>
          ) : (
            <>
              {/* Thống kê 4 chỉ số tinh gọn */}
              <Row gutter={12} style={{ marginBottom: 14 }}>
                <Col span={6}>
                  <Card size="small" style={{ borderRadius: 6, borderColor: '#f0f0f0' }}>
                    <Statistic
                      title={<Text style={{ fontSize: 12, color: '#64748b' }}>Nhân sự hiển thị</Text>}
                      value={filteredPayslips.length}
                      suffix="NV"
                      valueStyle={{ fontSize: 18, fontWeight: 700 }}
                    />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card size="small" style={{ borderRadius: 6, borderColor: '#f0f0f0' }}>
                    <Statistic
                      title={<Text style={{ fontSize: 12, color: '#64748b' }}>Đạt chỉ tiêu KPI</Text>}
                      value={summary.metInView}
                      suffix={`/ ${filteredPayslips.length} NV`}
                      valueStyle={{ fontSize: 18, fontWeight: 700, color: '#16a34a' }}
                    />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card size="small" style={{ borderRadius: 6, borderColor: '#f0f0f0' }}>
                    <Statistic
                      title={<Text style={{ fontSize: 12, color: '#64748b' }}>Tổng tiền hoa hồng</Text>}
                      value={summary.totalCommission}
                      formatter={v => fmtVND(Number(v))}
                      valueStyle={{ fontSize: 18, fontWeight: 700, color: '#16a34a' }}
                    />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card size="small" style={{ borderRadius: 6, borderColor: '#f0f0f0' }}>
                    <Statistic
                      title={<Text style={{ fontSize: 12, color: '#64748b' }}>Tổng thực lĩnh chi trả</Text>}
                      value={summary.totalNet}
                      formatter={v => fmtVND(Number(v))}
                      valueStyle={{ fontSize: 18, fontWeight: 700, color: '#1677ff' }}
                    />
                  </Card>
                </Col>
              </Row>

              {/* Bảng lương tinh gọn, chỉ số chuẩn & đẹp */}
              <Table
                dataSource={filteredPayslips}
                rowKey="id"
                pagination={{ pageSize: 10, showTotal: t => `Tổng cộng ${t} nhân sự` }}
                scroll={{ x: 1750 }}
                size="small"
                bordered
                locale={{ emptyText: 'Không có nhân sự nào phù hợp với bộ lọc.' }}
                columns={[
                  {
                    title: 'STT',
                    key: 'stt',
                    width: 50,
                    align: 'center',
                    render: (_: any, __: any, idx: number) => idx + 1,
                  },
                  {
                    title: 'Mã NV',
                    key: 'empCode',
                    width: 90,
                    align: 'center',
                    render: (_: any, r: any) => <Tag color="blue">{r.employee?.employeeCode}</Tag>,
                  },
                  {
                    title: 'Họ và tên',
                    key: 'empName',
                    width: 160,
                    render: (_: any, r: any) => <Text strong style={{ color: '#0f172a' }}>{r.employee?.fullName}</Text>,
                  },
                  {
                    title: 'Phòng ban',
                    key: 'dept',
                    width: 140,
                    render: (_: any, r: any) => r.employee?.department?.name || '—',
                  },
                  {
                    title: 'Chức danh',
                    key: 'pos',
                    width: 130,
                    render: (_: any, r: any) => r.employee?.position?.name || '—',
                  },
                  {
                    title: 'Thâm niên',
                    key: 'seniority',
                    width: 110,
                    align: 'center',
                    render: (_: any, r: any) => (
                      <Tag color="purple">{formatSeniority(r.employee?.hireDate)}</Tag>
                    ),
                  },
                  {
                    title: 'Chỉ tiêu KPI',
                    key: 'kpiTarget',
                    width: 120,
                    align: 'right',
                    render: (_: any, r: any) => {
                      const kpi = getSalesKpi(r);
                      return kpi.target > 0 ? fmtVND(kpi.target) : '—';
                    },
                  },
                  {
                    title: 'Doanh số thực tế',
                    key: 'salesActual',
                    width: 130,
                    align: 'right',
                    render: (_: any, r: any) => {
                      const kpi = getSalesKpi(r);
                      return kpi.actual > 0 ? (
                        <Text strong style={{ color: '#0284c7' }}>{fmtVND(kpi.actual)}</Text>
                      ) : '0 ₫';
                    },
                  },
                  {
                    title: 'Đánh giá KPI',
                    key: 'kpiStatus',
                    width: 130,
                    align: 'center',
                    render: (_: any, r: any) => {
                      const kpi = getSalesKpi(r);
                      if (kpi.target === 0 && kpi.actual === 0) return <Text type="secondary">—</Text>;
                      return kpi.isMet ? (
                        <Tag color="success" style={{ fontWeight: 600 }}>Đạt ({kpi.percent}%)</Tag>
                      ) : (
                        <Tag color="error" style={{ fontWeight: 600 }}>Chưa đạt ({kpi.percent}%)</Tag>
                      );
                    },
                  },
                  {
                    title: '% Hoa hồng',
                    key: 'commRate',
                    width: 95,
                    align: 'center',
                    render: (_: any, r: any) => {
                      const kpi = getSalesKpi(r);
                      return <Tag color="cyan">{kpi.rate}%</Tag>;
                    },
                  },
                  {
                    title: 'Tiền hoa hồng',
                    key: 'commission',
                    width: 130,
                    align: 'right',
                    render: (_: any, r: any) => {
                      const kpi = getSalesKpi(r);
                      return kpi.isMet && kpi.commission > 0 ? (
                        <Text strong style={{ color: '#16a34a' }}>+{fmtVND(kpi.commission)}</Text>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>0 ₫</span>
                      );
                    },
                  },
                  {
                    title: 'Lương theo công',
                    dataIndex: 'baseIncome',
                    key: 'base',
                    width: 125,
                    align: 'right',
                    render: fmtVND,
                  },
                  {
                    title: 'Phụ cấp',
                    dataIndex: 'allowanceTotal',
                    key: 'allow',
                    width: 105,
                    align: 'right',
                    render: fmtVND,
                  },
                  {
                    title: 'Giảm trừ',
                    key: 'deduct',
                    width: 110,
                    align: 'right',
                    render: (_: any, r: any) => {
                      const deduct = (r.insuranceEmployee || 0) + (r.personalIncomeTax || 0) + (r.otherDeduction || 0);
                      return deduct > 0 ? <span style={{ color: '#dc2626' }}>-{fmtVND(deduct)}</span> : '0 ₫';
                    },
                  },
                  {
                    title: 'Thực lĩnh',
                    dataIndex: 'netPay',
                    key: 'net',
                    width: 140,
                    align: 'right',
                    render: (v: number) => <Text strong style={{ color: '#1677ff', fontSize: 14 }}>{fmtVND(v)}</Text>,
                  },
                  {
                    title: 'Thao tác',
                    key: 'action',
                    width: 90,
                    align: 'center',
                    render: (_: any, r: any) => (
                      <Space size={4}>
                        <Tooltip title="Cấu hình KPI & Hoa hồng">
                          <Button
                            size="small"
                            type="text"
                            icon={<EditOutlined style={{ color: '#1677ff' }} />}
                            onClick={() => setSalesKpiModal({ open: true, payslip: r })}
                          />
                        </Tooltip>
                        <Tooltip title="Xem và in phiếu lương cá nhân">
                          <Button
                            size="small"
                            type="text"
                            icon={<PrinterOutlined style={{ color: '#52c41a' }} />}
                            onClick={() => setSelectedPayslip(r)}
                          />
                        </Tooltip>
                      </Space>
                    ),
                  },
                ]}
              />
            </>
          )}

          {/* Individual Payslip Modal */}
          <IndividualPayslipModal
            open={!!selectedPayslip}
            onClose={() => setSelectedPayslip(null)}
            payslip={selectedPayslip}
          />

          {/* Sales KPI Config Modal */}
          <SalesKpiConfigModal
            open={salesKpiModal.open}
            onClose={() => setSalesKpiModal({ open: false, payslip: null })}
            payslip={salesKpiModal.payslip}
            onSaved={handleUpdatePayslip}
          />
        </>
      )}
    </Modal>
  );
};

// ─────────────────────── COMPUTE PREVIEW MODAL (THEO PHÒNG BAN & CƠ SỐ) ───────────────
const ComputePreviewModal = ({
  open, onClose, period, onConfirmComputed,
}: { open: boolean; onClose: () => void; period: any; onConfirmComputed: () => void }) => {
  const [departments, setDepartments] = useState<any[]>([]);
  const [selectedDeptId, setSelectedDeptId] = useState<string>('');
  const [rows, setRows]         = useState<any[]>([]);
  const [loading, setLoading]   = useState(false);
  const [deptLoading, setDeptLoading] = useState(false);
  const [computing, setComputing] = useState(false);
  const [summary, setSummary]   = useState({ totalGross: 0, totalNet: 0, totalTax: 0, totalInsurance: 0, noProfile: 0 });

  // Sales parameters (Cơ số tính lương Sales)
  const [salesKpiTarget, setSalesKpiTarget] = useState<number>(100000000);
  const [salesCommissionRate, setSalesCommissionRate] = useState<number>(5);

  // Load departments on modal open
  useEffect(() => {
    if (!open) {
      setSelectedDeptId('');
      setRows([]);
      return;
    }
    setDeptLoading(true);
    apiClient.get('/organization/departments')
      .then(({ data }) => {
        const list = Array.isArray(data) ? data : [];
        setDepartments(list);
      })
      .catch(() => message.error('Lỗi khi tải danh sách phòng ban'))
      .finally(() => setDeptLoading(false));
  }, [open]);

  // Selected department info
  const selectedDept = useMemo(() => {
    return departments.find(d => d.id === selectedDeptId);
  }, [departments, selectedDeptId]);

  const isSalesDept = useMemo(() => {
    if (!selectedDept) return false;
    const code = (selectedDept.code || '').toUpperCase();
    const name = (selectedDept.name || '').toLowerCase();
    return (
      code.includes('SALES') ||
      code === 'BIZ' ||
      code === 'MKT' ||
      name.includes('kinh doanh') ||
      name.includes('sales') ||
      name.includes('bán hàng') ||
      name.includes('marketing')
    );
  }, [selectedDept]);

  // Fetch preview when selected department changes
  useEffect(() => {
    if (!open || !period || !selectedDeptId) {
      setRows([]);
      setSummary({ totalGross: 0, totalNet: 0, totalTax: 0, totalInsurance: 0, noProfile: 0 });
      return;
    }

    setLoading(true);
    apiClient.get(`/payroll/periods/${period.id}/preview?departmentId=${selectedDeptId}`)
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
  }, [open, period, selectedDeptId]);

  const handleConfirm = async () => {
    if (!selectedDeptId) {
      message.warning('Vui lòng chọn phòng ban cần tính lương!');
      return;
    }
    try {
      setComputing(true);
      const payload: any = { departmentId: selectedDeptId };
      if (isSalesDept) {
        payload.kpiTarget = salesKpiTarget;
        payload.commissionRate = salesCommissionRate;
      }
      const { data } = await apiClient.post(`/payroll/periods/${period.id}/compute`, payload);
      message.success(
        `Đã tính lương cho phòng ban "${selectedDept?.name}" (${data.count} nhân viên)!` +
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
          <span>Tính lương theo phòng ban — Tháng {period?.month}/{period?.year}</span>
          {selectedDeptId && (
            <Tag color={isSalesDept ? 'cyan' : 'blue'}>
              {selectedDept?.name} ({validCount} NV)
            </Tag>
          )}
        </Space>
      }
      open={open}
      onCancel={onClose}
      width={1380}
      style={{ top: 16 }}
      destroyOnHidden
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
            <Button onClick={onClose}>Đóng</Button>
            <Button
              type="primary"
              icon={<CalculatorOutlined />}
              loading={computing}
              disabled={!selectedDeptId || validCount === 0}
              onClick={handleConfirm}
              size="middle"
            >
              Xác nhận tính lương ({validCount} nhân sự)
            </Button>
          </Space>
        </Space>
      }
    >
      {/* ── BƯỚC 1: CHỌN PHÒNG BAN & ÁP CƠ SỐ TÍNH LƯƠNG ── */}
      <div style={{
        background: '#fafafa',
        border: '1px solid #f0f0f0',
        borderRadius: 6,
        padding: '12px 16px',
        marginBottom: 16,
      }}>
        <Row gutter={16} align="middle">
          <Col span={10}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', marginBottom: 6 }}>
              1. Chọn phòng ban cần tính lương:
            </div>
            <Select
              style={{ width: '100%' }}
              value={selectedDeptId || undefined}
              onChange={val => setSelectedDeptId(val)}
              placeholder="-- Chọn phòng ban để áp dụng cơ số --"
              loading={deptLoading}
              allowClear
            >
              {departments.map((dept: any) => (
                <Option key={dept.id} value={dept.id}>
                  {dept.name} ({dept.code})
                </Option>
              ))}
            </Select>
          </Col>
          <Col span={14}>
            {selectedDeptId ? (
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', marginBottom: 6 }}>
                  2. Cơ số tính lương: {isSalesDept ? (
                    <Tag color="cyan">Khối Kinh doanh (Sales)</Tag>
                  ) : (
                    <Tag color="blue">Khối Kỹ thuật & Văn phòng</Tag>
                  )}
                </div>
                {isSalesDept ? (
                  <div>
                    <Space size={12} wrap align="center">
                      <Space size={4}>
                        <Text style={{ fontSize: 12, color: '#64748b' }}>Chỉ tiêu KPI:</Text>
                        <InputNumber
                          size="small"
                          style={{ width: 140 }}
                          value={salesKpiTarget}
                          min={0}
                          step={10000000}
                          formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                          parser={v => (v ? v.replace(/,*/g, '') : '') as any}
                          onChange={v => setSalesKpiTarget(Number(v) || 0)}
                        />
                      </Space>
                      <Space size={4}>
                        <Text style={{ fontSize: 12, color: '#64748b' }}>% Hoa hồng:</Text>
                        <InputNumber
                          size="small"
                          style={{ width: 80 }}
                          value={salesCommissionRate}
                          min={0}
                          max={100}
                          step={0.5}
                          suffix="%"
                          onChange={v => setSalesCommissionRate(Number(v) || 0)}
                        />
                      </Space>
                      <Space size={4}>
                        {[3, 5, 8, 10].map(r => (
                          <Button
                            key={r}
                            size="small"
                            type={salesCommissionRate === r ? 'primary' : 'dashed'}
                            onClick={() => setSalesCommissionRate(r)}
                          >
                            {r}%
                          </Button>
                        ))}
                      </Space>
                    </Space>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                      Đủ KPI: nhận đủ lương cơ bản + hoa hồng. Chưa đủ KPI: chỉ nhận lương cơ bản theo ngày công.
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.6 }}>
                    ● Công chuẩn: <b>22 ngày công</b> | OT: <b>1.5x / 2.0x / 3.0x</b><br />
                    ● BHXH NLĐ: <b>10.5%</b> (DN: 21.5%) | Giảm trừ thuế: <b>11M</b> (bản thân), <b>4.4M</b> (phụ thuộc)
                  </div>
                )}
              </div>
            ) : (
              <Text type="secondary" style={{ fontSize: 13 }}>
                Vui lòng chọn phòng ban ở bên trái để tải danh sách nhân sự và xem trước số liệu.
              </Text>
            )}
          </Col>
        </Row>
      </div>

      {/* ── BƯỚC 2: NỘI DUNG XEM TRƯỚC BẢNG LƯƠNG ── */}
      {!selectedDeptId ? (
        <div style={{ padding: '60px 0', textAlign: 'center' }}>
          <BankOutlined style={{ fontSize: 44, color: '#94a3b8', marginBottom: 12 }} />
          <Title level={5} style={{ color: '#334155', margin: 0 }}>
            Vui lòng chọn một phòng ban để bắt đầu tính lương
          </Title>
          <Paragraph type="secondary" style={{ fontSize: 13, maxWidth: 520, margin: '6px auto 0' }}>
            Hệ thống phân tách luồng tính lương: Khối Sales tính theo KPI & hoa hồng chiết khấu, Khối Kỹ thuật / Văn phòng tính theo ngày công chuẩn và làm thêm giờ.
          </Paragraph>
        </div>
      ) : loading ? (
        <div style={{ textAlign: 'center', padding: '50px 0' }}>
          <Spin size="large" />
          <div style={{ marginTop: 14 }}>
            <Text type="secondary">Đang tải danh sách nhân sự phòng {selectedDept?.name}...</Text>
          </div>
        </div>
      ) : rows.length === 0 ? (
        <div style={{ padding: '48px 0', textAlign: 'center' }}>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <div>
                <Text strong style={{ fontSize: 15, color: '#334155' }}>
                  Phòng ban này hiện chưa có nhân viên nào
                </Text>
                <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
                  Phòng mới tạo hoặc chưa có nhân sự hoạt động trong hệ thống.
                </div>
              </div>
            }
          />
        </div>
      ) : (
        <>
          {/* Thống kê 4 chỉ số tóm tắt */}
          <Row gutter={12} style={{ marginBottom: 14 }}>
            {[
              { title: 'Tổng thu nhập ước tính', val: summary.totalGross, color: '#16a34a' },
              { title: 'Tổng bảo hiểm NLĐ (10.5%)', val: summary.totalInsurance, color: '#d97706' },
              { title: 'Tổng thuế TNCN', val: summary.totalTax, color: '#dc2626' },
              { title: 'Tổng thực lĩnh chi trả', val: summary.totalNet, color: '#1677ff' },
            ].map(({ title, val, color }) => (
              <Col span={6} key={title}>
                <Card size="small" style={{ borderRadius: 6, borderColor: '#f0f0f0' }}>
                  <Statistic
                    title={<Text style={{ fontSize: 12, color: '#64748b' }}>{title}</Text>}
                    value={val}
                    formatter={v => fmtVND(Number(v))}
                    valueStyle={{ color, fontSize: 16, fontWeight: 700 }}
                  />
                </Card>
              </Col>
            ))}
          </Row>

          {summary.noProfile > 0 && (
            <Alert
              type="warning"
              showIcon
              icon={<WarningOutlined />}
              message={`${summary.noProfile} nhân viên chưa thiết lập hồ sơ lương — sẽ bị bỏ qua khi tính tự động.`}
              style={{ marginBottom: 12, borderRadius: 6 }}
            />
          )}

          {/* Bảng xem trước */}
          <Table
            dataSource={rows}
            rowKey="employeeId"
            pagination={{ pageSize: 8, showTotal: t => `Tổng cộng ${t} nhân sự` }}
            scroll={{ x: 1350 }}
            size="small"
            bordered
          >
            <Table.Column title="STT" key="idx" width={50} align="center" render={(_: any, __: any, idx: number) => idx + 1} />
            <Table.Column
              title="Nhân viên"
              key="emp"
              width={180}
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
            <Table.Column title="Chức vụ" dataIndex="position" key="pos" width={130} />
            <Table.Column
              title="Ngày công"
              key="wd"
              width={90}
              align="center"
              render={(_: any, r: any) => r.hasSalaryProfile ? `${r.workDays}/22` : '—'}
            />
            <Table.Column
              title="Lương cơ bản"
              dataIndex="baseSalary"
              key="base"
              width={125}
              align="right"
              render={(v: number, r: any) => r.hasSalaryProfile ? fmtVND(v) : <Tag color="red">Chưa có</Tag>}
            />
            <Table.Column
              title="Phụ cấp"
              dataIndex="allowanceTotal"
              key="allow"
              width={105}
              align="right"
              render={(v: number, r: any) => r.hasSalaryProfile ? fmtVND(v) : '—'}
            />
            <Table.Column
              title="Làm thêm giờ"
              dataIndex="otAmount"
              key="ot"
              width={105}
              align="right"
              render={(v: number, r: any) => r.hasSalaryProfile ? fmtVND(v) : '—'}
            />
            {isSalesDept && (
              <Table.Column
                title="Hoa hồng dự kiến"
                dataIndex="bonus"
                key="bonus"
                width={125}
                align="right"
                render={(v: number, r: any) => r.hasSalaryProfile ? <Text strong style={{ color: '#16a34a' }}>+{fmtVND(v)}</Text> : '—'}
              />
            )}
            <Table.Column
              title="Tổng thu nhập"
              dataIndex="grossIncome"
              key="gross"
              width={130}
              align="right"
              render={(v: number, r: any) => r.hasSalaryProfile ? <Text strong style={{ color: '#16a34a' }}>{fmtVND(v)}</Text> : '—'}
            />
            <Table.Column
              title="Giảm trừ (BH+Thuế)"
              key="deduct"
              width={130}
              align="right"
              render={(_: any, r: any) => {
                if (!r.hasSalaryProfile) return '—';
                const d = (r.insuranceEmployee || 0) + (r.personalIncomeTax || 0);
                return d > 0 ? <span style={{ color: '#dc2626' }}>-{fmtVND(d)}</span> : '0 ₫';
              }}
            />
            <Table.Column
              title="Thực lĩnh"
              dataIndex="netPay"
              key="net"
              width={135}
              align="right"
              render={(v: number, r: any) => r.hasSalaryProfile ? <Text strong style={{ color: '#1677ff', fontSize: 13 }}>{fmtVND(v)}</Text> : '—'}
            />
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

  // ── DELETE DRAFT PERIOD ──
  const handleDeletePeriod = async (periodId: string) => {
    try {
      await apiClient.delete(`/payroll/periods/${periodId}`);
      message.success('Đã xóa kỳ lương thành công!');
      fetchData();
    } catch (err: any) {
      message.error(err?.response?.data?.message || 'Không thể xóa kỳ lương');
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
      width: canViewCompanyPayroll ? 220 : 80,
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
            <Tooltip title={!canCompute ? 'Chỉ Kế toán / Quản trị viên mới có quyền tính lương' : isPaid ? 'Kỳ lương đã khóa (Đã chi trả)' : 'Tính toán lương theo phòng ban'}>
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

            {/* 6. Xóa kỳ lương (chỉ áp dụng cho bản nháp) */}
            {canCreate && isDraft && (
              <Tooltip title="Xóa kỳ lương (chỉ áp dụng cho bản nháp)">
                <span>
                  <Popconfirm
                    title="Xác nhận xóa kỳ lương này?"
                    description="Toàn bộ phiếu lương thuộc kỳ lương này sẽ bị xóa. Bạn có thể tạo lại sau."
                    onConfirm={() => handleDeletePeriod(r.id)}
                    okText="Xóa kỳ lương"
                    cancelText="Hủy"
                    okButtonProps={{ danger: true }}
                  >
                    <Button
                      type="text"
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                    />
                  </Popconfirm>
                </span>
              </Tooltip>
            )}
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
