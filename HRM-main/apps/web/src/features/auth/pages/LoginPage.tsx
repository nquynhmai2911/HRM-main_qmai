import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, message, Space, Row, Col, Tag } from 'antd';
import { UserOutlined, LockOutlined, ThunderboltOutlined } from '@ant-design/icons';
import apiClient from '../../../lib/api';
import { useAuthStore } from '../../../lib/auth';
import { useNavigate } from 'react-router-dom';
import DiamondLogo from '../../../components/DiamondLogo';

const { Title, Text } = Typography;

const LoginPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const setAuth = useAuthStore((s) => s.setAuth);
  const setMustChangePassword = useAuthStore((s) => s.setMustChangePassword);
  const navigate = useNavigate();

  const handleLogin = async (values: { email: string; password: string }) => {
    setLoading(true);
    try {
      const { data } = await apiClient.post('/auth/login', values);

      if (data.mustChangePassword) {
        setMustChangePassword(true);
        setAuth(data.user, data.accessToken, data.refreshToken);
        navigate('/change-password');
        return;
      }

      setAuth(data.user, data.accessToken, data.refreshToken);
      message.success(`Xin chào, ${data.user.employee?.fullName || data.user.email}!`);
      navigate('/');
    } catch (error: any) {
      if (error.response) {
        const msg = error.response.data?.message;
        const finalMsg = Array.isArray(msg) ? msg[0] : msg || 'Đăng nhập thất bại';
        if (error.response.status === 423) {
          message.error('Tài khoản đã bị khóa tạm thời. Vui lòng thử lại sau.');
        } else if (error.response.status === 401) {
          message.error('Sai email hoặc mật khẩu');
        } else {
          message.error(finalMsg);
        }
      } else {
        message.error('Lỗi kết nối máy chủ, vui lòng thử lại sau.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (email: string) => {
    form.setFieldsValue({
      email,
      password: '123456',
    });
    message.info(`Đã điền tài khoản: ${email} (MK: 123456)`);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0c1a3a 0%, #1a365d 50%, #2a4a7f 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background decoration */}
      <div
        style={{
          position: 'absolute',
          top: '-20%',
          right: '-10%',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-15%',
          left: '-5%',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(147,51,234,0.1) 0%, transparent 70%)',
        }}
      />

      <Card
        style={{
          width: 440,
          borderRadius: 16,
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
          border: '1px solid rgba(255,255,255,0.1)',
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(20px)',
        }}
        bodyStyle={{ padding: '36px 32px' }}
      >
        <Space direction="vertical" size="middle" style={{ width: '100%', textAlign: 'center' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
              <DiamondLogo size={56} />
            </div>
            <Title level={3} style={{ margin: 0, color: '#0f172a', fontWeight: 700, letterSpacing: '-0.3px' }}>
              Công ty HRM
            </Title>
            <Text type="secondary" style={{ fontSize: 14, fontWeight: 500, color: '#64748b' }}>
              Phần mềm quản lý nhân sự
            </Text>
          </div>

          <Form
            form={form}
            name="login"
            onFinish={handleLogin}
            size="large"
            layout="vertical"
            style={{ width: '100%', marginTop: 8 }}
          >
            <Form.Item
              name="email"
              rules={[
                { required: true, message: 'Vui lòng nhập email hoặc mã nhân viên' },
              ]}
            >
              <Input
                prefix={<UserOutlined style={{ color: '#bfbfbf' }} />}
                placeholder="Email công ty hoặc mã nhân viên"
                autoComplete="username"
                style={{ borderRadius: 10, height: 46 }}
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: '#bfbfbf' }} />}
                placeholder="Mật khẩu"
                autoComplete="current-password"
                style={{ borderRadius: 10, height: 46 }}
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: 12 }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                style={{
                  height: 46,
                  borderRadius: 10,
                  fontSize: 16,
                  fontWeight: 600,
                  background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                  border: 'none',
                  boxShadow: '0 4px 15px rgba(59,130,246,0.4)',
                }}
              >
                Đăng nhập
              </Button>
            </Form.Item>

            {/* Quick Demo Accounts Selection */}
            <div style={{ 
              marginTop: 12, 
              padding: '12px', 
              borderRadius: 10, 
              backgroundColor: '#f8fafc', 
              border: '1px solid #e2e8f0',
              textAlign: 'left'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <ThunderboltOutlined style={{ color: '#eab308' }} />
                <Text strong style={{ fontSize: 12, color: '#334155' }}>
                  Tài khoản dùng thử Demo (1-click điền):
                </Text>
              </div>
              <Row gutter={[6, 6]}>
                <Col span={12}>
                  <Button 
                    size="small" 
                    block 
                    onClick={() => fillDemo('admin@gmail.com')}
                    style={{ fontSize: 12, textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                  >
                    <span>👑 Admin</span>
                    <Tag color="red" style={{ margin: 0, fontSize: 10, transform: 'scale(0.85)' }}>Full</Tag>
                  </Button>
                </Col>
                <Col span={12}>
                  <Button 
                    size="small" 
                    block 
                    onClick={() => fillDemo('quanly@gmail.com')}
                    style={{ fontSize: 12, textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                  >
                    <span>🛡️ Quản lý</span>
                    <Tag color="blue" style={{ margin: 0, fontSize: 10, transform: 'scale(0.85)' }}>Duyệt</Tag>
                  </Button>
                </Col>
                <Col span={12}>
                  <Button 
                    size="small" 
                    block 
                    onClick={() => fillDemo('hr@gmail.com')}
                    style={{ fontSize: 12, textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                  >
                    <span>💼 HR - Kế toán</span>
                    <Tag color="purple" style={{ margin: 0, fontSize: 10, transform: 'scale(0.85)' }}>Lương</Tag>
                  </Button>
                </Col>
                <Col span={12}>
                  <Button 
                    size="small" 
                    block 
                    onClick={() => fillDemo('nhanvien@gmail.com')}
                    style={{ fontSize: 12, textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                  >
                    <span>👤 Nhân viên</span>
                    <Tag color="green" style={{ margin: 0, fontSize: 10, transform: 'scale(0.85)' }}>Xem</Tag>
                  </Button>
                </Col>
              </Row>
              <div style={{ marginTop: 6, textAlign: 'center' }}>
                <Text type="secondary" style={{ fontSize: 11 }}>Mật khẩu chung: <Text code>123456</Text></Text>
              </div>
            </div>
          </Form>
        </Space>
      </Card>
    </div>
  );
};

export default LoginPage;
