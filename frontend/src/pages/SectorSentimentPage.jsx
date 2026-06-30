import { useMemo, useState } from 'react'
import {
  Row, Col, Card, Statistic, Tag, Progress, Alert, Spin, Empty, Table, Tooltip, DatePicker, AutoComplete, Input,
} from 'antd'
import {
  FireOutlined,
  RocketOutlined,
  RiseOutlined,
  DashboardOutlined,
  ThunderboltOutlined,
  TrophyOutlined,
  QuestionCircleOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ExperimentOutlined,
} from '@ant-design/icons'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip,
  ResponsiveContainer, BarChart, Bar, Cell, ReferenceLine,
} from 'recharts'
import { useGetFullReportQuery, useGetSectorSentimentLatestDateQuery, useGetSectorNamesQuery, useLazyGetSectorDriftQuery } from '../app/api'
import dayjs from 'dayjs'

// ============================================================
// Constants
// ============================================================

const DIVERGENCE_CONFIG = {
  healthy: {
    color: '#52c41a',
    bg: 'rgba(82,196,26,0.08)',
    border: 'rgba(82,196,26,0.25)',
    label: '健康·普涨共振',
    icon: <CheckCircleOutlined />,
    advice: '市场情绪健康，权重与个股合力向上，适合积极操作。',
  },
  fake_prosperity: {
    color: '#ff4d4f',
    bg: 'rgba(255,77,79,0.08)',
    border: 'rgba(255,77,79,0.35)',
    label: '⚠️ 虚假繁荣·高位分化',
    icon: <WarningOutlined />,
    advice: '危险！权重拉指数，个股大面积亏损——"赚指数不赚钱"。建议仓位减半，警惕高位分化。',
  },
  undercurrent: {
    color: '#1677ff',
    bg: 'rgba(22,119,255,0.08)',
    border: 'rgba(22,119,255,0.25)',
    label: '暗流涌动·个股回暖',
    icon: <ExperimentOutlined />,
    advice: '指数被权重拖累走弱，但多数个股已率先止跌回升——暗流涌动，可关注抄底机会。',
  },
  weak: {
    color: '#8c8c8c',
    bg: 'rgba(140,140,140,0.06)',
    border: 'rgba(140,140,140,0.2)',
    label: '双弱·观望等待',
    icon: <QuestionCircleOutlined />,
    advice: '大盘和行业均处于弱势区域，建议观望为主，等待信号明朗。',
  },
}

const FLAME_STYLE = { color: '#fa8c16', fontSize: 14, marginLeft: 2 }
const GOLD_STYLE = { color: '#faad14', fontSize: 14 }

// ============================================================
// Sub-components
// ============================================================

// ------ 背离信号 (Top) ------

