import React, { useState, useEffect } from 'react';
import { Card, Typography, Button, Space, message, Calendar, Badge, Select, Row, Col, Statistic, Tag } from 'antd';
import { ClockCircleOutlined, CheckCircleOutlined, ExportOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import apiClient from '../../../lib/api';
import type { CalendarProps } from 'antd';

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

const { Title, Text } = Typography;

const MyTimesheetPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [holidays, setHolidays] = useState<any[]>([]);
  
  const [currentMonth, setCurrentMonth] = useState(dayjs().month() + 1);
  const [currentYear, setCurrentYear] = useState(dayjs().year());

  const fetchTimesheet = async (month: number, year: number) => {
    try {
      setLoading(true);
      const res = await apiClient.get('/attendance/my-timesheet', { params: { month, year } });
      setLogs(res.data.logs);
      setLeaveRequests(res.data.leaveRequests);
      setHolidays(res.data.holidays);
    } catch (err) {
      console.error(err);
      message.error('Lỗi khi tải bảng công');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimesheet(currentMonth, currentYear);
  }, [currentMonth, currentYear]);

  const handleCheckIn = async () => {
    try {
      await apiClient.post('/attendance/checkin');
      message.success('Check-in thành công!');
      fetchTimesheet(currentMonth, currentYear);
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Check-in thất bại');
    }
  };

  const handleCheckOut = async () => {
    try {
      await apiClient.post('/attendance/checkout');
      message.success('Check-out thành công!');
      fetchTimesheet(currentMonth, currentYear);
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Check-out thất bại');
    }
  };

  const dateCellRender = (value: Dayjs) => {
    const dateStr = value.format('YYYY-MM-DD');
    const log = logs.find(l => dayjs(l.date).format('YYYY-MM-DD') === dateStr);
    const holiday = holidays.find(h => dayjs(h.date).format('YYYY-MM-DD') === dateStr);
    const leave = leaveRequests.find(lr => 
      dayjs(dateStr).isSameOrAfter(dayjs(lr.fromDate).format('YYYY-MM-DD')) && 
      dayjs(dateStr).isSameOrBefore(dayjs(lr.toDate).format('YYYY-MM-DD'))
    );

    if (holiday) {
      return (
        <div style={{ padding: 4, background: '#fff1f0', borderRadius: 4, marginTop: 4 }}>
          <Tag color="red" style={{ width: '100%', textAlign: 'center', margin: 0 }}>Nghỉ lễ</Tag>
          <div style={{ fontSize: 10, color: '#cf1322', textAlign: 'center', marginTop: 2 }}>{holiday.name}</div>
        </div>
      );
    }

    if (leave) {
      return (
        <div style={{ padding: 4, background: '#e6f4ff', borderRadius: 4, marginTop: 4 }}>
          <Tag color="blue" style={{ width: '100%', textAlign: 'center', margin: 0 }}>Nghỉ phép</Tag>
          <div style={{ fontSize: 10, color: '#0958d9', textAlign: 'center', marginTop: 2 }}>{leave.leaveType?.name}</div>
        </div>
      );
    }

    // Default to unpaid leave if it's a past weekday and no log exists
    const isPastWeekday = value.isBefore(dayjs(), 'day') && value.day() !== 0 && value.day() !== 6;
    
    if (!log && isPastWeekday) {
      return (
        <div style={{ padding: 4, marginTop: 4 }}>
          <Tag color="default" style={{ width: '100%', textAlign: 'center', margin: 0 }}>Nghỉ không lương</Tag>
        </div>
      );
    }

    if (log) {
      return (
        <ul style={{ listStyle: 'none', padding: 0, margin: '4px 0 0' }}>
          <li>
            <Badge status="success" text={`Vào: ${dayjs(log.checkInAt).format('HH:mm')}`} />
          </li>
          {log.checkOutAt ? (
            <li>
              <Badge status="processing" text={`Ra: ${dayjs(log.checkOutAt).format('HH:mm')}`} />
            </li>
          ) : (
            <li>
              <Badge status="warning" text="Chưa out" />
            </li>
          )}
          {log.lateMinutes > 0 && (
            <li>
              <Badge status="error" text={`Đi muộn ${log.lateMinutes}p`} />
            </li>
          )}
        </ul>
      );
    }

    return null;
  };

  const cellRender: CalendarProps<Dayjs>['cellRender'] = (current, info) => {
    if (info.type === 'date') return dateCellRender(current);
    return info.originNode;
  };

  const onPanelChange = (value: Dayjs, mode: string) => {
    setCurrentMonth(value.month() + 1);
    setCurrentYear(value.year());
  };

  const totalLate = logs.filter(l => l.lateMinutes > 0).length;
  const totalWorked = logs.length;

  return (
    <div style={{ padding: '24px' }}>
      <Row gutter={24}>
        <Col span={8}>
          <Card 
            title="Check-in / Check-out hôm nay" 
            style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', height: '100%' }}
          >
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <Title level={2} style={{ color: '#1677ff', margin: 0 }}>{dayjs().format('HH:mm')}</Title>
              <Text type="secondary">{dayjs().format('DD/MM/YYYY - dddd')}</Text>
              
              <div style={{ marginTop: 32 }}>
                <Space size="large">
                  <Button 
                    type="primary" 
                    size="large" 
                    icon={<CheckCircleOutlined />}
                    style={{ background: '#52c41a', width: 120, height: 48 }}
                    onClick={handleCheckIn}
                  >
                    Check-in
                  </Button>
                  <Button 
                    size="large" 
                    icon={<ExportOutlined />}
                    style={{ width: 120, height: 48 }}
                    onClick={handleCheckOut}
                  >
                    Check-out
                  </Button>
                </Space>
              </div>
            </div>
          </Card>
        </Col>
        
        <Col span={16}>
          <Card style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', height: '100%' }}>
            <Row gutter={16}>
              <Col span={8}>
                <Statistic title="Tổng ngày công (tháng)" value={totalWorked} prefix={<CheckCircleOutlined style={{ color: '#1677ff' }} />} />
              </Col>
              <Col span={8}>
                <Statistic title="Số lần đi muộn" value={totalLate} valueStyle={{ color: '#cf1322' }} prefix={<ClockCircleOutlined />} />
              </Col>
              <Col span={8}>
                <Statistic title="Nghỉ phép" value={leaveRequests.length} prefix={<Badge status="processing" />} />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      <Card style={{ marginTop: 24, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <Calendar 
          cellRender={cellRender} 
          onPanelChange={onPanelChange} 
          defaultValue={dayjs()}
        />
      </Card>
    </div>
  );
};

export default MyTimesheetPage;
