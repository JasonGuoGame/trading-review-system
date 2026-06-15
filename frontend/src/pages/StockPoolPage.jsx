import React, { useState, useEffect } from 'react';
import { Typography, Space, Button, InputNumber, Row, Col } from 'antd';
import { PlusOutlined, CalendarOutlined } from '@ant-design/icons';
import StrategyPerformanceHeader from '../components/stockpool/StrategyPerformanceHeader';
import PoolTabs from '../components/stockpool/PoolTabs';
import StockPoolTable from '../components/stockpool/StockPoolTable';
import StockDetailDrawer from '../components/stockpool/StockDetailDrawer';
import TradingPhaseGuide from '../components/stockpool/TradingPhaseGuide';
import VolumePriceStrategy from '../components/stockpool/VolumePriceStrategy';
import WinnerModeHeader from '../components/stockpool/WinnerModeHeader';
import StockPoolSearch from '../components/stockpool/StockPoolSearch';
import AddStockModal from '../components/stockpool/AddStockModal';
import { useGetStockPoolQuery, useGetStockPoolCountsQuery } from '../app/api';

const { Title } = Typography;

const StockPoolPage = () => {
  const [activeTab, setActiveTab] = useState(null);
  const [tabOrder, setTabOrder] = useState(null);
  const defaultSet = React.useRef(false);
  const [selectedStock, setSelectedStock] = useState(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [addStockOpen, setAddStockOpen] = useState(false);
  const [days, setDays] = useState(1);

  const { data: stocks = [], isFetching, refetch } = useGetStockPoolQuery({ type: activeTab, days: days || undefined }, { refetchOnMountOrArgChange: true });
  const { data: counts = {} } = useGetStockPoolCountsQuery(undefined, { refetchOnMountOrArgChange: true });

  useEffect(() => {
    if (tabOrder && tabOrder.length > 0) {
      if (!activeTab || !tabOrder.includes(activeTab)) {
        setActiveTab(tabOrder[0]);
      }
    }
  }, [tabOrder, activeTab]);

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

  const renderDivergenceReversalStrategy = () => {
    if (activeTab !== 'divergence_reversal') return null;
    return (
      <div style={{ marginBottom: 16, padding: '16px', background: 'rgba(19, 194, 194, 0.05)', border: '1px solid #13c2c2', borderRadius: 8 }}>
        <Typography.Title level={5} style={{ color: '#13c2c2', marginTop: 0 }}>🔄 分歧反包作战纪律 (Key Rules)</Typography.Title>
        <Row gutter={[16, 12]}>
          <Col span={12}><Typography.Text style={{ color: 'rgba(255,255,255,0.85)' }}>1. <Typography.Text type="danger" strong>分歧低吸承接</Typography.Text>：早盘急跌至均线附近企稳，展现强承接，可分批轻仓低吸。</Typography.Text></Col>
          <Col span={12}><Typography.Text style={{ color: 'rgba(255,255,255,0.85)' }}>3. <Typography.Text type="danger" strong>反包放量突破</Typography.Text>：突破昨日分歧高点（或最高价），且分时量能明显放大，是接力买点。</Typography.Text></Col>
          <Col span={12}><Typography.Text style={{ color: 'rgba(255,255,255,0.85)' }}>2. <Typography.Text type="success" strong>修复不及预期</Typography.Text>：缩量反弹且受阻于均线（修复无力），应果断冲高离场。</Typography.Text></Col>
          <Col span={12}><Typography.Text style={{ color: 'rgba(255,255,255,0.85)' }}>4. <Typography.Text type="success" strong>防守破位止损</Typography.Text>：若跌破昨日分歧低点支撑（反包失败），坚决止损，锁定风险。</Typography.Text></Col>
        </Row>
      </div>
    );
  };

  const renderAuctionSurgeStrategy = () => {
    if (activeTab !== 'auction_surge') return null;
    return (
      <div style={{ marginBottom: 16, padding: '16px', background: 'rgba(114, 46, 209, 0.05)', border: '1px solid #722ed1', borderRadius: 8 }}>
        <Typography.Title level={5} style={{ color: '#722ed1', marginTop: 0 }}>🔔 竞价异动作战纪律 (Key Rules)</Typography.Title>
        <Row gutter={[16, 12]}>
          <Col span={12}><Typography.Text style={{ color: 'rgba(255,255,255,0.85)' }}>1. <Typography.Text type="danger" strong>竞价超强抢筹</Typography.Text>：竞价量比大幅放大（{'>'}20倍），开盘小幅高开（0%~4%），放量上攻时顺势介入。</Typography.Text></Col>
          <Col span={12}><Typography.Text style={{ color: 'rgba(255,255,255,0.85)' }}>3. <Typography.Text type="danger" strong>资金深度参与</Typography.Text>：早盘竞价成交金额达数千万以上，表征大资金关注度极高，择机分时低吸。</Typography.Text></Col>
          <Col span={12}><Typography.Text style={{ color: 'rgba(255,255,255,0.85)' }}>2. <Typography.Text type="success" strong>规避超高开盘</Typography.Text>：开盘涨幅超7%或直接顶一字，防范冲高回落被动接盘，需观察分时承接。</Typography.Text></Col>
          <Col span={12}><Typography.Text style={{ color: 'rgba(255,255,255,0.85)' }}>4. <Typography.Text type="success" strong>防守破位减仓</Typography.Text>：开盘后分时走弱跌破均价线，或竞价抢筹冲高后无承接，跌破前低坚决止损。</Typography.Text></Col>
        </Row>
      </div>
    );
  };

  const renderMacdBollStrategy = () => {
    if (activeTab !== 'trend_following') return null;
    return (
      <div style={{ marginBottom: 16, padding: '16px', background: 'rgba(8, 151, 156, 0.05)', border: '1px solid #08979c', borderRadius: 8 }}>
        <Typography.Title level={5} style={{ color: '#08979c', marginTop: 0 }}>🧘 MACD+BOLL 影线作战纪律 — 位置决定性质</Typography.Title>
        <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 12 }}>
          核心原则：影线长度 ≥ 实体2倍；阳线信号强于阴线（低位）；阴线信号强于阳线（高位）
        </Typography.Text>
        <div style={{ background: 'rgba(82, 196, 26, 0.06)', border: '1px solid rgba(82, 196, 26, 0.25)', borderRadius: 6, padding: '10px 14px', marginBottom: 12 }}>
          <Typography.Title level={5} style={{ color: '#52c41a', marginTop: 0, marginBottom: 8 }}>🟢 低位区域 — 看涨格局</Typography.Title>
          <Typography.Text strong style={{ color: '#95de64', fontSize: 13 }}>📌 低位长上影线 → 「仙人指路 / 倒锤头线」— 试盘看涨</Typography.Text>
          <Row gutter={[16, 8]} style={{ marginTop: 4 }}>
            <Col span={12}><Typography.Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>1. <Typography.Text type="danger" strong style={{ fontSize: 12 }}>温和放量试盘</Typography.Text>：MACD零轴下方金叉 + BOLL中下轨，长上影伴随温和放量——主力试探上方抛压，积极看涨信号。</Typography.Text></Col>
            <Col span={12}><Typography.Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>2. <Typography.Text type="danger" strong style={{ fontSize: 12 }}>收复影线高点</Typography.Text>：若随后几天股价震荡企稳并放量突破上影线最高点→试盘成功，主升浪即将开启；止损设于影线最低点下方。</Typography.Text></Col>
            <Col span={12}><Typography.Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>3. <Typography.Text type="warning" strong style={{ fontSize: 12 }}>巨量上影警惕</Typography.Text>：若量能过大/天量，需警惕主力对倒或利空导致反弹受阻，暂观望等次日确认。</Typography.Text></Col>
          </Row>
          <div style={{ margin: '8px 0', borderTop: '1px solid rgba(82, 196, 26, 0.15)' }} />
          <Typography.Text strong style={{ color: '#95de64', fontSize: 13 }}>📌 低位长下影线 → 「锤头线 / 探底神针」— 经典见底</Typography.Text>
          <Row gutter={[16, 8]} style={{ marginTop: 4 }}>
            <Col span={12}><Typography.Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>1. <Typography.Text type="danger" strong style={{ fontSize: 12 }}>关键位锤头</Typography.Text>：打在重要均线（60日线/BOLL下轨/前低支撑）上的长下影阳线，多头强力抵抗信号，可信度极高。</Typography.Text></Col>
            <Col span={12}><Typography.Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>2. <Typography.Text type="danger" strong style={{ fontSize: 12 }}>次日阳线确认</Typography.Text>：次日收阳且站上锤头实体顶部→反转确认，是左侧交易者加仓信号；止损设于下影线最低点下方。</Typography.Text></Col>
            <Col span={12}><Typography.Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>3. <Typography.Text type="success" strong style={{ fontSize: 12 }}>破位必须止损</Typography.Text>：若跌破锤头线最低价（多头防线失守），支撑逻辑失效，须立即止损。</Typography.Text></Col>
          </Row>
        </div>
        <div style={{ background: 'rgba(255, 77, 79, 0.06)', border: '1px solid rgba(255, 77, 79, 0.25)', borderRadius: 6, padding: '10px 14px' }}>
          <Typography.Title level={5} style={{ color: '#ff4d4f', marginTop: 0, marginBottom: 8 }}>🔴 高位区域 — 见顶格局</Typography.Title>
          <Typography.Text strong style={{ color: '#ff9999', fontSize: 13 }}>📌 高位长下影线 → 「吊颈线 / 上吊线」— 上涨衰竭</Typography.Text>
          <Row gutter={[16, 8]} style={{ marginTop: 4 }}>
            <Col span={12}><Typography.Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>1. <Typography.Text type="success" strong style={{ fontSize: 12 }}>高位吊颈阴线</Typography.Text>：MACD高位死叉 + BOLL上轨，长下影阴线（下影≥实体2倍）——多头拉高出货/分歧加剧，见顶意味最浓。</Typography.Text></Col>
            <Col span={12}><Typography.Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>2. <Typography.Text type="success" strong style={{ fontSize: 12 }}>量能萎缩最危险</Typography.Text>：高位吊颈伴随缩量→上涨动能枯竭，变盘概率极高；若伴巨量→主力剧烈震荡诱多出货，均应减仓。</Typography.Text></Col>
            <Col span={12}><Typography.Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>3. <Typography.Text type="success" strong style={{ fontSize: 12 }}>次日低开即离场</Typography.Text>：形态出现后，若次日低开或收出实体阴线→空头确立，前期涨势宣告结束，坚决离场。</Typography.Text></Col>
          </Row>
          <div style={{ margin: '8px 0', borderTop: '1px solid rgba(255, 77, 79, 0.15)' }} />
          <Typography.Text strong style={{ color: '#ff9999', fontSize: 13 }}>📌 高位长上影线 → 「射击之星 / 流星线」— 强烈见顶</Typography.Text>
          <Row gutter={[16, 8]} style={{ marginTop: 4 }}>
            <Col span={12}><Typography.Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>1. <Typography.Text type="success" strong style={{ fontSize: 12 }}>高位放量流星</Typography.Text>：上影≥实体2倍 + 巨量→主力借利好盘中急拉诱多，随后反手出货致价格崩塌，是最强烈的见顶信号。</Typography.Text></Col>
            <Col span={12}><Typography.Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>2. <Typography.Text type="success" strong style={{ fontSize: 12 }}>缩量流星=试盘失败</Typography.Text>：高位缩量长上影→主力向上试盘发现抛压沉重、跟风不足，随即放弃；同样是离场/减仓信号。</Typography.Text></Col>
            <Col span={12}><Typography.Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>3. <Typography.Text type="success" strong style={{ fontSize: 12 }}>墓碑线最凶险</Typography.Text>：高位长上影阴线（墓碑线）杀跌意味比阳线更强——次日跌破实体或低开即确认见顶，立刻清仓，不抱幻想。</Typography.Text></Col>
          </Row>
        </div>
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

      <StrategyPerformanceHeader onOrderChange={setTabOrder} />

      <div style={{ background: '#141414', padding: '20px', borderRadius: 12, border: '1px solid #30363d' }}>
        <StockPoolSearch days={days} />
        <PoolTabs activeKey={activeTab} onChange={setActiveTab} counts={counts} tabOrder={tabOrder} />

        {renderDivergenceReversalStrategy()}
        {renderMacdBollStrategy()}
        {renderAuctionSurgeStrategy()}
        {activeTab === 'macd_boll' && <VolumePriceStrategy />}
        {activeTab === 'turnover_vol' && <TradingPhaseGuide />}
        {activeTab === 'winner_mode' && <WinnerModeHeader />}

        <StockPoolTable
          type={activeTab}
          data={stocks}
          loading={isFetching}
          onRowClick={handleRowClick}
          onRefresh={refetch}
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
