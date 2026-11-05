import {
  AimOutlined,
  BarChartOutlined,
  CalendarOutlined,
  CodeOutlined,
  DashboardOutlined,
  FireOutlined,
  FundOutlined,
  PlusCircleOutlined,
  ReadOutlined,
  RobotOutlined,
  ThunderboltOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons'
import { Layout, Menu } from 'antd'
import { useEffect, useState } from 'react'
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import AbnormalCapitalPage from './pages/AbnormalCapitalPage'
import Analysis from './pages/Analysis'
import ChipMonitorPage from './pages/ChipMonitorPage'
import DailyReview from './pages/DailyReview'
import Dashboard from './pages/Dashboard'
import EtfCockpitPage from './pages/EtfCockpitPage'
import MarketAttackPage from './pages/MarketAttackPage'
import MarketTemperaturePage from './pages/MarketTemperaturePage'
import RAGAnalysisPage from './pages/RAGAnalysisPage'
import ResearchLabPage from './pages/ResearchLabPage'
import SectorFundFlowPage from './pages/SectorFundFlowPage'
import SectorSentimentPage from './pages/SectorSentimentPage'
import StockPoolPage from './pages/StockPoolPage'
import TradeDetail from './pages/TradeDetail'
import TradeForm from './pages/TradeForm'
import TradePlaybook from './pages/TradePlaybook'
import Trades from './pages/Trades'

const { Sider, Content } = Layout

const menuItems = [
  { key: '/', icon: <DashboardOutlined />, label: '仪表盘' },
  { key: '/stock-pool', icon: <FireOutlined />, label: '股票池' },
  { key: '/trade-playbook', icon: <ReadOutlined />, label: '规则手册' },
  { key: '/etf-cockpit', icon: <FundOutlined />, label: 'ETF全景' },
  { key: '/market-temperature', icon: <FireOutlined />, label: '市场温度' },
  { key: '/daily-review', icon: <CalendarOutlined />, label: '每日复盘' },
  { key: '/trades', icon: <UnorderedListOutlined />, label: '交易列表' },
  { key: '/trades/new', icon: <PlusCircleOutlined />, label: '新建交易' },
  { key: '/abnormal-capital', icon: <ThunderboltOutlined />, label: '异动资金' },
  { key: '/chip-monitor', icon: <AimOutlined />, label: '筹码监控' },
  { key: '/sector-sentiment', icon: <DashboardOutlined />, label: '板块情绪' },
  { key: '/market-attack', icon: <AimOutlined />, label: '情绪周期' },
  { key: '/sector-fund-flow', icon: <FundOutlined />, label: '资金流向' },
  { type: 'divider' },
  { key: '/research-lab', icon: <CodeOutlined />, label: 'SQL研究中心' },
  { key: '/rag-analysis', icon: <RobotOutlined />, label: 'AI 投研分析' },
  { key: '/analysis', icon: <BarChartOutlined />, label: '分析中心' },
]

function App() {
  const navigate = useNavigate()
  const location = useLocation()
  const [tick, setTick] = useState(0)

  const selectedKey = menuItems
    .map((item) => item.key)
    .filter((key) => location.pathname === key || (key !== '/' && location.pathname.startsWith(key)))
    .sort((a, b) => b.length - a.length)[0] || '/'

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  const handleMenuClick = ({ key }) => {
    if (key === location.pathname) {
      setTick((t) => t + 1)
    }
    navigate(key)
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        width={220}
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 100,
          overflowY: 'auto',
        }}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderBottom: '1px solid #21262d',
          }}
        >
          <h1 style={{
            color: '#fff',
            fontSize: 18,
            fontWeight: 700,
            margin: 0,
            background: 'linear-gradient(135deg, #1677ff, #722ed1)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            🚀 交易作战系统
          </h1>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ marginTop: 8 }}
        />
      </Sider>
      <Layout style={{ marginLeft: 220, background: '#0a0a0a' }}>
        <Content style={{ minHeight: '100vh' }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/rag-analysis" element={<RAGAnalysisPage />} />
            <Route path="/daily-review" element={<DailyReview />} />
            <Route path="/trades" element={<Trades />} />
            <Route path="/trades/new" element={<TradeForm />} />
            <Route path="/trades/:id" element={<TradeDetail />} />
            <Route path="/trades/:id/edit" element={<TradeForm />} />
            <Route path="/abnormal-capital" element={<AbnormalCapitalPage />} />
            <Route path="/chip-monitor" element={<ChipMonitorPage />} />
            <Route path="/sector-sentiment" element={<SectorSentimentPage key={`sector-sentiment-${tick}`} />} />
            <Route path="/etf-cockpit" element={<EtfCockpitPage key={`etf-cockpit-${tick}`} />} />
            <Route path="/research-lab" element={<ResearchLabPage />} />
            <Route path="/market-attack" element={<MarketAttackPage />} />
            <Route path="/sector-fund-flow" element={<SectorFundFlowPage />} />
            <Route path="/stock-pool" element={<StockPoolPage key={`stock-pool-${tick}`} />} />
            <Route path="/trade-playbook" element={<TradePlaybook key={`trade-playbook-${tick}`} />} />
            <Route path="/market-temperature" element={<MarketTemperaturePage />} />
            <Route path="/analysis" element={<Analysis />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  )
}

export default App
