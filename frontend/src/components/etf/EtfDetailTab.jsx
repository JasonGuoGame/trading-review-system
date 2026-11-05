import { Card, Col, Empty, Row, Spin, Tag } from 'antd'
import { useGetEtfDetailQuery } from '../../app/api'
import StatCard from './StatCard'
import EtfKlineChart from './EtfKlineChart'
import { UP, DOWN, pctColor, fmtPct, fmtAmount } from './format'

const EtfDetailTab = ({ symbol, tradeDate }) => {
  const { data, isLoading } = useGetEtfDetailQuery({ symbol, trade_date: tradeDate }, { skip: !symbol })

  if (!symbol) return <Empty description="请选择一只 ETF" style={{ padding: 60 }} />
  if (isLoading) return <div style={{ textAlign: 'center', padding: 60 }}><Spin /></div>
  if (!data) return <Empty description="未找到该 ETF" style={{ padding: 60 }} />

  const stats = data.stats || {}

  return (
    <div>
      <Card size="small" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div style={{ color: '#fff', fontSize: 20, fontWeight: 700 }}>
              {data.name} <span style={{ color: '#8b949e', fontSize: 13 }}>{data.symbol}</span>
            </div>
            <div style={{ marginTop: 4 }}>
              <Tag color="blue">{data.etf_type || '-'}</Tag>
              <Tag color="purple">{data.etf_sub_type || '-'}</Tag>
              {data.industry_name && <Tag color="geekblue">{data.industry_name}</Tag>}
              {data.exchange && <Tag color="cyan">{data.exchange}</Tag>}
            </div>
          </div>
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <div style={{ fontSize: 12, color: '#8b949e' }}>最新价</div>
            <div style={{ color: '#fff', fontSize: 26, fontWeight: 700 }}>{data.latest_close?.toFixed(3)}</div>
            <div style={{ color: pctColor(data.today_return), fontWeight: 600 }}>{fmtPct(data.today_return)}</div>
            <div style={{ color: '#8b949e', fontSize: 12 }}>成交额 {fmtAmount(data.amount)}</div>
          </div>
        </div>
      </Card>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} lg={4}><StatCard label="5日收益" value={fmtPct(stats.ret_5d)} color={pctColor(stats.ret_5d)} /></Col>
        <Col xs={12} lg={4}><StatCard label="20日收益" value={fmtPct(stats.ret_20d)} color={pctColor(stats.ret_20d)} /></Col>
        <Col xs={12} lg={4}><StatCard label="60日收益" value={fmtPct(stats.ret_60d)} color={pctColor(stats.ret_60d)} /></Col>
        <Col xs={12} lg={4}><StatCard label="近20日最高" value={stats.high_20d?.toFixed(3)} /></Col>
        <Col xs={12} lg={4}><StatCard label="当前回撤" value={fmtPct(stats.drawdown_20d)} color={pctColor(stats.drawdown_20d)} /></Col>
        <Col xs={12} lg={4}>
          <StatCard
            label="均线状态" value={stats.ma20_status} suffix={` / ${stats.ma60_status}`}
            color={stats.ma20_status === '站上' ? UP : stats.ma20_status === '站下' ? DOWN : '#8b949e'}
            sub="MA20 / MA60"
          />
        </Col>
      </Row>

      <EtfKlineChart klines={data.klines || []} />
    </div>
  )
}

export default EtfDetailTab
