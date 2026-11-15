import React, { useState } from 'react';
import {
  Card,
  Typography,
  Row,
  Col,
  Space,
  Tag,
  Divider,
  Tooltip,
} from 'antd';
import {
  BankOutlined,
  TeamOutlined,
  CodeOutlined,
  RocketOutlined,
  HeartOutlined,
  TrophyOutlined,
  CompassOutlined,
  PhoneOutlined,
  MailOutlined,
  EnvironmentOutlined,
  CrownOutlined,
  ClockCircleOutlined,
  MedicineBoxOutlined,
  RiseOutlined,
  SmileOutlined,
  CoffeeOutlined,
  LaptopOutlined,
  ApartmentOutlined,
  SafetyCertificateOutlined,
  CheckCircleFilled,
} from '@ant-design/icons';
import DiamondLogo from '../../../components/DiamondLogo';

const { Title, Paragraph, Text } = Typography;

// ── DỮ LIỆU CÁC KHỐI SƠ ĐỒ CƠ CẤU ──
interface OrgDivision {
  id: string;
  name: string;
  role: string;
  color: string;
  bgLight: string;
  borderColor: string;
  icon: React.ReactNode;
  summary: string;
  departments: string[];
}

const ORG_DIVISIONS: OrgDivision[] = [
  {
    id: 'tech',
    name: 'Khối Công nghệ & Sản phẩm',
    role: 'Giám đốc Công nghệ (CTO)',
    color: '#0284c7',
    bgLight: '#f0f9ff',
    borderColor: '#bae6fd',
    icon: <CodeOutlined style={{ fontSize: 20, color: '#0284c7' }} />,
    summary: 'Nghiên cứu kiến trúc nền tảng, phát triển phần mềm HRM, AI và hạ tầng Cloud.',
    departments: [
      'Phát triển Phần mềm (Core Dev)',
      'Kiến trúc Cloud & DevOps',
      'Trung tâm Nghiên cứu AI & Dữ liệu',
      'Đảm bảo Chất lượng (QA/QC)',
    ],
  },
  {
    id: 'business',
    name: 'Khối Kinh doanh & Khách hàng',
    role: 'Giám đốc Kinh doanh (CCO)',
    color: '#16a34a',
    bgLight: '#f0fdf4',
    borderColor: '#bbf7d0',
    icon: <RocketOutlined style={{ fontSize: 20, color: '#16a34a' }} />,
    summary: 'Tư vấn giải pháp chuyển đổi số nhân sự, phát triển đối tác và đồng hành cùng khách hàng.',
    departments: [
      'Tư vấn Giải pháp Doanh nghiệp',
      'Phát triển Khách hàng Doanh nghiệp (B2B)',
      'Chăm sóc & Triển khai Khách hàng (CS)',
      'Marketing & Truyền thông Sản phẩm',
    ],
  },
  {
    id: 'hr-ops',
    name: 'Khối Nhân sự & Vận hành',
    role: 'Giám đốc Nhân sự & Vận hành (COO)',
    color: '#ea580c',
    bgLight: '#fff7ed',
    borderColor: '#fed7aa',
    icon: <TeamOutlined style={{ fontSize: 20, color: '#ea580c' }} />,
    summary: 'Thu hút nhân tài, phát triển văn hóa, đảm bảo quyền lợi và môi trường làm việc lý tưởng.',
    departments: [
      'Tuyển dụng & Thu hút Tài năng',
      'Tiền lương & Đãi ngộ (C&B)',
      'Đào tạo & Phát triển Văn hóa',
      'Hành chính & Quản trị Nội bộ',
    ],
  },
  {
    id: 'finance',
    name: 'Khối Tài chính & Kế toán',
    role: 'Giám đốc Tài chính (CFO)',
    color: '#7c3aed',
    bgLight: '#faf5ff',
    borderColor: '#e9d5ff',
    icon: <BankOutlined style={{ fontSize: 20, color: '#7c3aed' }} />,
    summary: 'Quản trị dòng tiền, kiểm toán minh bạch, hoạch định ngân sách và thực thi chế độ thuế.',
    departments: [
      'Kế toán Tổng hợp & Thuế',
      'Kế toán Tiền lương & Chi phí',
      'Hoạch định & Kiểm soát Tài chính',
    ],
  },
];

