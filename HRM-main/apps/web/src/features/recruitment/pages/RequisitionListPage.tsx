import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Table, Typography, Space, Button, Tag, Modal, Form, Input, InputNumber, Select, message, Tooltip } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, SendOutlined, SearchOutlined, CheckCircleOutlined, GlobalOutlined, TeamOutlined, UserAddOutlined } from '@ant-design/icons';
import { PermissionGate } from '../../../components/PermissionGate';
import apiClient from '../../../lib/api';
import { useAuthStore } from '../../../lib/auth';

const { Title } = Typography;
const { Option } = Select;

const RequisitionListPage: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [approvalRecord, setApprovalRecord] = useState<any>(null);
  const [form] = Form.useForm();
  const [approvalForm] = Form.useForm();
  const selectedDepartmentId = Form.useWatch('departmentId', form);
  const [searchText, setSearchText] = useState('');
  const { user } = useAuthStore();

  const [departments, setDepartments] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);

  const fetchDependencies = async () => {
    try {
      const [deptRes, posRes] = await Promise.all([
        apiClient.get('/organization/departments'),
        apiClient.get('/organization/positions')
      ]);
      
      const depts = Array.isArray(deptRes.data) ? deptRes.data : (deptRes.data?.data || []);
      const pos = Array.isArray(posRes.data) ? posRes.data : (posRes.data?.data || []);
      
      setDepartments(depts);
      setPositions(pos);
    } catch (error: any) {
      console.error('Lỗi khi tải phòng ban / chức danh', error);
      message.error(`Lỗi tải dữ liệu phòng ban: ${error.message || error}`);
    }
  };

  const fetchRequisitions = async (search = searchText) => {
    setLoading(true);
    try {
      const res = await apiClient.get('/recruitment/requisitions', { params: { search } });
      setData(res.data);
    } catch (error) {
      message.error('Lỗi khi tải danh sách YCTD');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDependencies();
    fetchRequisitions();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await apiClient.post(`/recruitment/requisitions/${id}/delete`);
      message.success('Xóa thành công');
      fetchRequisitions();
    } catch (e: any) {
      message.error('Lỗi khi xóa');
    }
  };

  const handleSubmit = async (id: string) => {
    try {
      await apiClient.post(`/recruitment/requisitions/${id}/submit`);
      message.success('Gửi duyệt thành công');
      fetchRequisitions();
    } catch (e: any) {
      message.error('Lỗi khi gửi duyệt');
    }
  };

  const handleEdit = (record: any) => {
    setEditingId(record.id);
    form.setFieldsValue({
      title: record.title,
      departmentId: record.departmentId,
      positionId: record.positionId,
      quantity: record.quantity,
      reason: record.reason,
      salaryMin: record.salaryMin,
      salaryMax: record.salaryMax,
      description: record.description,
    });
    setIsModalVisible(true);
  };

  const [viewRecord, setViewRecord] = useState<any>(null);

  const handleView = (record: any) => {
    setViewRecord(record);
  };

  const handleOpenApproval = (record: any) => {
    setApprovalRecord(record);
    approvalForm.setFieldsValue({
      salaryMin: record.salaryMin,
      salaryMax: record.salaryMax,
      comment: '',
    });
  };

  const handleProcessApproval = async (action: string) => {
    try {
      const values = await approvalForm.validateFields();
      await apiClient.post(`/recruitment/requisitions/${approvalRecord.id}/approve`, {
        action,
        salaryMin: values.salaryMin,
        salaryMax: values.salaryMax,
        comment: values.comment,
      });
      message.success('Đã xử lý phê duyệt');
      setApprovalRecord(null);
      fetchRequisitions();
    } catch (e: any) {
      if (e.errorFields) return;
      message.error(e.response?.data?.message || 'Lỗi khi xử lý');
    }
  };

  const handleCreateOrUpdate = async (values: any) => {
    try {
      if (editingId) {
        await apiClient.post(`/recruitment/requisitions/${editingId}/update`, values);
        message.success('Cập nhật Yêu cầu thành công');
      } else {
        await apiClient.post('/recruitment/requisitions', values);
        message.success('Tạo Yêu cầu tuyển dụng thành công');
      }
      setIsModalVisible(false);
      setEditingId(null);
      form.resetFields();
      fetchRequisitions();
    } catch (error: any) {
      const msg = error.response?.data?.message;
      if (Array.isArray(msg)) {
        message.error(msg[0]);
      } else {
        message.error(msg || 'Tạo thất bại');
      }
    }
  };

  const handlePublish = async (id: string) => {
    try {
      await apiClient.post(`/recruitment/requisitions/${id}/publish`);
      message.success('Đã chuyển sang trạng thái Đang mở tuyển!');
      fetchRequisitions();
    } catch (error: any) {
      console.error('Lỗi khi đăng tin', error);
      message.error(error.response?.data?.message || 'Lỗi khi đăng tin yêu cầu tuyển dụng');
    }
  };

  const columns = [
    {
      title: 'Mã YCTD',
      dataIndex: 'code',
      key: 'code',
      render: (text: string) => <strong>{text}</strong>,
    },
    {
      title: 'Tiêu đề YCTD',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: any) => (
        <Tooltip title="Bấm để xem danh sách & quy trình ứng viên cho vị trí này">
          <a onClick={() => navigate(`/recruitment/pipeline/${record.id}`)} style={{ fontWeight: 600, color: '#1677ff' }}>
            {text}
          </a>
        </Tooltip>
      ),
    },
    {
      title: 'Phòng ban',
      key: 'department',
      render: (record: any) => record.department?.name || 'N/A',
    },
    {
      title: 'Số lượng',
      dataIndex: 'quantity',
      key: 'quantity',
    },
    {
      title: 'Người yêu cầu',
      key: 'requestedBy',
      render: (record: any) => record.requestedBy?.fullName || 'N/A',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusMap: Record<string, { color: string; text: string }> = {
          DRAFT: { color: 'default', text: 'Bản nháp' },
          PENDING_APPROVAL: { color: 'processing', text: 'Chờ HR duyệt (Cũ)' },
          PENDING_HR_APPROVAL: { color: 'processing', text: 'Chờ HR duyệt' },
          PENDING_CEO_APPROVAL: { color: 'warning', text: 'Chờ CEO duyệt' },
          APPROVED: { color: 'success', text: 'Đã duyệt' },
          NEEDS_REVISION: { color: 'error', text: 'Yêu cầu sửa' },
          OPEN: { color: 'purple', text: 'Đang mở tuyển' },
          REJECTED: { color: 'error', text: 'Từ chối' },
          CLOSED: { color: 'default', text: 'Đã đóng' }
        };
        const config = statusMap[status] || { color: 'default', text: status };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (record: any) => {
        const canApproveHR = (user?.role === 'HR_MANAGER' || user?.role === 'ADMIN') && record.status === 'PENDING_HR_APPROVAL';
        const canApproveCEO = (user?.role === 'CEO' || user?.role === 'ADMIN') && record.status === 'PENDING_CEO_APPROVAL';
        const canApprove = canApproveHR || canApproveCEO;

        return (
          <Space size="small">
            <Button type="text" icon={<EyeOutlined />} title="Xem chi tiết JD" onClick={() => handleView(record)} />
            {(record.status === 'DRAFT' || record.status === 'NEEDS_REVISION') && (
              <>
                <Button type="text" icon={<EditOutlined />} style={{ color: '#1677ff' }} title="Sửa" onClick={() => handleEdit(record)} />
                <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)} title="Xóa" />
                <Button type="text" icon={<SendOutlined />} style={{ color: '#52c41a' }} onClick={() => handleSubmit(record.id)} title={record.status === 'NEEDS_REVISION' ? "Gửi duyệt lại" : "Gửi duyệt"} />
              </>
            )}
            {canApprove && (
              <Button type="text" icon={<CheckCircleOutlined />} style={{ color: '#fa8c16' }} onClick={() => handleOpenApproval(record)} title="Phê duyệt" />
            )}
            {record.status === 'APPROVED' && (
              <Button type="text" icon={<GlobalOutlined />} style={{ color: '#722ed1' }} onClick={() => handlePublish(record.id)} title="Đăng tin (Mở tuyển)" />
            )}
            {(record.status === 'APPROVED' || record.status === 'OPEN') && (
              <Button 
                type="text" 
                size="small"
                style={{ color: '#1677ff' }}
                icon={<UserAddOutlined />} 
                onClick={() => navigate(`/recruitment/pipeline/${record.id}`)} 
                title="Danh sách ứng viên (Pipeline)"
              />
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Title level={4} style={{ margin: 0 }}>Yêu cầu Tuyển dụng</Title>
            <Typography.Text type="secondary">
              Quản lý các nhu cầu nhân sự từ các phòng ban
            </Typography.Text>
          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
            <Input 
              placeholder="Tìm kiếm theo mã, tiêu đề..." 
              prefix={<SearchOutlined />} 
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onPressEnter={() => fetchRequisitions()}
              style={{ width: 250 }}
            />
            <PermissionGate resource="requisition" action="create">
              <Button type="primary" icon={<PlusOutlined />} onClick={() => {
                setEditingId(null);
                form.resetFields();
                setIsModalVisible(true);
              }}>
                Tạo Yêu cầu mới
              </Button>
            </PermissionGate>
          </div>
        </div>

        <Card bordered={false} style={{ borderRadius: 12 }}>
          <Table
            dataSource={data}
            columns={columns}
            rowKey="id"
            loading={loading}
          />
        </Card>
      </Space>

      <Modal
        title={editingId ? "Cập nhật Yêu cầu tuyển dụng" : "Tạo Yêu cầu tuyển dụng mới"}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          setEditingId(null);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        width={700}
        okText={editingId ? "Lưu thay đổi" : "Tạo yêu cầu"}
        cancelText="Hủy"
      >
        <Form 
          form={form} 
          layout="vertical" 
          onFinish={handleCreateOrUpdate}
          onFinishFailed={(errorInfo) => {
            console.log('Validation Failed:', errorInfo);
            message.warning('Vui lòng điền đầy đủ các trường bắt buộc');
          }}
        >
          <Form.Item name="title" label="Tiêu đề yêu cầu" rules={[{ required: true, message: 'Vui lòng nhập tiêu đề' }]}>
            <Input placeholder="VD: Tuyển gấp 2 Senior Frontend Developer" />
          </Form.Item>

          <div style={{ display: 'flex', gap: '16px' }}>
            <Form.Item name="departmentId" label="Phòng ban" style={{ flex: 1 }} rules={[{ required: true }]}>
              <Select 
                placeholder="Chọn phòng ban" 
                options={departments.map(d => ({ label: d.name, value: d.id }))} 
              />
            </Form.Item>
            <Form.Item name="positionId" label="Chức danh" style={{ flex: 1 }} rules={[{ required: true }]}>
              <Select 
                placeholder="Chọn chức danh" 
                disabled={!selectedDepartmentId}
                options={positions
                  .filter(p => !selectedDepartmentId || p.departments?.some((d: any) => d.id === selectedDepartmentId))
                  .map(p => ({ label: p.name, value: p.id }))}
              />
            </Form.Item>
          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
            <Form.Item name="quantity" label="Số lượng" style={{ flex: 1 }} rules={[{ required: true }]}>
              <InputNumber min={1} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="reason" label="Lý do tuyển dụng" style={{ flex: 1 }} rules={[{ required: true }]}>
              <Select placeholder="Chọn lý do">
                <Option value="NEW_PROJECT">Dự án mới</Option>
                <Option value="REPLACEMENT">Thay thế nhân sự nghỉ việc</Option>
                <Option value="EXPANSION">Mở rộng quy mô</Option>
              </Select>
            </Form.Item>
          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
            <Form.Item name="salaryMin" label="Mức lương dự kiến (Từ)" style={{ flex: 1 }}>
              <InputNumber style={{ width: '100%' }} formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
            </Form.Item>
            <Form.Item name="salaryMax" label="Mức lương dự kiến (Đến)" style={{ flex: 1 }}>
              <InputNumber style={{ width: '100%' }} formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
            </Form.Item>
          </div>

          <Form.Item name="description" label="Mô tả công việc (Tóm tắt)">
            <Input.TextArea rows={4} placeholder="Nhập mô tả yêu cầu công việc..." />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`Chi tiết YCTD: ${viewRecord?.code}`}
        open={!!viewRecord}
        onCancel={() => setViewRecord(null)}
        footer={[
          <Button key="close" onClick={() => setViewRecord(null)}>Đóng</Button>
        ]}
        width={600}
      >
        {viewRecord && (
          <Form layout="vertical" disabled initialValues={viewRecord} style={{ marginTop: 16 }}>
            <Form.Item name="title" label="Tiêu đề yêu cầu">
              <Input />
            </Form.Item>
            <div style={{ display: 'flex', gap: '16px' }}>
              <Form.Item name="departmentId" label="Phòng ban" style={{ flex: 1 }}>
                <Select options={departments.map(d => ({ label: d.name, value: d.id }))} />
              </Form.Item>
              <Form.Item name="positionId" label="Chức danh" style={{ flex: 1 }}>
                <Select options={positions.map(p => ({ label: p.name, value: p.id }))} />
              </Form.Item>
            </div>
            <div style={{ display: 'flex', gap: '16px' }}>
              <Form.Item name="quantity" label="Số lượng" style={{ flex: 1 }}>
                <InputNumber style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name="reason" label="Lý do tuyển dụng" style={{ flex: 1 }}>
                <Select>
                  <Option value="NEW_PROJECT">Dự án mới</Option>
                  <Option value="REPLACEMENT">Thay thế nhân sự nghỉ việc</Option>
                  <Option value="EXPANSION">Mở rộng quy mô</Option>
                </Select>
              </Form.Item>
            </div>
            <div style={{ display: 'flex', gap: '16px' }}>
              <Form.Item name="salaryMin" label="Mức lương dự kiến (Từ)" style={{ flex: 1 }}>
                <InputNumber style={{ width: '100%' }} formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
              </Form.Item>
              <Form.Item name="salaryMax" label="Mức lương dự kiến (Đến)" style={{ flex: 1 }}>
                <InputNumber style={{ width: '100%' }} formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
              </Form.Item>
            </div>
            <Form.Item name="description" label="Mô tả công việc (Tóm tắt)">
              <Input.TextArea rows={4} />
            </Form.Item>
            {viewRecord.approvalComment && (
              <Form.Item name="approvalComment" label="Ghi chú phê duyệt">
                <Input.TextArea rows={3} />
              </Form.Item>
            )}
          </Form>
        )}
      </Modal>

      <Modal
        title={`Phê duyệt YCTD: ${approvalRecord?.code}`}
        open={!!approvalRecord}
        onCancel={() => setApprovalRecord(null)}
        footer={[
          <Button key="reject" danger onClick={() => handleProcessApproval('REJECT')}>Từ chối</Button>,
          <Button key="revise" onClick={() => handleProcessApproval('REVISE')}>Yêu cầu sửa lại</Button>,
          <Button key="approve" type="primary" onClick={() => handleProcessApproval('APPROVE')}>Duyệt</Button>,
        ]}
        width={600}
      >
        <Form form={approvalForm} layout="vertical">
          <div style={{ display: 'flex', gap: '16px' }}>
            <Form.Item name="salaryMin" label="Chốt lương dự kiến (Từ)" style={{ flex: 1 }}>
              <InputNumber style={{ width: '100%' }} formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
            </Form.Item>
            <Form.Item name="salaryMax" label="Chốt lương dự kiến (Đến)" style={{ flex: 1 }}>
              <InputNumber style={{ width: '100%' }} formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
            </Form.Item>
          </div>
          <Form.Item name="comment" label="Ghi chú / Comment" rules={[{ required: true, message: 'Vui lòng nhập ghi chú' }]}>
            <Input.TextArea rows={4} placeholder="Nhập ghi chú hoặc yêu cầu sửa đổi..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default RequisitionListPage;
