import { Card, Col, Empty, Row, Spin } from 'antd'
import { useGetEtfOverviewQuery } from '../../app/api'
import StatCard from './StatCard'
import { UP, DOWN, NEUTRAL, pctColor, fmtPct, fmtAmount } from './format'

const TypeDistribution = ({ data }) => {
  const list = Array.isArray(data) ? data : []
  const total = list.reduce((s, b) => s + (b.count || 0), 0) || 1
  return (
    <div>
      {list.map((b) => (
        <div key={b.etf_type} style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ color: '#c9d1d9', fontSize: 13 }}>{b.label}</span>
            <span style={{ color: '#8b949e', fontSize: 12 }}>{b.count} 只 · {(b.count / total * 100).toFixed(1)}%</span>
          </div>
          <div style={{ background: '#1a1a2e', height: 8, borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ width: `${(b.count / total * 100).toFixed(1)}%`, background: '#1677ff', height: '100%' }} />
          </div>
        </div>
      ))}
    </div>
  )
}

const StrengthDistribution = ({ strength }) => {
  const s = strength || { up: 0, flat: 0, down: 0 }
  const total = (s.up + s.flat + s.down) || 1
  const items = [
    { label: '上涨', count: s.up, color: UP },
    { label: '平盘', count: s.flat, color: NEUTRAL },
    { label: '下跌', count: s.down, color: DOWN },
  ]
  return (
    <div>
      <div style={{ display: 'flex', height: 14, borderRadius: 7, overflow: 'hidden', background: '#1a1a2e', marginBottom: 12 }}>
        <div style={{ flex: s.up, background: UP }} />
        <div style={{ flex: s.flat, background: NEUTRAL }} />
        <div style={{ flex: s.down, background: DOWN }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-around' }}>
        {items.map((it) => (
          <div key={it.label} style={{ textAlign: 'center' }}>
            <div style={{ color: it.color, fontSize: 20, fontWeight: 700 }}>{it.count}</div>
            <div style={{ color: '#8b949e', fontSize: 11 }}>{it.label} {(it.count / total * 100).toFixed(1)}%</div>
          </div>
        ))}
      </div>
    </div>
  )
}

const ObservationCard = ({ label, brief, onOpenDetail }) => {
  if (!brief) {
    return (
      <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: 14, border: '1px solid rgba(255,255,255,0.06)', height: '100%' }}>
        <span style={{ fontSize: 11, color: '#8b949e' }}>{label}</span>
        <div style={{ color: '#8b949e', marginTop: 8 }}>--</div>
      </div>
    )
  }
  return (
    <div
      onClick={() => onOpenDetail && onOpenDetail(brief.symbol)}
      title="点击查看详情"
      style={{
        background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: 14,
        border: '1px solid rgba(255,255,255,0.06)', height: '100%', cursor: 'pointer',
      }}
    >
      <span style={{ fontSize: 11, color: '#8b949e', display: 'block' }}>{label}</span>
      <div style={{ color: '#fff', fontWeight: 700, marginTop: 6, fontSize: 14 }}>{brief.name}</div>
      <div style={{ color: '#8b949e', fontSize: 11, marginTop: 2 }}>{brief.symbol}</div>
      <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ color: pctColor(brief.today_return), fontWeight: 600 }}>{fmtPct(brief.today_return)}</span>
        <span style={{ color: '#c9d1d9', fontSize: 12 }}>{fmtAmount(brief.amount)}</span>
      </div>
    </div>
  )
}

const MarketOverviewTab = ({ tradeDate, onOpenDetail }) => {
  const { data, isLoading } = useGetEtfOverviewQuery({ trade_date: tradeDate }, { skip: !tradeDate })

  if (isLoading) return <div style={{ textAlign: 'center', padding: 60 }}><Spin /></div>
  if (!data) return <Empty description="暂无数据" style={{ padding: 60 }} />

  const obs = data.observations || {}
  const obsCards = [
    { label: '最强宽基 ETF', brief: obs.strongest_broad },
    { label: '最强行业 ETF', brief: obs.strongest_industry },
    { label: '最弱行业 ETF', brief: obs.weakest_industry },
    { label: '成交额最大 ETF', brief: obs.max_amount },
  ]

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} lg={6}><StatCard label="ETF 总数" value={data.total_etfs} /></Col>
        <Col xs={12} lg={6}>
          <StatCard
            label="今日上涨占比" value={data.today_up_ratio?.toFixed(1)} suffix="%" color={pctColor(data.today_up_ratio)}
            sub={`上涨 ${data.today_up_count} / 平盘 ${data.today_flat_count} / 下跌 ${data.today_down_count}`}
          />
        </Col>
        <Col xs={12} lg={6}>
          <StatCard
            label="站上 MA20 占比" value={data.ma20_above_ratio?.toFixed(1)} suffix="%" color={pctColor(data.ma20_above_ratio - 50)}
            sub={`${data.ma20_above_count} / ${data.ma20_eligible} 只`}
          />
        </Col>
        <Col xs={12} lg={6}>
          <StatCard
            label="站上 MA60 占比" value={data.ma60_above_ratio?.toFixed(1)} suffix="%" color={pctColor(data.ma60_above_ratio - 50)}
            sub={`${data.ma60_above_count} / ${data.ma60_eligible} 只`}
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={12}>
          <Card title="ETF 分类分布" size="small">
            <TypeDistribution data={data.type_distribution} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="市场强弱分布" size="small">
            <StrengthDistribution strength={data.strength_distribution} />
          </Card>
        </Col>
      </Row>

      <Card title="市场观察区" size="small">
        <Row gutter={[16, 16]}>
          {obsCards.map((o) => (
            <Col xs={12} lg={6} key={o.label}>
              <ObservationCard label={o.label} brief={o.brief} onOpenDetail={onOpenDetail} />
            </Col>
          ))}
        </Row>
      </Card>
    </div>
  )
}

export default MarketOverviewTab
