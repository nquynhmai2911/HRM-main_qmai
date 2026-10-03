import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, message, Space } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import apiClient from '../../../lib/api';
import { useAuthStore } from '../../../lib/auth';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

const LoginPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
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
          width: 420,
          borderRadius: 16,
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
          border: '1px solid rgba(255,255,255,0.1)',
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(20px)',
        }}
        bodyStyle={{ padding: '40px 36px' }}
      >
        <Space direction="vertical" size="middle" style={{ width: '100%', textAlign: 'center' }}>
          <div>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 16,
                background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                boxShadow: '0 8px 25px rgba(59,130,246,0.3)',
              }}
            >
              <UserOutlined style={{ fontSize: 28, color: '#fff' }} />
            </div>
            <Title level={3} style={{ margin: 0, color: '#1a1a2e' }}>
              DTS-HRM
            </Title>
            <Text type="secondary" style={{ fontSize: 14 }}>
              Hệ thống Quản lý Nhân sự
            </Text>
          </div>

          <Form
            name="login"
            onFinish={handleLogin}
            size="large"
            layout="vertical"
            style={{ width: '100%', marginTop: 8 }}
          >
            <Form.Item
              name="email"
              rules={[
                { required: true, message: 'Vui lòng nhập email' },
                { type: 'email', message: 'Email không hợp lệ' },
              ]}
            >
              <Input
                prefix={<UserOutlined style={{ color: '#bfbfbf' }} />}
                placeholder="Email công ty"
                autoComplete="email"
                style={{ borderRadius: 10, height: 48 }}
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
                style={{ borderRadius: 10, height: 48 }}
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: 8 }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                style={{
                  height: 48,
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

            <Text type="secondary" style={{ fontSize: 12 }}>
              Liên hệ Admin nếu quên mật khẩu
            </Text>
          </Form>
        </Space>
      </Card>
    </div>
  );
};

export default LoginPage;
