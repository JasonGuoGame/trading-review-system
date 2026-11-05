import { Card, Empty, Spin, Table } from 'antd'
import { useGetEtfIndustriesQuery, useGetEtfIndustryEtfsQuery } from '../../app/api'
import { fmtPct, fmtPctColored, fmtAmount, pctColor } from './format'

const IndustryEtfs = ({ industryName, tradeDate, onOpenDetail }) => {
  const { data, isLoading } = useGetEtfIndustryEtfsQuery({ industry_name: industryName, trade_date: tradeDate }, { skip: !industryName || !tradeDate })
  if (isLoading) return <Spin size="small" />
  if (!data?.etfs?.length) return <span style={{ color: '#8b949e' }}>无成分 ETF</span>
  return (
    <Table
      dataSource={data.etfs}
      rowKey="symbol"
      size="small"
      pagination={false}
      columns={[
        { title: '代码', dataIndex: 'symbol', width: 110, render: (v) => <span style={{ color: '#8b949e', fontSize: 12 }}>{v}</span> },
        { title: 'ETF', dataIndex: 'name', render: (v) => <strong style={{ color: '#fff' }}>{v}</strong> },
        { title: '今日涨幅', dataIndex: 'today_return', width: 110, render: (v) => fmtPctColored(v) },
        { title: '5日涨幅', dataIndex: 'ret_5d', width: 110, render: (v) => fmtPctColored(v) },
        { title: '成交额', dataIndex: 'amount', width: 110, render: (v) => <span style={{ color: '#c9d1d9' }}>{fmtAmount(v)}</span> },
      ]}
      onRow={(r) => ({ onClick: () => onOpenDetail && onOpenDetail(r.symbol), style: { cursor: 'pointer' } })}
    />
  )
}

const IndustryThemeTab = ({ tradeDate, onOpenDetail }) => {
  const { data, isLoading } = useGetEtfIndustriesQuery({ trade_date: tradeDate }, { skip: !tradeDate })
  if (isLoading) return <div style={{ textAlign: 'center', padding: 60 }}><Spin /></div>
  if (!data?.industries?.length) return <Empty description="暂无数据" style={{ padding: 60 }} />

  const columns = [
    { title: '行业', dataIndex: 'industry_name', fixed: 'left', width: 120, render: (v) => <strong style={{ color: '#fff' }}>{v}</strong> },
    { title: 'ETF数', dataIndex: 'etf_count', width: 80, sorter: (a, b) => a.etf_count - b.etf_count },
    { title: '今日中位', dataIndex: 'today_median', width: 110, sorter: (a, b) => a.today_median - b.today_median, render: (v) => fmtPctColored(v) },
    { title: '今日平均', dataIndex: 'today_avg', width: 110, sorter: (a, b) => a.today_avg - b.today_avg, render: (v) => <span style={{ color: pctColor(v) }}>{fmtPct(v)}</span> },
    { title: '5日均', dataIndex: 'ret_5d_avg', width: 110, sorter: (a, b) => a.ret_5d_avg - b.ret_5d_avg, render: (v) => fmtPctColored(v) },
    { title: '20日均', dataIndex: 'ret_20d_avg', width: 110, sorter: (a, b) => a.ret_20d_avg - b.ret_20d_avg, render: (v) => fmtPctColored(v) },
    { title: '上涨占比', dataIndex: 'up_ratio', width: 110, sorter: (a, b) => a.up_ratio - b.up_ratio, render: (v) => <span style={{ color: '#faad14' }}>{v?.toFixed(1)}%</span> },
    { title: '站上MA20', dataIndex: 'ma20_ratio', width: 110, sorter: (a, b) => a.ma20_ratio - b.ma20_ratio, render: (v) => <span style={{ color: pctColor(v - 50) }}>{v?.toFixed(1)}%</span> },
    { title: '成交额', dataIndex: 'total_amount', width: 110, sorter: (a, b) => a.total_amount - b.total_amount, render: (v) => <span style={{ color: '#c9d1d9' }}>{fmtAmount(v)}</span> },
  ]

  return (
    <Card size="small">
      <Table
        dataSource={data.industries}
        rowKey="industry_name"
        size="small"
        columns={columns}
        pagination={{ pageSize: 30, showSizeChanger: true, showTotal: (t) => `共 ${t} 个行业` }}
        scroll={{ x: 900 }}
        expandable={{
          expandedRowRender: (record) => <IndustryEtfs industryName={record.industry_name} tradeDate={tradeDate} onOpenDetail={onOpenDetail} />,
          rowExpandable: (record) => record.etf_count > 0,
        }}
      />
    </Card>
  )
}

export default IndustryThemeTab
