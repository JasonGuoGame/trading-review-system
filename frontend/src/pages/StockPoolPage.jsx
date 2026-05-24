import React, { useState } from 'react';
import { Typography, Space, Button, InputNumber, Row, Col } from 'antd';
import { PlusOutlined, CalendarOutlined } from '@ant-design/icons';
import StrategyPerformanceHeader from '../components/stockpool/StrategyPerformanceHeader';
import PoolTabs from '../components/stockpool/PoolTabs';
import StockPoolTable from '../components/stockpool/StockPoolTable';
import StockDetailDrawer from '../components/stockpool/StockDetailDrawer';
import TradingPhaseGuide from '../components/stockpool/TradingPhaseGuide';
import VolumePriceStrategy from '../components/stockpool/VolumePriceStrategy';
import WinnerModeHeader from '../components/stockpool/WinnerModeHeader';
import AddStockModal from '../components/stockpool/AddStockModal';
import { useGetStockPoolQuery } from '../app/api';

const { Title } = Typography;

const StockPoolPage = () => {
  const [activeTab, setActiveTab] = useState('short');
  const [selectedStock, setSelectedStock] = useState(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [addStockOpen, setAddStockOpen] = useState(false);
  const [days, setDays] = useState(1);

  const { data: stocks = [], isFetching, refetch } = useGetStockPoolQuery({ type: activeTab, days: days || undefined }, { refetchOnMountOrArgChange: true });

  const handleRowClick = (stock) => {
    setSelectedStock(stock);
    setDrawerVisible(true);
  };

  const handleCloseDrawer = () => {
    setDrawerVisible(false);
    setSelectedStock(null);
  };

  const renderShortTermStrategy = () => {
    if (activeTab !== 'short') return null;
    return (
      <div style={{ marginBottom: 16, padding: '16px', background: 'rgba(207, 19, 34, 0.05)', border: '1px solid #cf1322', borderRadius: 8 }}>
        <Typography.Title level={5} style={{ color: '#cf1322', marginTop: 0 }}>⚡ 短线交战纪律 (Top 8 Rules)</Typography.Title>
        <Row gutter={[16, 12]}>
          <Col span={12}><Typography.Text style={{ color: 'rgba(255,255,255,0.85)' }}>1. <Typography.Text type="danger" strong>趋势大票回踩</Typography.Text>：分时线回踩均价线不破（强势承接），果断介入。</Typography.Text></Col>
          <Col span={12}><Typography.Text style={{ color: 'rgba(255,255,255,0.85)' }}>5. <Typography.Text type="danger" strong>连板加速爆量</Typography.Text>：连板股加速后出现爆量换手（分歧转一致），留意接力机会。</Typography.Text></Col>
          <Col span={12}><Typography.Text style={{ color: 'rgba(255,255,255,0.85)' }}>2. <Typography.Text type="success" strong>情绪热点冲高</Typography.Text>：快速拉升至+7%以上未封板（动能衰竭），立即落袋。</Typography.Text></Col>
          <Col span={12}><Typography.Text style={{ color: 'rgba(255,255,255,0.85)' }}>6. <Typography.Text type="success" strong>连续拉升减仓</Typography.Text>：个股连续上涨3天（极度偏离），务必减仓一半，锁定利润。</Typography.Text></Col>
          <Col span={12}><Typography.Text style={{ color: 'rgba(255,255,255,0.85)' }}>3. <Typography.Text type="danger" strong>分时低点抬高</Typography.Text>：分时图呈现底部稳步抬升（资金建仓），逢低上车。</Typography.Text></Col>
          <Col span={12}><Typography.Text style={{ color: 'rgba(255,255,255,0.85)' }}>7. <Typography.Text type="danger" strong>中高位缩量洗盘</Typography.Text>：强势股中高位缩量震荡（筹码锁定良好），可择机低吸。</Typography.Text></Col>
          <Col span={12}><Typography.Text style={{ color: 'rgba(255,255,255,0.85)' }}>4. <Typography.Text type="success" strong>大幅低开弱势</Typography.Text>：低开超-3%且5分钟内未翻红（弱势确立），坚决离场。</Typography.Text></Col>
          <Col span={12}><Typography.Text style={{ color: 'rgba(255,255,255,0.85)' }}>8. <Typography.Text type="success" strong>高位放量滞涨</Typography.Text>：放量巨震但股价停滞不前（主力出货），立刻清仓离场。</Typography.Text></Col>
        </Row>
      </div>
    );
  };

  return (
    <div className="page-container" style={{ padding: '24px', background: '#0a0a0a', minHeight: '100vh' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Title level={2} style={{ color: '#fff', margin: 0 }}>🧠 股票池作战中心</Title>
          <Typography.Text type="secondary">Trading Command Center - 区分逻辑，快速决策</Typography.Text>
        </div>
        <Space size="middle">
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: '#1a1a2e',
            padding: '6px 16px',
            borderRadius: 8,
            border: '1px solid #30363d',
          }}>
            <CalendarOutlined style={{ color: '#8b949e', fontSize: 16 }} />
            <span style={{ color: '#8b949e', fontSize: 13, whiteSpace: 'nowrap' }}>最近</span>
            <InputNumber
              min={1}
              max={365}
              value={days}
              onChange={(val) => setDays(val)}
              style={{
                width: 64,
                background: '#0d1117',
                borderColor: '#30363d',
              }}
              size="small"
            />
            <span style={{ color: '#8b949e', fontSize: 13 }}>天</span>
          </div>
          <Button
            onClick={refetch}
            style={{ background: '#1a1a2e', borderColor: '#30363d', color: '#fff' }}
          >
            刷新
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="large"
            style={{ background: 'linear-gradient(135deg, #1677ff, #722ed1)', border: 'none' }}
            onClick={() => setAddStockOpen(true)}
          >
            添加股票
          </Button>
        </Space>
      </header>

      <StrategyPerformanceHeader />

      <div style={{ background: '#141414', padding: '20px', borderRadius: 12, border: '1px solid #30363d' }}>
        <PoolTabs activeKey={activeTab} onChange={setActiveTab} />

        {renderShortTermStrategy()}
        {activeTab === 'long' && <VolumePriceStrategy />}
        {activeTab === 'turnover_vol' && <TradingPhaseGuide />}
        {activeTab === 'winner_mode' && <WinnerModeHeader />}

        <StockPoolTable
          type={activeTab}
          data={stocks}
          loading={isFetching}
          onRowClick={handleRowClick}
        />
      </div>

      <StockDetailDrawer
        visible={drawerVisible}
        stock={selectedStock}
        onClose={handleCloseDrawer}
        onDeleted={refetch}
      />

      <AddStockModal
        open={addStockOpen}
        poolType={activeTab}
        onClose={() => setAddStockOpen(false)}
        onSuccess={refetch}
      />
    </div>
  );
};

export default StockPoolPage;
