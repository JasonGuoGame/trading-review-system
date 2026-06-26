import { CalendarOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Col, InputNumber, Row, Space, Typography } from 'antd';
import React, { useEffect, useState } from 'react';
import { useGetStockPoolCountsQuery, useGetStockPoolQuery } from '../app/api';
import AddStockModal from '../components/stockpool/AddStockModal';
import PoolTabs from '../components/stockpool/PoolTabs';
import StockDetailDrawer from '../components/stockpool/StockDetailDrawer';
import StockPoolSearch from '../components/stockpool/StockPoolSearch';
import StockPoolTable from '../components/stockpool/StockPoolTable';
import StrategyPerformanceHeader from '../components/stockpool/StrategyPerformanceHeader';
import TradingPhaseGuide from '../components/stockpool/TradingPhaseGuide';
import VolumePriceStrategy from '../components/stockpool/VolumePriceStrategy';
import WinnerModeHeader from '../components/stockpool/WinnerModeHeader';

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

  const renderGptFundStrategy = () => {
    if (activeTab !== 'gpt_fund') return null;
    return (
      <div style={{ marginBottom: 16, padding: '16px', background: 'rgba(19, 194, 194, 0.05)', border: '1px solid #13c2c2', borderRadius: 8 }}>
        <Typography.Title level={5} style={{ color: '#13c2c2', marginTop: 0 }}>🤖 GPT资金共振 · 分时交易口诀 (Intraday Rules)</Typography.Title>
        <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 12 }}>
          核心原则：开盘30分钟定胜负 —— 观察开盘幅度、翻红速度、涨停意愿，快速决策介入或离场
        </Typography.Text>

        {/* 买入口诀 */}
        <div style={{ background: 'rgba(82, 196, 26, 0.06)', border: '1px solid rgba(82, 196, 26, 0.25)', borderRadius: 6, padding: '10px 14px', marginBottom: 12 }}>
          <Typography.Title level={5} style={{ color: '#52c41a', marginTop: 0, marginBottom: 8 }}>🟢 买入口诀</Typography.Title>
          <Row gutter={[16, 12]}>
            <Col span={24}>
              <Typography.Text strong style={{ color: '#95de64', fontSize: 14 }}>📌 口诀一：低开3%以上，10分钟定生死</Typography.Text>
              <Typography.Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, display: 'block', marginTop: 4 }}>
                ✅ 10分钟内翻红且站上均价线 → <Typography.Text type="danger" strong>果断介入</Typography.Text>。低开3%以内说明空方力量有限，快速翻红+站上均价线表明多方承接强劲、主力洗盘后主动拉升。
              </Typography.Text>
              <Typography.Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, display: 'block', marginTop: 4 }}>
                ❌ 10分钟内没有翻红、没有站上均价线 → <Typography.Text type="success" strong>果断离场</Typography.Text>。低开后无力翻红且被均价线压制，说明多方承接疲弱、主力无意护盘，应避免被温水煮蛙式阴跌套牢。
              </Typography.Text>
            </Col>
            <Col span={24}>
              <Typography.Text strong style={{ color: '#95de64', fontSize: 14 }}>📌 口诀二：平开不跌，20分钟突破早盘高点</Typography.Text>
              <Typography.Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, display: 'block', marginTop: 4 }}>
                个股开盘平开，不跌不弱，20分钟内快速拉升突破早盘分时高点 → <Typography.Text type="danger" strong>果断加仓</Typography.Text>。平开说明多空均衡、没有恐慌抛压；不跌不弱表明盘中承接扎实；20分钟内突破早盘分时高点意味着主力主动进攻、打破盘整格局，是确定性加仓点。
              </Typography.Text>
            </Col>
          </Row>
        </div>

        {/* 卖出口诀 */}
        <div style={{ background: 'rgba(255, 77, 79, 0.06)', border: '1px solid rgba(255, 77, 79, 0.25)', borderRadius: 6, padding: '10px 14px', marginBottom: 12 }}>
          <Typography.Title level={5} style={{ color: '#ff4d4f', marginTop: 0, marginBottom: 8 }}>🔴 卖出口诀</Typography.Title>
          <Row gutter={[16, 12]}>
            <Col span={24}>
              <Typography.Text strong style={{ color: '#ff9999', fontSize: 14 }}>📌 口诀三：高开2%~5%，半小时不冲涨停</Typography.Text>
              <Typography.Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, display: 'block', marginTop: 4 }}>
                高开2%~5%，半小时不冲涨停 → <Typography.Text type="success" strong>先卖一半，落袋为安</Typography.Text>。高开已兑现部分利好预期，若半小时内无冲击涨停的动能，说明主力无意继续拉升，减半仓锁定利润，剩余观察。
              </Typography.Text>
            </Col>
            <Col span={24}>
              <Typography.Text strong style={{ color: '#ff9999', fontSize: 14 }}>📌 口诀四：高开5%以上，一小时不涨停 + 主力净流出</Typography.Text>
              <Typography.Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, display: 'block', marginTop: 4 }}>
                高开5%以上，一小时不涨停且主力净流出 → <Typography.Text type="success" strong>应全部卖出</Typography.Text>。大幅高开后长时间无法封板，叠加主力资金外流，是典型的"高开诱多"出货形态，不要留恋。
              </Typography.Text>
            </Col>
          </Row>
        </div>

        {/* 关注口诀 */}
        <div style={{ background: 'rgba(250, 173, 20, 0.06)', border: '1px solid rgba(250, 173, 20, 0.25)', borderRadius: 6, padding: '10px 14px' }}>
          <Typography.Title level={5} style={{ color: '#faad14', marginTop: 0, marginBottom: 8 }}>🟡 观察口诀</Typography.Title>
          <Col span={24}>
            <Typography.Text strong style={{ color: '#ffd666', fontSize: 14 }}>📌 口诀五：冲高涨停未封死</Typography.Text>
            <Typography.Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, display: 'block', marginTop: 4 }}>
              冲高涨停未封死，量能放大且持续 → <Typography.Text type="warning" strong>尾盘小回拉再补水（可关注）</Typography.Text>。涨停板被打开但量能未萎缩，说明多空分歧激烈但多方仍在努力——若尾盘回拉企稳，是次日的潜在低吸标的，加入观察清单。
            </Typography.Text>
          </Col>
        </div>
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

  const renderFourDimStrategy = () => {
    if (activeTab !== 'four_dim') return null;
    return (
      <div style={{ marginBottom: 16, padding: '16px', background: 'rgba(47, 84, 235, 0.05)', border: '1px solid #2f54eb', borderRadius: 8 }}>
        <Typography.Title level={5} style={{ color: '#2f54eb', marginTop: 0 }}>📡 四维共振作战纪律 (Four-Dimensional Resonance)</Typography.Title>
        <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 12 }}>
          核心逻辑：资金评分 + 板块流入 + 获利盘 + 主力净流入 四维共振选股。Tags 中包含 strategy、sector_rate、profit_ratio、capital_score、main_net_ratio、quantity_ratio。
        </Typography.Text>

        <Row gutter={[16, 12]}>
          <Col span={12}>
            <div style={{ background: 'rgba(47, 84, 235, 0.08)', borderRadius: 6, padding: '8px 12px', height: '100%' }}>
              <Typography.Text strong style={{ color: '#85a5ff', fontSize: 13 }}>📊 维度一：资金评分 (capital_score)</Typography.Text>
              <br />
              <Typography.Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12 }}>
                综合资金流向评分，≥80分视为强资金介入，优先关注。高分低吸，低分回避。
              </Typography.Text>
            </div>
          </Col>
          <Col span={12}>
            <div style={{ background: 'rgba(47, 84, 235, 0.08)', borderRadius: 6, padding: '8px 12px', height: '100%' }}>
              <Typography.Text strong style={{ color: '#85a5ff', fontSize: 13 }}>📈 维度二：获利盘比例 (profit_ratio)</Typography.Text>
              <br />
              <Typography.Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12 }}>
                获利盘占比过高（{'>'}95%）需警惕获利回吐；适中（60-85%）筹码结构健康，上涨阻力小。
              </Typography.Text>
            </div>
          </Col>
          <Col span={12}>
            <div style={{ background: 'rgba(47, 84, 235, 0.08)', borderRadius: 6, padding: '8px 12px', height: '100%' }}>
              <Typography.Text strong style={{ color: '#85a5ff', fontSize: 13 }}>💰 维度三：主力净流入 (main_net_ratio)</Typography.Text>
              <br />
              <Typography.Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12 }}>
                主力净流入占比，≥10%表明主力积极做多；负值或{'<'}5%说明主力参与度不足，谨慎参与。
              </Typography.Text>
            </div>
          </Col>
          <Col span={12}>
            <div style={{ background: 'rgba(47, 84, 235, 0.08)', borderRadius: 6, padding: '8px 12px', height: '100%' }}>
              <Typography.Text strong style={{ color: '#85a5ff', fontSize: 13 }}>🔄 维度四：量比 (quantity_ratio)</Typography.Text>
              <br />
              <Typography.Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12 }}>
                量比≥1.5说明放量明显，市场关注度高；量比{'<'}0.8缩量震荡，需等待放量信号再介入。
              </Typography.Text>
            </div>
          </Col>
        </Row>

        <div style={{ margin: '12px 0', borderTop: '1px solid rgba(47, 84, 235, 0.2)' }} />

        <Row gutter={[16, 8]}>
          <Col span={12}>
            <Typography.Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12 }}>
              1. <Typography.Text type="danger" strong style={{ fontSize: 12 }}>四维共振买入</Typography.Text>：资金评分≥80 + 主力净流入≥10% + 获利盘60-95% + 量比≥1.5，四项共振时果断介入。
            </Typography.Text>
          </Col>
          <Col span={12}>
            <Typography.Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12 }}>
              2. <Typography.Text type="success" strong style={{ fontSize: 12 }}>获利盘过高减仓</Typography.Text>：获利盘{'>'}98% 且资金评分下降，获利盘极度拥挤，应分批止盈锁定利润。
            </Typography.Text>
          </Col>
          <Col span={12}>
            <Typography.Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12 }}>
              3. <Typography.Text type="warning" strong style={{ fontSize: 12 }}>板块流入为负观望</Typography.Text>：sector_rate 为 0 或负值，板块资金未形成合力，个股独立行情持续性存疑，轻仓或观望。
            </Typography.Text>
          </Col>
          <Col span={12}>
            <Typography.Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12 }}>
              4. <Typography.Text type="success" strong style={{ fontSize: 12 }}>共振失效止损</Typography.Text>：若主力净流入转负或资金评分跌破60，共振逻辑破坏，应无条件止损离场。
            </Typography.Text>
          </Col>
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

      <StrategyPerformanceHeader onOrderChange={setTabOrder} />

      <div style={{ background: '#141414', padding: '20px', borderRadius: 12, border: '1px solid #30363d' }}>
        <StockPoolSearch days={days} />
        <PoolTabs activeKey={activeTab} onChange={setActiveTab} counts={counts} tabOrder={tabOrder} />

        {renderGptFundStrategy()}
        {renderDivergenceReversalStrategy()}
        {renderMacdBollStrategy()}
        {renderAuctionSurgeStrategy()}
        {renderFourDimStrategy()}
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
