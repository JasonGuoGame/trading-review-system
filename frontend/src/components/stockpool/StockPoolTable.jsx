import { EyeOutlined, StarFilled, StarOutlined } from '@ant-design/icons';
import { Button, message, Space, Table, Tag } from 'antd';
import dayjs from 'dayjs';
import { useSetWatchFocusMutation } from '../../app/api';

const StockPoolTable = ({ type, data, loading, onRowClick, onRefresh }) => {
  const [setWatchFocus] = useSetWatchFocusMutation();

  const handleWatchFocus = (e, record) => {
    e.stopPropagation();
    const newFocus = record.is_watch_focus ? 0 : 1;
    setWatchFocus({
      symbol: record.symbol,
      trade_date: dayjs(record.trade_date).format('YYYY-MM-DD'),
      pool_type: record.pool_type,
      status: record.status,
      focus: newFocus,
    }).then(() => {
      message.success(newFocus ? '已加入重点观察' : '已取消重点观察');
      onRefresh?.();
    }).catch(() => {
      message.error('操作失败');
    });
  };
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
      sorter: (a, b) => (a.status || '').localeCompare(b.status || '', 'zh'),
      defaultSortOrder: 'ascend',
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
        <Space size="small">
          <Button
            type="text"
            size="small"
            icon={record.is_watch_focus ? <StarFilled style={{ color: '#faad14' }} /> : <StarOutlined />}
            onClick={(e) => handleWatchFocus(e, record)}
            style={{ color: record.is_watch_focus ? '#faad14' : '#8b949e' }}
          >
            {record.is_watch_focus ? '已关注' : '关注'}
          </Button>
          <Button type="text" size="small" icon={<EyeOutlined />} onClick={() => onRowClick(record)} />
        </Space>
      ),
    },
  ];

  const shortTermColumns = [
    ...commonColumns.slice(0, 2),
    {
      title: '逻辑演绎',
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

  const longTermColumns = [
    ...commonColumns.slice(0, 2),
    {
      title: '逻辑演绎',
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

  const TAG_LABELS = { to: '换手率', qr: '量比' };

  const renderTags = (val) => {
    if (!val) return <span style={{ color: '#8b949e' }}>-</span>;
    try {
      const parsed = typeof val === 'string' ? JSON.parse(val) : val;
      return (
        <Space direction="vertical" size={2}>
          {Object.entries(parsed).map(([k, v]) => {
            const label = TAG_LABELS[k] || k;
            const displayVal = k === 'to' ? ((parseFloat(v) || 0) * 100).toFixed(1) : v;
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
      render: (val) => {
        if (!val) return <span>-</span>;
        const display = String(val).replace(/换手率([\d.]+)%/g, (_, n) => `换手率${(parseFloat(n) * 100).toFixed(1)}%`);
        return (
          <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, display: 'inline-block', maxWidth: 250, whiteSpace: 'normal', wordWrap: 'break-word' }}>
            {display}
          </span>
        );
      },
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
      render: (val) => {
        if (!val) return <span>-</span>;
        const display = String(val).replace(/换手率([\d.]+)%/g, (_, n) => `换手率${(parseFloat(n) * 100).toFixed(1)}%`);
        return (
          <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, display: 'inline-block', maxWidth: 250, whiteSpace: 'normal', wordWrap: 'break-word' }}>
            {display}
          </span>
        );
      },
    },
    ...commonColumns.slice(2),
  ];

  const MF_ENTRY_FACTOR_LABELS = {
    bias: '偏离主力',
    mf_cost: '主力成本',
    surge_cnt: '脉冲次数',
    market_vwap: '市场均价',
  };

  const MF_ENTRY_FACTOR_COLORS = {
    bias: '#ff7a45',
    mf_cost: '#1677ff',
    surge_cnt: '#ff4d4f',
    market_vwap: '#a0d911',
  };

  const renderMfEntryTags = (val) => {
    const tags = [];
    if (!val) return <Space size={4}>{tags}</Space>;
    try {
      const parsed = typeof val === 'string' ? JSON.parse(val) : val;
      Object.entries(parsed).forEach(([k, v]) => {
        const label = MF_ENTRY_FACTOR_LABELS[k] || k;
        const color = MF_ENTRY_FACTOR_COLORS[k] || 'default';
        let displayVal = v;
        if (k === 'bias') {
          displayVal = `${(parseFloat(v) || 0) > 0 ? '+' : ''}${(parseFloat(v) || 0).toFixed(2)}%`;
        } else if (k === 'mf_cost' || k === 'market_vwap') {
          displayVal = (parseFloat(v) || 0).toFixed(2);
        }
        tags.push(
          <Tag color={color} key={k} style={{ marginBottom: 4, fontSize: 12 }}>
            {label}: {displayVal}
          </Tag>
        );
      });
      return (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, maxWidth: 280 }}>
          {tags}
        </div>
      );
    } catch (e) {
      return <span>{val}</span>;
    }
  };

  const mfEntryColumns = [
    ...commonColumns.slice(0, 2),
    {
      title: '主力状态',
      dataIndex: 'status',
      key: 'mf_status',
      render: (status) => (
        <Tag color="magenta" style={{ fontWeight: 'bold', fontSize: 13, padding: '2px 10px' }}>
          🎯 {status || '主力入场'}
        </Tag>
      ),
    },
    {
      title: '主力指标',
      key: 'mf_factors',
      render: (_, record) => renderMfEntryTags(record.tags),
    },
    {
      title: '逻辑演绎 (Notes)',
      dataIndex: 'notes',
      key: 'notes',
      render: (val) => {
        if (!val) return <span>-</span>;
        return (
          <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, display: 'inline-block', maxWidth: 250, whiteSpace: 'normal', wordWrap: 'break-word' }}>
            {val}
          </span>
        );
      },
    },
    ...commonColumns.slice(2),
  ];

  const DIVERGENCE_REVERSAL_LABELS = {
    status: '反包状态',
    yest_vol: '昨量比',
    repair_depth: '修复深度',
  };

  const DIVERGENCE_REVERSAL_COLORS = {
    status: '#faad14',
    yest_vol: '#1677ff',
    repair_depth: '#ff4d4f',
  };

  const renderDivergenceReversalTags = (val) => {
    const tags = [];
    if (!val) return <Space size={4}>{tags}</Space>;
    try {
      const parsed = typeof val === 'string' ? JSON.parse(val) : val;
      Object.entries(parsed).forEach(([k, v]) => {
        const label = DIVERGENCE_REVERSAL_LABELS[k] || k;
        const color = DIVERGENCE_REVERSAL_COLORS[k] || 'default';
        let displayVal = v;
        if (k === 'status' && v === 'Divergence_Confirm') {
          displayVal = '分歧确认';
        }
        tags.push(
          <Tag color={color} key={k} style={{ marginBottom: 4, fontSize: 12 }}>
            {label}: {displayVal}
          </Tag>
        );
      });
      return (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, maxWidth: 280 }}>
          {tags}
        </div>
      );
    } catch (e) {
      return <span>{val}</span>;
    }
  };

  const divergenceReversalColumns = [
    ...commonColumns.slice(0, 2),
    {
      title: '策略状态',
      dataIndex: 'status',
      key: 'divergence_status',
      render: (status) => (
        <Tag color="orange" style={{ fontWeight: 'bold', fontSize: 13, padding: '2px 10px' }}>
          🔄 {status || '分歧反包'}
        </Tag>
      ),
    },
    {
      title: '反包指标',
      key: 'divergence_factors',
      render: (_, record) => renderDivergenceReversalTags(record.tags),
    },
    {
      title: '逻辑演绎 (Notes)',
      dataIndex: 'notes',
      key: 'notes',
      render: (val) => {
        if (!val) return <span>-</span>;
        return (
          <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, display: 'inline-block', maxWidth: 250, whiteSpace: 'normal', wordWrap: 'break-word' }}>
            {val}
          </span>
        );
      },
    },
    ...commonColumns.slice(2),
  ];

  const AUCTION_SURGE_FACTOR_LABELS = {
    ratio: '竞价量比',
    open_pct: '开盘涨幅',
    amount_wan: '竞价金额',
    strategy: '策略名称',
  };
  const AUCTION_SURGE_FACTOR_COLORS = {
    ratio: '#722ed1',
    open_pct: '#ff4d4f',
    amount_wan: '#13c2c2',
    strategy: '#2f54eb',
  };
  const renderAuctionSurgeTags = (val) => {
    const tags = [];
    if (!val) return <Space size={4}>{tags}</Space>;
    try {
      const parsed = typeof val === 'string' ? JSON.parse(val) : val;
      Object.entries(parsed).forEach(([k, v]) => {
        const label = AUCTION_SURGE_FACTOR_LABELS[k] || k;
        const color = AUCTION_SURGE_FACTOR_COLORS[k] || 'default';
        let displayVal = v;
        if (k === 'open_pct') {
          displayVal = `${(parseFloat(v) || 0) > 0 ? '+' : ''}${(parseFloat(v) || 0).toFixed(2)}%`;
        } else if (k === 'amount_wan') {
          displayVal = `${(parseFloat(v) || 0).toFixed(0)}万`;
        } else if (k === 'ratio') {
          displayVal = `${(parseFloat(v) || 0).toFixed(2)}倍`;
        }
        tags.push(
          <Tag color={color} key={k} style={{ marginBottom: 4, fontSize: 12 }}>
            {label}: {displayVal}
          </Tag>
        );
      });
      return (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, maxWidth: 280 }}>
          {tags}
        </div>
      );
    } catch (e) {
      return <span>{val}</span>;
    }
  };
  const auctionSurgeColumns = [
    ...commonColumns.slice(0, 2),
    {
      title: '策略状态',
      dataIndex: 'status',
      key: 'auction_status',
      render: (status) => (
        <Tag color="purple" style={{ fontWeight: 'bold', fontSize: 13, padding: '2px 10px' }}>
          🔔 {status || '竞价异动'}
        </Tag>
      ),
    },
    {
      title: '竞价指标',
      key: 'auction_factors',
      render: (_, record) => renderAuctionSurgeTags(record.tags),
    },
    {
      title: '逻辑演绎 (Notes)',
      dataIndex: 'notes',
      key: 'notes',
      render: (val) => {
        if (!val) return <span>-</span>;
        return (
          <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, display: 'inline-block', maxWidth: 250, whiteSpace: 'normal', wordWrap: 'break-word' }}>
            {val}
          </span>
        );
      },
    },
    ...commonColumns.slice(2),
  ];

  const getColumns = () => {
    switch (type) {
      case 'short': return shortTermColumns;
      case 'long': return longTermColumns;
      case 'winner_mode': return winnerModeColumns;
      case 'mf_entry': return mfEntryColumns;
      case 'divergence_reversal': return divergenceReversalColumns;
      case 'auction_surge': return auctionSurgeColumns;
      default: return macdBollColumns;
    }
  };

  return (
    <>
      <style>{`
        .watch-focus-row td {
          background: rgba(250,173,20,0.1) !important;
          border-left: 3px solid #faad14;
        }
        .watch-focus-row td:first-child {
          border-left: 3px solid #faad14;
        }
        .watch-focus-row:hover td {
          background: rgba(250,173,20,0.15) !important;
        }
      `}</style>
      <Table
        columns={getColumns()}
        dataSource={data}
        loading={loading}
        rowKey="id"
        rowClassName={(record) => record.is_watch_focus ? 'watch-focus-row' : ''}
        style={{
          background: '#141414',
          border: '1px solid #30363d',
          borderRadius: 8,
          overflow: 'hidden'
        }}
        pagination={false}
      />
    </>
  );
};

export default StockPoolTable;