const AboutCompanyPage: React.FC = () => {
  const [selectedDivision, setSelectedDivision] = useState<string>('tech');

  const activeDiv = ORG_DIVISIONS.find(d => d.id === selectedDivision) || ORG_DIVISIONS[0];

  return (
    <div style={{ padding: '24px', maxWidth: 1400, margin: '0 auto' }}>
      
      {/* ── 1. HERO WELCOME BANNER ────────────────────────────────────────────── */}
      <Card
        style={{
          borderRadius: 16,
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #0369a1 100%)',
          border: 'none',
          boxShadow: '0 8px 24px rgba(15, 23, 42, 0.25)',
          color: '#ffffff',
          marginBottom: 24,
          overflow: 'hidden',
          position: 'relative',
        }}
        bodyStyle={{ padding: '32px 36px' }}
      >
        <Row align="middle" gutter={[24, 24]}>
          <Col xs={24} md={16}>
            <Space size={16} align="center" style={{ marginBottom: 12 }}>
              <DiamondLogo size={52} />
              <div>
                <Tag color="cyan" style={{ fontSize: 11, fontWeight: 600, borderRadius: 4, textTransform: 'uppercase' }}>
                  Cổng Thông Tin Thành Viên
                </Tag>
                <Title level={2} style={{ color: '#ffffff', margin: '4px 0 0', fontWeight: 800, letterSpacing: -0.5 }}>
                  Chào Mừng Bạn Đến Với Công Ty HRM
                </Title>
              </div>
            </Space>
            <Paragraph style={{ color: '#cbd5e1', fontSize: 14, maxWidth: 650, margin: '8px 0 18px', lineHeight: 1.6 }}>
              Ngôi nhà chung của những con người đam mê công nghệ và đổi mới sáng tạo. Cùng nhau, chúng ta xây dựng nền tảng quản trị nhân sự thông minh, tinh gọn và nhân văn hàng đầu Việt Nam.
            </Paragraph>
            <Space wrap size={[12, 10]}>
              <Tag style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', color: '#ffffff', padding: '4px 12px', borderRadius: 20 }}>
                🏢 Thành lập: 2018 (8 năm phát triển)
              </Tag>
              <Tag style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', color: '#ffffff', padding: '4px 12px', borderRadius: 20 }}>
                👥 Quy mô: 500+ nhân sự toàn quốc
              </Tag>
              <Tag style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', color: '#ffffff', padding: '4px 12px', borderRadius: 20 }}>
                📍 3 Trụ sở: Hà Nội • Đà Nẵng • TP.HCM
              </Tag>
            </Space>
          </Col>

          <Col xs={24} md={8} style={{ textAlign: 'center' }}>
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: 14,
                padding: '20px 24px',
                backdropFilter: 'blur(10px)',
              }}
            >
              <TrophyOutlined style={{ fontSize: 32, color: '#facc15', marginBottom: 8 }} />
              <div style={{ fontSize: 13, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>
                Khẩu hiệu hành động
              </div>
              <div style={{ fontSize: 17, color: '#ffffff', fontWeight: 800, marginTop: 4 }}>
                Đoàn Kết — Tiên Phong — Bứt Phá
              </div>
              <div style={{ fontSize: 12, color: '#38bdf8', marginTop: 6 }}>
                "Con người là tài sản quý giá nhất của doanh nghiệp"
              </div>
            </div>
          </Col>
        </Row>
      </Card>

      {/* ── 2. 3 GIÁ TRỊ CỐT LÕI (NGẮN GỌN, ÍT CHỮ) ────────────────────────── */}
      <Row gutter={[16, 16]} style={{ marginBottom: 28 }}>
        <Col xs={24} md={8}>
          <Card
            style={{
              borderRadius: 12,
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              height: '100%',
            }}
            bodyStyle={{ padding: '20px' }}
          >
            <Space align="center" size={12} style={{ marginBottom: 8 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <RocketOutlined style={{ fontSize: 20, color: '#16a34a' }} />
              </div>
              <div>
                <Text strong style={{ fontSize: 15, color: '#166534', display: 'block' }}>Tiên Phong Đổi Mới</Text>
                <Text type="secondary" style={{ fontSize: 11 }}>Innovate Constantly</Text>
              </div>
            </Space>
            <Paragraph style={{ color: '#334155', fontSize: 13, margin: 0, lineHeight: 1.5 }}>
              Dám nghĩ, dám thử nghiệm công nghệ mới (AI, Cloud), không ngừng nâng chuẩn chất lượng để mang lại sản phẩm tốt nhất.
            </Paragraph>
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card
            style={{
              borderRadius: 12,
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              height: '100%',
            }}
            bodyStyle={{ padding: '20px' }}
          >
            <Space align="center" size={12} style={{ marginBottom: 8 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <HeartOutlined style={{ fontSize: 20, color: '#2563eb' }} />
              </div>
              <div>
                <Text strong style={{ fontSize: 15, color: '#1e40af', display: 'block' }}>Đồng Hành Gắn Kết</Text>
                <Text type="secondary" style={{ fontSize: 11 }}>Teamwork & Respect</Text>
              </div>
            </Space>
            <Paragraph style={{ color: '#334155', fontSize: 13, margin: 0, lineHeight: 1.5 }}>
              Tôn trọng sự khác biệt, lắng nghe chân thành, cùng chia sẻ tri thức và hỗ trợ đồng đội hoàn thành mục tiêu chung.
            </Paragraph>
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card
            style={{
              borderRadius: 12,
              background: '#fffbeb',
              border: '1px solid #fde68a',
              height: '100%',
            }}
            bodyStyle={{ padding: '20px' }}
          >
            <Space align="center" size={12} style={{ marginBottom: 8 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <SafetyCertificateOutlined style={{ fontSize: 20, color: '#d97706' }} />
              </div>
              <div>
                <Text strong style={{ fontSize: 15, color: '#92400e', display: 'block' }}>Tận Tâm Trách Nhiệm</Text>
                <Text type="secondary" style={{ fontSize: 11 }}>Integrity & Commitment</Text>
              </div>
            </Space>
            <Paragraph style={{ color: '#334155', fontSize: 13, margin: 0, lineHeight: 1.5 }}>
              Giữ lời hứa, chịu trách nhiệm đến cùng với công việc, coi sự hài lòng và thành công của khách hàng là thước đo giá trị.
            </Paragraph>
          </Card>
        </Col>
      </Row>

      {/* ── 3. SƠ ĐỒ CƠ CẤU TỔ CHỨC CÔNG TY (ORG CHART HÌNH CÂY TRỰC QUAN) ── */}
      <Card
        style={{
          borderRadius: 16,
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
          marginBottom: 28,
        }}
        bodyStyle={{ padding: '28px 24px' }}
        title={
          <Space align="center">
            <ApartmentOutlined style={{ color: '#0284c7', fontSize: 20 }} />
            <div>
              <span style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
                Sơ Đồ Cơ Cấu Tổ Chức Công Ty
              </span>
              <Text type="secondary" style={{ fontSize: 12, display: 'block', fontWeight: 400 }}>
                Mô hình quản trị phẳng — Kết nối trực tiếp giữa Ban Điều Hành và 4 Khối chuyên môn
              </Text>
            </div>
          </Space>
        }
      >
        {/* Sơ đồ dạng Tree Org-Chart */}
        <div style={{ textAlign: 'center', overflowX: 'auto', padding: '10px 0 20px' }}>
          
          {/* LEVEL 1: BAN TỔNG GIÁM ĐỐC (ĐỈNH CÂY) */}
          <div style={{ display: 'inline-block', minWidth: 320 }}>
            <div
              style={{
                background: 'linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%)',
                color: '#ffffff',
                padding: '16px 28px',
                borderRadius: 12,
                boxShadow: '0 6px 18px rgba(30, 58, 138, 0.25)',
                border: '2px solid #3b82f6',
                display: 'inline-block',
              }}
            >
              <CrownOutlined style={{ fontSize: 24, color: '#facc15', marginBottom: 4 }} />
              <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: 0.5 }}>BAN TỔNG GIÁM ĐỐC (CEO)</div>
              <div style={{ fontSize: 12, color: '#93c5fd', marginTop: 2 }}>Ban Điều Hành & Định Hướng Chiến Lược Toàn Diện</div>
            </div>
          </div>

          {/* CỘT NỐI DỌC TỪ CEO */}
          <div style={{ width: 2, height: 26, background: '#94a3b8', margin: '0 auto' }} />

          {/* ĐƯỜNG NỐI NGANG PHÂN NHÁNH 4 KHỐI */}
          <div style={{ position: 'relative', maxWidth: 1050, margin: '0 auto' }}>
            <div style={{ height: 2, background: '#cbd5e1', width: '75%', margin: '0 auto' }} />
            
            {/* 4 Nhánh dọc xuống 4 Khối */}
            <Row gutter={[16, 16]} style={{ marginTop: 0 }} justify="center">
              {ORG_DIVISIONS.map((div) => {
                const isSelected = selectedDivision === div.id;
                return (
                  <Col xs={24} sm={12} lg={6} key={div.id}>
                    {/* Nhánh dọc con */}
                    <div style={{ width: 2, height: 22, background: '#cbd5e1', margin: '0 auto' }} />
                    
                    {/* Card Khối */}
                    <div
                      onClick={() => setSelectedDivision(div.id)}
                      style={{
                        background: isSelected ? div.bgLight : '#ffffff',
                        border: isSelected ? `2px solid ${div.color}` : '1px solid #e2e8f0',
                        borderRadius: 12,
                        padding: '16px 14px',
                        cursor: 'pointer',
                        transition: 'all 0.25s ease',
                        boxShadow: isSelected ? `0 6px 16px ${div.color}25` : '0 2px 6px rgba(0,0,0,0.04)',
                        textAlign: 'left',
                        position: 'relative',
                        height: '100%',
                      }}
                    >
                      <Space align="center" size={10} style={{ marginBottom: 6 }}>
                        <div
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: 8,
                            background: `${div.color}18`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {div.icon}
                        </div>
                        <div>
                          <Text strong style={{ fontSize: 13.5, color: '#0f172a', display: 'block', lineHeight: 1.3 }}>
                            {div.name}
                          </Text>
                          <Text type="secondary" style={{ fontSize: 11, color: div.color, fontWeight: 600 }}>
                            {div.role}
                          </Text>
                        </div>
                      </Space>

                      {/* Danh sách phòng ban con (Tag nhỏ gọn) */}
                      <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 5 }}>
                        {div.departments.map((dept, dIdx) => (
                          <div
                            key={dIdx}
                            style={{
                              fontSize: 11.5,
                              color: isSelected ? '#1e293b' : '#64748b',
                              background: isSelected ? 'rgba(255,255,255,0.85)' : '#f8fafc',
                              padding: '3px 8px',
                              borderRadius: 4,
                              border: '1px solid #f1f5f9',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                            }}
                          >
                            <span style={{ width: 5, height: 5, borderRadius: '50%', background: div.color, flexShrink: 0 }} />
                            <span>{dept}</span>
                          </div>
                        ))}
                      </div>

                      {isSelected && (
                        <div style={{ marginTop: 10, textAlign: 'center' }}>
                          <Tag color={div.color} style={{ fontSize: 10, borderRadius: 10, margin: 0 }}>
                            ● Đang xem chi tiết
                          </Tag>
                        </div>
                      )}
                    </div>
                  </Col>
                );
              })}
            </Row>
          </div>

          {/* Hộp tóm tắt khối được chọn (Ngắn gọn 1-2 câu) */}
          <div
            style={{
              marginTop: 20,
              maxWidth: 900,
              margin: '20px auto 0',
              background: activeDiv.bgLight,
              border: `1px solid ${activeDiv.borderColor}`,
              borderRadius: 10,
              padding: '12px 20px',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <div style={{ fontSize: 20 }}>{activeDiv.icon}</div>
            <div>
              <Text strong style={{ color: activeDiv.color, fontSize: 13 }}>
                {activeDiv.name} ({activeDiv.role}):
              </Text>{' '}
              <Text style={{ color: '#334155', fontSize: 13 }}>{activeDiv.summary}</Text>
            </div>
          </div>
        </div>
      </Card>

      {/* ── 4. CẨM NANG QUYỀN LỢI & VĂN HÓA DÀNH CHO NHÂN VIÊN ───────────────── */}
      <Card
        style={{
          borderRadius: 16,
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
          marginBottom: 28,
        }}
        bodyStyle={{ padding: '24px' }}
        title={
          <Space align="center">
            <SmileOutlined style={{ color: '#16a34a', fontSize: 20 }} />
            <div>
              <span style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
                Quyền Lợi & Chế Độ Phúc Lợi Của Bạn
              </span>
              <Text type="secondary" style={{ fontSize: 12, display: 'block', fontWeight: 400 }}>
                Những chế độ đãi ngộ thiết thực dành riêng cho cán bộ nhân viên công ty
              </Text>
            </div>
          </Space>
        }
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: 12, border: '1px solid #e2e8f0', height: '100%' }}>
              <Space align="center" size={10} style={{ marginBottom: 6 }}>
                <ClockCircleOutlined style={{ fontSize: 18, color: '#0284c7' }} />
                <Text strong style={{ fontSize: 14, color: '#0f172a' }}>Thời Gian Linh Hoạt</Text>
              </Space>
              <Paragraph style={{ color: '#64748b', fontSize: 12.5, margin: 0, lineHeight: 1.5 }}>
                • 8h30 – 17h30 (Thứ 2 đến Thứ 6)<br />
                • Nghỉ trọn vẹn Thứ 7 & Chủ Nhật<br />
                • Chế độ làm việc linh hoạt (Hybrid/Remote khi cần)
              </Paragraph>
            </div>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: 12, border: '1px solid #e2e8f0', height: '100%' }}>
              <Space align="center" size={10} style={{ marginBottom: 6 }}>
                <MedicineBoxOutlined style={{ fontSize: 18, color: '#16a34a' }} />
                <Text strong style={{ fontSize: 14, color: '#0f172a' }}>Chăm Sóc Sức Khỏe</Text>
              </Space>
              <Paragraph style={{ color: '#64748b', fontSize: 12.5, margin: 0, lineHeight: 1.5 }}>
                • 100% đóng BHXH/BHYT đúng luật<br />
                • Gói bảo hiểm sức khỏe cao cấp mở rộng<br />
                • Khám sức khỏe toàn diện định kỳ hàng năm
              </Paragraph>
            </div>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: 12, border: '1px solid #e2e8f0', height: '100%' }}>
              <Space align="center" size={10} style={{ marginBottom: 6 }}>
                <RiseOutlined style={{ fontSize: 18, color: '#ea580c' }} />
                <Text strong style={{ fontSize: 14, color: '#0f172a' }}>Lộ Trình Thăng Tiến</Text>
              </Space>
              <Paragraph style={{ color: '#64748b', fontSize: 12.5, margin: 0, lineHeight: 1.5 }}>
                • Xét duyệt tăng lương 2 lần/năm (T6 & T12)<br />
                • Ngân sách đào tạo chứng chỉ chuyên môn<br />
                • Cơ hội thăng tiến quản lý minh bạch
              </Paragraph>
            </div>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: 12, border: '1px solid #e2e8f0', height: '100%' }}>
              <Space align="center" size={10} style={{ marginBottom: 6 }}>
                <CoffeeOutlined style={{ fontSize: 18, color: '#7c3aed' }} />
                <Text strong style={{ fontSize: 14, color: '#0f172a' }}>Đời Sống & Văn Hóa</Text>
              </Space>
              <Paragraph style={{ color: '#64748b', fontSize: 12.5, margin: 0, lineHeight: 1.5 }}>
                • Du lịch thường niên (Company Trip)<br />
                • Pantry trà, cà phê, đồ ăn nhẹ miễn phí<br />
                • Quà sinh nhật, thưởng các dịp lễ & Tết
              </Paragraph>
            </div>
          </Col>
        </Row>
      </Card>

      {/* ── 5. ĐẦU MỐI HỖ TRỢ NỘI BỘ (AI CẦN HỎI GÌ THÌ LIÊN HỆ ĐÂY) ─────────── */}
      <Card
        style={{
          borderRadius: 16,
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
        }}
        bodyStyle={{ padding: '24px' }}
        title={
          <Space align="center">
            <CompassOutlined style={{ color: '#0284c7', fontSize: 20 }} />
            <div>
              <span style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
                Đầu Mối Hỗ Trợ Nội Bộ & Địa Chỉ Trụ Sở
              </span>
              <Text type="secondary" style={{ fontSize: 12, display: 'block', fontWeight: 400 }}>
                Bạn cần hỗ trợ thủ tục gì? Hãy kết nối với các bộ phận chức năng bên dưới
              </Text>
            </div>
          </Space>
        }
      >
        <Row gutter={[20, 20]}>
          {/* Cột 1: Hotline hỗ trợ các phòng ban */}
          <Col xs={24} md={12}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 12 }}>
              CÁC KÊNH HỖ TRỢ NHÂN SỰ & KỸ THUẬT:
            </div>
            
            <Space direction="vertical" size={10} style={{ width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <Space>
                  <TeamOutlined style={{ color: '#ea580c', fontSize: 16 }} />
                  <div>
                    <Text strong style={{ fontSize: 13 }}>Bộ phận Nhân sự (HR):</Text>
                    <div style={{ fontSize: 11, color: '#64748b' }}>Nghỉ phép, hợp đồng, thẻ nhân viên, bảo hiểm</div>
                  </div>
                </Space>
                <Tag color="orange">hr@hrm.com.vn • Ext: 101</Tag>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <Space>
                  <BankOutlined style={{ color: '#7c3aed', fontSize: 16 }} />
                  <div>
                    <Text strong style={{ fontSize: 13 }}>Bộ phận Kế toán (Payroll):</Text>
                    <div style={{ fontSize: 11, color: '#64748b' }}>Phiếu lương, thuế TNCN, tài khoản chuyển khoản</div>
                  </div>
                </Space>
                <Tag color="purple">ketoan@hrm.com.vn • Ext: 102</Tag>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <Space>
                  <LaptopOutlined style={{ color: '#0284c7', fontSize: 16 }} />
                  <div>
                    <Text strong style={{ fontSize: 13 }}>Hỗ trợ Kỹ thuật & IT Helpdesk:</Text>
                    <div style={{ fontSize: 11, color: '#64748b' }}>Cấp phát laptop, tài khoản email, mạng LAN</div>
                  </div>
                </Space>
                <Tag color="blue">it-support@hrm.com.vn • Ext: 103</Tag>
              </div>
            </Space>
          </Col>

          {/* Cột 2: Mạng lưới 3 văn phòng */}
          <Col xs={24} md={12}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 12 }}>
              ĐỊA CHỈ TRỤ SỞ & CÁC CHI NHÁNH:
            </div>

            <Space direction="vertical" size={10} style={{ width: '100%' }}>
              <div style={{ padding: '10px 14px', background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0' }}>
                <Text strong style={{ color: '#166534', fontSize: 13 }}>📍 Trụ sở chính (Hà Nội):</Text>
                <div style={{ fontSize: 12, color: '#334155', marginTop: 2 }}>
                  Tòa nhà Diamond Tech, Duy Tân, Cầu Giấy, Hà Nội
                </div>
              </div>

              <div style={{ padding: '10px 14px', background: '#eff6ff', borderRadius: 8, border: '1px solid #bfdbfe' }}>
                <Text strong style={{ color: '#1e40af', fontSize: 13 }}>📍 Chi nhánh Đà Nẵng (R&D Center):</Text>
                <div style={{ fontSize: 12, color: '#334155', marginTop: 2 }}>
                  Tòa nhà F-Complex, Khu Đô Thị Nam Hòa Xuân, Hải Châu, Đà Nẵng
                </div>
              </div>

              <div style={{ padding: '10px 14px', background: '#fff7ed', borderRadius: 8, border: '1px solid #fed7aa' }}>
                <Text strong style={{ color: '#9a3412', fontSize: 13 }}>📍 Chi nhánh TP. Hồ Chí Minh:</Text>
                <div style={{ fontSize: 12, color: '#334155', marginTop: 2 }}>
                  Tòa nhà Bitexco Financial, Hải Triều, Bến Nghé, Quận 1, TP.HCM
                </div>
              </div>
            </Space>
          </Col>
        </Row>
      </Card>

    </div>
  );
};

export default AboutCompanyPage;
