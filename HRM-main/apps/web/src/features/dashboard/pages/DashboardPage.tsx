import React from 'react';
import { Card, Col, Row, Statistic, Typography, Space, Tag } from 'antd';
import {
  TeamOutlined,
  UserAddOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../../../lib/auth';

const { Title, Text } = Typography;

const DashboardPage: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const role = user?.role;

  // Mock data – will be replaced with API calls
  const stats = {
    totalEmployees: 523,
    newThisMonth: 12,
    resignedThisMonth: 3,
    openRequisitions: 8,
    pendingLeaves: 15,
    pendingOT: 7,
    contractsExpiring: 4,
    probationEnding: 2,
  };

  return (
    <div style={{ padding: '0' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Welcome header */}
        <div
          style={{
            padding: '24px 28px',
            borderRadius: 12,
            background: 'linear-gradient(135deg, #1a365d 0%, #2a4a7f 100%)',
            color: '#fff',
          }}
        >
          <Title level={4} style={{ color: '#fff', margin: 0 }}>
            Xin chào, {user?.employee?.fullName || user?.email}! 👋
          </Title>
          <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 14 }}>
            {new Date().toLocaleDateString('vi-VN', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </div>

        {/* Stats cards */}
        {(role === 'CEO' || role === 'HR_MANAGER' || role === 'HR_STAFF' || role === 'ADMIN') && (
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} lg={6}>
              <Card
                style={{ borderRadius: 12, border: '1px solid #f0f0f0' }}
                bodyStyle={{ padding: '20px' }}
              >
                <Statistic
                  title="Tổng nhân sự"
                  value={stats.totalEmployees}
                  prefix={<TeamOutlined style={{ color: '#3b82f6' }} />}
                  valueStyle={{ color: '#1a1a2e', fontWeight: 700 }}
                />
                <div style={{ marginTop: 8 }}>
                  <Tag color="green" icon={<ArrowUpOutlined />}>
                    +{stats.newThisMonth} tháng này
                  </Tag>
                  <Tag color="red" icon={<ArrowDownOutlined />}>
                    -{stats.resignedThisMonth} nghỉ việc
                  </Tag>
                </div>
              </Card>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <Card
                style={{ borderRadius: 12, border: '1px solid #f0f0f0' }}
                bodyStyle={{ padding: '20px' }}
              >
                <Statistic
                  title="Yêu cầu tuyển dụng"
                  value={stats.openRequisitions}
                  prefix={<UserAddOutlined style={{ color: '#8b5cf6' }} />}
                  valueStyle={{ color: '#1a1a2e', fontWeight: 700 }}
                  suffix="đang mở"
                />
              </Card>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <Card
                style={{ borderRadius: 12, border: '1px solid #f0f0f0' }}
                bodyStyle={{ padding: '20px' }}
              >
                <Statistic
                  title="Đơn chờ duyệt"
                  value={stats.pendingLeaves + stats.pendingOT}
                  prefix={<ClockCircleOutlined style={{ color: '#f59e0b' }} />}
                  valueStyle={{ color: '#1a1a2e', fontWeight: 700 }}
                />
                <div style={{ marginTop: 8 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {stats.pendingLeaves} nghỉ phép · {stats.pendingOT} OT
                  </Text>
                </div>
              </Card>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <Card
                style={{ borderRadius: 12, border: '1px solid #f0f0f0' }}
                bodyStyle={{ padding: '20px' }}
              >
                <Statistic
                  title="Cảnh báo"
                  value={stats.contractsExpiring + stats.probationEnding}
                  prefix={<ExclamationCircleOutlined style={{ color: '#ef4444' }} />}
                  valueStyle={{ color: '#ef4444', fontWeight: 700 }}
                />
                <div style={{ marginTop: 8 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {stats.contractsExpiring} HĐ sắp hết · {stats.probationEnding} thử việc
                  </Text>
                </div>
              </Card>
            </Col>
          </Row>
        )}

        {/* Employee self-service dashboard */}
        {role === 'EMPLOYEE' && (
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} lg={8}>
              <Card style={{ borderRadius: 12 }} bodyStyle={{ padding: '20px' }}>
                <Statistic
                  title="Ngày công tháng này"
                  value={18}
                  suffix="/ 22"
                  prefix={<CheckCircleOutlined style={{ color: '#22c55e' }} />}
                  valueStyle={{ fontWeight: 700 }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={8}>
              <Card style={{ borderRadius: 12 }} bodyStyle={{ padding: '20px' }}>
                <Statistic
                  title="Số dư phép năm"
                  value={8.5}
                  suffix="ngày"
                  prefix={<ClockCircleOutlined style={{ color: '#3b82f6' }} />}
                  valueStyle={{ fontWeight: 700 }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={8}>
              <Card style={{ borderRadius: 12 }} bodyStyle={{ padding: '20px' }}>
                <Statistic
                  title="Đơn của tôi"
                  value={2}
                  suffix="chờ duyệt"
                  prefix={<FileTextOutlined style={{ color: '#f59e0b' }} />}
                  valueStyle={{ fontWeight: 700 }}
                />
              </Card>
            </Col>
          </Row>
        )}

        {/* Manager team dashboard */}
        {role === 'MANAGER' && (
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} lg={6}>
              <Card style={{ borderRadius: 12 }} bodyStyle={{ padding: '20px' }}>
                <Statistic
                  title="Nhân viên team"
                  value={15}
                  prefix={<TeamOutlined style={{ color: '#3b82f6' }} />}
                  valueStyle={{ fontWeight: 700 }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card style={{ borderRadius: 12 }} bodyStyle={{ padding: '20px' }}>
                <Statistic
                  title="Đơn chờ duyệt"
                  value={5}
                  prefix={<ClockCircleOutlined style={{ color: '#f59e0b' }} />}
                  valueStyle={{ fontWeight: 700 }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card style={{ borderRadius: 12 }} bodyStyle={{ padding: '20px' }}>
                <Statistic
                  title="Chuyên cần hôm nay"
                  value={13}
                  suffix="/ 15"
                  prefix={<CheckCircleOutlined style={{ color: '#22c55e' }} />}
                  valueStyle={{ fontWeight: 700 }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card style={{ borderRadius: 12 }} bodyStyle={{ padding: '20px' }}>
                <Statistic
                  title="Thử việc sắp hết"
                  value={1}
                  prefix={<ExclamationCircleOutlined style={{ color: '#ef4444' }} />}
                  valueStyle={{ fontWeight: 700 }}
                />
              </Card>
            </Col>
          </Row>
        )}
      </Space>
    </div>
  );
};

export default DashboardPage;
