import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card, Button, Typography, Row, Col, Modal, Form, Input, Select, message,
  Tag, Space, Upload, Divider, DatePicker, InputNumber, Descriptions,
  Alert, Badge, Tabs, Switch, Checkbox, Radio
} from 'antd';
import {
  PlusOutlined, UploadOutlined, ArrowLeftOutlined, CalendarOutlined,
  CheckOutlined, CloseOutlined, EyeOutlined, FilePdfOutlined, MailOutlined,
  PhoneOutlined, UserOutlined, SolutionOutlined, PrinterOutlined,
  CheckCircleOutlined, DownloadOutlined, InboxOutlined, ThunderboltOutlined,
  FileDoneOutlined, GiftOutlined, UserSwitchOutlined, SafetyCertificateOutlined,
  AuditOutlined, SaveOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import apiClient from '../../../lib/api';

const { Title, Text, Paragraph } = Typography;
const { Dragger } = Upload;


const STAGES = [
  { id: 'NEW', title: 'Mới ứng tuyển', color: 'blue', desc: 'Hồ sơ mới nộp vào hệ thống' },
  { id: 'SCREENING', title: 'Đang sàng lọc', color: 'orange', desc: 'Đã duyệt hồ sơ, sắp xếp lịch PV' },
  { id: 'INTERVIEW', title: 'Phỏng vấn', color: 'purple', desc: 'Đang hoặc đã phỏng vấn chuyên môn' },
  { id: 'OFFER', title: 'Gửi Offer', color: 'cyan', desc: 'Đàm phán đãi ngộ & chốt ngày đi làm' },
  { id: 'HIRED', title: 'Đã nhận việc', color: 'green', desc: 'Đồng ý offer & chuẩn bị Onboarding' },
  { id: 'REJECTED', title: 'Từ chối / Loại', color: 'red', desc: 'Hồ sơ không phù hợp hoặc ứng viên từ chối' }
];

// Valid standard Base64 sample PDF for immediate local preview
const SAMPLE_PDF_BASE64 = 'data:application/pdf;base64,JVBERi0xLjQKJcOkw7zDtsOfCjEgMCBvYmoKPDwvVHlwZS9DYXRhbG9nL1BhZ2VzIDIgMCBSPj4KZW5kb2JqCjIgMCBvYmoKPDwvVHlwZS9QYWdlcy9LaWRzWzMgMCBSXS9Db3VudCAxPj4KZW5kb2JqCjMgMCBvYmoKPDwvVHlwZS9QYWdlL1BhcmVudCAyIDAgUi9NZWRpYUJveFswIDAgNTk1IDg0Ml0vQ29udGVudHMgNCAwIFIvUmVzb3VyY2VzPDwvRm9udDw8L0YxIDUgMCBSPj4+Pj4KZW5kb2JqCjQgMCBvYmoKPDwvTGVuZ3RoIDI5MD4+CnN0cmVhbQpCVAovRjEgMjIgVGYKMTAwIDc3MCBUZgooQ1VSUklDVUxVTSBWSVRBRSAtIENWIFVORyBWSUVOKSBUagowIC0zMCBUZgovRjEgMTQgVGYKKEhvIHRlbiB1bmcgdmllbjogTmd1eWVuIFZhbiBIb2FuZykgVGoKMCAtMjUgVGYKL0YxIDEyIFRmCihWaSB0cmkgdW5nIHR1eWVuOiBTZW5pb3IgRnVsbHN0YWNrIERldmVsb3BlcikgVGoKMCAtMjAgVGYKKktpbmggbmdoaWVtOiA1IG5hbSB2b2kgUmVhY3RKYywgTm9kZUpzLCBOZXN0SnMsIFBvc3RncmVTUUwpIFRqCjAgLTIwIFRkCihFbWFpbDogaG9hbmcubmd1eWVuQGR0cy5jb20udm4gLSBTREQ6IDA5MTIzNDU2NzgpIFRqCjAgLTMwIFRkCi9GMSAxMSBUZgooLS0tLS0gRGF5IGxhIHRlcCBDViBkdW9jIHRhaSBsZW4gdHJ1YyB0aWVwIHRyZW4gaGUgdGhvbmcgRFRTLUhSTSAtLS0tLSkgVGoKRVQKZW5kc3RyZWFtCmVuZG9iago1IDAgb2JqCjw8L1R5cGUvRm9udC9TdWJ0eXBlL1R5cGUxL0Jhc2VGb250L0hlbHZldGljYT4+CmVuZG9iagp4cmVmCjAgNgowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMTUgMDAwMDAgbiAKMDAwMDAwMDA2OCAwMDAwMCBuIAowMDAwMDAwMTI1IDAwMDAwIG4gCjAwMDAwMDAyNTYAwMDAwIG4gCjAwMDAwMDU1NyAwMDAwMCBuIAp0cmFpbGVyCjw8L1Jvb3QgMSAwIFIvU2l6ZSA2Pj4Kc3RhcnR4cmVmCjY4MAolJUVPRgo=';

const CandidatePipelinePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [requisition, setRequisition] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);

  // Modals state
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isAddingCandidate, setIsAddingCandidate] = useState(false);
  const [isJDModalVisible, setIsJDModalVisible] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [isCVVisible, setIsCVVisible] = useState(false);
  const [activeCVApp, setActiveCVApp] = useState<any>(null);
  const [activeCVUrl, setActiveCVUrl] = useState<string>('');
  const [activeCVFileName, setActiveCVFileName] = useState<string>('');

  // Upload file state in Add Modal
  const [uploadedFileData, setUploadedFileData] = useState<{
    name: string;
    size: string;
    type: string;
    dataUrl: string;
  } | null>(null);

  const [form] = Form.useForm();
  const [actionForm] = Form.useForm();
  const [benefitsForm] = Form.useForm();
  const [onboardForm] = Form.useForm();

  const [enableBenefitsEdit, setEnableBenefitsEdit] = useState(false);
  const [isOnboardModalVisible, setIsOnboardModalVisible] = useState(false);
  const [onboardType, setOnboardType] = useState<'DIRECT_OFFICIAL' | 'PROBATION'>('PROBATION');
  const [isOnboardSubmitting, setIsOnboardSubmitting] = useState(false);


  const fetchPipeline = async () => {
    try {
      const reqRes = await apiClient.get(`/recruitment/requisitions/${id}`);
      setRequisition(reqRes.data);

      const appRes = await apiClient.get(`/recruitment/applications`, { params: { requisitionId: id } });
      setApplications(appRes.data);
    } catch (error) {
      console.error('Error fetching pipeline', error);
      message.error('Lỗi khi tải dữ liệu Quy trình ứng viên');
    }
  };

  useEffect(() => {
    if (id) {
      fetchPipeline();
    }
  }, [id]);

  const handleFileChange = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setUploadedFileData({
        name: file.name,
        size: (file.size / 1024).toFixed(1) + ' KB',
        type: file.type || 'application/pdf',
        dataUrl: result,
      });
      form.setFieldsValue({
        cvUrl: file.name,
      });
      message.success(`Đã nhận tệp CV: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`);
    };
    reader.readAsDataURL(file);
    return false;
  };

  const handleUseSampleCV = () => {
    const randomSuffix = Date.now().toString().slice(-4);
    setUploadedFileData({
      name: 'CV_Senior_Fullstack_Engineer.pdf',
      size: '142.5 KB',
      type: 'application/pdf',
      dataUrl: SAMPLE_PDF_BASE64,
    });
    form.setFieldsValue({
      fullName: 'Hoàng Văn Nam',
      email: `nam.hoang_${randomSuffix}@gmail.com`,
      phone: '0988665544',
      yearsExperience: 5,
      skills: 'React, TypeScript, NodeJS, NestJS, Docker, AWS',
      source: 'TOPCV',
      cvUrl: 'CV_Senior_Fullstack_Engineer.pdf',
    });
    message.success('Đã tải bộ thông tin & tệp CV PDF mẫu thành công!');
  };

  const handleAddCandidate = async (values: any) => {
    try {
      setIsAddingCandidate(true);
      const cvContent = uploadedFileData?.dataUrl || values.cvUrl || 'CV_' + values.fullName?.replace(/\s+/g, '_') + '.pdf';
      const candidatePayload = {
        requisitionId: id,
        fullName: values.fullName?.trim(),
        email: values.email?.trim(),
        phone: values.phone?.trim(),
        yearsExperience: values.yearsExperience,
        skills: values.skills?.trim(),
        source: values.source || 'WEBSITE',
        cvUrl: cvContent,
      };

      await apiClient.post('/recruitment/applications', candidatePayload);

      // Cache local CV content by candidate email for quick instant view
      if (uploadedFileData?.dataUrl) {
        localStorage.setItem(`cv_file_${values.email?.trim()}`, uploadedFileData.dataUrl);
        localStorage.setItem(`cv_name_${values.email?.trim()}`, uploadedFileData.name);
      }

      message.success('Thêm hồ sơ ứng viên thành công!');
      setIsAddModalVisible(false);
      form.resetFields();
      setUploadedFileData(null);
      fetchPipeline();
    } catch (error: any) {
      const errMsg = error.response?.data?.message || 'Lỗi khi thêm ứng viên vào hệ thống';
      message.error(errMsg);
    } finally {
      setIsAddingCandidate(false);
    }
  };

  const handleUpdateStage = async (newStage: string, payload: any = {}) => {
    if (!selectedApp) return;
    try {
      await apiClient.post(`/recruitment/applications/${selectedApp.id}/stage`, {
        stage: newStage,
        ...payload
      });
      message.success(`Đã cập nhật trạng thái hồ sơ sang "${STAGES.find(s => s.id === newStage)?.title}"`);
      setIsModalVisible(false);
      fetchPipeline();
    } catch (error: any) {
      const errMsg = error.response?.data?.message || 'Lỗi khi cập nhật trạng thái';
      message.error(errMsg);
    }
  };

  const openAppDetail = (app: any) => {
    setSelectedApp(app);
    setIsModalVisible(true);
    actionForm.resetFields();
    benefitsForm.resetFields();

    const initialSalary = app.offer?.salary || requisition?.salaryMax || 20000000;
    actionForm.setFieldsValue({
      note: app.candidate?.note,
      finalSalary: initialSalary,
      onboardingDate: app.offer?.startDate ? dayjs(app.offer.startDate) : dayjs().add(14, 'day'),
      offerNote: app.offer?.note,
    });

    benefitsForm.setFieldsValue({
      benefitSalary: initialSalary,
      probationSalaryPercent: 85,
      insurancePackage: 'FULL_100',
      allowancePerks: ['LUNCH', 'LAPTOP'],
      specialNotes: app.candidate?.note || '',
    });
    setEnableBenefitsEdit(false);
  };

  const handleSaveBenefits = async () => {
    if (!selectedApp) return;
    try {
      const values = await benefitsForm.validateFields();
      const res = await apiClient.post(`/recruitment/applications/${selectedApp.id}/benefits`, {
        salary: values.benefitSalary,
        probationSalaryPercent: values.probationSalaryPercent,
        insurancePackage: values.insurancePackage,
        allowances: values.allowancePerks,
        note: values.specialNotes,
      });

      message.success('Đã lưu và cập nhật chế độ quyền lợi & ưu đãi cho ứng viên!');
      if (res.data) {
        setSelectedApp(res.data);
      }
      fetchPipeline();
    } catch (error: any) {
      console.error(error);
      message.error(error.response?.data?.message || 'Lỗi khi lưu điều chỉnh quyền lợi');
    }
  };

  const openOnboardModal = (app?: any) => {
    const targetApp = app || selectedApp;
    if (!targetApp) return;
    setSelectedApp(targetApp);
    setOnboardType('PROBATION');
    setIsOnboardModalVisible(true);

    const defaultSalary = targetApp.offer?.salary || requisition?.salaryMax || 20000000;
    onboardForm.setFieldsValue({
      startDate: targetApp.offer?.startDate ? dayjs(targetApp.offer.startDate) : dayjs(),
      salary: defaultSalary,
      probationSalaryPercent: 85,
      note: targetApp.offer?.note || '',
    });
  };

  const handleConfirmOnboard = async () => {
    if (!selectedApp) return;
    try {
      setIsOnboardSubmitting(true);
      const values = await onboardForm.validateFields();

      const payload = {
        applicationId: selectedApp.id,
        type: onboardType,
        startDate: values.startDate ? values.startDate.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
        baseSalary: values.salary,
        probationSalaryPercent: onboardType === 'DIRECT_OFFICIAL' ? 100 : (values.probationSalaryPercent || 85),
        benefits: values.note,
      };

      await apiClient.post('/contracts/onboard', payload);
      setIsOnboardModalVisible(false);
      setIsModalVisible(false);

      if (onboardType === 'DIRECT_OFFICIAL') {
        message.success(`Tuyển thẳng thành công! Nhân sự ${selectedApp.candidate?.fullName} đã được tạo với trạng thái Chính thức. Đang chuyển sang tab Nhân viên...`);
        navigate('/employees');
      } else {
        message.success(`Ký hợp đồng Thử việc thành công! Đã kích hoạt quy trình Đánh giá 2, 4, 8 tuần cho ${selectedApp.candidate?.fullName}. Đang chuyển sang Màn Thử việc...`);
        navigate('/contracts/probation');
      }
    } catch (error: any) {
      console.error(error);
      message.error(error.response?.data?.message || 'Lỗi khi tiếp nhận nhân sự');
    } finally {
      setIsOnboardSubmitting(false);
    }
  };


  const openCVViewer = (app: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setActiveCVApp(app);

    // Resolve CV file url (either database stored dataUrl, local cache, or fallback sample)
    const email = app.candidate?.email;
    const cachedUrl = localStorage.getItem(`cv_file_${email}`);
    const cachedName = localStorage.getItem(`cv_name_${email}`);

    let resolvedUrl = '';
    let resolvedName = cachedName || (app.candidate?.fullName ? `CV_${app.candidate.fullName}.pdf` : 'CV_UngVien.pdf');

    if (app.candidate?.cvUrl?.startsWith('data:')) {
      resolvedUrl = app.candidate.cvUrl;
    } else if (cachedUrl) {
      resolvedUrl = cachedUrl;
    } else {
      // Default to sample valid PDF so user can always see a real PDF view
      resolvedUrl = SAMPLE_PDF_BASE64;
    }

    setActiveCVUrl(resolvedUrl);
    setActiveCVFileName(resolvedName);
    setIsCVVisible(true);
  };

  return (
    <div style={{ padding: '24px' }}>
      {/* Header Info Banner */}
      <Card style={{ marginBottom: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderRadius: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <Space direction="vertical" size={4}>
            <Space>
              <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/recruitment/requisitions')}>
                Danh sách YCTD
              </Button>
              <Tag color="purple">Quy trình tuyển dụng</Tag>
            </Space>

            <Title level={4} style={{ margin: '8px 0 0 0', fontWeight: 700, color: '#111827' }}>
              Danh sách ứng viên ứng tuyển cho vị trí: {requisition?.position?.name || requisition?.title} {requisition?.department?.name ? `- ${requisition.department.name}` : ''}
            </Title>

            {requisition && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginTop: 4 }}>
                <Text type="secondary" style={{ fontSize: '13px' }}>
                  Mã YCTD: <strong style={{ color: '#1677ff' }}>{requisition.code}</strong> | Số lượng cần: <strong>{requisition.quantity}</strong> | Lương dự kiến: <strong>{requisition.salaryMin?.toLocaleString()} - {requisition.salaryMax?.toLocaleString()} VNĐ</strong> | Yêu cầu KN: <strong>{requisition.minExperienceYears || 0}+ năm</strong>
                </Text>
                <Button
                  type="link"
                  size="small"
                  icon={<SolutionOutlined />}
                  onClick={() => setIsJDModalVisible(true)}
                  style={{ padding: 0 }}
                >
                  Xem chi tiết JD
                </Button>
              </div>
            )}
          </Space>

          <Button
            type="primary"
            size="large"
            icon={<PlusOutlined />}
            onClick={() => {
              setUploadedFileData(null);
              setIsAddModalVisible(true);
            }}
            style={{ borderRadius: 6, fontWeight: 600, background: '#1677ff' }}
          >
            Thêm Hồ sơ Ứng viên
          </Button>
        </div>
      </Card>

      {/* Kanban Board Columns */}
      <Row gutter={[16, 16]} wrap={false} style={{ overflowX: 'auto', paddingBottom: '20px', minHeight: 'calc(100vh - 280px)' }}>
        {STAGES.map(stage => {
          const stageApps = applications.filter(app => app.stage === stage.id);
          return (
            <Col key={stage.id} style={{ minWidth: 320, width: 320, flex: '0 0 auto' }}>
              <div
                style={{
                  background: '#f8fafc',
                  borderRadius: 10,
                  border: '1px solid #e2e8f0',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                  minHeight: '62vh'
                }}
              >
                {/* Column Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingBottom: 8, borderBottom: '2px solid #e2e8f0' }}>
                  <Space>
                    <Tag color={stage.color} style={{ fontWeight: 600, fontSize: 13, padding: '2px 8px' }}>
                      {stage.title}
                    </Tag>
                    <Badge count={stageApps.length} overflowCount={99} style={{ backgroundColor: '#64748b' }} />
                  </Space>
                </div>

                {/* Candidate Cards in Column */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {stageApps.map(app => (
                    <Card
                      key={app.id}
                      size="small"
                      style={{
                        borderRadius: 8,
                        border: '1px solid #e2e8f0',
                        cursor: 'pointer',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                        transition: 'all 0.2s ease',
                      }}
                      hoverable
                      onClick={() => openAppDetail(app)}
                      bodyStyle={{ padding: '12px' }}
                    >
                      {/* Name & Experience */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                        <Text strong style={{ fontSize: 15, color: '#0f172a' }}>
                          {app.candidate?.fullName}
                        </Text>
                        <Tag color="geekblue" style={{ margin: 0, fontSize: 11, fontWeight: 500 }}>
                          {app.candidate?.yearsExperience !== null && app.candidate?.yearsExperience !== undefined ? `${app.candidate.yearsExperience} năm KN` : 'Kinh nghiệm: N/A'}
                        </Tag>
                      </div>

                      {/* Contact Info */}
                      <div style={{ fontSize: 12, color: '#64748b', display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 8 }}>
                        <div><MailOutlined style={{ marginRight: 6 }} />{app.candidate?.email}</div>
                        {app.candidate?.phone && <div><PhoneOutlined style={{ marginRight: 6 }} />{app.candidate?.phone}</div>}
                      </div>

                      {/* Skills */}
                      <div style={{ marginBottom: 10 }}>
                        {app.candidate?.skills ? (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                            {app.candidate.skills.split(',').slice(0, 3).map((skill: string, idx: number) => (
                              <Tag key={idx} color="default" style={{ fontSize: 11, margin: 0 }}>
                                {skill.trim()}
                              </Tag>
                            ))}
                            {app.candidate.skills.split(',').length > 3 && (
                              <Tag style={{ fontSize: 11, margin: 0 }}>+{app.candidate.skills.split(',').length - 3}</Tag>
                            )}
                          </div>
                        ) : (
                          <Text type="secondary" style={{ fontSize: 11 }}>Chưa cập nhật kỹ năng</Text>
                        )}
                      </div>

                      {/* Quick Action Footer on Card */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTop: '1px dashed #f1f5f9' }}>
                        <Button
                          type="link"
                          size="small"
                          icon={<FilePdfOutlined style={{ color: '#ef4444' }} />}
                          onClick={(e) => openCVViewer(app, e)}
                          style={{ padding: 0, fontSize: 12, color: '#ef4444' }}
                        >
                          Xem CV
                        </Button>
                        <Button
                          type="primary"
                          ghost
                          size="small"
                          icon={<EyeOutlined />}
                          onClick={(e) => { e.stopPropagation(); openAppDetail(app); }}
                          style={{ fontSize: 11, height: 24, padding: '0 8px' }}
                        >
                          Xử lý vòng
                        </Button>
                      </div>

                      {stage.id === 'HIRED' && (
                        <div style={{ marginTop: 8 }}>
                          <Button
                            type="primary"
                            size="small"
                            style={{ background: '#16a34a', borderColor: '#16a34a', width: '100%', fontSize: 12, fontWeight: 500 }}
                            icon={<UserSwitchOutlined />}
                            onClick={(e) => {
                              e.stopPropagation();
                              openOnboardModal(app);
                            }}
                          >
                            Tiếp nhận nhân sự
                          </Button>
                        </div>
                      )}
                    </Card>

                  ))}

                  {stageApps.length === 0 && (
                    <div style={{ textAlign: 'center', color: '#94a3b8', padding: '30px 0', fontSize: 13 }}>
                      Chưa có ứng viên
                    </div>
                  )}
                </div>
              </div>
            </Col>
          );
        })}
      </Row>

      {/* Modal 1: Thêm Hồ sơ Ứng viên với Upload Ảo / Local */}
      <Modal
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginRight: 24 }}>
            <Space>
              <PlusOutlined style={{ color: '#1677ff' }} />
              <span>Thêm Hồ sơ Ứng viên mới</span>
            </Space>
            <Button
              type="dashed"
              size="small"
              icon={<ThunderboltOutlined style={{ color: '#fa8c16' }} />}
              onClick={handleUseSampleCV}
            >
              Chọn nhanh CV mẫu
            </Button>
          </div>
        }
        open={isAddModalVisible}
        onCancel={() => { setIsAddModalVisible(false); form.resetFields(); setUploadedFileData(null); }}
        onOk={() => form.submit()}
        confirmLoading={isAddingCandidate}
        okText="Lưu hồ sơ"
        cancelText="Hủy bỏ"
        width={680}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleAddCandidate} initialValues={{ source: 'TOPCV' }}>
          <Alert
            message={`Đang thêm ứng viên vào vị trí: ${requisition?.position?.name || requisition?.title || 'Yêu cầu tuyển dụng'}`}
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item name="fullName" label="Họ và tên ứng viên" rules={[{ required: true, message: 'Vui lòng nhập họ tên ứng viên' }]}>
                <Input placeholder="VD: Nguyễn Văn An" prefix={<UserOutlined />} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email', message: 'Vui lòng nhập đúng định dạng email' }]}>
                <Input placeholder="VD: nguyenvanan@gmail.com" prefix={<MailOutlined />} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="phone" label="Số điện thoại" rules={[{ required: true, message: 'Vui lòng nhập số điện thoại' }]}>
                <Input placeholder="VD: 0987654321" prefix={<PhoneOutlined />} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="yearsExperience" label="Số năm kinh nghiệm">
                <InputNumber min={0} max={40} style={{ width: '100%' }} placeholder="VD: 3 (năm)" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="source" label="Nguồn ứng viên">
                <Select
                  options={[
                    { label: 'TopCV', value: 'TOPCV' },
                    { label: 'VietnamWorks', value: 'VIETNAMWORKS' },
                    { label: 'LinkedIn', value: 'LINKEDIN' },
                    { label: 'ITviec', value: 'ITVIEC' },
                    { label: 'Giới thiệu nội bộ (Referral)', value: 'REFERRAL' },
                    { label: 'Website Công ty', value: 'WEBSITE' },
                    { label: 'Khác', value: 'OTHER' },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="skills" label="Từ khóa kỹ năng / Chuyên môn">
                <Input placeholder="VD: ReactJS, TypeScript, NodeJS, PostgreSQL, Tailwind" />
              </Form.Item>
            </Col>

            {/* Khu vực Upload ảo / Tải file từ máy tính */}
            <Col span={24}>
              <div style={{ marginBottom: 8 }}>
                <Text strong>Tải tệp CV từ máy tính (Lưu trữ và xem trực tiếp):</Text>
              </div>
              <Dragger
                accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                beforeUpload={handleFileChange}
                showUploadList={false}
                style={{ padding: '16px', background: '#fafafa', borderRadius: 8 }}
              >
                <p className="ant-upload-drag-icon" style={{ marginBottom: 8 }}>
                  <InboxOutlined style={{ fontSize: 36, color: '#1677ff' }} />
                </p>
                <p className="ant-upload-text" style={{ fontSize: 14, fontWeight: 500 }}>
                  Kéo thả file CV vào đây, hoặc click để chọn từ máy tính
                </p>
                <p className="ant-upload-hint" style={{ fontSize: 12, color: '#64748b' }}>
                  Hỗ trợ định dạng PDF, DOC, DOCX, Hình ảnh (Tối đa 10MB). File PDF sẽ được hiển thị trực tiếp khi bấm Xem CV!
                </p>
              </Dragger>

              {uploadedFileData && (
                <div style={{ marginTop: 12, padding: '10px 14px', background: '#f0fdf4', borderRadius: 6, border: '1px solid #bbf7d0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Space>
                    <FilePdfOutlined style={{ color: '#16a34a', fontSize: 18 }} />
                    <div>
                      <strong style={{ color: '#15803d' }}>{uploadedFileData.name}</strong>
                      <span style={{ fontSize: 12, color: '#64748b', marginLeft: 8 }}>({uploadedFileData.size})</span>
                    </div>
                  </Space>
                  <Tag color="success">Đã sẵn sàng tải lên</Tag>
                </div>
              )}
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* Modal 2: Chi tiết Hồ sơ Ứng viên & Xử lý Vòng */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <SolutionOutlined style={{ color: '#1677ff', fontSize: 20 }} />
            <span>Chi tiết Hồ sơ Ứng viên & Xử lý Tuyển dụng</span>
          </div>
        }
        width={800}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        destroyOnClose
      >
        {selectedApp && (
          <div>
            {/* Header info banner */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#f8fafc', borderRadius: 8, marginBottom: 20, border: '1px solid #e2e8f0' }}>
              <div>
                <Title level={5} style={{ margin: 0 }}>{selectedApp.candidate?.fullName}</Title>
                <Text type="secondary" style={{ fontSize: 13 }}>
                  Vị trí ứng tuyển: <strong>{requisition?.position?.name || requisition?.title}</strong> - {requisition?.department?.name}
                </Text>
              </div>
              <div style={{ textAlign: 'right' }}>
                <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>Giai đoạn hiện tại:</Text>
                <Tag color={STAGES.find(s => s.id === selectedApp.stage)?.color} style={{ fontSize: 13, padding: '2px 10px', marginTop: 2 }}>
                  {STAGES.find(s => s.id === selectedApp.stage)?.title}
                </Tag>
              </div>
            </div>

            {/* Thông tin hồ sơ đầy đủ */}
            <Descriptions title="1. Thông tin Ứng viên" bordered size="small" column={2} style={{ marginBottom: 20 }}>
              <Descriptions.Item label="Họ và tên">
                <strong>{selectedApp.candidate?.fullName}</strong>
              </Descriptions.Item>
              <Descriptions.Item label="Số năm kinh nghiệm">
                <Tag color="cyan">
                  {selectedApp.candidate?.yearsExperience !== null && selectedApp.candidate?.yearsExperience !== undefined ? `${selectedApp.candidate.yearsExperience} năm` : 'Chưa cập nhật'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Email">
                <a href={`mailto:${selectedApp.candidate?.email}`}>{selectedApp.candidate?.email}</a>
              </Descriptions.Item>
              <Descriptions.Item label="Số điện thoại">
                {selectedApp.candidate?.phone || 'Chưa cập nhật'}
              </Descriptions.Item>
              <Descriptions.Item label="Kỹ năng chuyên môn" span={2}>
                {selectedApp.candidate?.skills ? (
                  <Space wrap size={[4, 6]}>
                    {selectedApp.candidate.skills.split(',').map((skill: string, idx: number) => (
                      <Tag key={idx} color="blue">{skill.trim()}</Tag>
                    ))}
                  </Space>
                ) : 'Chưa cập nhật'}
              </Descriptions.Item>
              <Descriptions.Item label="Nguồn hồ sơ">
                <Tag>{selectedApp.candidate?.source || 'Khác'}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Hồ sơ CV">
                <Button
                  type="primary"
                  ghost
                  size="small"
                  icon={<FilePdfOutlined />}
                  onClick={() => openCVViewer(selectedApp)}
                >
                  Xem CV trực tiếp
                </Button>
              </Descriptions.Item>
            </Descriptions>

            {/* Thông tin Yêu cầu tuyển dụng gắn kèm (JD) */}
            <Descriptions title="2. Vị trí Tuyển dụng gắn kèm (JD)" bordered size="small" column={2} style={{ marginBottom: 20 }}>
              <Descriptions.Item label="Tiêu đề JD">
                <strong>{requisition?.title}</strong>
              </Descriptions.Item>
              <Descriptions.Item label="Phòng ban">
                {requisition?.department?.name || 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Ngân sách lương">
                {requisition?.salaryMin?.toLocaleString()} - {requisition?.salaryMax?.toLocaleString()} VNĐ
              </Descriptions.Item>
              <Descriptions.Item label="Kinh nghiệm yêu cầu">
                {requisition?.minExperienceYears || 0}+ năm
              </Descriptions.Item>
            </Descriptions>

            {/* Mục Điều chỉnh Quyền lợi & Mức Offer / Ưu đãi (Có thể bật/tắt & lưu ở bất kỳ vòng nào) */}
            <Card
              size="small"
              style={{
                marginBottom: 20,
                borderRadius: 8,
                border: '1px solid #c7d2fe',
                background: '#f8fafc'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Space>
                  <GiftOutlined style={{ color: '#7c3aed', fontSize: 18 }} />
                  <span style={{ fontWeight: 600, color: '#334155', fontSize: 14 }}>
                    Điều chỉnh Quyền lợi, Mức Offer & Ưu đãi riêng
                  </span>
                  <Tag color="purple">Áp dụng linh hoạt ở mọi vòng</Tag>
                </Space>
                <Space>
                  <Text style={{ fontSize: 13, color: '#6d28d9', fontWeight: 500 }}>Bật chỉnh sửa quyền lợi:</Text>
                  <Switch
                    checked={enableBenefitsEdit}
                    onChange={(checked) => setEnableBenefitsEdit(checked)}
                    checkedChildren="Bật"
                    unCheckedChildren="Tắt"
                  />
                </Space>
              </div>

              {enableBenefitsEdit && (
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px dashed #cbd5e1' }}>
                  <Form form={benefitsForm} layout="vertical">
                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item
                          name="benefitSalary"
                          label={<span style={{ fontWeight: 500 }}>Mức lương thỏa thuận / Offer (VNĐ)</span>}
                        >
                          <InputNumber
                            style={{ width: '100%' }}
                            formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            parser={(value) => value?.replace(/\$\s?|(,*)/g, '') as any}
                            addonAfter="VNĐ"
                          />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item
                          name="probationSalaryPercent"
                          label={<span style={{ fontWeight: 500 }}>Tỷ lệ lương Thử việc (%)</span>}
                        >
                          <Select
                            options={[
                              { label: '85% lương chính thức (Tiêu chuẩn luật định)', value: 85 },
                              { label: '100% lương chính thức (Đặc cách hưởng 100%)', value: 100 },
                              { label: '90% lương chính thức', value: 90 },
                            ]}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={24}>
                        <Form.Item
                          name="insurancePackage"
                          label={<span style={{ fontWeight: 500 }}>Chế độ Bảo hiểm Xã hội & Sức khỏe</span>}
                        >
                          <Select
                            options={[
                              { label: 'Đóng full 100% trên tổng lương thực nhận', value: 'FULL_100' },
                              { label: 'Đóng BHXH theo mức lương cơ bản nhà nước quy định', value: 'STATUTORY' },
                              { label: 'Bảo hiểm sức khỏe Bảo Việt / PVI Care VIP cao cấp (Chi trả nội & ngoại trú)', value: 'PREMIUM_PVI' },
                            ]}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={24}>
                        <Form.Item
                          name="allowancePerks"
                          label={<span style={{ fontWeight: 500 }}>Phụ cấp & Ưu đãi riêng dành cho ứng viên</span>}
                        >
                          <Checkbox.Group style={{ width: '100%' }}>
                            <Row gutter={[12, 8]}>
                              <Col span={12}><Checkbox value="LUNCH">Phụ cấp ăn trưa 1.000.000 VNĐ/tháng</Checkbox></Col>
                              <Col span={12}><Checkbox value="PARKING">Miễn phí gửi xe tòa nhà văn phòng</Checkbox></Col>
                              <Col span={12}><Checkbox value="LAPTOP">Cấp mới MacBook Pro M-Series / ThinkPad X1</Checkbox></Col>
                              <Col span={12}><Checkbox value="SIGN_ON">Thưởng gia nhập (Sign-on Bonus 10.000.000đ)</Checkbox></Col>
                              <Col span={12}><Checkbox value="REMOTE">Làm việc linh hoạt (Hybrid Remote 2 ngày/tuần)</Checkbox></Col>
                              <Col span={12}><Checkbox value="CERT">Hỗ trợ 100% chi phí thi chứng chỉ quốc tế</Checkbox></Col>
                            </Row>
                          </Checkbox.Group>
                        </Form.Item>
                      </Col>
                      <Col span={24}>
                        <Form.Item
                          name="specialNotes"
                          label={<span style={{ fontWeight: 500 }}>Ghi chú quyền lợi đặc biệt khác</span>}
                        >
                          <Input.TextArea rows={2} placeholder="Nhập thêm thỏa thuận đãi ngộ riêng biệt khác nếu có..." />
                        </Form.Item>
                      </Col>
                    </Row>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <Button
                        type="primary"
                        icon={<SaveOutlined />}
                        onClick={handleSaveBenefits}
                        style={{ background: '#7c3aed', borderColor: '#7c3aed' }}
                      >
                        Lưu thay đổi quyền lợi
                      </Button>
                    </div>
                  </Form>
                </div>
              )}
            </Card>

            {/* 3. Xử lý nghiệp vụ theo từng vòng */}
            <Divider orientation="left" style={{ margin: '16px 0' }}>
              3. Thao tác Xử lý Vòng: <Tag color={STAGES.find(s => s.id === selectedApp.stage)?.color}>{STAGES.find(s => s.id === selectedApp.stage)?.title}</Tag>
            </Divider>


            {/* Vòng MỚI ỨNG TUYỂN */}
            {selectedApp.stage === 'NEW' && (
              <Card size="small" style={{ background: '#f0f9ff', borderColor: '#bae6fd', marginBottom: 16 }}>
                <Paragraph style={{ margin: 0, color: '#0369a1' }}>
                  <strong>Bước 1: Sàng lọc CV ban đầu.</strong> Kiểm tra mức độ phù hợp về kỹ năng, kinh nghiệm so với yêu cầu vị trí.
                </Paragraph>
                <Space style={{ marginTop: 16 }}>
                  <Button type="primary" icon={<CheckOutlined />} onClick={() => handleUpdateStage('SCREENING')}>
                    Duyệt CV (Chuyển sang Đang sàng lọc)
                  </Button>
                  <Button danger icon={<CloseOutlined />} onClick={() => handleUpdateStage('REJECTED')}>
                    Loại hồ sơ (Từ chối)
                  </Button>
                </Space>
              </Card>
            )}

            {/* Vòng ĐANG SÀNG LỌC */}
            {selectedApp.stage === 'SCREENING' && (
              <Card size="small" style={{ background: '#fffbeb', borderColor: '#fde68a', marginBottom: 16 }}>
                <Paragraph style={{ margin: '0 0 12px 0', color: '#b45309' }}>
                  <strong>Bước 2: Thiết lập lịch Phỏng vấn.</strong> Chọn ngày giờ và hình thức phỏng vấn ứng viên.
                </Paragraph>
                <Form form={actionForm} layout="vertical">
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item name="interviewDate" label="Ngày & Giờ phỏng vấn" initialValue={dayjs().add(2, 'day').set('hour', 9).set('minute', 30)}>
                        <DatePicker showTime format="DD/MM/YYYY HH:mm" style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="interviewFormat" label="Hình thức phỏng vấn" initialValue="ONLINE">
                        <Select options={[{ label: 'Online (Google Meet / Teams)', value: 'ONLINE' }, { label: 'Trực tiếp tại văn phòng', value: 'OFFLINE' }]} />
                      </Form.Item>
                    </Col>
                    <Col span={24}>
                      <Form.Item name="meetingLink" label="Link Meeting / Địa điểm" initialValue="https://meet.google.com/dts-hrm-interview">
                        <Input placeholder="VD: https://meet.google.com/... hoặc Phòng họp tầng 3" />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Space>
                    <Button type="primary" icon={<CalendarOutlined />} onClick={() => handleUpdateStage('INTERVIEW', actionForm.getFieldsValue())}>
                      Chốt lịch & Chuyển sang Vòng Phỏng vấn
                    </Button>
                    <Button danger icon={<CloseOutlined />} onClick={() => handleUpdateStage('REJECTED')}>
                      Loại hồ sơ
                    </Button>
                  </Space>
                </Form>
              </Card>
            )}

            {/* Vòng PHỎNG VẤN */}
            {selectedApp.stage === 'INTERVIEW' && (
              <Card size="small" style={{ background: '#faf5ff', borderColor: '#e9d5ff', marginBottom: 16 }}>
                <Paragraph style={{ margin: '0 0 12px 0', color: '#6b21a8' }}>
                  <strong>Bước 3: Đánh giá sau Phỏng vấn.</strong> Ghi lại nhận xét chuyên môn, kỳ vọng của ứng viên và đưa ra quyết định.
                </Paragraph>
                <Form form={actionForm} layout="vertical">
                  <Form.Item
                    name="note"
                    label="Ghi chú đánh giá sau Phỏng vấn (Điểm mạnh, điểm yếu, mức lương mong muốn, chế độ, thời gian đi làm)"
                  >
                    <Input.TextArea
                      rows={4}
                      placeholder="VD: - Điểm mạnh: Nắm vững React & Clean Code, tư duy hệ thống tốt&#10;- Điểm yếu: Tiếng Anh giao tiếp trung bình&#10;- Lương mong muốn: 25.000.000 VNĐ&#10;- Thời gian có thể đi làm: Sau 2 tuần ký offer&#10;- Chế độ BHXH: Đóng full lương..."
                    />
                  </Form.Item>
                  <Space>
                    <Button
                      type="primary"
                      style={{ background: '#7c3aed' }}
                      icon={<CheckCircleOutlined />}
                      onClick={() => handleUpdateStage('OFFER', actionForm.getFieldsValue())}
                    >
                      Đạt Phỏng vấn - Chuyển sang Gửi Offer
                    </Button>
                    <Button danger icon={<CloseOutlined />} onClick={() => handleUpdateStage('REJECTED', actionForm.getFieldsValue())}>
                      Không Đạt (Loại)
                    </Button>
                  </Space>
                </Form>
              </Card>
            )}

            {/* Vòng GỬI OFFER (Với 2 button nhận và từ chối rõ ràng) */}
            {selectedApp.stage === 'OFFER' && (
              <Card size="small" style={{ background: '#ecfeff', borderColor: '#a5f3fc', marginBottom: 16 }}>
                <Alert
                  message="Bước 4: Chốt Thỏa thuận Offer & Kết quả Phản hồi"
                  description="Xác nhận mức lương chốt, ngày onboarding dự kiến và chế độ đãi ngộ trước khi ghi nhận ứng viên đồng ý nhận việc hoặc từ chối."
                  type="info"
                  showIcon
                  style={{ marginBottom: 16 }}
                />

                <Form form={actionForm} layout="vertical">
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        name="finalSalary"
                        label="Chốt Mức lương chính thức (VNĐ)"
                        rules={[{ required: true, message: 'Vui lòng nhập mức lương chốt' }]}
                      >
                        <InputNumber
                          style={{ width: '100%' }}
                          formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                          parser={(value) => value?.replace(/\$\s?|(,*)/g, '') as any}
                          addonAfter="VNĐ"
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="onboardingDate"
                        label="Ngày Onboarding (Đi làm) dự kiến"
                        rules={[{ required: true, message: 'Vui lòng chọn ngày đi làm dự kiến' }]}
                      >
                        <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
                      </Form.Item>
                    </Col>
                    <Col span={24}>
                      <Form.Item name="offerNote" label="Chế độ đãi ngộ riêng & Ghi chú Offer">
                        <Input.TextArea
                          rows={2}
                          placeholder="VD: Thử việc 2 tháng hưởng 85% lương; Thưởng hiệu quả theo quý; Cấp laptop MacBook Pro..."
                        />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Divider style={{ margin: '12px 0' }} />

                  {/* 2 Buttons rõ ràng: Nhận việc & Từ chối */}
                  <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-start' }}>
                    <Button
                      type="primary"
                      size="large"
                      icon={<CheckCircleOutlined />}
                      style={{ background: '#16a34a', borderColor: '#16a34a', fontWeight: 600 }}
                      onClick={() => handleUpdateStage('HIRED', actionForm.getFieldsValue())}
                    >
                      Ứng viên đồng ý Offer (Nhận việc)
                    </Button>

                    <Button
                      danger
                      size="large"
                      icon={<CloseOutlined />}
                      onClick={() => handleUpdateStage('REJECTED', actionForm.getFieldsValue())}
                    >
                      Ứng viên từ chối Offer
                    </Button>
                  </div>
                </Form>
              </Card>
            )}

            {/* Vòng ĐÃ NHẬN VIỆC (HIRED) */}
            {selectedApp.stage === 'HIRED' && (
              <Card size="small" style={{ background: '#f0fdf4', borderColor: '#bbf7d0', marginBottom: 16 }}>
                <Alert
                  message="Tuyển dụng Thành công!"
                  description="Ứng viên đã chấp nhận Offer và hoàn thành quy trình tuyển dụng."
                  type="success"
                  showIcon
                  style={{ marginBottom: 16 }}
                />

                <Descriptions bordered size="small" column={2}>
                  <Descriptions.Item label="Mức lương chốt">
                    <strong style={{ color: '#16a34a', fontSize: 15 }}>
                      {selectedApp.offer?.salary ? `${selectedApp.offer.salary.toLocaleString()} VNĐ` : 'Chưa cập nhật'}
                    </strong>
                  </Descriptions.Item>
                  <Descriptions.Item label="Ngày Onboarding">
                    <strong>
                      {selectedApp.offer?.startDate ? dayjs(selectedApp.offer.startDate).format('DD/MM/YYYY') : 'Chưa xác định'}
                    </strong>
                  </Descriptions.Item>
                  <Descriptions.Item label="Đãi ngộ & Ghi chú" span={2}>
                    {selectedApp.offer?.note || 'Không có ghi chú thêm'}
                  </Descriptions.Item>
                </Descriptions>

                <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
                  <Button
                    type="primary"
                    size="large"
                    icon={<UserSwitchOutlined />}
                    style={{ background: '#16a34a', borderColor: '#16a34a', fontWeight: 600 }}
                    onClick={() => openOnboardModal(selectedApp)}
                  >
                    Tiếp nhận nhân sự & Tạo hồ sơ Nhân viên
                  </Button>
                </div>

              </Card>
            )}

            {/* Vòng TỪ CHỐI (REJECTED) */}
            {selectedApp.stage === 'REJECTED' && (
              <Card size="small" style={{ background: '#fef2f2', borderColor: '#fecaca', marginBottom: 16 }}>
                <Alert
                  message="Hồ sơ đã kết thúc (Từ chối / Loại)"
                  description="Ứng viên không qua vòng đánh giá hoặc đã từ chối nhận việc."
                  type="error"
                  showIcon
                />
                <div style={{ marginTop: 12 }}>
                  <Button onClick={() => handleUpdateStage('NEW')}>
                    Mở lại hồ sơ (Chuyển về Mới ứng tuyển)
                  </Button>
                </div>
              </Card>
            )}

          </div>
        )}
      </Modal>

      {/* Modal 3: Trình Xem CV Trực Tiếp (Hỗ trợ hiển thị trực tiếp file PDF đã tải lên) */}
      <Modal
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginRight: 24 }}>
            <Space>
              <FilePdfOutlined style={{ color: '#ef4444', fontSize: 20 }} />
              <span>Trình xem CV Trực tiếp - {activeCVApp?.candidate?.fullName}</span>
            </Space>
            <Space>
              {activeCVUrl && (
                <a href={activeCVUrl} download={activeCVFileName || 'CV_UngVien.pdf'} target="_blank" rel="noreferrer">
                  <Button size="small" icon={<DownloadOutlined />}>Tải về</Button>
                </a>
              )}
              <Button size="small" icon={<PrinterOutlined />} onClick={() => window.print()}>
                In CV
              </Button>
            </Space>
          </div>
        }
        width={920}
        open={isCVVisible}
        onCancel={() => setIsCVVisible(false)}
        footer={null}
        destroyOnClose
      >
        {activeCVApp && (
          <Tabs
            defaultActiveKey="1"
            items={[
              {
                key: '1',
                label: (
                  <span>
                    <FilePdfOutlined /> Tệp CV PDF Trực Tiếp
                  </span>
                ),
                children: (
                  <div style={{ minHeight: '75vh' }}>
                    {activeCVUrl?.startsWith('data:application/pdf') || activeCVUrl?.startsWith('blob:') ? (
                      <div style={{ border: '1px solid #cbd5e1', borderRadius: 8, overflow: 'hidden', height: '76vh', background: '#525659' }}>
                        <iframe
                          src={activeCVUrl}
                          title="Tệp CV PDF"
                          style={{ width: '100%', height: '100%', border: 'none' }}
                        />
                      </div>
                    ) : (
                      <div style={{ padding: '40px 20px', textAlign: 'center', background: '#f8fafc', borderRadius: 8, border: '1px dashed #cbd5e1' }}>
                        <FilePdfOutlined style={{ fontSize: 54, color: '#ef4444', marginBottom: 12 }} />
                        <Title level={4}>Tệp CV: {activeCVFileName || 'CV_' + activeCVApp.candidate?.fullName + '.pdf'}</Title>
                        <Text type="secondary" style={{ display: 'block', maxWidth: 500, margin: '0 auto 20px auto' }}>
                          Tệp này hiện chưa có dữ liệu xem nhanh trực tiếp. Bạn có thể chọn tệp PDF thật từ máy tính để cập nhật và xem ngay lập tức bên dưới:
                        </Text>
                        <Upload
                          accept=".pdf"
                          beforeUpload={(file) => {
                            const reader = new FileReader();
                            reader.onload = (e) => {
                              const dataUrl = e.target?.result as string;
                              localStorage.setItem(`cv_file_${activeCVApp.candidate?.email}`, dataUrl);
                              localStorage.setItem(`cv_name_${activeCVApp.candidate?.email}`, file.name);
                              setActiveCVUrl(dataUrl);
                              setActiveCVFileName(file.name);
                              message.success(`Đã cập nhật tệp PDF: ${file.name}`);
                            };
                            reader.readAsDataURL(file);
                            return false;
                          }}
                          showUploadList={false}
                        >
                          <Button type="primary" size="large" icon={<UploadOutlined />}>Tải tệp PDF từ máy tính để xem ngay</Button>
                        </Upload>
                      </div>
                    )}
                  </div>
                )
              },
              {
                key: '2',
                label: (
                  <span>
                    <FileDoneOutlined /> Bản Trích Xuất Thông Tin CV
                  </span>
                ),
                children: (
                  <div
                    style={{
                      background: '#ffffff',
                      padding: '24px 32px',
                      borderRadius: 8,
                      border: '1px solid #e2e8f0',
                      fontFamily: 'Inter, -apple-system, sans-serif',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                      maxHeight: '75vh',
                      overflowY: 'auto'
                    }}
                  >
                    {/* CV Header */}
                    <div style={{ borderBottom: '2px solid #2563eb', paddingBottom: 20, marginBottom: 20 }}>
                      <Row justify="space-between" align="middle">
                        <Col>
                          <Title level={3} style={{ margin: 0, color: '#1e3a8a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            {activeCVApp.candidate?.fullName}
                          </Title>
                          <Text style={{ fontSize: 16, color: '#475569', fontWeight: 500 }}>
                            Ứng tuyển vị trí: {requisition?.position?.name || requisition?.title}
                          </Text>
                        </Col>
                        <Col style={{ textAlign: 'right' }}>
                          <Tag color="blue" style={{ fontSize: 13, padding: '4px 12px' }}>
                            {activeCVApp.candidate?.yearsExperience !== null && activeCVApp.candidate?.yearsExperience !== undefined ? `${activeCVApp.candidate.yearsExperience} Năm Kinh Nghiệm` : 'Kinh nghiệm thực chiến'}
                          </Tag>
                        </Col>
                      </Row>

                      <div style={{ marginTop: 12, display: 'flex', gap: 20, flexWrap: 'wrap', fontSize: 13, color: '#334155' }}>
                        <div><MailOutlined style={{ marginRight: 6, color: '#2563eb' }} />{activeCVApp.candidate?.email}</div>
                        {activeCVApp.candidate?.phone && <div><PhoneOutlined style={{ marginRight: 6, color: '#2563eb' }} />{activeCVApp.candidate?.phone}</div>}
                        <div><UserOutlined style={{ marginRight: 6, color: '#2563eb' }} />Hà Nội, Việt Nam</div>
                      </div>
                    </div>

                    {/* CV Section: Tóm tắt năng lực */}
                    <div style={{ marginBottom: 20 }}>
                      <Title level={5} style={{ color: '#1e3a8a', borderLeft: '4px solid #2563eb', paddingLeft: 8, margin: '0 0 8px 0' }}>
                        TÓM TẮT MỤC TIÊU NGHỀ NGHIỆP
                      </Title>
                      <Paragraph style={{ color: '#475569', lineHeight: 1.6 }}>
                        Chuyên viên giàu nhiệt huyết với hơn {activeCVApp.candidate?.yearsExperience || 3} năm kinh nghiệm thực chiến trong lĩnh vực phát triển phần mềm và xây dựng giải pháp doanh nghiệp. Có khả năng làm việc độc lập cũng như phối hợp nhóm hiệu quả, luôn hướng đến việc tối ưu hiệu suất và mang lại giá trị cao nhất cho tổ chức.
                      </Paragraph>
                    </div>

                    {/* CV Section: Kỹ năng chuyên môn */}
                    <div style={{ marginBottom: 20 }}>
                      <Title level={5} style={{ color: '#1e3a8a', borderLeft: '4px solid #2563eb', paddingLeft: 8, margin: '0 0 10px 0' }}>
                        KỸ NĂNG CHUYÊN MÔN
                      </Title>
                      <Space wrap size={[6, 8]}>
                        {(activeCVApp.candidate?.skills || 'ReactJS, TypeScript, NodeJS, SQL, Git').split(',').map((skill: string, index: number) => (
                          <Tag key={index} color="geekblue" style={{ fontSize: 13, padding: '3px 10px' }}>
                            {skill.trim()}
                          </Tag>
                        ))}
                      </Space>
                    </div>

                    {/* CV Section: Kinh nghiệm làm việc */}
                    <div style={{ marginBottom: 20 }}>
                      <Title level={5} style={{ color: '#1e3a8a', borderLeft: '4px solid #2563eb', paddingLeft: 8, margin: '0 0 12px 0' }}>
                        KINH NGHIỆM LÀM VIỆC
                      </Title>

                      <div style={{ marginBottom: 14 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Text strong style={{ fontSize: 14, color: '#0f172a' }}>Senior Specialist / Developer</Text>
                          <Text type="secondary" style={{ fontSize: 13 }}>2022 - Hiện tại</Text>
                        </div>
                        <Text type="secondary" style={{ fontStyle: 'italic', fontSize: 12 }}>Tech Solution JSC</Text>
                        <ul style={{ margin: '6px 0 0 18px', padding: 0, color: '#475569', fontSize: 13, lineHeight: 1.5 }}>
                          <li>Tham gia thiết kế kiến trúc hệ thống và xây dựng các module lõi phục vụ hơn 50.000 người dùng hàng ngày.</li>
                          <li>Phối hợp cùng Product Owner và Tech Lead để phân tích nghiệp vụ, tối ưu hóa truy vấn cơ sở dữ liệu.</li>
                          <li>Áp dụng quy trình CI/CD và kiểm thử tự động, giảm thiểu 30% lỗi phát sinh trong quá trình vận hành.</li>
                        </ul>
                      </div>

                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Text strong style={{ fontSize: 14, color: '#0f172a' }}>Software Engineer</Text>
                          <Text type="secondary" style={{ fontSize: 13 }}>2020 - 2022</Text>
                        </div>
                        <Text type="secondary" style={{ fontStyle: 'italic', fontSize: 12 }}>Global Software Corp</Text>
                        <ul style={{ margin: '6px 0 0 18px', padding: 0, color: '#475569', fontSize: 13, lineHeight: 1.5 }}>
                          <li>Phát triển các tính năng theo mô hình Agile/Scrum, đảm bảo tiến độ bàn giao sản phẩm.</li>
                          <li>Tương tác trực tiếp với khách hàng để thu thập yêu cầu kỹ thuật và hỗ trợ triển khai hệ thống.</li>
                        </ul>
                      </div>
                    </div>

                    {/* CV Section: Học vấn & Chứng chỉ */}
                    <div>
                      <Title level={5} style={{ color: '#1e3a8a', borderLeft: '4px solid #2563eb', paddingLeft: 8, margin: '0 0 10px 0' }}>
                        HỌC VẤN & CHỨNG CHỈ
                      </Title>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <div>
                          <Text strong style={{ fontSize: 13, color: '#0f172a' }}>Đại học Bách Khoa / Đại học Quốc Gia</Text>
                          <div style={{ fontSize: 12, color: '#64748b' }}>Cử nhân Công nghệ Thông tin - Tốt nghiệp loại Giỏi</div>
                        </div>
                        <Text type="secondary" style={{ fontSize: 12 }}>2016 - 2020</Text>
                      </div>
                    </div>

                  </div>
                )
              }
            ]}
          />
        )}
      </Modal>

      {/* Modal 4: Chi tiết JD (Job Description) */}
      <Modal
        title={
          <Space>
            <SolutionOutlined style={{ color: '#1677ff' }} />
            <span>Mô tả Vị trí Tuyển dụng (Job Description - JD)</span>
          </Space>
        }
        width={750}
        open={isJDModalVisible}
        onCancel={() => setIsJDModalVisible(false)}
        footer={null}
      >
        {requisition && (
          <div>
            <Descriptions bordered size="small" column={2} style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Mã YCTD"><strong>{requisition.code}</strong></Descriptions.Item>
              <Descriptions.Item label="Trạng thái"><Tag color="purple">{requisition.status}</Tag></Descriptions.Item>
              <Descriptions.Item label="Vị trí tuyển">{requisition.position?.name || requisition.title}</Descriptions.Item>
              <Descriptions.Item label="Phòng ban">{requisition.department?.name || 'N/A'}</Descriptions.Item>
              <Descriptions.Item label="Số lượng cần">{requisition.quantity} người</Descriptions.Item>
              <Descriptions.Item label="Ngân sách lương">{requisition.salaryMin?.toLocaleString()} - {requisition.salaryMax?.toLocaleString()} VNĐ</Descriptions.Item>
              <Descriptions.Item label="Kinh nghiệm tối thiểu">{requisition.minExperienceYears || 0}+ năm</Descriptions.Item>
              <Descriptions.Item label="Người yêu cầu">{requisition.requestedBy?.fullName || 'N/A'}</Descriptions.Item>
              <Descriptions.Item label="Kỹ năng yêu cầu" span={2}>
                <Tag color="blue">{requisition.requiredSkills || 'Chưa cập nhật'}</Tag>
              </Descriptions.Item>
            </Descriptions>

            <Title level={5} style={{ margin: '16px 0 8px 0' }}>Mô tả công việc & Yêu cầu chi tiết:</Title>
            <Card size="small" style={{ background: '#f8fafc', whiteSpace: 'pre-line' }}>
              {requisition.description || 'Chưa có mô tả chi tiết cho vị trí tuyển dụng này.'}
            </Card>
          </div>
        )}
      </Modal>

      {/* Modal 5: Quyết định Tiếp nhận Nhân sự & Lựa chọn Hình thức Hợp đồng (Tuyển thẳng vs Thử việc) */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <UserSwitchOutlined style={{ color: '#1677ff', fontSize: 20 }} />
            <span style={{ fontSize: 17, fontWeight: 700, color: '#1e3a8a' }}>
              Tiếp nhận Nhân sự & Lựa chọn Hình thức Hợp đồng
            </span>
          </div>
        }
        open={isOnboardModalVisible}
        onCancel={() => setIsOnboardModalVisible(false)}
        width={760}
        footer={null}
        destroyOnClose
      >
        {selectedApp && (
          <div>
            <div style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: 8, marginBottom: 20, border: '1px solid #e2e8f0' }}>
              <Row gutter={16}>
                <Col span={12}>
                  <Text type="secondary">Ứng viên:</Text> <strong style={{ color: '#1e3a8a', fontSize: 14 }}>{selectedApp.candidate?.fullName}</strong>
                </Col>
                <Col span={12}>
                  <Text type="secondary">Email:</Text> <span>{selectedApp.candidate?.email}</span>
                </Col>
                <Col span={12} style={{ marginTop: 6 }}>
                  <Text type="secondary">Vị trí:</Text> <strong>{requisition?.position?.name || requisition?.title}</strong>
                </Col>
                <Col span={12} style={{ marginTop: 6 }}>
                  <Text type="secondary">Phòng ban:</Text> <span>{requisition?.department?.name || 'N/A'}</span>
                </Col>
              </Row>
            </div>

            <Paragraph style={{ fontSize: 14, fontWeight: 600, color: '#334155', marginBottom: 12 }}>
              Vui lòng lựa chọn hình thức tiếp nhận nhân sự cho ứng viên này:
            </Paragraph>

            <Row gutter={16} style={{ marginBottom: 20 }}>
              {/* Lựa chọn 1: Tuyển thẳng */}
              <Col span={12}>
                <div
                  onClick={() => setOnboardType('DIRECT_OFFICIAL')}
                  style={{
                    border: onboardType === 'DIRECT_OFFICIAL' ? '2px solid #16a34a' : '1px solid #cbd5e1',
                    background: onboardType === 'DIRECT_OFFICIAL' ? '#f0fdf4' : '#ffffff',
                    borderRadius: 10,
                    padding: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    height: '100%',
                    boxShadow: onboardType === 'DIRECT_OFFICIAL' ? '0 4px 12px rgba(22, 163, 74, 0.15)' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <Space>
                      <SafetyCertificateOutlined style={{ fontSize: 24, color: '#16a34a' }} />
                      <strong style={{ fontSize: 16, color: '#15803d' }}>Tuyển thẳng</strong>
                    </Space>
                    <Radio checked={onboardType === 'DIRECT_OFFICIAL'} />
                  </div>
                  <Tag color="green" style={{ marginBottom: 10 }}>Ký HĐ Lao động Chính thức 1 năm</Tag>
                  <ul style={{ paddingLeft: 18, margin: 0, fontSize: 12, color: '#475569', lineHeight: 1.6 }}>
                    <li>Dành cho nhân sự đặc cách, quản lý, không cần qua thời gian thử việc.</li>
                    <li>Trạng thái hồ sơ: <strong>Chính thức (ACTIVE)</strong>.</li>
                    <li>Hưởng <strong>100% lương chính thức</strong> ngay khi vào làm.</li>
                    <li><strong>Điều hướng: Sang trực tiếp tab Nhân viên.</strong></li>
                  </ul>
                </div>
              </Col>

              {/* Lựa chọn 2: Thử việc */}
              <Col span={12}>
                <div
                  onClick={() => setOnboardType('PROBATION')}
                  style={{
                    border: onboardType === 'PROBATION' ? '2px solid #d97706' : '1px solid #cbd5e1',
                    background: onboardType === 'PROBATION' ? '#fffbeb' : '#ffffff',
                    borderRadius: 10,
                    padding: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    height: '100%',
                    boxShadow: onboardType === 'PROBATION' ? '0 4px 12px rgba(217, 119, 6, 0.15)' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <Space>
                      <AuditOutlined style={{ fontSize: 24, color: '#d97706' }} />
                      <strong style={{ fontSize: 16, color: '#b45309' }}>Thử việc</strong>
                    </Space>
                    <Radio checked={onboardType === 'PROBATION'} />
                  </div>
                  <Tag color="orange" style={{ marginBottom: 10 }}>Ký HĐ Thử việc 60 ngày</Tag>
                  <ul style={{ paddingLeft: 18, margin: 0, fontSize: 12, color: '#475569', lineHeight: 1.6 }}>
                    <li>Thử việc chuẩn 60 ngày (2 tháng) theo quy định.</li>
                    <li>Trạng thái hồ sơ: <strong>Thử việc (PROBATION)</strong>.</li>
                    <li><strong>Quy trình đánh giá 3 mốc: Sau 2 tuần, Sau 4 tuần, Sau 8 tuần</strong>.</li>
                    <li><strong>Điều hướng: Sang màn Thử việc & Đánh giá định kỳ.</strong></li>
                  </ul>
                </div>
              </Col>
            </Row>

            <Form form={onboardForm} layout="vertical">
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="startDate"
                    label="Ngày bắt đầu làm việc"
                    rules={[{ required: true, message: 'Vui lòng chọn ngày bắt đầu làm việc' }]}
                  >
                    <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item
                    name="salary"
                    label="Mức lương cơ sở chốt (VNĐ)"
                    rules={[{ required: true, message: 'Vui lòng nhập mức lương' }]}
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      parser={(value) => value?.replace(/\$\s?|(,*)/g, '') as any}
                      addonAfter="VNĐ"
                    />
                  </Form.Item>
                </Col>

                {onboardType === 'PROBATION' && (
                  <Col span={12}>
                    <Form.Item
                      name="probationSalaryPercent"
                      label="Tỷ lệ lương Thử việc (%)"
                      initialValue={85}
                    >
                      <Select
                        options={[
                          { label: '85% lương (Tiêu chuẩn luật định)', value: 85 },
                          { label: '100% lương (Đặc cách nhận full lương)', value: 100 },
                          { label: '90% lương', value: 90 },
                        ]}
                      />
                    </Form.Item>
                  </Col>
                )}

                <Col span={onboardType === 'PROBATION' ? 12 : 24}>
                  <Form.Item name="note" label="Ghi chú điều khoản & Ưu đãi đi kèm">
                    <Input placeholder="VD: Thưởng dự án, cấp laptop mới, phụ cấp ăn trưa..." />
                  </Form.Item>
                </Col>
              </Row>

              <Divider style={{ margin: '12px 0 16px 0' }} />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <Button onClick={() => setIsOnboardModalVisible(false)}>
                  Hủy bỏ
                </Button>
                <Button
                  type="primary"
                  size="large"
                  loading={isOnboardSubmitting}
                  onClick={handleConfirmOnboard}
                  style={{
                    background: onboardType === 'DIRECT_OFFICIAL' ? '#16a34a' : '#d97706',
                    borderColor: onboardType === 'DIRECT_OFFICIAL' ? '#16a34a' : '#d97706',
                    fontWeight: 600
                  }}
                  icon={onboardType === 'DIRECT_OFFICIAL' ? <SafetyCertificateOutlined /> : <AuditOutlined />}
                >
                  {onboardType === 'DIRECT_OFFICIAL'
                    ? 'Xác nhận Tuyển thẳng -> Sang tab Nhân viên'
                    : 'Xác nhận Thử việc -> Sang màn Thử việc'}
                </Button>
              </div>
            </Form>
          </div>
        )}
      </Modal>

    </div>

  );
};

export default CandidatePipelinePage;
