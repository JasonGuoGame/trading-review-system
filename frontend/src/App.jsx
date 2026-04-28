import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { Layout, Menu } from 'antd'
import {
  DashboardOutlined,
  UnorderedListOutlined,
  PlusCircleOutlined,
  BarChartOutlined,
  CalendarOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons'
import Dashboard from './pages/Dashboard'
import Trades from './pages/Trades'
import TradeDetail from './pages/TradeDetail'
import TradeForm from './pages/TradeForm'
import Analysis from './pages/Analysis'
import DailyReview from './pages/DailyReview'
import AbnormalCapitalPage from './pages/AbnormalCapitalPage'

const { Sider, Content } = Layout

const menuItems = [
  { key: '/', icon: <DashboardOutlined />, label: '仪表盘' },
  { key: '/daily-review', icon: <CalendarOutlined />, label: '每日复盘' },
  { key: '/trades', icon: <UnorderedListOutlined />, label: '交易列表' },
  { key: '/trades/new', icon: <PlusCircleOutlined />, label: '新建交易' },
  { key: '/abnormal-capital', icon: <ThunderboltOutlined />, label: '异动资金' },
  { key: '/analysis', icon: <BarChartOutlined />, label: '分析中心' },
]

function App() {
  const navigate = useNavigate()
  const location = useLocation()

  const selectedKey = menuItems
    .map((item) => item.key)
    .filter((key) => location.pathname === key || (key !== '/' && location.pathname.startsWith(key)))
    .sort((a, b) => b.length - a.length)[0] || '/'

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
            📈 交易复盘
          </h1>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ marginTop: 8 }}
        />
      </Sider>
      <Layout style={{ marginLeft: 220, background: '#0a0a0a' }}>
        <Content style={{ minHeight: '100vh' }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/daily-review" element={<DailyReview />} />
            <Route path="/trades" element={<Trades />} />
            <Route path="/trades/new" element={<TradeForm />} />
            <Route path="/trades/:id" element={<TradeDetail />} />
            <Route path="/trades/:id/edit" element={<TradeForm />} />
            <Route path="/abnormal-capital" element={<AbnormalCapitalPage />} />
            <Route path="/analysis" element={<Analysis />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  )
}

export default App
