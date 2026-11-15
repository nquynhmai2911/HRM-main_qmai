import React from 'react';
import { Spin } from 'antd';

export const PageLoader: React.FC = () => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '50vh',
      gap: 16,
    }}
  >
    <Spin size="large" />
    <span style={{ color: '#64748b', fontSize: 13, fontWeight: 500 }}>Đang tải dữ liệu...</span>
  </div>
);

export default PageLoader;

