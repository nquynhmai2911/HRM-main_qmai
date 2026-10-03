import React, { useState, useEffect } from 'react';
import {
  Card, Table, Typography, Tag, Space, Button, Modal, Form, Input,
  InputNumber, Select, message, Row, Col, Statistic, Alert,
  Divider, Tooltip
} from 'antd';
import {
  AuditOutlined, CheckCircleOutlined, CloseCircleOutlined, UserOutlined,
  ClockCircleOutlined, CalendarOutlined, DollarOutlined, TeamOutlined,
  TrophyOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import apiClient from '../../../lib/api';

const { Title, Text, Paragraph } = Typography;

const ProbationListPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [probationList, setProbationList] = useState<any[]>([]);

  // Evaluation Modal State
  const [evalRecord, setEvalRecord] = useState<any>(null);
  const [isEvalModalVisible, setIsEvalModalVisible] = useState(false);
  const [evalForm] = Form.useForm();
  const selectedMilestone = Form.useWatch('milestone', evalForm);

  // Final Decision Modal State
  const [decisionRecord, setDecisionRecord] = useState<any>(null);
  const [isDecisionModalVisible, setIsDecisionModalVisible] = useState(false);
  const [decisionType, setDecisionType] = useState<'ACCEPT' | 'REJECT'>('ACCEPT');
  const [decisionForm] = Form.useForm();

  const fetchProbationList = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/contracts/probation');
      setProbationList(res.data);
    } catch (error) {
      console.error('Lỗi khi tải danh sách thử việc', error);
      message.error('Lỗi khi tải danh sách nhân sự thử việc');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProbationList();
  }, []);

  const openEvaluationModal = (record: any) => {
    setEvalRecord(record);
    setIsEvalModalVisible(true);

    let milestones: any = {};
    try {
      milestones = record.probationReview?.comment ? JSON.parse(record.probationReview.comment) : {};
    } catch {
      milestones = {};
    }

    // Default to week2, or next pending milestone
    let defaultMilestone = 'week2';
    if (milestones.week2?.status === 'EVALUATED' && milestones.week4?.status !== 'EVALUATED') {
      defaultMilestone = 'week4';
    } else if (milestones.week4?.status === 'EVALUATED') {
      defaultMilestone = 'week8';
    }

    const currentMilestoneData = milestones[defaultMilestone] || {};

    evalForm.setFieldsValue({
      milestone: defaultMilestone,
      technicalScore: currentMilestoneData.technicalScore || 8,
      attitudeScore: currentMilestoneData.attitudeScore || 9,
      result: currentMilestoneData.result || 'PASS',
      comment: currentMilestoneData.comment || '',
    });
  };

  const handleMilestoneChange = (milestoneKey: string) => {
    if (!evalRecord) return;
    let milestones: any = {};
    try {
      milestones = evalRecord.probationReview?.comment ? JSON.parse(evalRecord.probationReview.comment) : {};
    } catch {
      milestones = {};
    }
    const currentMilestoneData = milestones[milestoneKey] || {};
    evalForm.setFieldsValue({
      technicalScore: currentMilestoneData.technicalScore || 8,
      attitudeScore: currentMilestoneData.attitudeScore || 9,
      result: currentMilestoneData.result || 'PASS',
      comment: currentMilestoneData.comment || '',
    });
  };

  const handleSaveEvaluation = async () => {
    try {
      const values = await evalForm.validateFields();
      await apiClient.post(`/contracts/probation/${evalRecord.id}/review`, values);
      message.success(`Đã lưu kết quả đánh giá cho ${values.milestone === 'week2' ? 'Tuần 2' : values.milestone === 'week4' ? 'Tuần 4' : 'Tuần 8'}!`);
      setIsEvalModalVisible(false);
      fetchProbationList();
    } catch (error: any) {
      if (error.errorFields) return;
      message.error(error.response?.data?.message || 'Lỗi khi lưu đánh giá');
    }
  };

  const openDecisionModal = (record: any, type: 'ACCEPT' | 'REJECT') => {
    setDecisionRecord(record);
    setDecisionType(type);
    setIsDecisionModalVisible(true);
    decisionForm.setFieldsValue({
      officialSalary: record.baseSalary,
      contractType: 'DEFINITE_1Y',
      reason: '',
    });
  };

  const handleConfirmDecision = async () => {
    try {
      const values = await decisionForm.validateFields();
      await apiClient.post(`/contracts/probation/${decisionRecord.id}/decision`, {
        decision: decisionType,
        officialSalary: values.officialSalary,
        reason: values.reason,
      });

      if (decisionType === 'ACCEPT') {
        message.success(`Chúc mừng! Nhân sự ${decisionRecord.employee?.fullName} đã vượt qua thử việc và chuyển sang Nhân viên chính thức!`);
        setIsDecisionModalVisible(false);
        navigate('/employees');
      } else {
        message.warning(`Đã ghi nhận kết quả không đạt thử việc cho nhân sự ${decisionRecord.employee?.fullName}.`);
        setIsDecisionModalVisible(false);
        fetchProbationList();
      }
    } catch (error: any) {
      if (error.errorFields) return;
      message.error(error.response?.data?.message || 'Lỗi khi xử lý quyết định thử việc');
    }
  };

  const parseMilestones = (record: any) => {
    try {
      return record.probationReview?.comment ? JSON.parse(record.probationReview.comment) : {};
    } catch {
      return {};
    }
  };

  const columns = [
    {
      title: 'Nhân sự thử việc',
      key: 'employee',
      render: (record: any) => (
        <div>
          <div style={{ fontWeight: 600, color: '#1e3a8a', fontSize: 14 }}>
            {record.employee?.fullName}
          </div>
          <div style={{ fontSize: 12, color: '#64748b' }}>
            Mã: <Tag color="blue" style={{ fontSize: 11 }}>{record.employee?.employeeCode}</Tag>
            | {record.employee?.workEmail}
          </div>
        </div>
      ),
    },
    {
      title: 'Vị trí & Phòng ban',
      key: 'department',
      render: (record: any) => (
        <div>
          <div style={{ fontWeight: 500 }}>{record.employee?.position?.name || 'N/A'}</div>
          <Text type="secondary" style={{ fontSize: 12 }}>{record.employee?.department?.name || 'N/A'}</Text>
        </div>
      ),
    },
    {
      title: 'Thời gian thử việc',
      key: 'duration',
      render: (record: any) => (
        <div>
          <div style={{ fontSize: 13 }}>
            <CalendarOutlined style={{ marginRight: 6, color: '#1677ff' }} />
            {dayjs(record.startDate).format('DD/MM/YYYY')} - {record.endDate ? dayjs(record.endDate).format('DD/MM/YYYY') : '60 ngày'}
          </div>
          <Text type="secondary" style={{ fontSize: 11 }}>Lương: {record.baseSalary?.toLocaleString()} VNĐ ({record.probationSalaryPercent || 85}%)</Text>
        </div>
      ),
    },
    {
      title: 'Đánh giá Tuần 2 (14 ngày)',
      key: 'week2',
      render: (record: any) => {
        const milestones = parseMilestones(record);
        const w2 = milestones.week2;
        if (!w2 || w2.status !== 'EVALUATED') {
          return <Tag color="default">Chờ đánh giá</Tag>;
        }
        return (
          <Tooltip title={`Chuyên môn: ${w2.technicalScore}/10 | Thái độ: ${w2.attitudeScore}/10 - Nhận xét: ${w2.comment || 'Tốt'}`}>
            <Tag color={w2.result === 'PASS' ? 'success' : 'warning'}>
              {w2.result === 'PASS' ? `Đạt (${w2.technicalScore}đ)` : 'Cần cải thiện'}
            </Tag>
          </Tooltip>
        );
      },
    },
    {
      title: 'Đánh giá Tuần 4 (30 ngày)',
      key: 'week4',
      render: (record: any) => {
        const milestones = parseMilestones(record);
        const w4 = milestones.week4;
        if (!w4 || w4.status !== 'EVALUATED') {
          return <Tag color="default">Chờ đánh giá</Tag>;
        }
        return (
          <Tooltip title={`Chuyên môn: ${w4.technicalScore}/10 | Thái độ: ${w4.attitudeScore}/10 - Nhận xét: ${w4.comment || 'Tốt'}`}>
            <Tag color={w4.result === 'PASS' ? 'success' : 'warning'}>
              {w4.result === 'PASS' ? `Đạt (${w4.technicalScore}đ)` : 'Cần cải thiện'}
            </Tag>
          </Tooltip>
        );
      },
    },
    {
      title: 'Đánh giá Tuần 8 (Tổng kết)',
      key: 'week8',
      render: (record: any) => {
        const milestones = parseMilestones(record);
        const w8 = milestones.week8;
        if (!w8 || w8.status !== 'EVALUATED') {
          return <Tag color="default">Chờ đánh giá</Tag>;
        }
        return (
          <Tooltip title={`Chuyên môn: ${w8.technicalScore}/10 | Thái độ: ${w8.attitudeScore}/10 - Nhận xét: ${w8.comment || 'Tốt'}`}>
            <Tag color={w8.result === 'PASS' ? 'success' : 'error'}>
              {w8.result === 'PASS' ? `Đạt (${w8.technicalScore}đ)` : 'Không đạt'}
            </Tag>
          </Tooltip>
        );
      },
    },
    {
      title: 'Trạng thái',
      key: 'status',
      render: (record: any) => {
        if (record.status === 'COMPLETED') {
          return <Tag color="green">Đã chuyển Chính thức</Tag>;
        }
        if (record.status === 'TERMINATED') {
          return <Tag color="red">Dừng thử việc</Tag>;
        }
        return <Tag color="processing">Đang thử việc</Tag>;
      },
    },
    {
      title: 'Hành động',
      key: 'actions',
      render: (record: any) => {
        const isFinished = record.status === 'COMPLETED' || record.status === 'TERMINATED';
        return (
          <Space size="small">
            <Button
              size="small"
              icon={<AuditOutlined />}
              onClick={() => openEvaluationModal(record)}
              title="Đánh giá các mốc (2, 4, 8 tuần)"
            >
              Đánh giá
            </Button>

            {!isFinished && (
              <>
                <Button
                  type="primary"
                  size="small"
                  style={{ background: '#16a34a', borderColor: '#16a34a' }}
                  icon={<CheckCircleOutlined />}
                  onClick={() => openDecisionModal(record, 'ACCEPT')}
                  title="Đạt thử việc - Chuyển sang Nhân viên chính thức"
                >
                  Nhận việc
                </Button>

                <Button
                  danger
                  size="small"
                  icon={<CloseCircleOutlined />}
                  onClick={() => openDecisionModal(record, 'REJECT')}
                  title="Không đạt - Dừng thử việc"
                >
                  Từ chối
                </Button>
              </>
            )}
          </Space>
        );
      },
    },
  ];

  const totalProbation = probationList.filter(p => p.status === 'ACTIVE').length;
  const passedProbation = probationList.filter(p => p.status === 'COMPLETED').length;

  return (
    <div style={{ padding: '24px' }}>
      {/* Header Cards */}
      <Card style={{ marginBottom: 20, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <Title level={4} style={{ margin: 0, color: '#1e3a8a', fontWeight: 700 }}>
              Quản lý Đánh giá Thử việc (Probation Management)
            </Title>
            <Text type="secondary" style={{ fontSize: 13 }}>
              Theo dõi và đánh giá hiệu quả thử việc qua 3 mốc chuẩn hoá: <strong>Sau 2 tuần</strong>, <strong>Sau 4 tuần</strong>, và <strong>Sau 8 tuần (Chung cuộc)</strong>.
            </Text>
          </div>

          <Space>
            <Button icon={<TeamOutlined />} onClick={() => navigate('/employees')}>
              Xem DS Nhân viên
            </Button>
            <Button type="primary" icon={<UserOutlined />} onClick={() => navigate('/recruitment/requisitions')}>
              Đến Tuyển dụng
            </Button>
          </Space>
        </div>

        <Divider style={{ margin: '16px 0' }} />

        <Row gutter={16}>
          <Col span={6}>
            <Statistic title="Đang trong thời gian thử việc" value={totalProbation} prefix={<ClockCircleOutlined style={{ color: '#1677ff' }} />} />
          </Col>
          <Col span={6}>
            <Statistic title="Đã đạt & Chuyển sang Chính thức" value={passedProbation} prefix={<TrophyOutlined style={{ color: '#52c41a' }} />} />
          </Col>
          <Col span={6}>
            <Statistic title="Thời gian thử việc tiêu chuẩn" value="60 ngày (2 tháng)" prefix={<CalendarOutlined style={{ color: '#722ed1' }} />} />
          </Col>
          <Col span={6}>
            <Statistic title="Tỷ lệ lương thử việc" value="85% - 100%" prefix={<DollarOutlined style={{ color: '#fa8c16' }} />} />
          </Col>
        </Row>
      </Card>

      {/* Main Table */}
      <Card bodyStyle={{ padding: 0 }} style={{ borderRadius: 8, overflow: 'hidden' }}>
        <Table
          columns={columns}
          dataSource={probationList}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* Modal 1: Đánh giá thử việc 3 giai đoạn (Tuần 2, Tuần 4, Tuần 8) */}
      <Modal
        title={
          <Space>
            <AuditOutlined style={{ color: '#1677ff' }} />
            <span>Đánh giá Thử việc - {evalRecord?.employee?.fullName}</span>
          </Space>
        }
        open={isEvalModalVisible}
        onCancel={() => setIsEvalModalVisible(false)}
        onOk={handleSaveEvaluation}
        okText="Lưu đánh giá"
        cancelText="Đóng"
        width={680}
        destroyOnClose
      >
        <Form form={evalForm} layout="vertical">
          <Alert
            message={`Đánh giá nhân sự: ${evalRecord?.employee?.fullName} - Vị trí: ${evalRecord?.employee?.position?.name || 'N/A'}`}
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />

          <Form.Item name="milestone" label="Chọn Mốc Đánh giá Thử việc" rules={[{ required: true }]}>
            <Select
              onChange={handleMilestoneChange}
              options={[
                { label: 'Mốc 1: Đánh giá sau 2 tuần', value: 'week2' },
                { label: 'Mốc 2: Đánh giá sau 4 tuần', value: 'week4' },
                { label: 'Mốc 3: Đánh giá sau 8 tuần', value: 'week8' },
              ]}
            />
          </Form.Item>

          <Card size="small" style={{ background: '#f8fafc', marginBottom: 16 }}>
            {selectedMilestone === 'week2' && (
              <Paragraph style={{ margin: 0, color: '#334155' }}>
                <strong>Tiêu chí Tuần 2:</strong> Mức độ hòa nhập văn hóa công ty, tính kỷ luật giờ giấc, hoàn thành các bài học nhập môn và chuẩn bị môi trường làm việc.
              </Paragraph>
            )}
            {selectedMilestone === 'week4' && (
              <Paragraph style={{ margin: 0, color: '#334155' }}>
                <strong>Tiêu chí Tuần 4:</strong> Năng lực xử lý công việc thực tế, chất lượng code/sản phẩm bàn giao, kỹ năng phối hợp với đồng nghiệp trong nhóm.
              </Paragraph>
            )}
            {selectedMilestone === 'week8' && (
              <Paragraph style={{ margin: 0, color: '#334155' }}>
                <strong>Tiêu chí Tuần 8 (Chung cuộc):</strong> Mức độ độc lập trong công việc, tinh thần trách nhiệm, đáp ứng toàn diện các yêu cầu trong JD ban đầu để tiếp nhận chính thức.
              </Paragraph>
            )}
          </Card>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="technicalScore" label="Điểm Chuyên môn" rules={[{ required: true }]}>
                <InputNumber min={1} max={10} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="attitudeScore" label="Điểm Thái độ" rules={[{ required: true }]}>
                <InputNumber min={1} max={10} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="result" label="Kết quả đánh giá mốc này" rules={[{ required: true }]}>
                <Select options={[
                  { label: 'Đạt yêu cầu (Tiếp tục thử việc)', value: 'PASS' },
                  { label: 'Cần cải thiện (Leader sẽ kèm cặp thêm)', value: 'NEEDS_IMPROVEMENT' },
                  { label: 'Không đạt yêu cầu', value: 'FAIL' },
                ]} />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="comment" label="Nhận xét chi tiết của Leader / Quản lý bộ phận">
                <Input.TextArea rows={3} placeholder="Ghi nhận điểm mạnh, các điểm cần khắc phục và định hướng cho giai đoạn tiếp theo..." />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* Modal 2: Quyết định Nhận việc chính thức hay Từ chối */}
      <Modal
        title={
          decisionType === 'ACCEPT' ? (
            <Space>
              <CheckCircleOutlined style={{ color: '#16a34a', fontSize: 20 }} />
              <span style={{ color: '#15803d' }}>Tiếp nhận Chính thức (Vượt qua thử việc)</span>
            </Space>
          ) : (
            <Space>
              <CloseCircleOutlined style={{ color: '#dc2626', fontSize: 20 }} />
              <span style={{ color: '#b91c1c' }}>Dừng Thử việc (Không đạt yêu cầu)</span>
            </Space>
          )
        }
        open={isDecisionModalVisible}
        onCancel={() => setIsDecisionModalVisible(false)}
        onOk={handleConfirmDecision}
        okText={decisionType === 'ACCEPT' ? 'Xác nhận ký HĐ Chính thức' : 'Xác nhận Dừng thử việc'}
        okButtonProps={{ style: decisionType === 'ACCEPT' ? { background: '#16a34a', borderColor: '#16a34a' } : { background: '#dc2626', borderColor: '#dc2626' } }}
        cancelText="Hủy"
        width={580}
        destroyOnClose
      >
        <Form form={decisionForm} layout="vertical">
          {decisionType === 'ACCEPT' ? (
            <div>
              <Alert
                message={`Nhân sự ${decisionRecord?.employee?.fullName} đã hoàn thành tốt giai đoạn thử việc.`}
                description="Hệ thống sẽ cập nhật trạng thái nhân sự thành Chính thức, tạo Hợp đồng lao động chính thức và chuyển nhân sự sang tab Quản lý Nhân viên."
                type="success"
                showIcon
                style={{ marginBottom: 16 }}
              />

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="contractType" label="Loại hợp đồng lao động" rules={[{ required: true }]}>
                    <Select options={[
                      { label: 'HĐ Xác định thời hạn 1 năm', value: 'DEFINITE_1Y' },
                      { label: 'HĐ Xác định thời hạn 3 năm', value: 'DEFINITE_3Y' },
                      { label: 'HĐ Không xác định thời hạn', value: 'INDEFINITE' },
                    ]} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="officialSalary" label="Mức lương chính thức" rules={[{ required: true }]}>
                    <InputNumber
                      style={{ width: '100%' }}
                      formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      parser={(value) => value?.replace(/\$\s?|(,*)/g, '') as any}
                      addonAfter="VNĐ"
                    />
                  </Form.Item>
                </Col>
              </Row>
            </div>
          ) : (
            <div>
              <Alert
                message={`Xác nhận dừng thử việc đối với nhân sự: ${decisionRecord?.employee?.fullName}`}
                description="Nhân sự sẽ được chuyển sang trạng thái đã nghỉ việc và đóng hợp đồng thử việc."
                type="error"
                showIcon
                style={{ marginBottom: 16 }}
              />
              <Form.Item name="reason" label="Lý do dừng thử việc" rules={[{ required: true, message: 'Vui lòng nhập lý do dừng thử việc' }]}>
                <Input.TextArea rows={3} placeholder="VD: Năng lực chuyên môn chưa đáp ứng yêu cầu dự án; Hoặc nhân sự có nguyện vọng cá nhân dừng thử việc..." />
              </Form.Item>
            </div>
          )}
        </Form>
      </Modal>
    </div>
  );
};

export default ProbationListPage;
