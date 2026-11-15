import React, { useEffect, useState, useMemo } from 'react';
import { Card, Table, Typography, Space, Button, Modal, Form, Input, Select, message, Row, Col, Alert, Spin } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import apiClient from '../../../lib/api';
import { useAuthStore } from '../../../lib/auth';

const { Title, Text } = Typography;
const { Option } = Select;

const DepartmentListPage: React.FC = () => {
  const { user } = useAuthStore();
  const canManage = user?.role === 'ADMIN' || user?.role === 'HR_MANAGER';

  const [data, setData] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form] = Form.useForm();

  // Cascade delete states
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deletingDept, setDeletingDept] = useState<any>(null);
  const [deletionImpact, setDeletionImpact] = useState<any>(null);
  const [impactLoading, setImpactLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [searchCode, setSearchCode] = useState('');
  const [searchBranch, setSearchBranch] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [depRes, branchRes] = await Promise.all([
        apiClient.get('/organization/departments'),
        apiClient.get('/organization/branches')
      ]);
      setBranches(branchRes.data);
      
      let filtered = depRes.data;
      if (searchCode) {
        filtered = filtered.filter((d: any) => 
          d.code.toLowerCase().includes(searchCode.toLowerCase()) || 
          d.name.toLowerCase().includes(searchCode.toLowerCase())
        );
      }
      if (searchBranch) {
        filtered = filtered.filter((d: any) => d.branchId === searchBranch);
      }
      setData(filtered);
    } catch (error) {
      message.error('Lỗi khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [searchCode, searchBranch]);

  const handleEdit = (record: any) => {
    setEditingId(record.id);
    form.setFieldsValue(record);
    setIsModalVisible(true);
  };

  const promptDelete = async (record: any) => {
    setDeletingDept(record);
    setDeleteModalVisible(true);
    setImpactLoading(true);
    try {
      const res = await apiClient.get(`/organization/departments/${record.id}/deletion-impact`);
      setDeletionImpact(res.data);
    } catch {
      setDeletionImpact({
        department: record,
        employeeCount: record._count?.employees || 0,
        childrenCount: 0,
        employees: [],
      });
    } finally {
      setImpactLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingDept) return;
    try {
      setDeleteLoading(true);
      await apiClient.delete(`/organization/departments/${deletingDept.id}?cascade=true`);
      message.success(`Đã xóa phòng ban "${deletingDept.name}" thành công!`);
      setDeleteModalVisible(false);
      setDeletingDept(null);
      setDeletionImpact(null);
      fetchData();
    } catch (error: any) {
      message.error(error?.response?.data?.message || 'Lỗi khi xóa phòng ban');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingId) {
        await apiClient.put(`/organization/departments/${editingId}`, values);
        message.success('Cập nhật phòng ban thành công');
      } else {
        await apiClient.post('/organization/departments', values);
        message.success('Thêm phòng ban thành công');
      }
      setIsModalVisible(false);
      setEditingId(null);
      form.resetFields();
      fetchData();
    } catch (error) {
      message.error('Lỗi lưu dữ liệu');
    }
  };

  const columns = useMemo(() => {
    const baseCols: any[] = [
      { title: 'Mã PB', dataIndex: 'code', key: 'code', render: (t: string) => <strong>{t}</strong> },
      { title: 'Tên phòng ban', dataIndex: 'name', key: 'name' },
      { title: 'Phòng ban cha', key: 'parent', render: (record: any) => record.parent?.name || '-' },
      { title: 'Trực thuộc chi nhánh', key: 'branch', render: (record: any) => record.branch?.name || 'N/A' },
      { title: 'Số lượng nhân sự', key: 'employeeCount', render: (record: any) => record._count?.employees || 0 },
    ];

    if (canManage) {
      baseCols.push({
        title: 'Hành động',
        key: 'action',
        render: (record: any) => (
          <Space size="small">
            <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
            <Button type="text" danger icon={<DeleteOutlined />} onClick={() => promptDelete(record)} />
          </Space>
        ),
      });
    }

    return baseCols;
  }, [canManage]);

  return (
    <div style={{ padding: '24px' }}>
      <Card style={{ borderRadius: 8, marginBottom: 24 }}>
        <Row gutter={16}>
          <Col span={8}>
            <Input 
              placeholder="Tìm kiếm theo mã hoặc tên..." 
              prefix={<SearchOutlined />} 
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value)}
              allowClear
            />
          </Col>
          <Col span={8}>
            <Select 
              placeholder="Lọc theo chi nhánh" 
              style={{ width: '100%' }} 
              allowClear 
              onChange={setSearchBranch}
            >
              {branches.map(b => (
                <Option key={b.id} value={b.id}>{b.name}</Option>
              ))}
            </Select>
          </Col>
        </Row>
      </Card>

      <Card 
        title={<Title level={4} style={{ margin: 0 }}>Danh sách Phòng ban</Title>}
        extra={
          canManage && (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingId(null); form.resetFields(); setIsModalVisible(true); }}>
              Thêm phòng ban
            </Button>
          )
        }
        style={{ borderRadius: 8 }}
      >
        <Table columns={columns} dataSource={data} rowKey="id" loading={loading} />
      </Card>

      {/* MODAL THÊM / CẬP NHẬT PHÒNG BAN */}
      <Modal
        title={editingId ? 'Cập nhật phòng ban' : 'Thêm phòng ban'}
        open={isModalVisible}
        onOk={handleSubmit}
        onCancel={() => setIsModalVisible(false)}
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Form.Item name="code" label="Mã phòng ban" rules={[{ required: true }]}>
            <Input placeholder="VD: HR" />
          </Form.Item>
          <Form.Item name="name" label="Tên phòng ban" rules={[{ required: true }]}>
            <Input placeholder="VD: Phòng Nhân sự" />
          </Form.Item>
          <Form.Item name="branchId" label="Trực thuộc chi nhánh" rules={[{ required: true }]}>
            <Select placeholder="Chọn chi nhánh">
              {branches.map(b => (
                <Option key={b.id} value={b.id}>{b.name}</Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* MODAL CẢNH BÁO XÓA PHÒNG BAN & NHÂN VIÊN */}
      <Modal
        title={
          <Space>
            <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
            <span>Xác nhận xóa phòng ban</span>
          </Space>
        }
        open={deleteModalVisible}
        onCancel={() => { setDeleteModalVisible(false); setDeletingDept(null); }}
        footer={[
          <Button key="cancel" onClick={() => { setDeleteModalVisible(false); setDeletingDept(null); }}>
            Hủy bỏ
          </Button>,
          <Button
            key="delete"
            type="primary"
            danger
            loading={deleteLoading}
            onClick={handleConfirmDelete}
          >
            {deletionImpact?.employeeCount > 0 ? 'Xác nhận xóa (Xóa cả nhân viên)' : 'Xác nhận xóa'}
          </Button>
        ]}
        destroyOnHidden
      >
        {impactLoading ? (
          <div style={{ textAlign: 'center', padding: '24px 0' }}><Spin /></div>
        ) : (
          <div>
            {deletionImpact?.employeeCount > 0 ? (
              <Alert
                type="error"
                showIcon
                message="Cảnh báo ảnh hưởng nhân sự"
                description={
                  <div style={{ marginTop: 6, lineHeight: 1.6 }}>
                    Phòng ban <b>{deletingDept?.name}</b> hiện đang có <b>{deletionImpact.employeeCount} nhân viên</b>
                    {deletionImpact.childrenCount > 0 ? ` và ${deletionImpact.childrenCount} phòng ban trực thuộc` : ''}.
                    <br /><br />
                    <b style={{ color: '#dc2626' }}>Nếu xóa phòng ban này thì nhân viên sẽ bị mất. Bạn có chắc chắn muốn xóa không?</b>
                  </div>
                }
                style={{ marginBottom: 14 }}
              />
            ) : (
              <p>Bạn có chắc chắn muốn xóa phòng ban <b>{deletingDept?.name}</b> ({deletingDept?.code}) không?</p>
            )}

            {deletionImpact?.employees?.length > 0 && (
              <div>
                <Text strong style={{ fontSize: 13, color: '#334155' }}>
                  Danh sách nhân sự bị ảnh hưởng ({deletionImpact.employees.length} NV):
                </Text>
                <div style={{ maxHeight: 180, overflowY: 'auto', marginTop: 8, background: '#fafafa', padding: 8, borderRadius: 6, border: '1px solid #f0f0f0' }}>
                  {deletionImpact.employees.map((e: any) => (
                    <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px dashed #e2e8f0', fontSize: 13 }}>
                      <span><b>{e.fullName}</b> ({e.employeeCode})</span>
                      <span style={{ color: '#64748b' }}>{e.department?.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DepartmentListPage;
