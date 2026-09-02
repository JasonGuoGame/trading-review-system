import { useMemo, useState } from 'react'
import dayjs from 'dayjs'
import { Modal, Row, Col, Statistic, Radio, Tag, Spin, Empty, Typography } from 'antd'
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell,
  Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip as ReTooltip,
  XAxis, YAxis,
} from 'recharts'
import { useGetSectorTrendQuery } from '../../app/api'

const { Text } = Typography

// 中国股市惯例：红=流入(涨)，绿=流出(跌)
const INFLOW = '#cf1322'
const OUTFLOW = '#3f8600'
const CAPITAL_SCORE = '#1677ff'
const ATTACK_SCORE = '#fa8c16'
const MUTED = '#8c8c8c'

const fmtYi = (v) => `${v > 0 ? '+' : ''}${v.toFixed(1)}亿`
const fmtPct = (v) => `${v > 0 ? '+' : ''}${v.toFixed(2)}%`

const tooltipStyle = {
  background: '#141414',
  border: '1px solid #333',
  borderRadius: 8,
  fontSize: 12,
}

function StatTile({ title, value, color, suffix }) {
  return (
    <Statistic
      title={title}
      value={value}
      suffix={suffix}
      valueStyle={{ fontSize: 18, color, fontWeight: 600 }}
    />
  )
}

