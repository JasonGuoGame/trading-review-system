import { Fragment } from 'react'
import { Card, Empty, Spin, Table } from 'antd'
import { useGetEtfRotationQuery } from '../../app/api'
import { UP, DOWN, NEUTRAL, fmtPct } from './format'

const statusColor = (s) => ({ '排名上升': UP, '持续强势': '#faad14', '排名下降': DOWN, '保持': NEUTRAL }[s] || NEUTRAL)

const RankLadder = ({ ranks }) => {
  const list = Array.isArray(ranks) ? ranks : []
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {list.map((r, i) => (
        <div key={i} style={{
          width: 22, height: 22, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 700,
          background: r <= 5 ? 'rgba(255,77,79,0.18)' : r <= 10 ? 'rgba(250,173,20,0.14)' : 'rgba(255,255,255,0.06)',
          color: r <= 5 ? UP : r <= 10 ? '#faad14' : '#8b949e',
        }}>{r}</div>
      ))}
    </div>
  )
}

const ReturnHeatmap = ({ industries }) => {
  const vals = industries.flatMap((ind) => [ind.ret_1d, ind.ret_5d, ind.ret_20d].filter((v) => v != null))
  const maxAbs = Math.max(1, ...vals.map((v) => Math.abs(v)))
  const cellBg = (v) => {
    if (v == null) return 'rgba(255,255,255,0.04)'
    const a = Math.min(1, Math.abs(v) / maxAbs)
    return v >= 0 ? `rgba(255,77,79,${0.15 + 0.55 * a})` : `rgba(82,196,26,${0.15 + 0.55 * a})`
  }
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(90px, 1fr) repeat(3, 70px)', gap: 4, fontSize: 12 }}>
        <div style={{ color: '#8b949e', fontSize: 11 }}>行业</div>
        {['1日', '5日', '20日'].map((h) => <div key={h} style={{ color: '#8b949e', fontSize: 11, textAlign: 'center' }}>{h}</div>)}
        {industries.map((ind) => (
          <Fragment key={ind.industry_name}>
            <div style={{ color: '#c9d1d9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ind.industry_name}</div>
            {[ind.ret_1d, ind.ret_5d, ind.ret_20d].map((v, i) => (
              <div key={i} style={{ background: cellBg(v), borderRadius: 4, padding: '6px 4px', textAlign: 'center', color: '#fff' }}>{fmtPct(v, 1)}</div>
            ))}
          </Fragment>
        ))}
      </div>
    </div>
  )
}

const IndustryRotationTab = ({ tradeDate }) => {
  const { data, isLoading } = useGetEtfRotationQuery({ trade_date: tradeDate }, { skip: !tradeDate })
  if (isLoading) return <div style={{ textAlign: 'center', padding: 60 }}><Spin /></div>
  if (!data?.industries?.length) return <Empty description="暂无数据" style={{ padding: 60 }} />

  const columns = [
    { title: '行业', dataIndex: 'industry_name', fixed: 'left', render: (v) => <strong style={{ color: '#fff' }}>{v}</strong> },
    {
      title: '今日排名', dataIndex: 'today_rank', width: 90, sorter: (a, b) => a.today_rank - b.today_rank,
      render: (v) => <span style={{ fontWeight: 700, color: v <= 5 ? UP : v <= 10 ? '#faad14' : '#c9d1d9' }}>{v}</span>,
    },
    { title: '昨日排名', dataIndex: 'yesterday_rank', width: 90, render: (v) => <span style={{ color: '#8b949e' }}>{v || '-'}</span> },
    { title: '近5日排名', dataIndex: 'rank_5d', width: 90, render: (v) => <span style={{ color: '#c9d1d9' }}>{v}</span> },
    {
      title: '状态', dataIndex: 'status', width: 100,
      render: (v) => <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 12, background: 'rgba(255,255,255,0.06)', color: statusColor(v) }}>{v}</span>,
    },
    { title: '排名阶梯（近7日）', dataIndex: 'daily_ranks', render: (v) => <RankLadder ranks={v} /> },
  ]

  return (
    <div>
      <Card size="small" style={{ marginBottom: 16 }}>
        <Table
          dataSource={data.industries}
          rowKey="industry_name"
          size="small"
          columns={columns}
          pagination={{ pageSize: 30, showSizeChanger: true, showTotal: (t) => `共 ${t} 个行业` }}
          scroll={{ x: 700 }}
        />
      </Card>
      <Card title="行业收益热力图（1日 / 5日 / 20日）" size="small">
        <ReturnHeatmap industries={data.industries} />
      </Card>
    </div>
  )
}

export default IndustryRotationTab
