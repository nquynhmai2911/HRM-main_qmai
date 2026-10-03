import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Select, DatePicker, Row, Col, InputNumber, message, Upload, Button } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import apiClient from '../../../lib/api';

const { Option } = Select;

interface ContractFormModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  contractData?: any;
}

const ContractFormModal: React.FC<ContractFormModalProps> = ({ visible, onCancel, onSuccess, contractData }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  
  const [employees, setEmployees] = useState<any[]>([]);

  useEffect(() => {
    if (visible) {
      fetchEmployees();
      if (contractData) {
        form.setFieldsValue({
          ...contractData,
          startDate: contractData.startDate ? dayjs(contractData.startDate) : null,
          endDate: contractData.endDate ? dayjs(contractData.endDate) : null,
        });
      } else {
        form.resetFields();
      }
    }
  }, [visible, contractData, form]);

  const fetchEmployees = async () => {
    try {
      const res = await apiClient.get('/employees');
      setEmployees(res.data);
    } catch (err) {
      console.error('Failed to fetch employees', err);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const payload = {
        ...values,
        startDate: values.startDate ? values.startDate.toDate() : null,
        endDate: values.endDate ? values.endDate.toDate() : null,
      };

      if (contractData && contractData.id) {
        await apiClient.put(`/contracts/${contractData.id}`, payload);
        message.success('Cập nhật hợp đồng thành công');
      } else {
        await apiClient.post('/contracts', payload);
        message.success('Thêm hợp đồng thành công');
      }
      
      onSuccess();
    } catch (error) {
      console.error('Submit error:', error);
      message.error('Có lỗi xảy ra khi lưu hợp đồng');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={contractData ? "Cập nhật Hợp đồng" : "Thêm mới Hợp đồng"}
      open={visible}
      onCancel={onCancel}
      onOk={handleSubmit}
      confirmLoading={loading}
      width={700}
      okText="Lưu lại"
      cancelText="Hủy"
    >
      <Form form={form} layout="vertical">
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item name="employeeId" label="Nhân viên" rules={[{ required: true }]}>
              <Select
                showSearch
                placeholder="Chọn nhân viên"
                optionFilterProp="children"
                disabled={!!contractData}
              >
                {employees.map(emp => (
                  <Option key={emp.id} value={emp.id}>{emp.employeeCode} - {emp.fullName}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          
          <Col span={12}>
            <Form.Item name="type" label="Loại hợp đồng" rules={[{ required: true }]}>
              <Select placeholder="Chọn loại HĐ">
                <Option value="PROBATION">Thử việc</Option>
                <Option value="DEFINITE_1Y">Xác định thời hạn 1 năm</Option>
                <Option value="DEFINITE_3Y">Xác định thời hạn 3 năm</Option>
                <Option value="INDEFINITE">Vô thời hạn</Option>
                <Option value="FREELANCE">Cộng tác viên</Option>
              </Select>
            </Form.Item>
          </Col>
          
          <Col span={12}>
            <Form.Item name="status" label="Trạng thái" initialValue="ACTIVE">
              <Select>
                <Option value="DRAFT">Nháp</Option>
                <Option value="ACTIVE">Hiệu lực</Option>
                <Option value="COMPLETED">Hoàn thành (Thử việc)</Option>
                <Option value="TERMINATED">Chấm dứt</Option>
                <Option value="EXPIRED">Hết hạn</Option>
              </Select>
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item name="startDate" label="Ngày bắt đầu" rules={[{ required: true }]}>
              <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="endDate" label="Ngày kết thúc">
              <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item name="baseSalary" label="Mức lương cơ bản (VNĐ)" rules={[{ required: true }]}>
              <InputNumber 
                style={{ width: '100%' }}
                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="probationSalaryPercent" label="Tỷ lệ lương (%)" initialValue={100}>
              <InputNumber min={1} max={100} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          
          <Col span={24}>
            <Form.Item name="fileUrl" label="File hợp đồng đính kèm">
              <Upload
                name="file"
                customRequest={({ onSuccess }) => {
                  setTimeout(() => {
                    onSuccess?.("ok");
                  }, 1000);
                }}
                onChange={(info) => {
                  if (info.file.status === 'done') {
                    message.success(`${info.file.name} file uploaded successfully`);
                    form.setFieldsValue({ fileUrl: `https://local-storage/${info.file.name}` });
                  } else if (info.file.status === 'error') {
                    message.error(`${info.file.name} file upload failed.`);
                  }
                }}
              >
                <Button icon={<UploadOutlined />}>Tải lên tài liệu</Button>
              </Upload>
            </Form.Item>
            {contractData?.fileUrl && (
              <div style={{ marginTop: 8 }}>
                <a href={contractData.fileUrl} target="_blank" rel="noopener noreferrer">
                  Xem file hiện tại
                </a>
              </div>
            )}
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};

export default ContractFormModal;
