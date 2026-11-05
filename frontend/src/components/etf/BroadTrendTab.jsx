import { Card, Col, Empty, Row, Spin, Table } from 'antd'
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useGetEtfBroadTrendQuery } from '../../app/api'
import StatCard from './StatCard'
import { pctColor, fmtPctColored } from './format'

const SERIES_COLORS = ['#1677ff', '#ff4d4f', '#52c41a', '#faad14', '#13c2c2', '#722ed1', '#eb2f96', '#fa8c16']

const BroadTrendTab = ({ tradeDate, onOpenDetail }) => {
  const { data, isLoading } = useGetEtfBroadTrendQuery({ trade_date: tradeDate }, { skip: !tradeDate })

  if (isLoading) return <div style={{ textAlign: 'center', padding: 60 }}><Spin /></div>
  if (!data) return <Empty description="暂无数据" style={{ padding: 60 }} />

  const columns = [
    {
      title: '名称', dataIndex: 'name',
      render: (v, r) => <span style={{ color: '#fff' }}><strong>{v}</strong> <span style={{ color: '#8b949e', fontSize: 11 }}>{r.symbol}</span></span>,
    },
    { title: '今日涨幅', dataIndex: 'today_return', sorter: (a, b) => a.today_return - b.today_return, render: (v) => fmtPctColored(v) },
    { title: '5日涨幅', dataIndex: 'ret_5d', sorter: (a, b) => a.ret_5d - b.ret_5d, render: (v) => fmtPctColored(v) },
    { title: '20日涨幅', dataIndex: 'ret_20d', sorter: (a, b) => a.ret_20d - b.ret_20d, render: (v) => fmtPctColored(v) },
  ]

  const trendSeries = data.trend_series || []
  const trendDates = data.trend_dates || []
  const chartData = trendDates.map((d, i) => {
    const row = { date: d }
    for (const s of trendSeries) row[s.symbol] = s.values?.[i]
    return row
  })

  const spreads = data.spreads || {}

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={16}>
          <Card title="宽基代表 ETF" size="small">
            <Table
              dataSource={data.etfs || []}
              rowKey="symbol"
              size="small"
              columns={columns}
              pagination={false}
              onRow={(r) => ({ onClick: () => onOpenDetail && onOpenDetail(r.symbol), style: { cursor: 'pointer' } })}
            />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="风格强弱（5日收益差）" size="small">
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <StatCard label="大小盘强弱差" value={spreads.size_style != null ? spreads.size_style.toFixed(2) : '--'} suffix="pp" color={pctColor(spreads.size_style)} sub="中证1000 - 沪深300" />
              </Col>
              <Col span={12}>
                <StatCard label="成长价值强弱差" value={spreads.growth_value != null ? spreads.growth_value.toFixed(2) : '--'} suffix="pp" color={pctColor(spreads.growth_value)} sub="创业板 - 上证50" />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      <Card title="宽基趋势对比（近 30 个交易日，基点 100）" size="small">
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={chartData}>
            <CartesianGrid stroke="#30363d" strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fill: '#8b949e', fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
            <YAxis domain={['auto', 'auto']} tick={{ fill: '#8b949e', fontSize: 11 }} />
            <Tooltip contentStyle={{ background: '#141414', border: '1px solid #333', borderRadius: 8 }} labelStyle={{ color: '#c9d1d9' }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {trendSeries.map((s, i) => (
              <Line key={s.symbol} type="monotone" dataKey={s.symbol} name={s.name} stroke={SERIES_COLORS[i % SERIES_COLORS.length]} strokeWidth={1.6} dot={false} connectNulls />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </div>
  )
}

export default BroadTrendTab
