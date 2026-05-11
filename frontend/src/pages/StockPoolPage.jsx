import React, { useState } from 'react';
import { Layout, Typography, Space, Button, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import HeaderSummary from '../components/stockpool/HeaderSummary';
import PoolTabs from '../components/stockpool/PoolTabs';
import StockPoolTable from '../components/stockpool/StockPoolTable';
import StockDetailDrawer from '../components/stockpool/StockDetailDrawer';
import { useGetStockPoolQuery, useGetMarketBreadthQuery, useGetSectorFundFlowQuery } from '../app/api';
import dayjs from 'dayjs';

const { Content } = Layout;
const { Title } = Typography;

const StockPoolPage = () => {
  const [activeTab, setActiveTab] = useState('short');
  const [selectedStock, setSelectedStock] = useState(null);
  const [drawerVisible, setDrawerVisible] = useState(false);

  const today = dayjs().format('YYYY-MM-DD');
  
  // Data fetching
  const { data: stocks = [], isLoading: stocksLoading } = useGetStockPoolQuery({ type: activeTab });
  const { data: marketBreadth } = useGetMarketBreadthQuery(today);
  const { data: sectorFlow } = useGetSectorFundFlowQuery({ limit: 5 });

  const handleRowClick = (stock) => {
    setSelectedStock(stock);
    setDrawerVisible(true);
  };

  const handleCloseDrawer = () => {
    setDrawerVisible(false);
    setSelectedStock(null);
  };

  // Prepare market overview data
  const marketOverview = {
    status: marketBreadth ? (marketBreadth.advancers > marketBreadth.decliners ? '强势' : '分歧') : '强势',
    advancers: marketBreadth?.advancers || 0,
    decliners: marketBreadth?.decliners || 0,
    mainThemes: sectorFlow?.strong_sectors?.slice(0, 3).map(s => s.sector_name) || ['机器人', 'AI', '电力'],
    topFund: {
      name: sectorFlow?.strong_sectors?.[0]?.sector_name || '机器人',
      flow: sectorFlow?.strong_sectors?.[0] 
        ? `+${(sectorFlow.strong_sectors[0].total_net_inflow / 100000000).toFixed(1)}亿` 
        : '+82亿'
    }
  };

  return (
    <div className="page-container" style={{ padding: '24px', background: '#0a0a0a', minHeight: '100vh' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Title level={2} style={{ color: '#fff', margin: 0 }}>🧠 股票池作战中心</Title>
          <Typography.Text type="secondary">Trading Command Center - 区分逻辑，快速决策</Typography.Text>
        </div>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          size="large"
          style={{ background: 'linear-gradient(135deg, #1677ff, #722ed1)', border: 'none' }}
          onClick={() => message.info('添加股票功能开发中...')}
        >
          添加股票
        </Button>
      </header>

      <HeaderSummary marketData={marketOverview} />

      <div style={{ background: '#141414', padding: '20px', borderRadius: 12, border: '1px solid #30363d' }}>
        <PoolTabs activeKey={activeTab} onChange={setActiveTab} />
        
        <StockPoolTable 
          type={activeTab} 
          data={stocks} 
          loading={stocksLoading} 
          onRowClick={handleRowClick}
        />
      </div>

      <StockDetailDrawer 
        visible={drawerVisible} 
        stock={selectedStock} 
        onClose={handleCloseDrawer} 
      />
    </div>
  );
};

export default StockPoolPage;
