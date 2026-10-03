import React, { useState, useEffect } from 'react';
import { Card, Table, Typography, Space, Button, Input, Select, Tag, Popconfirm, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, AuditOutlined, FileTextOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import apiClient from '../../../lib/api';
import ContractFormModal from '../components/ContractFormModal';
import { PermissionGate } from '../../../components/PermissionGate';

const { Title, Text } = Typography;

const ContractListPage: React.FC = () => {
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingContract, setEditingContract] = useState<any>(null);

  const fetchContracts = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/contracts');
      setContracts(res.data);
    } catch (error) {
      console.error('Lỗi khi tải danh sách hợp đồng', error);
      message.error('Không thể tải danh sách hợp đồng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, []);

  const handleAdd = () => {
    setEditingContract(null);
    setIsModalVisible(true);
  };

  const handleEdit = (record: any) => {
    setEditingContract(record);
    setIsModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await apiClient.delete(`/contracts/${id}`);
      message.success('Đã xoá hợp đồng');
      fetchContracts();
    } catch (error) {
      message.error('Không thể xoá hợp đồng này');
    }
  };

  const filteredContracts = contracts.filter(c => {
    const searchString = searchText.toLowerCase();
    const empName = c.employee?.fullName?.toLowerCase() || '';
    const empCode = c.employee?.employeeCode?.toLowerCase() || '';
    return empName.includes(searchString) || empCode.includes(searchString);
  });

  const columns = [
    {
      title: 'Nhân viên',
      key: 'employee',
      render: (record: any) => (
        <div>
          <div style={{ fontWeight: 600, color: '#1e3a8a' }}>{record.employee?.fullName}</div>
          <Text type="secondary" style={{ fontSize: 12 }}>{record.employee?.employeeCode}</Text>
        </div>
      ),
    },
    {
      title: 'Loại Hợp đồng',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
        let color = 'blue';
        let text = type;
        if (type === 'PROBATION') { color = 'orange'; text = 'Thử việc'; }
        else if (type === 'DEFINITE_1Y') { color = 'green'; text = '1 năm'; }
        else if (type === 'DEFINITE_3Y') { color = 'cyan'; text = '3 năm'; }
        else if (type === 'INDEFINITE') { color = 'purple'; text = 'Vô thời hạn'; }
        
        return <Tag color={color}>{text}</Tag>;
      }
    },
    {
      title: 'Lương & Tỷ lệ',
      key: 'salary',
      render: (record: any) => (
        <div>
          <div style={{ color: '#16a34a', fontWeight: 600 }}>
            {record.baseSalary?.toLocaleString()} VNĐ
          </div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Hưởng {record.probationSalaryPercent}%
          </Text>
        </div>
      ),
    },
    {
      title: 'Thời hạn',
      key: 'duration',
      render: (record: any) => (
        <div style={{ fontSize: 13 }}>
          <div>Từ: {dayjs(record.startDate).format('DD/MM/YYYY')}</div>
          {record.endDate && <div>Đến: {dayjs(record.endDate).format('DD/MM/YYYY')}</div>}
        </div>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        let color = 'default';
        if (status === 'ACTIVE') color = 'success';
        else if (status === 'COMPLETED') color = 'processing';
        else if (status === 'TERMINATED') color = 'error';
        else if (status === 'EXPIRED') color = 'warning';
        return <Tag color={color}>{status}</Tag>;
      }
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_: any, record: any) => (
        <Space size="small">
          {record.fileUrl && (
            <Button 
              type="text" 
              icon={<FileTextOutlined />} 
              onClick={() => window.open(record.fileUrl, '_blank')}
            />
          )}
          <PermissionGate resource="contract" action="update">
            <Button type="text" icon={<EditOutlined />} style={{ color: '#1677ff' }} onClick={() => handleEdit(record)} />
          </PermissionGate>
          <PermissionGate resource="contract" action="delete">
            <Popconfirm title="Bạn có chắc chắn muốn xoá?" onConfirm={() => handleDelete(record.id)}>
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </PermissionGate>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card style={{ marginBottom: 20, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Title level={4} style={{ margin: 0, color: '#1e3a8a', fontWeight: 700 }}>
              Quản lý Hợp đồng Lao động
            </Title>
            <Text type="secondary" style={{ fontSize: 13 }}>
              Thiết lập và theo dõi hợp đồng của nhân sự.
            </Text>
          </div>
          <PermissionGate resource="contract" action="create">
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              Tạo Hợp đồng
            </Button>
          </PermissionGate>
        </div>
      </Card>

      <Card bordered={false} style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <div style={{ marginBottom: 16 }}>
          <Input 
            placeholder="Tìm theo tên hoặc mã nhân viên..." 
            prefix={<SearchOutlined style={{ color: '#94a3b8' }} />} 
            style={{ width: 300 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
          />
        </div>

        <Table 
          dataSource={filteredContracts} 
          columns={columns} 
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <ContractFormModal
        visible={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onSuccess={() => {
          setIsModalVisible(false);
          fetchContracts();
        }}
        contractData={editingContract}
      />
    </div>
  );
};

export default ContractListPage;