export default function SectorDriftModal({ visible, sectorName, endDate, onClose }) {
  const [days, setDays] = useState(30)

  const { data, isFetching } = useGetSectorTrendQuery(
    { sector: sectorName, end_date: endDate, days },
    { skip: !visible || !sectorName }
  )

  // trend_days 已按时间升序（旧→新），逐日累计得到资金漂移曲线
  const chartData = useMemo(() => {
    const daysList = data?.trend_days || []
    let acc = 0
    return daysList.map((d) => {
      acc += d.net_inflow
      return {
        trade_date: d.trade_date,
        net_inflow: d.net_inflow,
        net_inflow_rate: d.net_inflow_rate,
        capital_score: d.capital_score,
        attack_score: d.attack_score,
        cum: acc,
        cum_pos: acc > 0 ? acc : 0,
        cum_neg: acc < 0 ? acc : 0,
      }
    })
  }, [data])

  const latest = chartData[chartData.length - 1]
  const inflowRatio = data?.total_days ? Math.round((data.inflow_days / data.total_days) * 100) : null

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      width={960}
      title={
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
          <span>🌊 {sectorName || '--'}</span>
          <Text type="secondary" style={{ fontWeight: 400, fontSize: 13 }}>
            资金漂移 · 截至 {endDate || '--'}
          </Text>
          {data?.leader_stock && <Tag color="magenta">龙头 {data.leader_stock}</Tag>}
          <Tag color="blue">{data?.trend_symbol || '-'}</Tag>
        </span>
      }
      styles={{ body: { maxHeight: 'calc(100vh - 180px)', overflowY: 'auto' } }}
    >
      {isFetching ? (
        <div style={{ textAlign: 'center', padding: 60 }}><Spin size="large" /></div>
      ) : !data || chartData.length === 0 ? (
        <Empty description={`暂无 "${sectorName}" 的资金数据`} image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <>
          {/* 操作建议 */}
          <div style={{ marginBottom: 16 }}>
            <Text strong style={{ fontSize: 15, color: data.suggestion.includes('🔥') || data.suggestion.includes('📈') ? INFLOW : data.suggestion.includes('❌') || data.suggestion.includes('📉') ? OUTFLOW : '#faad14' }}>
              {data.suggestion}
            </Text>
          </div>

          {/* 关键指标 */}
          <Row gutter={16} style={{ marginBottom: 8 }}>
            <Col span={6}>
              <StatTile title={`累计净流入(${data.total_days}日)`} value={data.cumulative_inflow.toFixed(1)} suffix="亿" color={data.cumulative_inflow >= 0 ? INFLOW : OUTFLOW} />
            </Col>
            <Col span={6}>
              <StatTile title="最新单日净流入" value={latest?.net_inflow?.toFixed(1)} suffix="亿" color={(latest?.net_inflow || 0) >= 0 ? INFLOW : OUTFLOW} />
            </Col>
            <Col span={6}>
              <StatTile title="最新流入率" value={data.latest_inflow_rate.toFixed(2)} suffix="%" color={data.latest_inflow_rate >= 0 ? INFLOW : OUTFLOW} />
            </Col>
            <Col span={6}>
              <Statistic
                title="流入天数占比"
                value={inflowRatio ?? '--'}
                suffix={inflowRatio != null ? '%' : ''}
                valueStyle={{ fontSize: 18, color: (inflowRatio ?? 50) >= 50 ? INFLOW : OUTFLOW, fontWeight: 600 }}
              />
              <Text type="secondary" style={{ fontSize: 12 }}>流入 {data.inflow_days}/{data.total_days} 天</Text>
            </Col>
          </Row>

          {/* 周期切换 */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            <Radio.Group value={days} onChange={(e) => setDays(e.target.value)} size="small" optionType="button" buttonStyle="solid">
              <Radio.Button value={30}>30日</Radio.Button>
              <Radio.Button value={60}>60日</Radio.Button>
              <Radio.Button value={365}>全部</Radio.Button>
            </Radio.Group>
          </div>

          {/* 资金漂移（累计净流入） */}
          <div style={{ color: MUTED, fontSize: 12, marginBottom: 6 }}>📈 资金漂移（累计净流入 · 红=净流入 / 绿=净流出）</div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="cumInflow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={INFLOW} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={INFLOW} stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="cumOutflow" x1="0" y1="1" x2="0" y2="0">
                  <stop offset="0%" stopColor={OUTFLOW} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={OUTFLOW} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" />
              <XAxis dataKey="trade_date" tick={{ fill: MUTED, fontSize: 11 }} tickFormatter={(v) => dayjs(v).format('MM/DD')} />
              <YAxis tick={{ fill: MUTED, fontSize: 11 }} width={60} tickFormatter={(v) => `${v}亿`} />
              <ReTooltip
                contentStyle={tooltipStyle}
                labelFormatter={(v) => dayjs(v).format('YYYY-MM-DD')}
                formatter={(value, name, item) => {
                  if (name === 'cum_neg') return null
                  return [fmtYi(item.payload.cum), '累计净流入']
                }}
              />
              <ReferenceLine y={0} stroke="#595959" strokeDasharray="4 4" />
              <Area type="monotone" dataKey="cum_pos" name="累计净流入" baseValue={0} stroke={INFLOW} strokeWidth={2} fill="url(#cumInflow)" dot={false} />
              <Area type="monotone" dataKey="cum_neg" name="累计净流入" baseValue={0} stroke={OUTFLOW} strokeWidth={2} fill="url(#cumOutflow)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>

          {/* 每日净流入 */}
          <div style={{ color: MUTED, fontSize: 12, margin: '16px 0 6px' }}>📊 每日净流入（亿 · 红=流入 / 绿=流出）</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" vertical={false} />
              <XAxis dataKey="trade_date" tick={{ fill: MUTED, fontSize: 11 }} tickFormatter={(v) => dayjs(v).format('MM/DD')} />
              <YAxis tick={{ fill: MUTED, fontSize: 11 }} width={60} tickFormatter={(v) => `${v}亿`} />
              <ReTooltip
                contentStyle={tooltipStyle}
                labelFormatter={(v) => dayjs(v).format('YYYY-MM-DD')}
                formatter={(value, name, item) => [
                  fmtYi(item.payload.net_inflow),
                  '净流入',
                ]}
                cursor={{ fill: 'rgba(255,255,255,0.04)' }}
              />
              <Bar dataKey="net_inflow" name="净流入" radius={[3, 3, 0, 0]}>
                {chartData.map((d, i) => (
                  <Cell key={i} fill={d.net_inflow >= 0 ? INFLOW : OUTFLOW} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* 资金/攻击评分 */}
          <div style={{ color: MUTED, fontSize: 12, margin: '16px 0 6px' }}>🎯 资金评分 vs 攻击评分（0-100）</div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" />
              <XAxis dataKey="trade_date" tick={{ fill: MUTED, fontSize: 11 }} tickFormatter={(v) => dayjs(v).format('MM/DD')} />
              <YAxis domain={[0, 100]} tick={{ fill: MUTED, fontSize: 11 }} width={40} />
              <ReTooltip
                contentStyle={tooltipStyle}
                labelFormatter={(v) => dayjs(v).format('YYYY-MM-DD')}
                formatter={(value, name) =>
                  name === 'capital_score' ? [`${value}`, '资金评分'] : [`${value}`, '攻击评分']
                }
              />
              <Line type="monotone" dataKey="capital_score" name="资金评分" stroke={CAPITAL_SCORE} strokeWidth={2} dot={false} connectNulls />
              <Line type="monotone" dataKey="attack_score" name="攻击评分" stroke={ATTACK_SCORE} strokeWidth={2} strokeDasharray="5 3" dot={false} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </>
      )}
    </Modal>
  )
}
