import React, { useEffect, useState } from 'react';
import { Card, Avatar, Typography, Row, Col, Descriptions, Tag, Button, Tabs, Spin, message, Divider } from 'antd';
import { UserOutlined, MailOutlined, PhoneOutlined, SafetyCertificateOutlined, IdcardOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { useAuthStore } from '../../../lib/auth';
import apiClient from '../../../lib/api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const ProfilePage: React.FC = () => {
  const { user } = useAuthStore();
  const [employee, setEmployee] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchMyProfile = async () => {
      if (!user?.employee?.id) return;
      setLoading(true);
      try {
        const res = await apiClient.get(`/employees/${user.employee.id}`);
        setEmployee(res.data);
      } catch (error) {
        message.error('Không thể tải thông tin cá nhân');
      } finally {
        setLoading(false);
      }
    };
    fetchMyProfile();
  }, [user]);

  if (loading) {
    return <div style={{ textAlign: 'center', marginTop: 100 }}><Spin size="large" /></div>;
  }

  if (!employee) {
    return (
      <div style={{ padding: 24 }}>
        <Card>
          <Title level={4}>Thông tin tài khoản</Title>
          <Descriptions bordered column={1}>
            <Descriptions.Item label="Email đăng nhập">{user?.email}</Descriptions.Item>
            <Descriptions.Item label="Quyền (Role)"><Tag color="blue">{user?.role}</Tag></Descriptions.Item>
          </Descriptions>
          <div style={{ marginTop: 16 }}>
            <Text type="secondary">Tài khoản này chưa được liên kết với một Hồ sơ nhân sự nào trong hệ thống.</Text>
          </div>
        </Card>
      </div>
    );
  }

  const getStatusTag = (status: string) => {
    switch (status) {
      case 'ACTIVE': return <Tag color="success">Nhân viên chính thức</Tag>;
      case 'PROBATION': return <Tag color="warning">Đang thử việc</Tag>;
      case 'ONBOARDING': return <Tag color="processing">Đang tiếp nhận</Tag>;
      case 'RESIGNED': return <Tag color="error">Đã nghỉ việc</Tag>;
      default: return <Tag>{status}</Tag>;
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: 1000, margin: '0 auto' }}>
      <Card style={{ borderRadius: 12, overflow: 'hidden', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <Row gutter={24} align="middle">
          <Col>
            <Avatar 
              size={100} 
              src={employee.avatarUrl} 
              icon={<UserOutlined />} 
              style={{ backgroundColor: '#1677ff', border: '4px solid #f0f5ff' }}
            />
          </Col>
          <Col flex="auto">
            <Title level={3} style={{ margin: 0 }}>{employee.fullName}</Title>
            <div style={{ marginTop: 8, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <Text><IdcardOutlined style={{ marginRight: 6, color: '#8c8c8c' }}/> {employee.employeeCode}</Text>
              <Text><MailOutlined style={{ marginRight: 6, color: '#8c8c8c' }}/> {employee.workEmail}</Text>
              <Text><PhoneOutlined style={{ marginRight: 6, color: '#8c8c8c' }}/> {employee.phone || 'Chưa cập nhật'}</Text>
            </div>
            <div style={{ marginTop: 12 }}>
              {getStatusTag(employee.status)}
              <Tag color="purple">{employee.position?.name || 'Chưa có chức danh'}</Tag>
            </div>
          </Col>
          <Col>
            <Button type="primary">Chỉnh sửa hồ sơ</Button>
          </Col>
        </Row>
      </Card>

      <Card style={{ marginTop: 24, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <Tabs defaultActiveKey="1" size="large">
          <TabPane tab="Thông tin chung" key="1">
            <Descriptions bordered column={2}>
              <Descriptions.Item label="Mã nhân viên" span={1}><b>{employee.employeeCode}</b></Descriptions.Item>
              <Descriptions.Item label="Phòng ban" span={1}>{employee.department?.name || 'N/A'}</Descriptions.Item>
              
              <Descriptions.Item label="Giới tính">{employee.gender === 'MALE' ? 'Nam' : employee.gender === 'FEMALE' ? 'Nữ' : 'Khác'}</Descriptions.Item>
              <Descriptions.Item label="Ngày sinh">{employee.dob ? dayjs(employee.dob).format('DD/MM/YYYY') : 'N/A'}</Descriptions.Item>
              
              <Descriptions.Item label="Số CCCD/CMND" span={2}>{employee.idNumber}</Descriptions.Item>
              
              <Descriptions.Item label="Ngày gia nhập" span={1}>{employee.joinDate ? dayjs(employee.joinDate).format('DD/MM/YYYY') : 'N/A'}</Descriptions.Item>
              <Descriptions.Item label="Trạng thái" span={1}>{getStatusTag(employee.status)}</Descriptions.Item>

              <Descriptions.Item label="Địa chỉ hiện tại" span={2}>
                <EnvironmentOutlined style={{ color: '#8c8c8c', marginRight: 6 }}/>
                {employee.address || 'Chưa cập nhật địa chỉ'}
              </Descriptions.Item>
            </Descriptions>
          </TabPane>
          <TabPane tab="Bảo mật tài khoản" key="2">
            <Descriptions bordered column={1}>
              <Descriptions.Item label="Tên đăng nhập">{user?.email}</Descriptions.Item>
              <Descriptions.Item label="Quyền hạn hệ thống (Role)">
                <Tag color="blue">{user?.role}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái tài khoản">
                <Tag color="success" icon={<SafetyCertificateOutlined />}>Đang hoạt động (Bảo mật an toàn)</Tag>
              </Descriptions.Item>
            </Descriptions>
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default ProfilePage;
