import React from 'react';
import { Table, Tag, Progress, Space, Button } from 'antd';
import { EyeOutlined, EditOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const StockPoolTable = ({ type, data, loading, onRowClick }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case '买点': return 'error';
      case '强': return 'warning';
      case '观察': return 'default';
      case '风险': return 'success';
      case '新入选': return 'error'; // Red color for newly selected to stand out
      case '曾经入选': return 'processing'; // Blue color for previously selected
      default: return 'default';
    }
  };

  const commonColumns = [
    {
      title: '股票',
      dataIndex: 'stock_name',
      key: 'stock_name',
      render: (text, record) => (
        <div style={{ fontWeight: 'bold' }}>
          {text} <span style={{ color: '#8b949e', fontSize: 12, fontWeight: 'normal' }}>{record.symbol}</span>
        </div>
      ),
    },
    {
      title: '板块',
      dataIndex: 'sector_name',
      key: 'sector_name',
    },
    {
      title: '日期',
      dataIndex: 'trade_date',
      key: 'trade_date',
      sorter: (a, b) => dayjs(a.trade_date).unix() - dayjs(b.trade_date).unix(),
      render: (val) => (
        <span style={{ color: '#8b949e', fontSize: 13 }}>
          {val ? dayjs(val).format('YYYY-MM-DD') : '-'}
        </span>
      ),
    },
    {
      title: '评分',
      dataIndex: 'score',
      key: 'score',
      sorter: (a, b) => a.score - b.score,
      render: (score) => {
        let color = '#52c41a';
        if (score > 90) color = '#ff4d4f';
        else if (score > 80) color = '#faad14';
        return <span style={{ color, fontWeight: 'bold' }}>{score}</span>;
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={getStatusColor(status)} style={{ borderRadius: 4 }}>
          {status === '买点' ? '🔥 ' : status === '观察' ? '⚡ ' : ''}{status}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button type="text" icon={<EyeOutlined />} onClick={() => onRowClick(record)} />
        </Space>
      ),
    },
  ];

  const shortTermColumns = [
    ...commonColumns.slice(0, 2),
    {
      title: '资金',
      dataIndex: 'fund_flow',
      key: 'fund_flow',
      render: (val) => <span style={{ color: '#ff4d4f' }}>{val || '+5亿'}</span>,
    },
    {
      title: '异动',
      dataIndex: 'surge_count',
      key: 'surge_count',
      render: (val) => <Tag color="blue">{val || 5}</Tag>,
    },
    {
      title: '形态',
      dataIndex: 'pattern',
      key: 'pattern',
      render: (val) => <span>{val || '二次启动'}</span>,
    },
    ...commonColumns.slice(2),
  ];

  const longTermColumns = [
    ...commonColumns.slice(0, 2),
    {
      title: '趋势',
      dataIndex: 'trend',
      key: 'trend',
      render: (val) => <Tag color="orange">{val || 'MA多头'}</Tag>,
    },
    {
      title: '机构资金',
      dataIndex: 'inst_flow',
      key: 'inst_flow',
      render: (val) => <span style={{ color: '#ff4d4f' }}>{val || '持续流入'}</span>,
    },
    {
      title: '估值',
      dataIndex: 'valuation',
      key: 'valuation',
      render: (val) => <span>{val || '合理'}</span>,
    },
    ...commonColumns.slice(2),
  ];

  return (
    <Table
      columns={type === 'short' ? shortTermColumns : longTermColumns}
      dataSource={data}
      loading={loading}
      rowKey="id"
      onRow={(record) => ({
        onClick: () => onRowClick(record),
      })}
      style={{
        background: '#141414',
        border: '1px solid #30363d',
        borderRadius: 8,
        overflow: 'hidden'
      }}
      pagination={false}
    />
  );
};

export default StockPoolTable;
