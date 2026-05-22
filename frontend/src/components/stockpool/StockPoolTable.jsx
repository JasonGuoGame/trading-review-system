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

  const TAG_LABELS = { to: '换手率', qr: '量比' };

  const renderTags = (val) => {
    if (!val) return <span style={{ color: '#8b949e' }}>-</span>;
    try {
      const parsed = typeof val === 'string' ? JSON.parse(val) : val;
      return (
        <Space direction="vertical" size={2}>
          {Object.entries(parsed).map(([k, v]) => {
            const label = TAG_LABELS[k] || k;
            const displayVal = k === 'to' ? ((parseFloat(v) || 0) * 10).toFixed(1) : v;
            return <Tag color="purple" key={k}>{label}: {displayVal}</Tag>;
          })}
        </Space>
      );
    } catch (e) {
      return <span>{val}</span>;
    }
  };

  const macdBollColumns = [
    ...commonColumns.slice(0, 2),
    {
      title: '指标数据 (Tags)',
      dataIndex: 'tags',
      key: 'tags',
      render: renderTags,
    },
    {
      title: '逻辑演绎 (Notes)',
      dataIndex: 'notes',
      key: 'notes',
      render: (val) => (
        <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, display: 'inline-block', maxWidth: 250, whiteSpace: 'normal', wordWrap: 'break-word' }}>
          {val || '-'}
        </span>
      ),
    },
    ...commonColumns.slice(2),
  ];

  const WINNER_FACTOR_LABELS = {
    vol_ratio: '量比',
    dif: 'DIF',
    close_position: '收盘位置',
    turnover: '换手率',
    macd_signal: 'MACD信号',
    boll_position: '布林位置',
    rsi: 'RSI',
    volume: '成交量',
    ma_status: '均线状态',
    momentum: '动量',
  };

  const WINNER_FACTOR_COLORS = {
    vol_ratio: '#ff7a45',
    dif: '#1677ff',
    close_position: '#a0d911',
    turnover: '#ff4d4f',
    macd_signal: '#597ef7',
    boll_position: '#9254de',
    rsi: '#36cfc9',
    volume: '#ffc53d',
    ma_status: '#73d13d',
    momentum: '#ff85c0',
  };

  const renderWinnerTags = (val, status) => {
    const tags = [];
    // Show mode name first
    const modeName = (status || '').replace(/^赢家模式[：:]/, '');
    if (modeName) {
      tags.push(
        <Tag color="gold" key="mode" style={{ fontWeight: 'bold', fontSize: 13 }}>
          {modeName}
        </Tag>
      );
    }
    if (!val) return <Space size={4}>{tags}</Space>;
    try {
      const parsed = typeof val === 'string' ? JSON.parse(val) : val;
      Object.entries(parsed).forEach(([k, v]) => {
        const label = WINNER_FACTOR_LABELS[k] || k;
        const color = WINNER_FACTOR_COLORS[k] || 'default';
        const displayVal = k === 'vol_ratio' && !isNaN(v) ? (parseFloat(v) * 10).toFixed(1) : v;
        tags.push(
          <Tag color={color} key={k} style={{ marginBottom: 4 }}>
            {label}: {displayVal}
          </Tag>
        );
      });
    } catch (e) {
      return <Space size={4}>{tags}</Space>;
    }
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, maxWidth: 280 }}>
        {tags}
      </div>
    );
  };

  const winnerModeColumns = [
    ...commonColumns.slice(0, 2),
    {
      title: '赢家效应',
      dataIndex: 'status',
      key: 'winner_effect',
      render: (status) => {
        const modeName = (status || '').replace(/^赢家模式[：:]/, '');
        return (
          <Tag color="gold" style={{ fontWeight: 'bold', fontSize: 13, padding: '2px 10px' }}>
            {modeName || status}
          </Tag>
        );
      },
    },
    {
      title: '核心因子',
      key: 'factors',
      render: (_, record) => renderWinnerTags(record.tags, record.status),
    },
    {
      title: '逻辑演绎 (Notes)',
      dataIndex: 'notes',
      key: 'notes',
      render: (val) => (
        <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, display: 'inline-block', maxWidth: 250, whiteSpace: 'normal', wordWrap: 'break-word' }}>
          {val || '-'}
        </span>
      ),
    },
    ...commonColumns.slice(2),
  ];

  const getColumns = () => {
    switch (type) {
      case 'short': return shortTermColumns;
      case 'long': return longTermColumns;
      case 'winner_mode': return winnerModeColumns;
      default: return macdBollColumns;
    }
  };

  return (
    <Table
      columns={getColumns()}
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