function DivergencePanel({ divergence }) {
  const { trend = [], latest_status: latest, warning = 'healthy' } = divergence || {}
  const cfg = DIVERGENCE_CONFIG[warning] || DIVERGENCE_CONFIG.healthy

  if (!latest) {
    return <Empty description="暂无背离信号数据" />
  }

  const broadVal = Math.round(latest.broad_avg_rate)
  const industryVal = Math.round(latest.industry_avg_rate)

  return (
    <div>
      {/* Gauge area + Status indicator */}
      <Row gutter={[24, 16]} align="middle">
        <Col xs={24} md={10}>
          <div style={{
            background: cfg.bg,
            border: `1px solid ${cfg.border}`,
            borderRadius: 12,
            padding: '20px 16px',
            textAlign: 'center',
          }}>
            {/* Dual gauge visual */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 48, marginBottom: 16 }}>
              {/* Broad needle */}
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: 90, height: 90, borderRadius: '50%',
                  background: `conic-gradient(#1677ff 0deg ${broadVal * 3.6}deg, #1f1f1f ${broadVal * 3.6}deg 360deg)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 8px',
                }}>
                  <div style={{
                    width: 60, height: 60, borderRadius: '50%',
                    background: '#0d0d0d',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexDirection: 'column',
                  }}>
                    <span style={{ fontSize: 18, fontWeight: 700, color: '#1677ff' }}>{broadVal}%</span>
                  </div>
                </div>
                <Tag color="blue">大盘宽基</Tag>
              </div>

              {/* Industry needle */}
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: 90, height: 90, borderRadius: '50%',
                  background: `conic-gradient(#fa8c16 0deg ${industryVal * 3.6}deg, #1f1f1f ${industryVal * 3.6}deg 360deg)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 8px',
                }}>
                  <div style={{
                    width: 60, height: 60, borderRadius: '50%',
                    background: '#0d0d0d',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexDirection: 'column',
                  }}>
                    <span style={{ fontSize: 18, fontWeight: 700, color: '#fa8c16' }}>{industryVal}%</span>
                  </div>
                </div>
                <Tag color="orange">行业板块</Tag>
              </div>
            </div>

            {/* Status light */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '6px 16px', borderRadius: 20,
              background: cfg.bg, border: `1px solid ${cfg.border}`,
            }}>
              <span style={{ color: cfg.color, fontSize: 18 }}>{cfg.icon}</span>
              <span style={{ color: cfg.color, fontWeight: 600, fontSize: 14 }}>{cfg.label}</span>
            </div>
          </div>
        </Col>

        <Col xs={24} md={14}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Statistic
              title="今日红盘热度"
              value={Math.round(latest.market_heat_pct)}
              suffix="%"
              valueStyle={{ color: latest.market_heat_pct >= 50 ? '#52c41a' : '#ff4d4f' }}
              prefix={<FireOutlined />}
            />
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              <span style={{ color: '#8c8c8c' }}>
                沸腾板块 <b style={{ color: '#fff' }}>{latest.hot_sectors_count}</b> / {latest.total_sectors}
              </span>
            </div>
          </div>
        </Col>
      </Row>

      {/* Warning alert for red divergence */}
      {warning === 'fake_prosperity' && (
        <Alert
          type="error"
          showIcon
          icon={<WarningOutlined />}
          message="⚠️ 红色背离警报"
          description={cfg.advice}
          style={{ marginTop: 16 }}
          banner
        />
      )}
      {warning === 'undercurrent' && (
        <Alert
          type="info"
          showIcon
          icon={<ExperimentOutlined />}
          message="🔵 暗流涌动信号"
          description={cfg.advice}
          style={{ marginTop: 16 }}
          banner
        />
      )}

      {/* Trend line chart */}
      {trend.length > 1 && (
        <div style={{ marginTop: 16 }}>
          <div style={{ color: '#8c8c8c', fontSize: 12, marginBottom: 8 }}>
            📈 近20日背离趋势（蓝=宽基 · 橙=行业）
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" />
              <XAxis
                dataKey="trade_date"
                tick={{ fill: '#8c8c8c', fontSize: 11 }}
                tickFormatter={(v) => dayjs(v).format('MM/DD')}
              />
              <YAxis domain={[0, 100]} tick={{ fill: '#8c8c8c', fontSize: 11 }} />
              <ReTooltip
                contentStyle={{ background: '#141414', border: '1px solid #333', borderRadius: 8 }}
                labelFormatter={(v) => dayjs(v).format('YYYY-MM-DD')}
              />
              <ReferenceLine y={50} stroke="#434343" strokeDasharray="5 5" />
              <Line type="monotone" dataKey="broad_avg_rate" stroke="#1677ff" strokeWidth={2} dot={false} name="宽基均值" />
              <Line type="monotone" dataKey="industry_avg_rate" stroke="#fa8c16" strokeWidth={2} dot={false} name="行业均值" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

// ------ 连强信号 (Left) ------

function ConsistentStrengthPanel({ data }) {
  if (!data || data.length === 0) {
    return <Empty description="暂无连续走强板块" />
  }

  // Build table columns
  const columns = [
    {
      title: '板块',
      dataIndex: 'sector_name',
      key: 'sector_name',
      render: (name, record) => (
        <span>
          {name}
          {record.strong_days >= 5 && (
            <Tooltip title="连续5天进入Top10，市场主线！">
              <span style={{ marginLeft: 4 }}>
                {[...Array(3)].map((_, i) => <FireOutlined key={i} style={GOLD_STYLE} />)}
              </span>
            </Tooltip>
          )}
          {record.strong_days === 4 && (
            <Tooltip title="连续4天进入Top10">
              <span style={{ marginLeft: 4 }}>
                {[...Array(2)].map((_, i) => <FireOutlined key={i} style={FLAME_STYLE} />)}
              </span>
            </Tooltip>
          )}
          {record.strong_days === 3 && (
            <Tooltip title="连续3天进入Top10">
              <FireOutlined style={FLAME_STYLE} />
            </Tooltip>
          )}
        </span>
      ),
    },
    {
      title: '强天数',
      dataIndex: 'strong_days',
      key: 'strong_days',
      width: 80,
      align: 'center',
      render: (d) => <b style={{ color: d >= 5 ? '#faad14' : '#fa8c16' }}>{d}天</b>,
    },
    {
      title: '近5日排名阶梯',
      dataIndex: 'recent_ranks',
      key: 'recent_ranks',
      width: 200,
      render: (ranks) => (
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          {[...Array(5)].map((_, i) => {
            const r = (ranks && ranks[i]) || null
            const inTop10 = r !== null && r <= 10
            return (
              <Tooltip key={i} title={r !== null ? `排名 ${r}` : '无数据'}>
                <div style={{
                  width: 28, height: 28, borderRadius: 4,
                  background: inTop10
                    ? (i >= 3 ? '#faad14' : '#fa541c')
                    : '#1f1f1f',
                  border: inTop10 ? '1px solid #fa8c16' : '1px solid #333',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, color: inTop10 ? '#fff' : '#8c8c8c',
                  transition: 'all 0.3s',
                }}>
                  {r !== null ? r : '-'}
                </div>
              </Tooltip>
            )
          })}
          <span style={{ fontSize: 10, color: '#8c8c8c', marginLeft: 4 }}>旧→新</span>
        </div>
      ),
    },
    {
      title: '热度阶梯',
      dataIndex: 'recent_ranks',
      key: 'heat_ladder',
      width: 140,
      render: (ranks) => {
        const days = ranks ? ranks.filter(r => r !== null && r <= 10).length : 0
        return (
          <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
            {[...Array(5)].map((_, i) => (
              <div key={i} style={{
                width: 20, height: 10, borderRadius: 2,
                background: i < days ? `hsl(${30 - i * 6}, 100%, ${50 - i * 5}%)` : '#1f1f1f',
                border: i < days ? 'none' : '1px solid #333',
              }} />
            ))}
            <span style={{ fontSize: 11, color: '#8c8c8c', marginLeft: 4 }}>{days}/5</span>
          </div>
        )
      },
    },
  ]

  return (
    <Table
      dataSource={data}
      columns={columns}
      rowKey="sector_name"
      size="small"
      pagination={false}
      locale={{ emptyText: '暂无连续走强板块' }}
    />
  )
}

// ------ 新面孔信号 (Right) ------

function NewFacesPanel({ data }) {
  if (!data || data.length === 0) {
    return <Empty description="暂无新面孔异动" />
  }

  const columns = [
    {
      title: '板块',
      dataIndex: 'sector_name',
      key: 'sector_name',
      render: (name, record) => {
        const isFirstTimer = record.yesterday_rank > 30
        return (
          <span style={{
            color: isFirstTimer ? '#b37feb' : undefined,
            fontWeight: isFirstTimer ? 600 : undefined,
          }}>
            {isFirstTimer && '🆕 '}
            {name}
          </span>
        )
      },
    },
    {
      title: '今日排名',
      dataIndex: 'today_rank',
      key: 'today_rank',
      width: 80,
      align: 'center',
      render: (r) => <Tag color="gold">🏆 {r}</Tag>,
    },
    {
      title: '昨日排名',
      dataIndex: 'yesterday_rank',
      key: 'yesterday_rank',
      width: 80,
      align: 'center',
      render: (r) => <span style={{ color: '#8c8c8c' }}>{r > 30 ? `${r}名外` : r}</span>,
    },
    {
      title: '位次跃升',
      dataIndex: 'rank_jump',
      key: 'rank_jump',
      width: 120,
      align: 'center',
      render: (jump, record) => {
        const isBigJump = jump >= 30
        return (
          <span style={{
            color: isBigJump ? '#b37feb' : '#52c41a',
            fontWeight: 600,
            fontSize: isBigJump ? 15 : 13,
            animation: isBigJump ? 'pulse 1.5s infinite' : undefined,
          }}>
            <RocketOutlined style={{ marginRight: 4 }} />
            +{jump}位
          </span>
        )
      },
    },
  ]

  return (
    <div>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `}</style>
      <Table
        dataSource={data}
        columns={columns}
        rowKey="sector_name"
        size="small"
        pagination={false}
        locale={{ emptyText: '暂无新面孔异动' }}
      />
    </div>
  )
}

// ------ 冰点回升信号 (Bottom) ------

function IceRecoveryPanel({ data }) {
  if (!data || data.length === 0) {
    return <Empty description="暂无冰点回升信号（好事，说明市场没有极度压抑后反弹的情况）" />
  }

  // Build data for bar chart: each sector shows prev 5d avg vs today
  const chartData = useMemo(() => {
    return data.map(item => {
      const prevAvg = item.prev_5d_rates && item.prev_5d_rates.length > 0
        ? item.prev_5d_rates.reduce((a, b) => a + b, 0) / item.prev_5d_rates.length
        : 0
      return {
        sector_name: item.sector_name,
        prev_5d_avg: Math.round(prevAvg),
        today_rate: Math.round(item.red_rate),
      }
    })
  }, [data])

  const columns = [
    {
      title: '板块',
      dataIndex: 'sector_name',
      key: 'sector_name',
      render: (name) => (
        <span>
          <ThunderboltOutlined style={{ color: '#1677ff', marginRight: 6 }} />
          {name}
          <Tag color="blue" style={{ marginLeft: 8, fontSize: 10 }}>破冰反转</Tag>
        </span>
      ),
    },
    {
      title: '今日红盘率',
      dataIndex: 'red_rate',
      key: 'red_rate',
      width: 100,
      align: 'center',
      render: (r) => <b style={{ color: '#52c41a', fontSize: 16 }}>{r}%</b>,
    },
    {
      title: '前5日最高',
      dataIndex: 'prev_5d_max',
      key: 'prev_5d_max',
      width: 100,
      align: 'center',
      render: (r) => <span style={{ color: '#8c8c8c' }}>{r ? `${r}%` : 'N/A'}</span>,
    },
    {
      title: '弹簧效应',
      dataIndex: 'red_rate',
      key: 'spring',
      width: 200,
      render: (today, record) => {
        const prevAvg = record.prev_5d_rates && record.prev_5d_rates.length > 0
          ? record.prev_5d_rates.reduce((a, b) => a + b, 0) / record.prev_5d_rates.length
          : 0
        const maxBar = Math.max(today, prevAvg, 1)
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Grey bar: prev 5d avg */}
            <Tooltip title={`前5日均值: ${Math.round(prevAvg)}%`}>
              <div style={{
                width: Math.max((prevAvg / maxBar) * 60, 2),
                height: 8, borderRadius: 4,
                background: '#434343',
              }} />
            </Tooltip>
            <span style={{ color: '#8c8c8c', fontSize: 11 }}>→</span>
            {/* Colored bar: today */}
            <Tooltip title={`今日爆发: ${Math.round(today)}%`}>
              <div style={{
                width: Math.max((today / maxBar) * 60, 2),
                height: 16, borderRadius: 4,
                background: 'linear-gradient(90deg, #1677ff, #52c41a)',
              }} />
            </Tooltip>
          </div>
        )
      },
    },
  ]

  return (
    <div>
      {/* Spring chart */}
      {chartData.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ color: '#8c8c8c', fontSize: 12, marginBottom: 8 }}>
            🧊→🔥 弹簧效应对比（灰=前5日平均 · 彩=今日爆发）
          </div>
          <ResponsiveContainer width="100%" height={Math.max(chartData.length * 36, 80)}>
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ left: 60, right: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" />
              <XAxis type="number" domain={[0, 100]} tick={{ fill: '#8c8c8c', fontSize: 11 }} />
              <YAxis dataKey="sector_name" type="category" tick={{ fill: '#ccc', fontSize: 12 }} width={80} />
              <ReTooltip
                contentStyle={{ background: '#141414', border: '1px solid #333', borderRadius: 8 }}
              />
              <Bar dataKey="prev_5d_avg" fill="#434343" name="前5日均值" barSize={12} />
              <Bar dataKey="today_rate" fill="#1677ff" name="今日" barSize={12}>
                {chartData.map((_, idx) => (
                  <Cell key={idx} fill="url(#springGradient)" />
                ))}
              </Bar>
              <defs>
                <linearGradient id="springGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#1677ff" />
                  <stop offset="100%" stopColor="#52c41a" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <Table
        dataSource={data}
        columns={columns}
        rowKey="sector_name"
        size="small"
        pagination={false}
        locale={{ emptyText: '暂无' }}
      />
    </div>
  )
}

// ------ 资金抱团度 ------

function ConcentrationPanel({ data }) {
  if (!data || data.length === 0) {
    return <Empty description="暂无大兵团共振板块" />
  }

  const columns = [
    {
      title: '板块',
      dataIndex: 'sector_name',
      key: 'sector_name',
      render: (name) => (
        <span>
          <TrophyOutlined style={{ color: '#faad14', marginRight: 6 }} />
          {name}
        </span>
      ),
    },
    {
      title: '成分股数',
      dataIndex: 'total_stocks',
      key: 'total_stocks',
      width: 100,
      align: 'center',
      sorter: (a, b) => a.total_stocks - b.total_stocks,
    },
    {
      title: '红盘率',
      dataIndex: 'red_rate',
      key: 'red_rate',
      width: 100,
      align: 'center',
      render: (r) => <b style={{ color: r >= 95 ? '#faad14' : '#52c41a' }}>{r}%</b>,
      sorter: (a, b) => a.red_rate - b.red_rate,
    },
    {
      title: '共振强度',
      dataIndex: 'red_rate',
      key: 'resonance',
      width: 160,
      render: (r, record) => {
        const power = r >= 95 ? '🔥🔥🔥 超强共振'
          : r >= 90 ? '🔥🔥 强共振'
          : '🔥 共振'
        const desc = record.total_stocks >= 50 ? '大兵团' : '中等集群'
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Progress
              percent={Math.round(r)}
              size="small"
              strokeColor={r >= 95 ? '#faad14' : '#52c41a'}
              style={{ width: 80, margin: 0 }}
              showInfo={false}
            />
            <span style={{ fontSize: 11, color: '#8c8c8c' }}>
              {power} · {desc}
            </span>
          </div>
        )
      },
    },
  ]

  return (
    <Table
      dataSource={data}
      columns={columns}
      rowKey="sector_name"
      size="small"
      pagination={false}
      locale={{ emptyText: '暂无' }}
    />
  )
}

// ------ 板块排名漂移 ------

function SectorDriftPanel() {
  const { data: sectorList } = useGetSectorNamesQuery()
  const [triggerDrift, { data: driftData, isFetching: driftLoading }] = useLazyGetSectorDriftQuery()
  const [selectedSector, setSelectedSector] = useState(null)
  const [options, setOptions] = useState([])

  const sectors = sectorList?.sectors || []

  const onSearch = (text) => {
    if (!text) { setOptions([]); return }
    setOptions(
      sectors
        .filter((s) => s.includes(text))
        .slice(0, 15)
        .map((s) => ({ value: s }))
    )
  }

  const onSelect = (value) => {
    setSelectedSector(value)
    triggerDrift({ sector_name: value, days: 30 })
  }

  // Prepare chart data: rank is inverted so that rank 1 appears at the top
  const chartData = useMemo(() => {
    if (!driftData?.points) return []
    const maxRank = Math.max(...driftData.points.map((p) => p.rank_pos || 999), 50)
    return driftData.points.map((p) => ({
      trade_date: p.trade_date,
      rank: p.rank_pos,
      // Invert rank: higher = better (maxRank - rank)
      rank_score: p.rank_pos ? Math.max(0, maxRank - p.rank_pos) : null,
      red_rate: p.red_rate,
    }))
  }, [driftData])

  return (
    <div>
      <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ color: '#c9d1d9', fontWeight: 500, whiteSpace: 'nowrap' }}>板块名称：</span>
        <AutoComplete
          value={selectedSector}
          options={options}
          onSearch={onSearch}
          onSelect={onSelect}
          onChange={(v) => { if (!v) { setSelectedSector(null); setOptions([]) } }}
          style={{ width: 240 }}
          placeholder="输入板块名称搜索..."
        >
          <Input allowClear />
        </AutoComplete>
      </div>

      {driftLoading && <Spin style={{ display: 'block', margin: '20px auto' }} />}

      {driftData && chartData.length > 0 && (
        <div>
          <div style={{ color: '#8c8c8c', fontSize: 12, marginBottom: 8 }}>
            📉 排名漂移图（柱=排名 · 线=红盘率%）
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" />
              <XAxis
                dataKey="trade_date"
                tick={{ fill: '#8c8c8c', fontSize: 11 }}
                tickFormatter={(v) => dayjs(v).format('MM/DD')}
              />
              {/* Inverted rank Y axis: top = rank 1 (best) */}
              <YAxis
                yAxisId="rank"
                orientation="left"
                tick={{ fill: '#1677ff', fontSize: 11 }}
                reversed
                domain={[1, 'auto']}
                label={{ value: '排名 (↓越小越强)', angle: -90, position: 'insideLeft', style: { fill: '#1677ff', fontSize: 10 } }}
              />
              <YAxis
                yAxisId="rate"
                orientation="right"
                tick={{ fill: '#fa8c16', fontSize: 11 }}
                domain={[0, 100]}
                label={{ value: '红盘率%', angle: 90, position: 'insideRight', style: { fill: '#fa8c16', fontSize: 10 } }}
              />
              <ReTooltip
                contentStyle={{ background: '#141414', border: '1px solid #333', borderRadius: 8 }}
                labelFormatter={(v) => dayjs(v).format('YYYY-MM-DD')}
                formatter={(value, name) => {
                  if (name === 'rank') return [`第 ${value} 名`, '排名']
                  if (name === 'red_rate') return [`${value}%`, '红盘率']
                  return [value, name]
                }}
              />
              <ReferenceLine y={5} yAxisId="rank" stroke="#52c41a" strokeDasharray="4 4" />
              <ReferenceLine y={10} yAxisId="rank" stroke="#faad14" strokeDasharray="4 4" />
              <Line
                type="monotone"
                dataKey="rank"
                yAxisId="rank"
                stroke="#1677ff"
                strokeWidth={2}
                dot={{ r: 3, fill: '#1677ff' }}
                name="排名"
              />
              <Line
                type="monotone"
                dataKey="red_rate"
                yAxisId="rate"
                stroke="#fa8c16"
                strokeWidth={1.5}
                strokeDasharray="4 3"
                dot={false}
                name="红盘率"
              />
            </LineChart>
          </ResponsiveContainer>
          {/* Summary stats */}
          <Row gutter={12} style={{ marginTop: 12 }}>
            <Col span={8}>
              <Statistic
                title="当前排名"
                value={chartData[chartData.length - 1]?.rank ?? '--'}
                suffix="名"
                valueStyle={{ fontSize: 18, color: '#1677ff' }}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="30日最佳"
                value={Math.min(...chartData.filter(d => d.rank).map(d => d.rank))}
                suffix="名"
                valueStyle={{ fontSize: 18, color: '#52c41a' }}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="当前红盘率"
                value={chartData[chartData.length - 1]?.red_rate ?? '--'}
                suffix="%"
                valueStyle={{ fontSize: 18, color: '#fa8c16' }}
              />
            </Col>
          </Row>
        </div>
      )}

      {driftData && chartData.length === 0 && !driftLoading && (
        <Empty description={`暂无 "${selectedSector}" 的排名数据`} image={Empty.PRESENTED_IMAGE_SIMPLE} />
      )}
    </div>
  )
}

// ============================================================
// Main Page Component
// ============================================================

export default function SectorSentimentPage() {
  const { data: latestDate } = useGetSectorSentimentLatestDateQuery()
  const [selectedDate, setSelectedDate] = useState(null)
  const queryDate = selectedDate || latestDate || undefined
  const { data, isLoading, isError, error } = useGetFullReportQuery(queryDate, { skip: !queryDate })

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <Spin size="large" tip="加载板块情绪数据..." />
      </div>
    )
  }

  if (isError) {
    return (
      <Alert
        type="error"
        message="数据加载失败"
        description={error?.message || '无法获取板块情绪数据，请检查后端服务是否正常运行。'}
        style={{ margin: 24 }}
      />
    )
  }

  if (!data) {
    return <Empty description="暂无板块情绪数据" style={{ marginTop: 100 }} />
  }

  const {
    trade_date: tradeDate,
    consistent_strength: consistent = [],
    new_faces: newFaces = [],
    ice_recovery: iceRecovery = [],
    divergence,
    concentration = [],
  } = data

  return (
    <div style={{ padding: '16px 20px' }}>
      {/* Page header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 16, flexWrap: 'wrap', gap: 8,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>📊 板块情绪</h2>
          <DatePicker
            value={selectedDate ? dayjs(selectedDate) : null}
            onChange={(d) => setSelectedDate(d ? d.format('YYYY-MM-DD') : null)}
            placeholder={latestDate || '选择日期'}
            allowClear={true}
            format="YYYY-MM-DD"
            style={{ width: 150 }}
          />
          {!selectedDate && latestDate && <Tag color="processing">{dayjs(latestDate).format('YYYY-MM-DD')} (最新)</Tag>}
          {selectedDate && <Tag color="purple">{dayjs(selectedDate).format('YYYY-MM-DD')}</Tag>}
        </div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: '#8c8c8c' }}>
            <FireOutlined style={{ color: '#fa8c16' }} /> 连强: {consistent.length}个
          </span>
          <span style={{ fontSize: 12, color: '#8c8c8c' }}>
            <RocketOutlined style={{ color: '#b37feb' }} /> 新面孔: {newFaces.length}个
          </span>
          <span style={{ fontSize: 12, color: '#8c8c8c' }}>
            <ThunderboltOutlined style={{ color: '#1677ff' }} /> 破冰: {iceRecovery.length}个
          </span>
          <span style={{ fontSize: 12, color: '#8c8c8c' }}>
            <TrophyOutlined style={{ color: '#faad14' }} /> 大兵团: {concentration.length}个
          </span>
        </div>
      </div>

      {/* =========================================== */}
      {/* TOP: 背离信号 (天平) */}
      {/* =========================================== */}
      <Card
        title={
          <span>
            <DashboardOutlined style={{ marginRight: 8, color: '#1677ff' }} />
            背离信号 · 情绪天平
            <span style={{ fontSize: 12, color: '#8c8c8c', marginLeft: 8, fontWeight: 400 }}>
              宽基 vs 行业红盘率对比 — 定当日操作总基调
            </span>
          </span>
        }
        style={{ marginBottom: 16 }}
        styles={{ header: { borderBottom: '1px solid #21262d' } }}
      >
        <DivergencePanel divergence={divergence} />
      </Card>

      {/* =========================================== */}
      {/* MIDDLE ROW: 连强信号 (Left) + 新面孔信号 (Right) */}
      {/* =========================================== */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        {/* LEFT: 连强信号 (火苗) */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <span>
                <FireOutlined style={{ marginRight: 8, color: '#fa8c16' }} />
                连强信号 · 寻找领头羊
                <span style={{ fontSize: 12, color: '#8c8c8c', marginLeft: 8, fontWeight: 400 }}>
                  过去7天≥3天排名前15
                </span>
              </span>
            }
            style={{ height: '100%' }}
            styles={{ header: { borderBottom: '1px solid #21262d' } }}
          >
            <ConsistentStrengthPanel data={consistent} />
          </Card>
        </Col>

        {/* RIGHT: 新面孔信号 (火箭) */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <span>
                <RocketOutlined style={{ marginRight: 8, color: '#b37feb' }} />
                新面孔信号 · 捕捉黑马
                <span style={{ fontSize: 12, color: '#8c8c8c', marginLeft: 8, fontWeight: 400 }}>
                  昨日30名外→今日冲进前10
                </span>
              </span>
            }
            style={{ height: '100%' }}
            styles={{ header: { borderBottom: '1px solid #21262d' } }}
          >
            <NewFacesPanel data={newFaces} />
          </Card>
        </Col>
      </Row>

      {/* =========================================== */}
      {/* BOTTOM: 冰点回升信号 (破冰) */}
      {/* =========================================== */}
      <Card
        title={
          <span>
            <ThunderboltOutlined style={{ marginRight: 8, color: '#1677ff' }} />
            冰点回升信号 · 苦尽甘来
            <span style={{ fontSize: 12, color: '#8c8c8c', marginLeft: 8, fontWeight: 400 }}>
              前5日极度低迷(&lt;25%)，今日集体爆发(&ge;80%)
            </span>
          </span>
        }
        style={{ marginBottom: 16 }}
        styles={{
          header: {
            borderBottom: '1px solid #21262d',
            background: 'linear-gradient(90deg, rgba(22,119,255,0.06) 0%, rgba(82,196,26,0.04) 100%)',
          },
        }}
      >
        <IceRecoveryPanel data={iceRecovery} />
      </Card>

      {/* =========================================== */}
      {/* BOTTOM: 资金抱团度 */}
      {/* =========================================== */}
      <Card
        title={
          <span>
            <TrophyOutlined style={{ marginRight: 8, color: '#faad14' }} />
            资金抱团度 · 大兵团作战
            <span style={{ fontSize: 12, color: '#8c8c8c', marginLeft: 8, fontWeight: 400 }}>
              成分股≥20只且红盘率≥85%的"真共振"板块
            </span>
          </span>
        }
        styles={{ header: { borderBottom: '1px solid #21262d' } }}
      >
        <ConcentrationPanel data={concentration} />
      </Card>

      {/* =========================================== */}
      {/* Sector Rank Drift */}
      {/* =========================================== */}
      <Card
        title={
          <span>
            <RiseOutlined style={{ marginRight: 8, color: '#1677ff' }} />
            板块排名漂移图
            <span style={{ fontSize: 12, color: '#8c8c8c', marginLeft: 8, fontWeight: 400 }}>
              输入板块名称，查看近30日排名变化趋势
            </span>
          </span>
        }
        style={{ marginTop: 16 }}
        styles={{ header: { borderBottom: '1px solid #21262d' } }}
      >
        <SectorDriftPanel />
      </Card>

      {/* Legend */}
      <div style={{
        display: 'flex', gap: 24, flexWrap: 'wrap', marginTop: 24,
        padding: '12px 16px', background: 'rgba(255,255,255,0.02)',
        borderRadius: 8, border: '1px solid #21262d',
        fontSize: 12, color: '#8c8c8c',
      }}>
        <span><FireOutlined style={{ color: '#fa8c16' }} /> 火苗=连强天数</span>
        <span><RocketOutlined style={{ color: '#b37feb' }} /> 火箭=位次跃升</span>
        <span><ThunderboltOutlined style={{ color: '#1677ff' }} /> 破冰=冰点反转</span>
        <span><TrophyOutlined style={{ color: '#faad14' }} /> 大兵团=权重共振</span>
        <span><DashboardOutlined style={{ color: '#1677ff' }} /> 天平=背离监测</span>
      </div>
    </div>
  )
}
