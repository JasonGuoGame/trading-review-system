import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Table, Card, Tag, Button, Input, Select, DatePicker, Space, Row, Col,
} from 'antd'
import { PlusOutlined, EyeOutlined, SearchOutlined } from '@ant-design/icons'
import { useGetTradesQuery } from '../app/api'
import { formatMoney, formatPercent, formatDate, getPnlClass, getScoreColor } from '../utils/format'
import { STRATEGIES, SCORES } from '../utils/constants'

const { RangePicker } = DatePicker

function Trades() {
  const navigate = useNavigate()
  const [filters, setFilters] = useState({
    page: 1,
    size: 20,
    symbol: '',
    start_date: '',
    end_date: '',
    pnl: '',
    strategy: '',
    score: '',
  })

  const { data, isLoading } = useGetTradesQuery(filters)

  const updateFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }))
  }

  const columns = [
    {
      title: '股票',
      dataIndex: 'symbol',
      key: 'symbol',
      render: (v) => <strong style={{ color: '#fff' }}>{v}</strong>,
      width: 100,
    },
    {
      title: '策略',
      dataIndex: 'strategy',
      key: 'strategy',
      width: 100,
    },
    {
      title: '方向',
      dataIndex: 'direction',
      key: 'direction',
      width: 80,
      render: (v) => (
        <Tag color={v === 'long' ? 'green' : 'red'}>
          {v === 'long' ? '做多' : '做空'}
        </Tag>
      ),
    },
    {
      title: '盈亏',
      dataIndex: 'total_pnl',
      key: 'total_pnl',
      width: 120,
      render: (v) => <span className={getPnlClass(v)}>{formatMoney(v)}</span>,
      sorter: (a, b) => a.total_pnl - b.total_pnl,
    },
    {
      title: '盈亏 %',
      dataIndex: 'total_pnl_pct',
      key: 'total_pnl_pct',
      width: 100,
      render: (v) => <span className={getPnlClass(v)}>{formatPercent(v)}</span>,
    },
    {
      title: '持仓天数',
      key: 'holding_days',
      width: 90,
      render: (_, record) => {
        if (!record.entry_date) return '0 天'
        const start = new Date(record.entry_date)
        const end = record.status === 'closed' && record.exit_date ? new Date(record.exit_date) : new Date()
        const days = Math.max(0, Math.floor((end - start) / (1000 * 60 * 60 * 24)))
        return `${days} 天`
      },
    },
    {
      title: '标签',
      dataIndex: 'tags',
      key: 'tags',
      width: 160,
      render: (tags) =>
        tags?.map((tag) => (
          <Tag key={tag.id} color={tag.category === '错误' ? 'red' : 'blue'}>
            {tag.name}
          </Tag>
        )),
    },
    {
      title: '评分',
      dataIndex: 'grade',
      key: 'grade',
      width: 70,
      render: (v) => v ? <Tag color={getScoreColor(v)}>{v}</Tag> : '--',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (v) => (
        <Tag color={v === 'open' ? 'processing' : 'default'}>
          {v === 'open' ? '持仓中' : '已平仓'}
        </Tag>
      ),
    },
    {
      title: '入场日期',
      dataIndex: 'entry_date',
      key: 'entry_date',
      width: 110,
      render: (v) => formatDate(v),
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_, record) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/trades/${record.id}`)}
        >
          查看
        </Button>
      ),
    },
  ]

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontSize: 24, fontWeight: 600, margin: 0 }}>📋 交易列表</h2>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          onClick={() => navigate('/trades/new')}
        >
          新建交易
        </Button>
      </div>

      {/* Filter Bar */}
      <Card style={{ marginBottom: 16 }} bodyStyle={{ padding: '16px' }}>
        <Row gutter={[12, 12]}>
          <Col xs={24} sm={12} md={6}>
            <Input
              placeholder="搜索股票代码"
              prefix={<SearchOutlined />}
              value={filters.symbol}
              onChange={(e) => updateFilter('symbol', e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <RangePicker
              style={{ width: '100%' }}
              onChange={(dates) => {
                if (dates) {
                  updateFilter('start_date', dates[0].format('YYYY-MM-DD'))
                  setFilters((prev) => ({ ...prev, end_date: dates[1].format('YYYY-MM-DD'), page: 1 }))
                } else {
                  updateFilter('start_date', '')
                  setFilters((prev) => ({ ...prev, end_date: '', page: 1 }))
                }
              }}
            />
          </Col>
          <Col xs={12} sm={8} md={3}>
            <Select
              placeholder="盈亏"
              style={{ width: '100%' }}
              value={filters.pnl || undefined}
              onChange={(v) => updateFilter('pnl', v || '')}
              allowClear
              options={[
                { value: 'win', label: '盈利' },
                { value: 'loss', label: '亏损' },
              ]}
            />
          </Col>
          <Col xs={12} sm={8} md={3}>
            <Select
              placeholder="策略"
              style={{ width: '100%' }}
              value={filters.strategy || undefined}
              onChange={(v) => updateFilter('strategy', v || '')}
              allowClear
              options={STRATEGIES.map((s) => ({ value: s, label: s }))}
            />
          </Col>
          <Col xs={12} sm={8} md={3}>
            <Select
              placeholder="评分"
              style={{ width: '100%' }}
              value={filters.score || undefined}
              onChange={(v) => updateFilter('score', v || '')}
              allowClear
              options={SCORES.map((s) => ({ value: s, label: s }))}
            />
          </Col>
        </Row>
      </Card>

      {/* Trade Table */}
      <Card bodyStyle={{ padding: 0 }}>
        <Table
          columns={columns}
          dataSource={data?.data || []}
          rowKey="id"
          loading={isLoading}
          scroll={{ x: 1100 }}
          pagination={{
            current: data?.page || 1,
            pageSize: data?.size || 20,
            total: data?.total || 0,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (page, size) => setFilters((prev) => ({ ...prev, page, size })),
          }}
          onRow={(record) => ({
            onClick: () => navigate(`/trades/${record.id}`),
            style: { cursor: 'pointer' },
          })}
        />
      </Card>
    </div>
  )
}

export default Trades
