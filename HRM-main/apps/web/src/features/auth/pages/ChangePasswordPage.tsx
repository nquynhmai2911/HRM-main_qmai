import React, { useState } from 'react';
import { Card, Form, Input, Button, Typography, Space, message, Alert, Row, Col } from 'antd';
import { LockOutlined, KeyOutlined, SafetyCertificateOutlined, CheckCircleOutlined } from '@ant-design/icons';
import apiClient from '../../../lib/api';
import { useAuthStore } from '../../../lib/auth';

const { Title, Text } = Typography;

const ChangePasswordPage: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const user = useAuthStore(s => s.user);

  const onFinish = async (values: any) => {
    try {
      setLoading(true);
      await apiClient.post('/auth/change-password', {
        oldPassword: values.oldPassword,
        newPassword: values.newPassword,
      });
      message.success('Đổi mật khẩu thành công! Hãy ghi nhớ mật khẩu mới của bạn.');
      form.resetFields();
    } catch (err: any) {
      message.error(err?.response?.data?.message || 'Không thể đổi mật khẩu. Vui lòng kiểm tra lại mật khẩu hiện tại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: 800, margin: '0 auto' }}>
      <Row gutter={24}>
        <Col xs={24} md={14}>
          <Card
            title={
              <Space>
                <KeyOutlined style={{ color: '#1677ff' }} />
                <span style={{ fontWeight: 600 }}>Đổi mật khẩu tài khoản</span>
              </Space>
            }
            style={{ borderRadius: 10, boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}
          >
            <Form
              form={form}
              layout="vertical"
              onFinish={onFinish}
              requiredMark="optional"
            >
              <Form.Item
                label={<Text strong>Mật khẩu hiện tại</Text>}
                name="oldPassword"
                rules={[{ required: true, message: 'Vui lòng nhập mật khẩu hiện tại' }]}
              >
                <Input.Password
                  prefix={<LockOutlined style={{ color: '#bfbfbf' }} />}
                  placeholder="Nhập mật khẩu hiện tại của bạn"
                  size="large"
                />
              </Form.Item>

              <Form.Item
                label={<Text strong>Mật khẩu mới</Text>}
                name="newPassword"
                rules={[
                  { required: true, message: 'Vui lòng nhập mật khẩu mới' },
                  { min: 6, message: 'Mật khẩu mới phải có tối thiểu 6 ký tự' }
                ]}
              >
                <Input.Password
                  prefix={<KeyOutlined style={{ color: '#bfbfbf' }} />}
                  placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                  size="large"
                />
              </Form.Item>

              <Form.Item
                label={<Text strong>Xác nhận mật khẩu mới</Text>}
                name="confirmPassword"
                dependencies={['newPassword']}
                rules={[
                  { required: true, message: 'Vui lòng xác nhận lại mật khẩu mới' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('newPassword') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('Mật khẩu xác nhận không trùng khớp!'));
                    },
                  }),
                ]}
              >
                <Input.Password
                  prefix={<CheckCircleOutlined style={{ color: '#bfbfbf' }} />}
                  placeholder="Nhập lại mật khẩu mới"
                  size="large"
                />
              </Form.Item>

              <Form.Item style={{ marginTop: 24, marginBottom: 8 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  loading={loading}
                  icon={<SafetyCertificateOutlined />}
                  block
                  style={{ height: 44, fontWeight: 600 }}
                >
                  Xác nhận đổi mật khẩu
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        <Col xs={24} md={10}>
          <Card
            title={
              <Space>
                <SafetyCertificateOutlined style={{ color: '#52c41a' }} />
                <span>Quy định bảo mật</span>
              </Space>
            }
            style={{ borderRadius: 10, background: '#f8fafc', borderColor: '#e2e8f0' }}
          >
            <div style={{ lineHeight: 1.8, fontSize: 13, color: '#475569' }}>
              <p>● Tài khoản đang đăng nhập: <strong style={{ color: '#1e3a8a' }}>{user?.email}</strong></p>
              <p>● Mật khẩu mới cần tối thiểu <strong>6 ký tự</strong>.</p>
              <p>● Khuyến nghị kết hợp cả chữ hoa, chữ thường và chữ số để đảm bảo an toàn.</p>
              <p>● Sau khi đổi thành công, hệ thống sẽ tự động ghi nhận vào nhật ký bảo mật (Audit Log).</p>
            </div>
            <Alert
              type="info"
              showIcon
              message="Tài khoản Demo"
              description="Với các tài khoản demo (Admin, Quản lý, HR, Nhân viên), bạn có thể dùng mật khẩu mặc định là 123456."
              style={{ marginTop: 16, borderRadius: 6, fontSize: 12 }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ChangePasswordPage;

