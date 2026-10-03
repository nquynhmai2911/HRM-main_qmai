import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Select, DatePicker, Row, Col, Switch, message, Divider } from 'antd';
import dayjs from 'dayjs';
import apiClient from '../../../lib/api';

const { Option } = Select;

interface EmployeeFormModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  employeeData?: any;
}

const EmployeeFormModal: React.FC<EmployeeFormModalProps> = ({ visible, onCancel, onSuccess, employeeData }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  
  const [departments, setDepartments] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);

  const selectedBranchId = Form.useWatch('branchId', form);
  const selectedDepartmentId = Form.useWatch('departmentId', form);

  const filteredDepartments = departments.filter(d => !selectedBranchId || d.branchId === selectedBranchId);
  const filteredPositions = positions.filter(p => !selectedDepartmentId || p.departments?.some((d: any) => d.id === selectedDepartmentId));

  useEffect(() => {
    if (visible) {
      fetchOptions();
      if (employeeData) {
        form.setFieldsValue({
          ...employeeData,
          dob: employeeData.dob ? dayjs(employeeData.dob) : null,
          joinDate: employeeData.joinDate ? dayjs(employeeData.joinDate) : null,
        });
      } else {
        form.resetFields();
      }
    }
  }, [visible, employeeData, form]);

  const fetchOptions = async () => {
    try {
      const [deptRes, posRes, branchRes] = await Promise.all([
        apiClient.get('/organization/departments'),
        apiClient.get('/organization/positions'),
        apiClient.get('/organization/branches')
      ]);
      setDepartments(deptRes.data);
      setPositions(posRes.data);
      setBranches(branchRes.data);
    } catch (err) {
      console.error('Failed to fetch options', err);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const payload = {
        ...values,
        dob: values.dob ? values.dob.toDate() : null,
        joinDate: values.joinDate ? values.joinDate.toDate() : null,
      };

      if (!payload.branchId && branches.length > 0) {
        payload.branchId = branches[0].id;
      }

      if (employeeData && employeeData.id) {
        await apiClient.put(`/employees/${employeeData.id}`, payload);
        message.success('Cập nhật nhân viên thành công');
      } else {
        await apiClient.post('/employees', payload);
        message.success('Thêm nhân viên thành công');
      }
      
      onSuccess();
    } catch (error) {
      console.error('Submit error:', error);
      message.error('Có lỗi xảy ra khi lưu nhân viên');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={employeeData ? "Cập nhật Hồ sơ Nhân viên" : "Thêm mới Nhân viên"}
      open={visible}
      onCancel={onCancel}
      onOk={handleSubmit}
      confirmLoading={loading}
      width={800}
      okText="Lưu lại"
      cancelText="Hủy"
    >
      <Form form={form} layout="vertical">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="fullName" label="Họ và tên" rules={[{ required: true }]}>
              <Input placeholder="Nhập họ và tên" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="workEmail" label="Email công ty" rules={[{ required: true, type: 'email' }]}>
              <Input placeholder="Nhập email công ty" />
            </Form.Item>
          </Col>
          
          <Col span={8}>
            <Form.Item name="phone" label="Số điện thoại">
              <Input placeholder="Nhập số điện thoại" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="idNumber" label="CMND / CCCD" rules={[{ required: true }]}>
              <Input placeholder="Nhập số CCCD" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="gender" label="Giới tính" initialValue="MALE">
              <Select>
                <Option value="MALE">Nam</Option>
                <Option value="FEMALE">Nữ</Option>
                <Option value="OTHER">Khác</Option>
              </Select>
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item name="branchId" label="Chi nhánh" rules={[{ required: true }]}>
              <Select placeholder="Chọn chi nhánh">
                {branches.map(b => (
                  <Option key={b.id} value={b.id}>{b.name}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="departmentId" label="Phòng ban" rules={[{ required: true }]}>
              <Select placeholder="Chọn phòng ban">
                {filteredDepartments.map(d => (
                  <Option key={d.id} value={d.id}>{d.name}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="positionId" label="Chức danh" rules={[{ required: true }]}>
              <Select placeholder="Chọn chức danh">
                {filteredPositions.map(p => (
                  <Option key={p.id} value={p.id}>{p.name}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item name="dob" label="Ngày sinh">
              <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="joinDate" label="Ngày vào làm">
              <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="status" label="Trạng thái" initialValue="ACTIVE">
              <Select>
                <Option value="ACTIVE">Chính thức</Option>
                <Option value="PROBATION">Thử việc</Option>
                <Option value="ONBOARDING">Tiếp nhận</Option>
                <Option value="RESIGNED">Đã nghỉ việc</Option>
              </Select>
            </Form.Item>
          </Col>

          <Col span={24}>
            <Form.Item name="address" label="Địa chỉ">
              <Input.TextArea rows={2} placeholder="Nhập địa chỉ hiện tại" />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Divider orientation="left">Tài khoản truy cập hệ thống</Divider>
          </Col>
          <Col span={12}>
            <Form.Item name="createUser" valuePropName="checked" label="Cấp tài khoản đăng nhập">
              <Switch />
            </Form.Item>
            <div style={{ marginTop: -15, fontSize: 12, color: '#6b7280' }}>
              Tài khoản là Email công ty. Mật khẩu mặc định: <b>Dts@123</b> <br />
              (Bắt buộc đổi mật khẩu ở lần đăng nhập đầu tiên)
            </div>
          </Col>
          <Col span={12}>
            <Form.Item 
              name="role" 
              label="Quyền truy cập (Role)" 
              initialValue="EMPLOYEE"
            >
              <Select>
                <Option value="EMPLOYEE">Nhân viên (Chấm công, Xem bảng công, Xin nghỉ)</Option>
                <Option value="MANAGER">Quản lý (Duyệt đơn, Tuyển dụng)</Option>
                <Option value="HR_STAFF">Nhân sự (Quản lý hồ sơ, Hợp đồng)</Option>
                <Option value="ADMIN">Quản trị viên (Toàn quyền)</Option>
              </Select>
            </Form.Item>
          </Col>

        </Row>
      </Form>
    </Modal>
  );
};

export default EmployeeFormModal;
