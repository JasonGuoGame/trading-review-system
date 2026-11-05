import { AppstoreOutlined, CalendarOutlined, FileSearchOutlined, FundOutlined, LineChartOutlined, SwapOutlined, TrophyOutlined } from '@ant-design/icons'
import { Card, DatePicker, Empty, Space, Tabs, Typography } from 'antd'
import dayjs from 'dayjs'
import { useEffect, useState } from 'react'
import { useGetEtfMetaQuery } from '../app/api'
import MarketOverviewTab from '../components/etf/MarketOverviewTab'
import BroadTrendTab from '../components/etf/BroadTrendTab'
import IndustryThemeTab from '../components/etf/IndustryThemeTab'
import IndustryRotationTab from '../components/etf/IndustryRotationTab'
import EtfRankingTab from '../components/etf/EtfRankingTab'
import EtfDetailTab from '../components/etf/EtfDetailTab'

const { Title, Text } = Typography

const tabItems = [
  { key: 'overview', icon: <FundOutlined />, label: '市场总览' },
  { key: 'broad', icon: <LineChartOutlined />, label: '宽基趋势' },
  { key: 'industry', icon: <AppstoreOutlined />, label: '行业主题' },
  { key: 'rotation', icon: <SwapOutlined />, label: '行业轮动' },
  { key: 'ranking', icon: <TrophyOutlined />, label: 'ETF排行' },
  { key: 'detail', icon: <FileSearchOutlined />, label: 'ETF详情' },
]

const EtfCockpitPage = () => {
  const { data: meta } = useGetEtfMetaQuery()
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedDate, setSelectedDate] = useState(dayjs())
  const [selectedSymbol, setSelectedSymbol] = useState(null)

  useEffect(() => {
    if (meta?.latest_trade_date) {
      setSelectedDate(dayjs(meta.latest_trade_date))
    }
  }, [meta?.latest_trade_date])

  const tradeDate = selectedDate.format('YYYY-MM-DD')

  const openDetail = (symbol) => {
    setSelectedSymbol(symbol)
    setActiveTab('detail')
  }

  return (
    <div className="page-container" style={{ padding: '24px', background: '#0a0a0a', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <Title level={2} style={{ color: '#fff', marginBottom: 4 }}>🚀 ETF 全景驾驶舱</Title>
          <Text type="secondary">市场强弱 · 宽基趋势 · 行业轮动 · 个股详情</Text>
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

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems.map((t) => ({ ...t, key: t.key, label: <span>{t.icon} {t.label}</span> }))}
        style={{ margin: 0 }}
        tabBarStyle={{ background: '#141414', padding: '0 16px', borderBottom: '1px solid #30363d', margin: 0, borderRadius: '8px 8px 0 0' }}
      />
      <div style={{ padding: '16px 0 0' }}>
        {activeTab === 'overview' && <MarketOverviewTab tradeDate={tradeDate} onOpenDetail={openDetail} />}
        {activeTab === 'broad' && <BroadTrendTab tradeDate={tradeDate} onOpenDetail={openDetail} />}
        {activeTab === 'industry' && <IndustryThemeTab tradeDate={tradeDate} onOpenDetail={openDetail} />}
        {activeTab === 'rotation' && <IndustryRotationTab tradeDate={tradeDate} />}
        {activeTab === 'ranking' && <EtfRankingTab tradeDate={tradeDate} onOpenDetail={openDetail} />}
        {activeTab === 'detail' && (
          selectedSymbol
            ? <EtfDetailTab symbol={selectedSymbol} tradeDate={tradeDate} />
            : <Card><Empty description="从排行 / 宽基 / 行业点击任意 ETF 查看详情" /></Card>
        )}
      </div>
    </div>
  )
}

export default EtfCockpitPage
