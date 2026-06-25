import { useState, useEffect } from 'react'
import { Row, Col, Card, Tabs, Table, Tag, Spin, Empty, Typography, Input, Button, Descriptions, Space, message, DatePicker } from 'antd'
import { TrophyOutlined, RiseOutlined, FallOutlined, WarningOutlined, SearchOutlined, CalendarOutlined } from '@ant-design/icons'
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ResponsiveContainer,
} from 'recharts'
import dayjs from 'dayjs'
import {
  useGetChipLatestDateQuery,
  useGetChipRadarQuery,
  useGetChipAccumulationQuery,
  useGetChipPeakMoveQuery,
  useGetChipDivergenceQuery,
  useGetChipDistributionQuery,
  useLazySearchChipStockQuery,
} from '../app/api'

const { Title, Text } = Typography

const RADAR_MAX = 100

const TAB_KEYS = ['accumulation', 'peak_move', 'divergence', 'distribution']

const tabItems = [
  { key: 'accumulation', icon: <TrophyOutlined />, label: '主力吸筹榜' },
  { key: 'peak_move', icon: <RiseOutlined />, label: '筹码上移榜' },
  { key: 'divergence', icon: <WarningOutlined />, label: '筹码发散榜' },
  { key: 'distribution', icon: <FallOutlined />, label: '疑似出货榜' },
]

const TAB_LABELS = {
  accumulation: '主力吸筹榜',
  peak_move: '筹码上移榜',
  divergence: '筹码发散榜',
  distribution: '疑似出货榜',
}

const RESONANCE_COLORS = {
  '★★★★★': '#ff4d4f',
  '★★★★': '#fa541c',
  '★★★': '#faad14',
  '★★': '#52c41a',
  '★': '#8b949e',
}

const commonColumns = (showBehavior, showPeak, showWidth, showDist) => {
  const cols = [
    { title: '代码', dataIndex: 'symbol', width: 100, render: (v) => <span style={{ color: '#8b949e', fontSize: 12 }}>{v}</span> },
    { title: '名称', dataIndex: 'stock_name', width: 90, render: (v) => <strong style={{ color: '#fff' }}>{v}</strong> },
  ]
  if (showBehavior) {
    cols.push(
      { title: '行为', dataIndex: 'behavior_label', width: 70, render: (v) => <Tag color={v === '吸筹' ? 'red' : v === '拉升' ? 'orange' : 'default'}>{v || '-'}</Tag> },
      { title: '吸筹强度', dataIndex: 'behavior_strength', width: 90, sorter: (a, b) => a.behavior_strength - b.behavior_strength,
        render: (v) => <span style={{ color: '#faad14', fontWeight: 600 }}>{v?.toFixed(1)}</span> },
    )
  }
  cols.push(
    { title: '控盘', dataIndex: 'control_degree', width: 70, render: (v, r) => <span><Tag color={v >= 80 ? 'red' : v >= 60 ? 'orange' : 'default'}>{v}</Tag>{r.control_level && <span style={{ color: '#8b949e', fontSize: 10, marginLeft: 4 }}>{r.control_level}</span>}</span> },
    { title: '资金', dataIndex: 'capital_score', width: 70, render: (v) => <Tag color={v >= 80 ? 'purple' : v >= 60 ? 'blue' : 'default'}>{v}</Tag> },
  )
  if (showBehavior) {
    cols.push(
      { title: '主力净流入', dataIndex: 'main_net_inflow', width: 100, sorter: (a, b) => a.main_net_inflow - b.main_net_inflow,
        render: (v) => <span style={{ color: v > 0 ? '#ff4d4f' : '#52c41a', fontWeight: 600 }}>{v > 0 ? '+' : ''}{v?.toFixed(2)}亿</span> },
      { title: '连续流入', dataIndex: 'inflow_days', width: 80, render: (v) => <span style={{ color: v >= 3 ? '#ff4d4f' : '#faad14', fontWeight: 600 }}>{v || 0}天</span> },
    )
  }
  if (showPeak) {
    cols.push(
      { title: '筹码上移', dataIndex: 'peak_move_pct', width: 90, sorter: (a, b) => a.peak_move_pct - b.peak_move_pct,
        render: (v) => <span style={{ color: v > 0 ? '#52c41a' : '#ff4d4f', fontWeight: 600 }}>{v > 0 ? '+' : ''}{v?.toFixed(2)}%</span> },
      { title: '主力成本', dataIndex: 'estimated_main_cost', width: 90, render: (v) => <span style={{ color: '#c9d1d9' }}>{v?.toFixed(2)}</span> },
      { title: '现价', dataIndex: 'current_price', width: 80, render: (v) => <span style={{ color: '#fff' }}>{v?.toFixed(2)}</span> },
    )
  }
  if (showWidth) {
    cols.push(
      { title: '筹码宽度', dataIndex: 'chip_width70', width: 90, sorter: (a, b) => a.chip_width70 - b.chip_width70,
        render: (v) => <span style={{ color: v > 0.35 ? '#ff4d4f' : v > 0.25 ? '#faad14' : '#52c41a', fontWeight: 600 }}>{v?.toFixed(4)}</span> },
    )
  }
  if (showDist) {
    cols.push(
      { title: '出货强度', dataIndex: 'behavior_strength', width: 90, sorter: (a, b) => a.behavior_strength - b.behavior_strength,
        render: (v) => <span style={{ color: '#ff4d4f', fontWeight: 600 }}>{v?.toFixed(1)}</span> },
      { title: '主力收益率', dataIndex: 'cost_profit_pct', width: 100, sorter: (a, b) => a.cost_profit_pct - b.cost_profit_pct,
        render: (v) => <span style={{ color: '#52c41a', fontWeight: 600 }}>+{v?.toFixed(1)}%</span> },
    )
  }
  cols.push(
    { title: '获利盘', dataIndex: 'profit_ratio', width: 75, render: (v) => <span style={{ color: v > 80 ? '#ff4d4f' : '#c9d1d9' }}>{v?.toFixed(0)}%</span> },
    { title: '共振', dataIndex: 'chip_resonance_score', width: 65, sorter: (a, b) => a.chip_resonance_score - b.chip_resonance_score,
      render: (v) => <span style={{ color: v >= 80 ? '#ff4d4f' : v >= 60 ? '#faad14' : '#52c41a', fontWeight: 600 }}>{v}</span> },
    { title: '评级', dataIndex: 'resonance_rating', width: 90, render: (v) => <span style={{ color: RESONANCE_COLORS[v] || '#8b949e' }}>{v}</span> },
  )
  return cols
}

