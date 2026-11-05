import { Card, Empty, Select, Space, Spin, Table, Tag } from 'antd'
import { useState } from 'react'
import { useGetEtfMetaQuery, useGetEtfRankingQuery } from '../../app/api'
import { UP, DOWN, fmtPctColored, fmtAmount } from './format'

const EtfRankingTab = ({ tradeDate, onOpenDetail }) => {
  const { data: meta } = useGetEtfMetaQuery()
  const [etfType, setEtfType] = useState(undefined)
  const [etfSubType, setEtfSubType] = useState(undefined)
  const [industryName, setIndustryName] = useState(undefined)
  const [sortBy, setSortBy] = useState('today_return')
  const [order, setOrder] = useState('desc')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)

  const params = {
    trade_date: tradeDate,
    etf_type: etfType, etf_sub_type: etfSubType, industry_name: industryName,
    sort_by: sortBy, order, page, page_size: pageSize,
  }
  const { data, isLoading, isFetching } = useGetEtfRankingQuery(params, { skip: !tradeDate })

  const sortOrderFor = (key) => (sortBy === key ? (order === 'asc' ? 'ascend' : 'descend') : null)

  const columns = [
    { title: '代码', dataIndex: 'symbol', width: 100, render: (v) => <span style={{ color: '#8b949e', fontSize: 12 }}>{v}</span> },
    { title: '名称', dataIndex: 'name', render: (v) => <strong style={{ color: '#fff' }}>{v}</strong> },
    { title: '一级分类', dataIndex: 'etf_type', width: 100, render: (v) => <Tag color="blue">{v || '-'}</Tag> },
    { title: '二级分类', dataIndex: 'etf_sub_type', width: 110, render: (v) => <span style={{ color: '#8b949e', fontSize: 12 }}>{v || '-'}</span> },
    { title: '行业', dataIndex: 'industry_name', width: 110, render: (v) => <span style={{ color: '#c9d1d9' }}>{v || '-'}</span> },
    { title: '今日涨幅', dataIndex: 'today_return', key: 'today_return', width: 110, sorter: true, sortOrder: sortOrderFor('today_return'), render: (v) => fmtPctColored(v) },
    { title: '5日涨幅', dataIndex: 'ret_5d', key: 'ret_5d', width: 110, sorter: true, sortOrder: sortOrderFor('ret_5d'), render: (v) => fmtPctColored(v) },
    { title: '20日涨幅', dataIndex: 'ret_20d', key: 'ret_20d', width: 110, sorter: true, sortOrder: sortOrderFor('ret_20d'), render: (v) => fmtPctColored(v) },
    { title: 'MA20', dataIndex: 'ma20_status', key: 'ma20_status', width: 80, sorter: true, sortOrder: sortOrderFor('ma20_status'), render: (v) => <span style={{ color: v === '站上' ? UP : v === '站下' ? DOWN : '#8b949e', fontWeight: 600 }}>{v}</span> },
    { title: '成交额', dataIndex: 'amount', key: 'amount', width: 100, sorter: true, sortOrder: sortOrderFor('amount'), render: (v) => <span style={{ color: '#c9d1d9' }}>{fmtAmount(v)}</span> },
  ]

  const handleChange = (pagination, filters, sorter) => {
    setPage(pagination.current || 1)
    setPageSize(pagination.pageSize || 50)
    if (sorter?.order) {
      setSortBy(sorter.columnKey || 'today_return')
      setOrder(sorter.order === 'ascend' ? 'asc' : 'desc')
    } else {
      setSortBy('today_return')
      setOrder('desc')
    }
  }

  const toOpts = (arr) => (arr || []).map((v) => ({ label: v, value: v }))

  return (
    <Card size="small">
      <Space wrap style={{ marginBottom: 12 }}>
        <Select allowClear placeholder="一级分类" value={etfType} onChange={(v) => { setEtfType(v); setPage(1) }} style={{ width: 160 }} options={toOpts(meta?.etf_types)} />
        <Select allowClear placeholder="二级分类" value={etfSubType} onChange={(v) => { setEtfSubType(v); setPage(1) }} style={{ width: 160 }} options={toOpts(meta?.etf_sub_types)} />
        <Select allowClear placeholder="具体行业" value={industryName} onChange={(v) => { setIndustryName(v); setPage(1) }} style={{ width: 180 }} options={toOpts(meta?.industry_names)} />
      </Space>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 60 }}><Spin /></div>
      ) : !data?.etfs?.length ? (
        <Empty description="暂无数据" style={{ padding: 60 }} />
      ) : (
        <Table
          dataSource={data.etfs}
          rowKey="symbol"
          size="small"
          loading={isFetching}
          columns={columns}
          onChange={handleChange}
          pagination={{
            current: page, pageSize, total: data.total, showSizeChanger: true,
            showTotal: (t) => `共 ${t} 只 ETF`,
          }}
          scroll={{ x: 1100 }}
          onRow={(r) => ({ onClick: () => onOpenDetail && onOpenDetail(r.symbol), style: { cursor: 'pointer' } })}
        />
      )}
    </Card>
  )
}

export default EtfRankingTab
