import React, { useState, useEffect } from 'react';
import { Card, Table, Typography, Space, Button, Input, Select, Tag, Popconfirm, message, Tooltip } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, AuditOutlined, FileTextOutlined, FileExcelOutlined, ReloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import apiClient from '../../../lib/api';
import ContractFormModal from '../components/ContractFormModal';
import { PermissionGate } from '../../../components/PermissionGate';

const { Title, Text } = Typography;

const ContractListPage: React.FC = () => {
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  
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

  const exportToExcel = () => {
    try {
      const headers = ['STT', 'Mã NV', 'Họ và tên', 'Phòng ban', 'Chức vụ', 'Loại hợp đồng', 'Mức lương (VNĐ)', 'Tỷ lệ hưởng', 'Ngày bắt đầu', 'Ngày kết thúc', 'Trạng thái'];
      const rows = filteredContracts.map((c: any, idx: number) => [
        idx + 1,
        c.employee?.employeeCode || '',
        `"${(c.employee?.fullName || '').replace(/"/g, '""')}"`,
        `"${(c.employee?.department?.name || '').replace(/"/g, '""')}"`,
        `"${(c.employee?.position?.name || '').replace(/"/g, '""')}"`,
        c.type === 'PROBATION' ? 'HĐ Thử việc' : c.type === 'DEFINITE_1Y' ? 'Chính thức 1 năm' : c.type === 'DEFINITE_3Y' ? 'Chính thức 3 năm' : 'Không thời hạn',
        c.baseSalary || 0,
        c.type === 'PROBATION' ? `${c.probationSalaryPercent || 85}%` : '100%',
        c.startDate ? dayjs(c.startDate).format('DD/MM/YYYY') : '',
        c.endDate ? dayjs(c.endDate).format('DD/MM/YYYY') : 'Không thời hạn',
        c.status === 'ACTIVE' ? 'Đang hiệu lực' : c.status === 'COMPLETED' ? 'Đã hoàn thành' : c.status === 'EXPIRED' ? 'Đã hết hạn' : 'Đã chấm dứt'
      ]);

      const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Danh_sach_hop_dong_${dayjs().format('YYYYMMDD_HHmm')}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      message.success('Đã xuất danh sách hợp đồng ra file Excel (.csv) thành công!');
    } catch {
      message.error('Lỗi khi xuất file Excel');
    }
  };

  const filteredContracts = contracts.filter(c => {
    const searchString = searchText.toLowerCase();
    const empName = c.employee?.fullName?.toLowerCase() || '';
    const empCode = c.employee?.employeeCode?.toLowerCase() || '';
    const matchesSearch = empName.includes(searchString) || empCode.includes(searchString);
    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const columns = [
    {
      title: 'Mã NV',
      key: 'empCode',
      width: 110,
      fixed: 'left' as const,
      render: (record: any) => (
        <Tag
          color="blue"
          style={{
            fontFamily: 'monospace',
            fontWeight: 700,
            fontSize: 12,
            borderRadius: 4,
            padding: '1px 8px',
          }}
        >
          {record.employee?.employeeCode || '-'}
        </Tag>
      ),
    },
    {
      title: 'Họ và tên',
      key: 'empName',
      width: 180,
      fixed: 'left' as const,
      render: (record: any) => (
        <span style={{ fontWeight: 600, color: '#0f172a', fontSize: 13.5 }}>
          {record.employee?.fullName || '-'}
        </span>
      ),
    },
    {
      title: 'Phòng ban',
      key: 'department',
      width: 180,
      render: (record: any) => {
        const dept = record.employee?.department?.name;
        return dept ? (
          <Tag color="cyan" style={{ borderRadius: 4, fontWeight: 500, fontSize: 12, padding: '2px 8px' }}>
            {dept}
          </Tag>
        ) : <span style={{ color: '#94a3b8' }}>-</span>;
      },
    },
    {
      title: 'Chức vụ',
      key: 'position',
      width: 165,
      render: (record: any) => (
        <span style={{ fontWeight: 500, color: '#1e293b', fontSize: 13 }}>
          {record.employee?.position?.name || <span style={{ color: '#94a3b8' }}>-</span>}
        </span>
      ),
    },
    {
      title: 'Loại hợp đồng',
      dataIndex: 'type',
      key: 'type',
      width: 170,
      align: 'center' as const,
      render: (type: string) => {
        let color = 'blue';
        let text = 'HĐ Lao động';
        if (type === 'PROBATION') { color = 'orange'; text = 'HĐ Thử việc'; }
        else if (type === 'DEFINITE_1Y') { color = 'green'; text = 'Chính thức 1 năm'; }
        else if (type === 'DEFINITE_3Y') { color = 'cyan'; text = 'Chính thức 3 năm'; }
        else if (type === 'INDEFINITE') { color = 'purple'; text = 'Không thời hạn'; }
        
        return <Tag color={color} bordered={false} style={{ fontWeight: 600, fontSize: 11.5, borderRadius: 4 }}>{text}</Tag>;
      }
    },
    {
      title: 'Mức lương',
      dataIndex: 'baseSalary',
      key: 'baseSalary',
      width: 150,
      align: 'right' as const,
      render: (salary: number) => salary ? (
        <span style={{ color: '#059669', fontWeight: 700, fontSize: 13, fontFamily: 'monospace' }}>
          {salary.toLocaleString('vi-VN')} đ
        </span>
      ) : <span style={{ color: '#94a3b8' }}>-</span>,
    },
    {
      title: 'Tỷ lệ hưởng',
      dataIndex: 'probationSalaryPercent',
      key: 'probationSalaryPercent',
      width: 120,
      align: 'center' as const,
      render: (percent: number, record: any) => {
        if (record.type === 'PROBATION') {
          return <Tag color="warning" bordered={false} style={{ fontWeight: 600 }}>{percent || 85}%</Tag>;
        }
        return <Tag color="success" bordered={false} style={{ fontWeight: 600 }}>100%</Tag>;
      },
    },
    {
      title: 'Ngày bắt đầu',
      dataIndex: 'startDate',
      key: 'startDate',
      width: 130,
      align: 'center' as const,
      render: (date: any) => (
        <span style={{ fontSize: 13, color: '#475569' }}>
          {date ? dayjs(date).format('DD/MM/YYYY') : '-'}
        </span>
      ),
    },
    {
      title: 'Ngày kết thúc',
      dataIndex: 'endDate',
      key: 'endDate',
      width: 135,
      align: 'center' as const,
      render: (date: any) => (
        <span style={{ fontSize: 13, color: '#475569' }}>
          {date ? dayjs(date).format('DD/MM/YYYY') : <Tag bordered={false} color="purple">Không thời hạn</Tag>}
        </span>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 145,
      align: 'center' as const,
      render: (status: string) => {
        if (status === 'ACTIVE') {
          return <Tag color="success" style={{ fontWeight: 600 }}>Đang hiệu lực</Tag>;
        }
        if (status === 'COMPLETED') {
          return <Tag color="processing" style={{ fontWeight: 600 }}>Đã hoàn thành</Tag>;
        }
        if (status === 'EXPIRED') {
          return <Tag color="warning" style={{ fontWeight: 600 }}>Đã hết hạn</Tag>;
        }
        if (status === 'TERMINATED') {
          return <Tag color="error" style={{ fontWeight: 600 }}>Đã chấm dứt</Tag>;
        }
        return <Tag color="default" style={{ fontWeight: 500 }}>{status || 'Chưa xác định'}</Tag>;
      }
    },
    {
      title: 'Hành động',
      key: 'action',
      width: 130,
      fixed: 'right' as const,
      align: 'center' as const,
      render: (_: any, record: any) => (
        <Space size={6} wrap={false} style={{ justifyContent: 'center' }}>
          <Tooltip title={record.fileUrl ? 'Xem tệp hợp đồng đính kèm' : 'Chưa đính kèm tệp hợp đồng'}>
            <span>
              <Button 
                type="text" 
                size="small"
                disabled={!record.fileUrl}
                icon={<FileTextOutlined style={{ color: record.fileUrl ? '#1677ff' : undefined }} />} 
                onClick={() => record.fileUrl && window.open(record.fileUrl, '_blank')}
              />
            </span>
          </Tooltip>
          <PermissionGate resource="contract" action="update">
            <Tooltip title="Chỉnh sửa hợp đồng">
              <Button type="text" size="small" icon={<EditOutlined />} style={{ color: '#1677ff' }} onClick={() => handleEdit(record)} />
            </Tooltip>
          </PermissionGate>
          <PermissionGate resource="contract" action="delete">
            <Popconfirm title="Bạn có chắc chắn muốn xoá hợp đồng này?" onConfirm={() => handleDelete(record.id)}>
              <Tooltip title="Xoá hợp đồng">
                <Button type="text" size="small" danger icon={<DeleteOutlined />} />
              </Tooltip>
            </Popconfirm>
          </PermissionGate>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card style={{ marginBottom: 20, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
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
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
          <Space>
            <Input 
              placeholder="Tìm theo tên hoặc mã nhân viên..." 
              prefix={<SearchOutlined style={{ color: '#94a3b8' }} />} 
              style={{ width: 280 }}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 190 }}
              options={[
                { label: 'Tất cả trạng thái', value: 'ALL' },
                { label: 'Đang hiệu lực (ACTIVE)', value: 'ACTIVE' },
                { label: 'Đã hoàn thành (COMPLETED)', value: 'COMPLETED' },
                { label: 'Đã hết hạn (EXPIRED)', value: 'EXPIRED' },
                { label: 'Đã chấm dứt (TERMINATED)', value: 'TERMINATED' },
              ]}
            />
          </Space>

          <Space size={10}>
            <Button
              icon={<FileExcelOutlined />}
              style={{
                background: '#107c41',
                color: '#fff',
                borderColor: '#107c41',
                fontWeight: 600,
                borderRadius: 6
              }}
              onClick={exportToExcel}
            >
              Xuất file Excel (.csv)
            </Button>
            <Button icon={<ReloadOutlined />} onClick={fetchContracts} style={{ borderRadius: 6 }}>
              Làm mới danh sách
            </Button>
          </Space>
        </div>

        <Table 
          dataSource={filteredContracts} 
          columns={columns} 
          rowKey="id"
          loading={loading}
          scroll={{ x: 1750 }}
          pagination={{ 
            pageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50'],
            showTotal: (total) => `Tổng cộng ${total} hợp đồng`
          }}
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