const ChipMonitorPage = () => {
  // Persist search state across page navigation
  const readSS = (key, fb) => { try { const v = sessionStorage.getItem('cm_'+key); return v != null ? JSON.parse(v) : fb } catch { return fb } }
  const writeSS = (key, val) => { try { sessionStorage.setItem('cm_'+key, JSON.stringify(val)) } catch {} }

  const [activeTab, setActiveTab] = useState('accumulation')
  const [searchQuery, setSearchQuery] = useState(() => readSS('searchQuery', ''))
  const [lastSearchQ, setLastSearchQ] = useState(() => readSS('lastSearchQ', ''))

  // Date selection
  const { data: latestDate } = useGetChipLatestDateQuery()
  const [selectedDate, setSelectedDate] = useState(dayjs())

  // Auto-set to latest available date once loaded
  useEffect(() => {
    if (latestDate) {
      setSelectedDate(dayjs(latestDate))
    }
  }, [latestDate])

  const tradeDate = selectedDate.format('YYYY-MM-DD')

  const { data: radar, isLoading: loadingRadar } = useGetChipRadarQuery(tradeDate, { skip: !tradeDate })
  const { data: accumulation, isLoading: loadingAcc } = useGetChipAccumulationQuery(tradeDate, { skip: !tradeDate })
  const { data: peakMove, isLoading: loadingPeak } = useGetChipPeakMoveQuery(tradeDate, { skip: !tradeDate })
  const { data: divergence, isLoading: loadingDiv } = useGetChipDivergenceQuery(tradeDate, { skip: !tradeDate })
  const { data: distribution, isLoading: loadingDist } = useGetChipDistributionQuery(tradeDate, { skip: !tradeDate })

  const [triggerSearch, { data: searchResult, isLoading: loadingSearch, isUninitialized }] = useLazySearchChipStockQuery()

  // Persist search state on change
  useEffect(() => { writeSS('searchQuery', searchQuery) }, [searchQuery])
  useEffect(() => { writeSS('lastSearchQ', lastSearchQ) }, [lastSearchQ])

  // Re-run search on mount (if had active search) and when date changes
  useEffect(() => {
    if (lastSearchQ.trim()) {
      triggerSearch({ q: lastSearchQ.trim(), tradeDate })
    }
  }, [tradeDate, lastSearchQ])

  const radarData = radar ? [
    { subject: '控盘度', A: radar['控盘度'] || 0, fullMark: RADAR_MAX },
    { subject: '资金流', A: radar['资金流'] || 0, fullMark: RADAR_MAX },
    { subject: '筹码集中', A: radar['筹码集中'] || 0, fullMark: RADAR_MAX },
    { subject: '获利盘', A: radar['获利盘'] || 0, fullMark: RADAR_MAX },
    { subject: '筹码上移', A: radar['筹码上移'] || 0, fullMark: RADAR_MAX },
  ] : []

  const handleSearch = () => {
    const q = searchQuery.trim()
    if (!q) {
      message.warning('请输入股票代码或名称')
      return
    }
    setLastSearchQ(q)
    triggerSearch({ q, tradeDate })
  }

  const handleTabJump = (tabKey) => {
    setActiveTab(tabKey)
    // scroll to tab
    document.querySelector('.ant-tabs')?.scrollIntoView({ behavior: 'smooth' })
  }

  const renderTable = (data, loading, columns) => {
    if (loading) return <div style={{ textAlign: 'center', padding: 60 }}><Spin /></div>
    if (!data?.stocks?.length) return <Empty description="暂无数据" style={{ padding: 60 }} />
    return (
      <Table
        dataSource={data.stocks}
        rowKey="symbol"
        size="small"
        columns={columns}
        pagination={{ pageSize: 30, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }}
        scroll={{ x: 1100 }}
      />
    )
  }

  return (
    <div className="page-container" style={{ padding: '24px', background: '#0a0a0a', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <Title level={2} style={{ color: '#fff', marginBottom: 4 }}>🎯 筹码监控</Title>
          <Text type="secondary">筹码共振雷达 · 主力行为追踪 · 实时风险预警</Text>
        </div>
        <Space>
          <CalendarOutlined style={{ color: '#8b949e', fontSize: 16 }} />
          <DatePicker
            value={selectedDate}
            onChange={(d) => setSelectedDate(d || dayjs())}
            allowClear={false}
            style={{ background: '#1a1a2e', borderColor: '#30363d' }}
          />
        </Space>
      </div>

      {/* Top section: Radar + Search */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {/* Radar */}
        <Col xs={24} lg={10}>
          <Card title="📡 筹码共振雷达" bodyStyle={{ padding: '12px 0' }}>
            {loadingRadar ? (
              <div style={{ textAlign: 'center', padding: 60 }}><Spin /></div>
            ) : radarData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="75%">
                  <PolarGrid stroke="rgba(255,255,255,0.12)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#8b949e', fontSize: 12 }} />
                  <PolarRadiusAxis angle={90} domain={[0, RADAR_MAX]} tick={{ fill: '#8b949e', fontSize: 10 }} />
                  <Radar name="共振值" dataKey="A" stroke="#1677ff" fill="#1677ff" fillOpacity={0.25} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <Empty description="暂无雷达数据" style={{ padding: 60 }} />
            )}
          </Card>
        </Col>

        {/* Search */}
        <Col xs={24} lg={14}>
          <Card title="🔍 搜索股票" bodyStyle={{ padding: 16 }}>
            <Space.Compact style={{ width: '100%', marginBottom: 16 }}>
              <Input
                placeholder="输入股票代码或名称，如 600000 或 浦发银行"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onPressEnter={handleSearch}
                prefix={<SearchOutlined style={{ color: '#8b949e' }} />}
                style={{ background: '#1a1a2e', color: '#fff', borderColor: '#30363d' }}
              />
              <Button type="primary" onClick={handleSearch} loading={loadingSearch}>
                搜索
              </Button>
            </Space.Compact>

            {loadingSearch && (
              <div style={{ textAlign: 'center', padding: 24 }}><Spin /></div>
            )}

            {!isUninitialized && searchResult === null && !loadingSearch && (
              <Empty description="未找到该股票，请确认代码或名称" style={{ padding: 24 }} />
            )}

            {searchResult && searchResult.stock && (
              <Card
                size="small"
                style={{ background: '#141414', border: '1px solid #30363d' }}
                title={
                  <span style={{ color: '#fff' }}>
                    {searchResult.stock.stock_name} <Text type="secondary" style={{ fontSize: 12 }}>{searchResult.stock.symbol}</Text>
                    <span style={{ marginLeft: 12 }}>{searchResult.stock.resonance_rating}</span>
                  </span>
                }
                extra={
                  searchResult.match_tabs && searchResult.match_tabs.length > 0 ? (
                    <Space size={4}>
                      {searchResult.match_tabs.map((t) => (
                        <Tag
                          key={t}
                          color="blue"
                          style={{ cursor: 'pointer' }}
                          onClick={() => handleTabJump(t)}
                        >
                          查看{TAB_LABELS[t]}
                        </Tag>
                      ))}
                    </Space>
                  ) : (
                    <Tag color="default">未上榜</Tag>
                  )
                }
              >
                <Descriptions size="small" column={4} labelStyle={{ color: '#8b949e' }} contentStyle={{ color: '#fff' }}>
                  <Descriptions.Item label="行为">{searchResult.stock.behavior_label || '-'}</Descriptions.Item>
                  <Descriptions.Item label="控盘分">{searchResult.stock.control_degree}</Descriptions.Item>
                  <Descriptions.Item label="控盘等级">{searchResult.stock.control_level || '-'}</Descriptions.Item>
                  <Descriptions.Item label="筹码分">{searchResult.stock.chip_score}</Descriptions.Item>
                  <Descriptions.Item label="资金分">{searchResult.stock.capital_score}</Descriptions.Item>
                  <Descriptions.Item label="主力净流入">{searchResult.stock.main_net_inflow?.toFixed(2)}亿</Descriptions.Item>
                  <Descriptions.Item label="连续流入">{searchResult.stock.inflow_days || 0}天</Descriptions.Item>
                  <Descriptions.Item label="净占比">{searchResult.stock.main_net_ratio?.toFixed(2)}%</Descriptions.Item>
                  <Descriptions.Item label="获利盘">{searchResult.stock.profit_ratio?.toFixed(0)}%</Descriptions.Item>
                  <Descriptions.Item label="筹码上移">{searchResult.stock.peak_move_pct > 0 ? '+' : ''}{searchResult.stock.peak_move_pct?.toFixed(2)}%</Descriptions.Item>
                  <Descriptions.Item label="筹码宽度">{searchResult.stock.chip_width70?.toFixed(4)}</Descriptions.Item>
                  <Descriptions.Item label="现价">{searchResult.stock.current_price?.toFixed(2)}</Descriptions.Item>
                  <Descriptions.Item label="主力成本">{searchResult.stock.estimated_main_cost?.toFixed(2)}</Descriptions.Item>
                  <Descriptions.Item label="筹码峰位置">{searchResult.stock.chip_peak_price?.toFixed(2)}</Descriptions.Item>
                  <Descriptions.Item label="主动买入占比">{searchResult.stock.buy_power_ratio?.toFixed(2)}%</Descriptions.Item>
                  <Descriptions.Item label="主动卖出占比">{searchResult.stock.sell_power_ratio?.toFixed(2)}%</Descriptions.Item>
                  <Descriptions.Item label="红量白量比">{searchResult.stock.volume_power_ratio?.toFixed(2)}</Descriptions.Item>
                </Descriptions>
              </Card>
            )}

            {isUninitialized && (
              <div style={{ textAlign: 'center', padding: 24, color: '#8b949e' }}>
                输入代码或名称查看股票所属榜单
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* Bottom section: Tabs + Table */}
      <Card bodyStyle={{ padding: 0 }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems.map((t) => ({ ...t, key: t.key, label: <span>{t.icon} {t.label}</span> }))}
          style={{ margin: 0 }}
          tabBarStyle={{ background: '#141414', padding: '0 16px', borderBottom: '1px solid #30363d', margin: 0 }}
        />
        <div style={{ padding: '12px 16px' }}>
          {activeTab === 'accumulation' && renderTable(accumulation, loadingAcc, commonColumns(true, false, false, false))}
          {activeTab === 'peak_move' && renderTable(peakMove, loadingPeak, commonColumns(false, true, false, false))}
          {activeTab === 'divergence' && renderTable(divergence, loadingDiv, commonColumns(false, false, true, false))}
          {activeTab === 'distribution' && renderTable(distribution, loadingDist, commonColumns(false, false, false, true))}
        </div>
      </Card>
    </div>
  )
}

export default ChipMonitorPage
