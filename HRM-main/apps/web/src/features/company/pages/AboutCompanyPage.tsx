import React from 'react';
import { Card, Typography, Row, Col, Space, Divider, Tag, List } from 'antd';
import { 
  BankOutlined, 
  CodeOutlined, 
  SafetyCertificateOutlined,
  TeamOutlined,
  DesktopOutlined,
  GlobalOutlined
} from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

const AboutCompanyPage: React.FC = () => {
  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <Row gutter={[24, 24]}>
        {/* Giới thiệu công ty */}
        <Col span={24}>
          <Card 
            style={{ borderRadius: 12, borderTop: '4px solid #1890ff' }}
            title={
              <Space>
                <BankOutlined style={{ fontSize: 24, color: '#1890ff' }} />
                <Title level={3} style={{ margin: 0 }}>Về Chúng Tôi (DTS Tech)</Title>
              </Space>
            }
          >
            <Paragraph style={{ fontSize: 16 }}>
              <strong>Công ty Cổ phần Công nghệ DTS (DTS Tech)</strong> là một trong những đơn vị hàng đầu tại Việt Nam trong lĩnh vực Gia công Phần mềm (Software Outsourcing) và Cung cấp giải pháp Công nghệ số. Với quy mô hơn 500+ nhân sự tài năng trải dài khắp 3 miền (Hà Nội, Đà Nẵng, TP.HCM), chúng tôi cam kết mang lại những sản phẩm chất lượng cao nhất cho khách hàng toàn cầu.
            </Paragraph>
            <Paragraph style={{ fontSize: 16 }}>
              <strong>Sứ mệnh:</strong> Đưa công nghệ Việt Nam vươn tầm thế giới, xây dựng một môi trường làm việc hạnh phúc, lấy con người làm trọng tâm.
            </Paragraph>
          </Card>
        </Col>

        {/* Sản phẩm và Dịch vụ */}
        <Col xs={24} md={12}>
          <Card 
            style={{ borderRadius: 12, height: '100%' }}
            title={
              <Space>
                <CodeOutlined style={{ color: '#52c41a' }} />
                <Title level={4} style={{ margin: 0 }}>Sản Phẩm & Dịch Vụ</Title>
              </Space>
            }
          >
            <List
              itemLayout="horizontal"
              dataSource={[
                {
                  title: 'Phát triển phần mềm theo yêu cầu',
                  desc: 'Web App, Mobile App, hệ thống phân tán chịu tải cao.',
                  icon: <DesktopOutlined style={{ fontSize: 20, color: '#1890ff' }} />
                },
                {
                  title: 'Giải pháp Quản trị Doanh nghiệp',
                  desc: 'Hệ thống ERP, HRIS (DTS-HRM), CRM cho doanh nghiệp vừa và lớn.',
                  icon: <GlobalOutlined style={{ fontSize: 20, color: '#eb2f96' }} />
                },
                {
                  title: 'Dịch vụ Đảm bảo chất lượng (QA)',
                  desc: 'Kiểm thử phần mềm tự động, kiểm thử bảo mật, tối ưu hiệu năng.',
                  icon: <SafetyCertificateOutlined style={{ fontSize: 20, color: '#52c41a' }} />
                }
              ]}
              renderItem={item => (
                <List.Item>
                  <List.Item.Meta
                    avatar={item.icon}
                    title={<Text strong>{item.title}</Text>}
                    description={item.desc}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>

        {/* Sơ đồ Cơ cấu Tổ chức */}
        <Col xs={24} md={12}>
          <Card 
            style={{ borderRadius: 12, height: '100%' }}
            title={
              <Space>
                <TeamOutlined style={{ color: '#fa8c16' }} />
                <Title level={4} style={{ margin: 0 }}>Cơ Cấu Tổ Chức</Title>
              </Space>
            }
          >
            <div style={{ paddingLeft: '16px', borderLeft: '2px solid #e8e8e8' }}>
              <div style={{ marginBottom: 16 }}>
                <Text strong style={{ fontSize: 16 }}>1. Khối Sản xuất / Kỹ thuật (TECH)</Text>
                <ul style={{ marginTop: 8, color: '#666' }}>
                  <li>Phòng Phát triển (DEV)</li>
                  <li>Phòng Kiểm thử (QA)</li>
                  <li>Phòng Quản lý dự án (PMO)</li>
                </ul>
              </div>
              
              <div style={{ marginBottom: 16 }}>
                <Text strong style={{ fontSize: 16 }}>2. Khối Kinh doanh & Marketing (BIZ)</Text>
                <ul style={{ marginTop: 8, color: '#666' }}>
                  <li>Phòng Kinh doanh Quốc tế (SALES-INTL)</li>
                  <li>Phòng Kinh doanh Nội địa (SALES-VN)</li>
                  <li>Phòng Marketing (MKT)</li>
                </ul>
              </div>

              <div>
                <Text strong style={{ fontSize: 16 }}>3. Khối Hỗ trợ (SUPPORT)</Text>
                <ul style={{ marginTop: 8, color: '#666' }}>
                  <li>Phòng Hành chính - Nhân sự (HR)</li>
                  <li>Phòng Tài chính - Kế toán (FIN)</li>
                  <li>Phòng IT Nội bộ (IT-INTERNAL)</li>
                </ul>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AboutCompanyPage;
