import React, { useEffect, useState, useMemo } from 'react';
import {
  Card, Table, Typography, Space, Button, Modal, Form, Input,
  InputNumber, Select, message, Row, Col, Statistic, Tag, Popconfirm,
  Badge, Segmented, Tooltip, Alert,
} from 'antd';
import {
  TrophyOutlined, PlusOutlined, EditOutlined, DeleteOutlined,
  SearchOutlined, TeamOutlined, CheckCircleOutlined,
  CloseCircleOutlined, DollarOutlined, FileExcelOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import apiClient from '../../../lib/api';
import { useAuthStore } from '../../../lib/auth';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

const fmtVND = (v: number) =>
  v != null ? Number(v).toLocaleString('vi-VN') + ' ₫' : '0 ₫';

const isSalesDept = (dept: any) => {
  if (!dept) return false;
  const code = (dept.code || '').toUpperCase();
  const name = (dept.name || '').toLowerCase();
  return (
    code.includes('SALES') ||
    code === 'BIZ' ||
    code === 'MKT' ||
    name.includes('kinh doanh') ||
    name.includes('sales') ||
    name.includes('bán hàng') ||
    name.includes('marketing')
  );
};

const EmployeeKpiPage: React.FC = () => {
  const { user } = useAuthStore();
  const role = user?.role;
  const canManage = role === 'ADMIN' || role === 'HR_MANAGER' || role === 'ACCOUNTANT' || role === 'MANAGER';
  const canDelete = role === 'ADMIN' || role === 'HR_MANAGER' || role === 'ACCOUNTANT';

  const [data, setData] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({
    totalCount: 0,
    totalTarget: 0,
    totalActual: 0,
    totalCommission: 0,
    metCount: 0,
    unmetCount: 0,
  });
  const [departments, setDepartments] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [selectedMonth, setSelectedMonth] = useState<number>(dayjs().month() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(dayjs().year());
  const [selectedDeptId, setSelectedDeptId] = useState<string>('ALL');
  const [kpiFilter, setKpiFilter] = useState<'ALL' | 'MET' | 'UNMET'>('ALL');
  const [searchText, setSearchText] = useState<string>('');

  // Modals
  const [isSingleModalOpen, setIsSingleModalOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [editingKpi, setEditingKpi] = useState<any>(null);

  const [singleForm] = Form.useForm();
  const [batchForm] = Form.useForm();

  // Dynamic preview for single form
  const [calcTarget, setCalcTarget] = useState<number>(100000000);
  const [calcActual, setCalcActual] = useState<number>(0);
  const [calcRate, setCalcRate] = useState<number>(5);

  const fetchKpis = async () => {
    setLoading(true);
    try {
      const params: any = {
        month: selectedMonth,
        year: selectedYear,
      };
      if (selectedDeptId !== 'ALL') params.departmentId = selectedDeptId;
      if (kpiFilter === 'MET') params.isMet = 'true';
      if (kpiFilter === 'UNMET') params.isMet = 'false';
      if (searchText.trim()) params.search = searchText.trim();

      const res = await apiClient.get('/kpis', { params });
      setData(res.data?.list || []);
      setSummary(res.data?.summary || {
        totalCount: 0,
        totalTarget: 0,
        totalActual: 0,
        totalCommission: 0,
        metCount: 0,
        unmetCount: 0,
      });
    } catch {
      message.error('Lỗi khi tải dữ liệu KPI');
    } finally {
      setLoading(false);
    }
  };

  const fetchMeta = async () => {
    try {
      const [depRes, empRes] = await Promise.all([
        apiClient.get('/organization/departments'),
        apiClient.get('/employees'),
      ]);
      setDepartments(depRes.data || []);
      const emps = Array.isArray(empRes.data?.data) ? empRes.data.data : empRes.data;
      setEmployees(Array.isArray(emps) ? emps : []);
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    fetchMeta();
  }, []);

  useEffect(() => {
    fetchKpis();
  }, [selectedMonth, selectedYear, selectedDeptId, kpiFilter, searchText]);

  // Handle open Single Modal (Create or Edit)
  const handleOpenSingle = (record?: any) => {
    setEditingKpi(record || null);
    if (record) {
      setCalcTarget(record.targetAmount);
      setCalcActual(record.actualAmount);
      setCalcRate(record.commissionRate);
      singleForm.setFieldsValue({
        employeeId: record.employeeId,
        month: record.month,
        year: record.year,
        kpiCode: record.kpiCode,
        kpiName: record.kpiName,
        targetAmount: record.targetAmount,
        actualAmount: record.actualAmount,
        commissionRate: record.commissionRate,
        extraBonus: record.extraBonus || 0,
        note: record.note || '',
      });
    } else {
      setCalcTarget(100000000);
      setCalcActual(0);
      setCalcRate(5);
      singleForm.resetFields();
      singleForm.setFieldsValue({
        month: selectedMonth,
        year: selectedYear,
        targetAmount: 100000000,
        actualAmount: 0,
        commissionRate: 5,
        extraBonus: 0,
      });
    }
    setIsSingleModalOpen(true);
  };

  // Submit Single KPI
  const handleSubmitSingle = async () => {
    try {
      const values = await singleForm.validateFields();
      if (editingKpi) {
        await apiClient.put(`/kpis/${editingKpi.id}`, values);
        message.success('Cập nhật chỉ tiêu KPI thành công!');
      } else {
        await apiClient.post('/kpis', values);
        message.success('Tạo và áp mã KPI cho nhân viên thành công!');
      }
      setIsSingleModalOpen(false);
      setEditingKpi(null);
      fetchKpis();
    } catch (err: any) {
      message.error(err?.response?.data?.message || 'Lỗi lưu dữ liệu KPI');
    }
  };

  // Submit Batch Apply for Sales
  const handleSubmitBatch = async () => {
    try {
      const values = await batchForm.validateFields();
      const res = await apiClient.post('/kpis/batch-apply-sales', values);
      message.success(res.data?.message || 'Đã áp mã KPI cho toàn bộ nhân sự!');
      setIsBatchModalOpen(false);
      batchForm.resetFields();
      fetchKpis();
    } catch (err: any) {
      message.error(err?.response?.data?.message || 'Lỗi khi áp KPI hàng loạt');
    }
  };

  // Delete KPI
  const handleDelete = async (id: string) => {
    try {
      await apiClient.delete(`/kpis/${id}`);
      message.success('Đã xóa chỉ tiêu KPI!');
      fetchKpis();
    } catch (err: any) {
      message.error(err?.response?.data?.message || 'Không thể xóa chỉ tiêu KPI');
    }
  };

  // Export CSV
  const exportToCsv = () => {
    if (!data.length) {
      message.warning('Không có dữ liệu để xuất file');
      return;
    }
    const headers = [
      'STT', 'Mã KPI', 'Mã NV', 'Họ và tên', 'Phòng ban', 'Chức danh',
      'Tháng/Năm', 'Chỉ tiêu KPI (₫)', 'Doanh số thực tế (₫)', 'Tỷ lệ hoàn thành (%)',
      'Đánh giá KPI', '% Hoa hồng', 'Tiền hoa hồng chiết khấu (₫)', 'Ghi chú'
    ];
    const rows = data.map((item, idx) => {
      const percent = item.targetAmount > 0 ? Math.round((item.actualAmount / item.targetAmount) * 100) : 0;
      return [
        idx + 1,
        `"${item.kpiCode}"`,
        `"${item.employee?.employeeCode || ''}"`,
        `"${item.employee?.fullName || ''}"`,
        `"${item.employee?.department?.name || ''}"`,
        `"${item.employee?.position?.name || ''}"`,
        `"${item.month}/${item.year}"`,
        item.targetAmount,
        item.actualAmount,
        `${percent}%`,
        `"${item.isMet ? 'Đạt KPI' : 'Chưa đạt'}"`,
        `${item.commissionRate}%`,
        item.commissionAmount,
        `"${item.note || ''}"`,
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Bang_Chi_Tieu_KPI_Thang_${selectedMonth}_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    message.success('Đã xuất file dữ liệu KPI thành công!');
  };

  // Computed preview in modal
  const percentAchieved = calcTarget > 0 ? Math.round((calcActual / calcTarget) * 100) : 0;
  const isTargetMet = calcTarget > 0 ? calcActual >= calcTarget : calcActual > 0;
  const estCommission = isTargetMet ? Math.round(calcActual * (calcRate / 100)) : 0;

  // Filtered employees for dropdown
  const salesDepts = useMemo(() => departments.filter(isSalesDept), [departments]);

  const columns = useMemo(() => {
    const baseCols: any[] = [
      {
        title: 'STT',
        key: 'stt',
        width: 50,
        align: 'center' as const,
        render: (_: any, __: any, idx: number) => idx + 1,
      },
      {
        title: 'Mã KPI',
        dataIndex: 'kpiCode',
        key: 'kpiCode',
        width: 140,
        render: (code: string) => <Tag color="cyan" style={{ fontWeight: 600 }}>{code}</Tag>,
      },
      {
        title: 'Nhân sự',
        key: 'emp',
        width: 180,
        render: (_: any, r: any) => (
          <div>
            <Text strong style={{ color: '#0f172a' }}>{r.employee?.fullName}</Text><br />
            <Text type="secondary" style={{ fontSize: 12 }}>{r.employee?.employeeCode}</Text>
          </div>
        ),
      },
      {
        title: 'Phòng ban / Chức danh',
        key: 'dept',
        width: 160,
        render: (_: any, r: any) => (
          <div>
            <div>{r.employee?.department?.name || '—'}</div>
            <Text type="secondary" style={{ fontSize: 12 }}>{r.employee?.position?.name || '—'}</Text>
          </div>
        ),
      },
      {
        title: 'Kỳ áp dụng',
        key: 'period',
        width: 100,
        align: 'center' as const,
        render: (_: any, r: any) => (
          <Tag color="blue">Tháng {r.month}/{r.year}</Tag>
        ),
      },
      {
        title: 'Chỉ tiêu KPI (₫)',
        dataIndex: 'targetAmount',
        key: 'target',
        width: 130,
        align: 'right' as const,
        render: fmtVND,
      },
      {
        title: 'Doanh số thực tế (₫)',
        dataIndex: 'actualAmount',
        key: 'actual',
        width: 140,
        align: 'right' as const,
        render: (v: number) => (
          <Text strong style={{ color: v > 0 ? '#0284c7' : '#94a3b8' }}>
            {fmtVND(v)}
          </Text>
        ),
      },
      {
        title: 'Tỷ lệ đạt',
        key: 'percent',
        width: 110,
        align: 'center' as const,
        render: (_: any, r: any) => {
          const pct = r.targetAmount > 0 ? Math.round((r.actualAmount / r.targetAmount) * 100) : 0;
          return (
            <Space size={4}>
              <Text strong>{pct}%</Text>
              {r.isMet ? (
                <Badge status="success" />
              ) : (
                <Badge status="error" />
              )}
            </Space>
          );
        },
      },
      {
        title: 'Đánh giá KPI',
        key: 'status',
        width: 120,
        align: 'center' as const,
        render: (_: any, r: any) => (
          r.isMet ? (
            <Tag color="success" icon={<CheckCircleOutlined />}>Đạt KPI</Tag>
          ) : (
            <Tag color="error" icon={<CloseCircleOutlined />}>Chưa đạt</Tag>
          )
        ),
      },
      {
        title: '% Hoa hồng',
        dataIndex: 'commissionRate',
        key: 'rate',
        width: 95,
        align: 'center' as const,
        render: (r: number) => <Tag color="purple">{r}%</Tag>,
      },
      {
        title: 'Tiền hoa hồng chiết khấu',
        dataIndex: 'commissionAmount',
        key: 'comm',
        width: 150,
        align: 'right' as const,
        render: (v: number, r: any) => (
          r.isMet && v > 0 ? (
            <Text strong style={{ color: '#16a34a', fontSize: 13 }}>
              +{fmtVND(v)}
            </Text>
          ) : (
            <span style={{ color: '#94a3b8' }}>0 ₫</span>
          )
        ),
      },
    ];

    if (canManage) {
      baseCols.push({
        title: 'Thao tác',
        key: 'action',
        width: 90,
        align: 'center' as const,
        render: (_: any, r: any) => (
          <Space size={4}>
            <Tooltip title="Chỉnh sửa chỉ tiêu & doanh số">
              <Button
                type="text"
                size="small"
                icon={<EditOutlined style={{ color: '#1677ff' }} />}
                onClick={() => handleOpenSingle(r)}
              />
            </Tooltip>
            {canDelete && (
              <Tooltip title="Xóa chỉ tiêu này">
                <span>
                  <Popconfirm
                    title="Xác nhận xóa chỉ tiêu KPI này?"
                    onConfirm={() => handleDelete(r.id)}
                    okText="Xóa"
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
        ),
      });
    }

    return baseCols;
  }, [canManage, canDelete]);

  return (
    <div style={{ padding: '24px' }}>
      {/* Header Metric Cards */}
      <Row gutter={16} style={{ marginBottom: 20 }}>
        <Col span={6}>
          <Card style={{ borderRadius: 8, borderColor: '#f0f0f0' }}>
            <Statistic
              title={<Text style={{ fontSize: 12, color: '#64748b' }}>Nhân sự áp chỉ tiêu KPI</Text>}
              value={summary.totalCount}
              suffix="nhân viên"
              prefix={<TeamOutlined style={{ color: '#1677ff' }} />}
              valueStyle={{ fontSize: 18, fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card style={{ borderRadius: 8, borderColor: '#f0f0f0' }}>
            <Statistic
              title={<Text style={{ fontSize: 12, color: '#64748b' }}>Đạt chỉ tiêu doanh số</Text>}
              value={summary.metCount}
              suffix={`/ ${summary.totalCount} NV`}
              valueStyle={{ color: '#16a34a', fontSize: 18, fontWeight: 700 }}
              prefix={<TrophyOutlined style={{ color: '#16a34a' }} />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card style={{ borderRadius: 8, borderColor: '#f0f0f0' }}>
            <Statistic
              title={<Text style={{ fontSize: 12, color: '#64748b' }}>Tổng doanh số thực tế ghi nhận</Text>}
              value={summary.totalActual}
              formatter={v => fmtVND(Number(v))}
              valueStyle={{ color: '#0284c7', fontSize: 18, fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card style={{ borderRadius: 8, borderColor: '#f0f0f0' }}>
            <Statistic
              title={<Text style={{ fontSize: 12, color: '#64748b' }}>Tổng tiền hoa hồng chiết khấu</Text>}
              value={summary.totalCommission}
              formatter={v => fmtVND(Number(v))}
              valueStyle={{ color: '#16a34a', fontSize: 18, fontWeight: 700 }}
              prefix={<DollarOutlined style={{ color: '#16a34a' }} />}
            />
          </Card>
        </Col>
      </Row>

      {/* Main Container Card */}
      <Card
        title={
          <Space align="center">
            <TrophyOutlined style={{ color: '#fa8c16', fontSize: 20 }} />
            <div>
              <Title level={4} style={{ margin: 0, color: '#1e3a8a' }}>
                Quản lý Chỉ tiêu KPI & Doanh số (Khối Kinh doanh / Sales)
              </Title>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Áp mã chỉ tiêu doanh số, theo dõi tiến độ hoàn thành, tự động chiết khấu hoa hồng và tích hợp trực tiếp vào bảng tính lương.
              </Text>
            </div>
          </Space>
        }
        extra={
          <Space size="middle">
            <Button icon={<ReloadOutlined />} onClick={fetchKpis}>
              Làm mới
            </Button>
            <Button
              icon={<FileExcelOutlined style={{ color: '#107c41' }} />}
              onClick={exportToCsv}
            >
              Xuất Excel (.csv)
            </Button>
            {canManage && (
              <>
                <Button
                  type="primary"
                  style={{ background: '#0284c7', borderColor: '#0284c7' }}
                  icon={<TeamOutlined />}
                  onClick={() => {
                    batchForm.resetFields();
                    batchForm.setFieldsValue({
                      month: selectedMonth,
                      year: selectedYear,
                      targetAmount: 100000000,
                      commissionRate: 5,
                    });
                    setIsBatchModalOpen(true);
                  }}
                >
                  Áp nhanh KPI phòng Sale
                </Button>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => handleOpenSingle()}
                >
                  Áp mã KPI nhân viên
                </Button>
              </>
            )}
          </Space>
        }
        style={{ borderRadius: 8 }}
      >
        {/* Banner nghiệp vụ */}
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16, borderRadius: 6 }}
          message={
            <div style={{ fontSize: 13, lineHeight: 1.5 }}>
              <b>Quy tắc tính lương Khối Sales:</b> Nhân sự đạt chỉ tiêu KPI (≥ 100%) nhận đủ <b>Lương cơ bản + Tiền hoa hồng chiết khấu</b>. Khi chưa đạt chỉ tiêu (&lt; 100%), nhân sự chỉ nhận <b>Lương cơ bản theo ngày công thực tế</b> (hoa hồng = 0 ₫).
            </div>
          }
        />

        {/* Filter Bar */}
        <div style={{
          background: '#fafafa',
          border: '1px solid #f0f0f0',
          borderRadius: 6,
          padding: '12px 14px',
          marginBottom: 16,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
        }}>
          <Space size={10} wrap>
            {/* Kỳ tháng / năm */}
            <Space size={4}>
              <Text style={{ fontSize: 13 }}>Kỳ:</Text>
              <Select
                value={selectedMonth}
                onChange={v => setSelectedMonth(v)}
                style={{ width: 105 }}
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                  <Option key={m} value={m}>Tháng {m}</Option>
                ))}
              </Select>
              <Select
                value={selectedYear}
                onChange={v => setSelectedYear(v)}
                style={{ width: 90 }}
              >
                {[2025, 2026, 2027].map(y => (
                  <Option key={y} value={y}>{y}</Option>
                ))}
              </Select>
            </Space>

            {/* Phòng ban filter */}
            <Space size={4}>
              <Text style={{ fontSize: 13 }}>Phòng ban:</Text>
              <Select
                value={selectedDeptId}
                onChange={v => setSelectedDeptId(v)}
                style={{ width: 230 }}
                placeholder="Chọn phòng ban"
              >
                <Option value="ALL">Tất cả phòng ban</Option>
                {departments.map((d: any) => (
                  <Option key={d.id} value={d.id}>
                    {d.name} {isSalesDept(d) ? '★ (Sales)' : ''}
                  </Option>
                ))}
              </Select>
            </Space>

            {/* Bộ lọc 2 nhóm Đạt KPI vs Chưa đạt */}
            <Segmented
              value={kpiFilter}
              onChange={(v: any) => setKpiFilter(v)}
              options={[
                { label: `Tất cả (${summary.totalCount})`, value: 'ALL' },
                {
                  label: (
                    <Space size={4}>
                      <Badge status="success" />
                      <span>Đạt KPI ({summary.metCount})</span>
                    </Space>
                  ),
                  value: 'MET'
                },
                {
                  label: (
                    <Space size={4}>
                      <Badge status="error" />
                      <span>Chưa đạt ({summary.unmetCount})</span>
                    </Space>
                  ),
                  value: 'UNMET'
                },
              ]}
            />
          </Space>

          {/* Tìm kiếm */}
          <Input
            placeholder="Tìm theo tên, mã NV, mã KPI..."
            prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            allowClear
            style={{ width: 240 }}
          />
        </div>

        {/* Table */}
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10, showTotal: t => `Tổng cộng ${t} nhân sự` }}
          scroll={{ x: 1450 }}
          bordered
          size="small"
          locale={{ emptyText: 'Chưa có chỉ tiêu KPI nào trong kỳ này. Bấm "Áp mã KPI nhân viên" hoặc "Áp nhanh KPI phòng Sale" để bắt đầu.' }}
        />
      </Card>

      {/* ── MODAL: TẠO / SỬA KPI CHO TỪNG NHÂN VIÊN ── */}
      <Modal
        title={
          <Space>
            <TrophyOutlined style={{ color: '#1677ff' }} />
            <span>{editingKpi ? 'Chỉnh sửa Chỉ tiêu KPI' : 'Áp mã KPI cho Nhân viên'}</span>
          </Space>
        }
        open={isSingleModalOpen}
        onCancel={() => { setIsSingleModalOpen(false); setEditingKpi(null); }}
        onOk={handleSubmitSingle}
        okText="Lưu chỉ tiêu"
        cancelText="Hủy"
        width={680}
        destroyOnHidden
      >
        <Form form={singleForm} layout="vertical" style={{ marginTop: 12 }}>
          <Row gutter={16}>
            <Col span={14}>
              <Form.Item
                name="employeeId"
                label="Chọn nhân viên"
                rules={[{ required: true, message: 'Vui lòng chọn nhân viên!' }]}
              >
                <Select
                  placeholder="Tìm chọn nhân viên..."
                  showSearch
                  optionFilterProp="children"
                  disabled={!!editingKpi}
                >
                  {employees.map(emp => (
                    <Option key={emp.id} value={emp.id}>
                      {emp.fullName} ({emp.employeeCode}) — {emp.department?.name || ''}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={5}>
              <Form.Item
                name="month"
                label="Tháng"
                rules={[{ required: true }]}
              >
                <Select disabled={!!editingKpi}>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                    <Option key={m} value={m}>Tháng {m}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={5}>
              <Form.Item
                name="year"
                label="Năm"
                rules={[{ required: true }]}
              >
                <Select disabled={!!editingKpi}>
                  {[2025, 2026, 2027].map(y => (
                    <Option key={y} value={y}>{y}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="kpiCode"
                label="Mã chỉ tiêu KPI (Tùy chọn)"
              >
                <Input placeholder="Tự sinh nếu bỏ trống (vd: KPI-202611-001)" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="kpiName"
                label="Tên chỉ tiêu"
              >
                <Input placeholder="VD: KPI Doanh số Dự án, Bán lẻ..." />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="targetAmount"
                label="Mức chỉ tiêu KPI (₫)"
                rules={[{ required: true, message: 'Vui lòng nhập mức chỉ tiêu!' }]}
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
                name="actualAmount"
                label="Doanh số thực tế ghi nhận (₫)"
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
              <Space size={4} style={{ marginTop: -8, marginBottom: 12 }}>
                {[3, 5, 8, 10].map(r => (
                  <Button
                    key={r}
                    size="small"
                    type={calcRate === r ? 'primary' : 'dashed'}
                    onClick={() => {
                      singleForm.setFieldsValue({ commissionRate: r });
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
                label="Thưởng vượt mốc / Thưởng nóng (₫)"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  step={500000}
                  formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={v => (v ? v.replace(/,*/g, '') : '') as any}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="note" label="Ghi chú nghiệp vụ">
            <Input.TextArea rows={2} placeholder="Nhập ghi chú điều kiện hoặc căn cứ áp dụng..." />
          </Form.Item>

          {/* Hộp xem trước kết quả */}
          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: 6,
            padding: '12px 14px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 13, color: '#334155' }}>Dự toán kết quả đạt được:</span>
              {isTargetMet ? (
                <Tag color="success" style={{ fontWeight: 600 }}>Đạt chỉ tiêu ({percentAchieved}%)</Tag>
              ) : (
                <Tag color="error" style={{ fontWeight: 600 }}>Chưa đạt ({percentAchieved}%)</Tag>
              )}
            </div>
            <Row gutter={12}>
              <Col span={12}>
                <div style={{ fontSize: 11, color: '#64748b' }}>Tiền hoa hồng được nhận:</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: isTargetMet ? '#16a34a' : '#94a3b8' }}>
                  {isTargetMet ? fmtVND(estCommission) : '0 ₫'}
                </div>
              </Col>
              <Col span={12}>
                <div style={{ fontSize: 11, color: '#64748b' }}>Quy tắc chi trả:</div>
                <div style={{ fontSize: 12, color: '#334155', marginTop: 2 }}>
                  {isTargetMet ? 'Nhận đủ lương cơ bản + hoa hồng' : 'Chỉ nhận lương cơ bản theo ngày công'}
                </div>
              </Col>
            </Row>
          </div>
        </Form>
      </Modal>

      {/* ── MODAL: ÁP NHANH KPI CHO PHÒNG BAN SALE ── */}
      <Modal
        title={
          <Space>
            <TeamOutlined style={{ color: '#0284c7' }} />
            <span>Áp nhanh KPI cho Phòng ban Sale</span>
          </Space>
        }
        open={isBatchModalOpen}
        onCancel={() => setIsBatchModalOpen(false)}
        onOk={handleSubmitBatch}
        okText="Áp dụng toàn bộ phòng"
        cancelText="Hủy"
        width={560}
        destroyOnHidden
      >
        <Paragraph type="secondary" style={{ fontSize: 13, marginTop: 4 }}>
          Hệ thống sẽ tự động gán chỉ tiêu KPI và tỷ lệ hoa hồng chung cho toàn bộ nhân sự đang làm việc trong phòng ban được chọn. Bạn vẫn có thể điều chỉnh riêng từng người sau đó.
        </Paragraph>

        <Form form={batchForm} layout="vertical">
          <Form.Item
            name="departmentId"
            label="Chọn phòng ban Sales"
            rules={[{ required: true, message: 'Vui lòng chọn phòng ban!' }]}
          >
            <Select placeholder="Chọn phòng ban...">
              <Option value="ALL">Toàn bộ nhân sự Sales các phòng</Option>
              {departments.map(d => (
                <Option key={d.id} value={d.id}>
                  {d.name} {isSalesDept(d) ? '★ (Sales)' : ''}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="month" label="Tháng áp dụng" rules={[{ required: true }]}>
                <Select>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                    <Option key={m} value={m}>Tháng {m}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="year" label="Năm" rules={[{ required: true }]}>
                <Select>
                  {[2025, 2026, 2027].map(y => (
                    <Option key={y} value={y}>{y}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="targetAmount"
                label="Chỉ tiêu KPI mặc định (₫)"
                rules={[{ required: true, message: 'Nhập chỉ tiêu mặc định!' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  step={10000000}
                  formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={v => (v ? v.replace(/,*/g, '') : '') as any}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="commissionRate"
                label="Tỷ lệ hoa hồng (%)"
                rules={[{ required: true, message: 'Nhập tỷ lệ hoa hồng!' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  max={100}
                  step={0.5}
                  suffix="%"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="note" label="Ghi chú áp dụng">
            <Input placeholder="VD: Gán chỉ tiêu kinh doanh Quý 4" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default EmployeeKpiPage;
