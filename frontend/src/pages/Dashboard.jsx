import { Row, Col, Card, Statistic, Table, Tag, Spin, Empty } from 'antd'
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  TrophyOutlined,
  ThunderboltOutlined,
  FallOutlined,
  SwapOutlined,
} from '@ant-design/icons'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell,
} from 'recharts'
import { useNavigate } from 'react-router-dom'
import {
  useGetDashboardSummaryQuery,
  useGetEquityCurveQuery,
  useGetWinRateQuery,
  useGetRecentTradesQuery,
  useGetMarketBreadthQuery,
} from '../app/api'
import { formatMoney, formatPercent, formatDate, getPnlClass, getScoreColor } from '../utils/format'
import dayjs from 'dayjs'

const COLORS = ['#52c41a', '#1677ff', '#faad14', '#ff4d4f']

function Dashboard() {
  const { data: summary, isLoading: loadingSummary } = useGetDashboardSummaryQuery()
  const { data: equityCurve, isLoading: loadingEquity } = useGetEquityCurveQuery()
  const { data: winRate, isLoading: loadingWinRate } = useGetWinRateQuery()
  const { data: recentTrades, isLoading: loadingRecent } = useGetRecentTradesQuery()
  
  const todayDateStr = dayjs().format('YYYY-MM-DD')
  const { data: breadthData, isLoading: loadingBreadth } = useGetMarketBreadthQuery(todayDateStr)

  const navigate = useNavigate()

  const recentColumns = [
    { title: '股票', dataIndex: 'symbol', key: 'symbol', render: (v) => <strong>{v}</strong> },
    {
      title: '盈亏',
      dataIndex: 'total_pnl',
      key: 'total_pnl',
      render: (v) => <span className={getPnlClass(v)}>{formatMoney(v)}</span>,
    },
    {
      title: '盈亏%',
      dataIndex: 'total_pnl_pct',
      key: 'total_pnl_pct',
      render: (v) => <span className={getPnlClass(v)}>{formatPercent(v)}</span>,
    },
    {
      title: '评分',
      dataIndex: 'execution_score',
      key: 'execution_score',
      render: (v) => v ? <Tag color={getScoreColor(v)}>{v}</Tag> : '--',
    },
    {
      title: '日期',
      dataIndex: 'entry_date',
      key: 'entry_date',
      render: (v) => formatDate(v),
    },
  ]

  const renderMarketBreadth = () => {
    if (loadingBreadth) return <Spin />
    if (!breadthData) return <Empty description="今日市场宽度未录入" />
    
    const up = breadthData.advancers || 0
    const down = breadthData.decliners || 0
    const flat = breadthData.flat || 0
    const total = up + down + flat
    const ratio = total > 0 ? (up / total * 100).toFixed(1) : 0
    const upDownRatio = down > 0 ? (up / down).toFixed(1) : up > 0 ? '∞' : 0

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>上涨：<strong>{up}</strong> 🟢</span>
          <span>下跌：<strong>{down}</strong> 🔴</span>
          <span>平盘：<strong>{flat}</strong></span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#999' }}>
          <span>上涨占比：<strong>{ratio}%</strong></span>
          <span>涨跌比：<strong>{upDownRatio}</strong></span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>🔥 涨停：<strong>{breadthData.limit_up || 0}</strong></span>
          <span>❄️ 跌停：<strong>{breadthData.limit_down || 0}</strong></span>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container">
      <h2 style={{ marginBottom: 24, fontSize: 24, fontWeight: 600 }}>📊 仪表盘</h2>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={6}>
          <Card title="今日市场情绪" bodyStyle={{ padding: '20px 24px' }}>
            {renderMarketBreadth()}
          </Card>
        </Col>
        <Col xs={24} lg={18}>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} lg={6}>
          <Card className={summary?.total_pnl >= 0 ? 'stat-card-profit' : 'stat-card-loss'}>
            <Statistic
              title="总收益"
              value={summary?.total_pnl || 0}
              precision={2}
              prefix={summary?.total_pnl >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
              suffix="$"
              valueStyle={{ color: summary?.total_pnl >= 0 ? '#52c41a' : '#ff4d4f' }}
              loading={loadingSummary}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card-neutral">
            <Statistic
              title="胜率"
              value={summary?.win_rate || 0}
              precision={1}
              prefix={<TrophyOutlined />}
              suffix="%"
              valueStyle={{ color: '#1677ff' }}
              loading={loadingSummary}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card-loss">
            <Statistic
              title="最大回撤"
              value={summary?.max_drawdown || 0}
              precision={2}
              prefix={<FallOutlined />}
              suffix="%"
              valueStyle={{ color: '#ff4d4f' }}
              loading={loadingSummary}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card-neutral">
            <Statistic
              title="交易次数"
              value={summary?.trade_count || 0}
              prefix={<SwapOutlined />}
              valueStyle={{ color: '#1677ff' }}
              loading={loadingSummary}
            />
          </Card>
        </Col>
          </Row>
        </Col>
      </Row>

      {/* Charts Row */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={16}>
          <Card title="📈 收益曲线" bodyStyle={{ padding: '12px 0' }}>
            {loadingEquity ? (
              <div style={{ textAlign: 'center', padding: 60 }}><Spin /></div>
            ) : equityCurve?.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={equityCurve}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                  <XAxis dataKey="date" stroke="#666" fontSize={12} />
                  <YAxis stroke="#666" fontSize={12} />
                  <Tooltip
                    contentStyle={{ background: '#1f1f1f', border: '1px solid #333', borderRadius: 8 }}
                    labelStyle={{ color: '#999' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="cumulative_pnl"
                    stroke="#1677ff"
                    strokeWidth={2}
                    dot={false}
                    name="累计收益"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <Empty description="暂无数据" style={{ padding: 60 }} />
            )}
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="🎯 评分分布">
            {loadingWinRate ? (
              <div style={{ textAlign: 'center', padding: 60 }}><Spin /></div>
            ) : winRate?.distribution?.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie
                    data={winRate.distribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="count"
                    nameKey="score"
                    label={({ score, count }) => `${score}: ${count}`}
                  >
                    {winRate.distribution.map((entry, idx) => (
                      <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#1f1f1f', border: '1px solid #333', borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Empty description="暂无数据" style={{ padding: 60 }} />
            )}
          </Card>
        </Col>
      </Row>

      {/* Win Rate Trend */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="📉 胜率变化">
            {loadingWinRate ? (
              <div style={{ textAlign: 'center', padding: 60 }}><Spin /></div>
            ) : winRate?.trend?.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={winRate.trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                  <XAxis dataKey="date" stroke="#666" fontSize={12} />
                  <YAxis stroke="#666" fontSize={12} domain={[0, 100]} />
                  <Tooltip contentStyle={{ background: '#1f1f1f', border: '1px solid #333', borderRadius: 8 }} />
                  <Line type="monotone" dataKey="win_rate" stroke="#52c41a" strokeWidth={2} dot={false} name="胜率%" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <Empty description="暂无数据" style={{ padding: 60 }} />
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="🕐 最近交易">
            <Table
              columns={recentColumns}
              dataSource={recentTrades || []}
              rowKey="id"
              pagination={false}
              size="small"
              loading={loadingRecent}
              onRow={(record) => ({
                onClick: () => navigate(`/trades/${record.id}`),
                style: { cursor: 'pointer' },
              })}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Dashboard
