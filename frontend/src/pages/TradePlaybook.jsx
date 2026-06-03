import React, { useState, useEffect } from 'react';
import { Typography, Card, Row, Col, Tag, Checkbox, Button, Spin, Collapse, Progress, message, DatePicker } from 'antd';
import {
  CheckCircleOutlined, CloseCircleOutlined, ThunderboltOutlined,
  RiseOutlined, FallOutlined, AimOutlined, CalendarOutlined,
  FireOutlined, FundOutlined, WarningOutlined, SaveOutlined,
  CaretRightOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  useGetMarketBreadthQuery, useGetRecentTradesQuery,
  useGetSectorFundFlowQuery, useGetTopMarketAttacksQuery,
  useGetMarketEarningEffectQuery, useGetStockPoolQuery,
  useGetTradeChecklistQuery, useUpsertTradeChecklistMutation,
} from '../app/api';

const { Title, Text } = Typography;
const { Panel } = Collapse;

const MarketPhaseBadge = ({ advancers, decliners, limitUp, limitDown }) => {
  const total = advancers + decliners;
  const upRatio = total > 0 ? advancers / total : 0;
  if (upRatio >= 0.6 && limitUp > 50) {
    return <Tag color="red" style={{ fontSize: 16, padding: '4px 16px' }}>🚀 主升期</Tag>;
  }
  if (upRatio <= 0.35 || limitDown > 50) {
    return <Tag color="blue" style={{ fontSize: 16, padding: '4px 16px' }}>❄️ 退潮期</Tag>;
  }
  return <Tag color="orange" style={{ fontSize: 16, padding: '4px 16px' }}>🌊 震荡期</Tag>;
};

const getPositionAdvice = (advancers, decliners) => {
  const total = advancers + decliners;
  const upRatio = total > 0 ? advancers / total : 0;
  if (upRatio >= 0.6) return { range: '60%-100%', color: '#52c41a', label: '可积极做多' };
  if (upRatio <= 0.35) return { range: '0%-20%', color: '#ff4d4f', label: '优先空仓' };
  return { range: '30%-50%', color: '#faad14', label: '降低仓位，快进快出' };
};

const StepHeader = ({ step, title, icon, passed }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
    <span style={{ fontSize: 22 }}>{icon}</span>
    <Text strong style={{ color: '#fff', fontSize: 15 }}>STEP {step}：{title}</Text>
    {passed === true && <Tag color="success" style={{ marginLeft: 8 }}>✅ 通过</Tag>}
    {passed === false && <Tag color="error" style={{ marginLeft: 8 }}>❌ 不通过</Tag>}
  </div>
);

const StatCard = ({ label, value, suffix = '', color = '#fff', sub }) => (
  <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '12px 16px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.06)' }}>
    <Text type="secondary" style={{ fontSize: 11 }}>{label}</Text>
    <div style={{ fontSize: 24, fontWeight: 700, color, lineHeight: 1.3 }}>{value}{suffix}</div>
    {sub && <Text type="secondary" style={{ fontSize: 10 }}>{sub}</Text>}
  </div>
);

const TradePlaybook = () => {
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const selectedDateStr = selectedDate.format('YYYY-MM-DD');
  const isToday = selectedDateStr === dayjs().format('YYYY-MM-DD');
  const [checkItems, setCheckItems] = useState({});

  const { data: breadth } = useGetMarketBreadthQuery(selectedDateStr);
  const { data: recentTrades } = useGetRecentTradesQuery();
  const { data: fundFlow } = useGetSectorFundFlowQuery({ limit: 5, date: selectedDateStr });
  const { data: topAttacks } = useGetTopMarketAttacksQuery({ limit: 5, trade_date: selectedDateStr });
  const { data: stockPool } = useGetStockPoolQuery({ trade_date: selectedDateStr });
  const { data: earningEffect } = useGetMarketEarningEffectQuery();
  const { data: checklist, isFetching: checklistLoading } = useGetTradeChecklistQuery(selectedDateStr);
  const [saveChecklist, { isLoading: saving }] = useUpsertTradeChecklistMutation();

  useEffect(() => {
    if (checklist) {
      setCheckItems({
        market_good: checklist.market_good || false,
        theme_clear: checklist.theme_clear || false,
        stock_breakout: checklist.stock_breakout || false,
        intraday_good: checklist.intraday_good || false,
        position_ok: checklist.position_ok || false,
        stoploss_set: checklist.stoploss_set || false,
        no_emotional: checklist.no_emotional || false,
      });
    }
  }, [checklist]);

  const handleCheck = (key) => {
    setCheckItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    try {
      await saveChecklist({ date: selectedDateStr, ...checkItems }).unwrap();
      message.success('核对清单已保存');
    } catch {
      message.error('保存失败');
    }
  };

  const checkedCount = Object.values(checkItems).filter(Boolean).length;

  const advancers = breadth?.advancers || 0;
  const decliners = breadth?.decliners || 0;
  const limitUp = breadth?.limit_up || 0;
  const limitDown = breadth?.limit_down || 0;
  const totalStocks = advancers + decliners;
  const upRatio = totalStocks > 0 ? (advancers / totalStocks * 100).toFixed(1) : '--';

  const posAdvice = getPositionAdvice(advancers, decliners);
  const step1Passed = advancers >= 2800;
  const fourKdown = decliners >= 4000;

  const recentList = Array.isArray(recentTrades) ? recentTrades : [];
  const recentPnls = recentList.slice(0, 10).map((t) => t.total_pnl || 0);
  let consecutiveLoss = 0;
  for (let i = 0; i < recentPnls.length; i++) {
    if (recentPnls[i] < 0) consecutiveLoss++;
    else break;
  }

  const strongSectors = fundFlow?.strong_sectors || [];
  const topSectors = Array.isArray(strongSectors) ? strongSectors : [];
  const fundSummary = fundFlow?.summary;

  const attackItems = topAttacks?.attack_list || [];
  const attackList = Array.isArray(attackItems) ? attackItems : [];

  const poolStocks = Array.isArray(stockPool) ? stockPool : [];
  const poolByType = poolStocks.reduce((acc, s) => {
    const t = s.pool_type || 'unknown';
    acc[t] = (acc[t] || 0) + 1;
    return acc;
  }, {});
  const poolTotal = poolStocks.length;
  const watchFocusList = poolStocks.filter((s) => s.is_watch_focus);

  const earningLabel = earningEffect?.sentiment || '--';

  return (
    <div style={{ padding: '24px', background: '#0a0a0a', minHeight: '100vh' }}>
      <header style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={2} style={{ color: '#fff', margin: 0 }}>📋 交易规则作战手册</Title>
          <Text type="secondary">A股主线波段交易体系 — 逐项核对，用纪律替代情绪</Text>
        </div>
        <div style={{ textAlign: 'right' }}>
          <DatePicker
            value={selectedDate}
            onChange={(d) => setSelectedDate(d || dayjs())}
            allowClear={false}
            style={{ background: '#1a1a2e', borderColor: '#30363d', color: '#fff' }}
          />
          {!isToday && (
            <Tag color="warning" style={{ marginLeft: 8 }}>查看历史</Tag>
          )}
        </div>
      </header>

      <Collapse
        accordion
        defaultActiveKey={['step1']}
        expandIcon={({ isActive }) => <CaretRightOutlined rotate={isActive ? 90 : 0} />}
        style={{ background: 'transparent', border: 'none' }}
        ghost
      >
        {/* STEP 1: Market Environment */}
        <Panel
          key="step1"
          header={<StepHeader step={1} title="市场环境判断" icon="🌍" passed={breadth ? step1Passed : null} />}
          style={{ marginBottom: 12, background: '#141414', borderRadius: 10, border: '1px solid #30363d', overflow: 'hidden' }}
        >
          {!breadth ? (
            <div style={{ textAlign: 'center', padding: 24 }}><Spin /></div>
          ) : (
            <>
              <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
                <Col span={4}><StatCard label="上涨家数" value={advancers.toLocaleString()} color="#52c41a" /></Col>
                <Col span={4}><StatCard label="下跌家数" value={decliners.toLocaleString()} color="#ff4d4f" /></Col>
                <Col span={4}><StatCard label="上涨占比" value={upRatio} suffix="%" color={upRatio > 50 ? '#52c41a' : '#ff4d4f'} /></Col>
                <Col span={4}><StatCard label="涨停" value={limitUp} suffix="家" color="#ff7a45" /></Col>
                <Col span={4}><StatCard label="跌停" value={limitDown} suffix="家" color="#ff4d4f" /></Col>
                <Col span={4}><StatCard label="成交额" value={breadth?.total_stocks?.toLocaleString() || '--'} suffix="" sub="待接入" /></Col>
              </Row>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                <Text strong style={{ color: '#fff' }}>自动判定：</Text>
                <MarketPhaseBadge advancers={advancers} decliners={decliners} limitUp={limitUp} limitDown={limitDown} />
                <Text strong style={{ color: '#fff' }}>建议仓位：</Text>
                <Text style={{ color: posAdvice.color, fontSize: 18, fontWeight: 700 }}>{posAdvice.range}</Text>
                <Tag color={posAdvice.color === '#52c41a' ? 'success' : posAdvice.color === '#ff4d4f' ? 'error' : 'warning'}>
                  {posAdvice.label}
                </Tag>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '12px 16px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <Text strong style={{ color: '#fff', fontSize: 13 }}>规则对照：</Text>
                <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {advancers >= 2800 ? <CheckCircleOutlined style={{ color: '#52c41a' }} /> : <CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
                    <Text style={{ color: advancers >= 2800 ? '#52c41a' : '#ff4d4f' }}>
                      {advancers >= 2800 ? '✅ 至少2800家上涨 → 允许积极做多' : `❌ 不足2800家上涨（当前${advancers}家）→ 谨慎操作`}
                    </Text>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {fourKdown ? <WarningOutlined style={{ color: '#ff4d4f' }} /> : <CheckCircleOutlined style={{ color: '#52c41a' }} />}
                    <Text style={{ color: fourKdown ? '#ff4d4f' : '#52c41a' }}>
                      {fourKdown ? '❌ 4000家下跌 → 禁止重仓，清仓警告！' : '✅ 未触发4000家下跌警报'}
                    </Text>
                  </div>
                </div>
              </div>
            </>
          )}
        </Panel>

        {/* STEP 2: Main Theme */}
        <Panel
          key="step2"
          header={<StepHeader step={2} title="主线题材确认" icon="🎯" />}
          style={{ marginBottom: 12, background: '#141414', borderRadius: 10, border: '1px solid #30363d', overflow: 'hidden' }}
        >
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Text strong style={{ color: '#fff', display: 'block', marginBottom: 8 }}>
                <FundOutlined /> 板块资金流入 TOP5
              </Text>
              {topSectors.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {topSectors.map((s, i) => (
                    <div key={s.sector_name || i} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 6, border: '1px solid rgba(255,255,255,0.06)',
                    }}>
                      <span>
                        <Text style={{ color: '#8b949e', fontSize: 14, marginRight: 8 }}>#{i + 1}</Text>
                        <Text style={{ color: '#fff' }}>{s.sector_name || s.name || '--'}</Text>
                      </span>
                      <Text style={{ color: s.total_net_inflow > 0 ? '#52c41a' : '#ff4d4f', fontWeight: 600 }}>
                        {s.total_net_inflow > 0 ? '+' : ''}{(s.total_net_inflow / 1e8).toFixed(2)}亿
                      </Text>
                    </div>
                  ))}
                </div>
              ) : (
                <Text type="secondary">暂无数据</Text>
              )}
            </Col>
            <Col span={12}>
              <Text strong style={{ color: '#fff', display: 'block', marginBottom: 8 }}>
                <AimOutlined /> 市场进攻方向
              </Text>
              {attackList.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {attackList.slice(0, 5).map((a, i) => (
                    <div key={a.sector_name || i} style={{
                      display: 'flex', justifyContent: 'space-between', padding: '8px 12px',
                      background: 'rgba(255,255,255,0.03)', borderRadius: 6, border: '1px solid rgba(255,255,255,0.06)',
                    }}>
                      <Text style={{ color: '#fff' }}>{a.sector_name || a.name || '--'}</Text>
                      <span>
                        <Tag color={a.trend === '主升' ? 'red' : a.trend === '退潮' ? 'blue' : 'default'} style={{ fontSize: 11 }}>{a.trend || '--'}</Tag>
                        <Text style={{ color: '#8b949e', fontSize: 12 }}>力度 {a.attack_score?.toFixed(0) || 0}</Text>
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <Text type="secondary">暂无数据</Text>
              )}
            </Col>
          </Row>
          <div style={{ marginTop: 12, background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '12px 16px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <Text strong style={{ color: '#fff', fontSize: 13 }}>手册规则：</Text>
            <ul style={{ color: '#8b949e', margin: '8px 0 0', paddingLeft: 20, fontSize: 13 }}>
              <li>是否市场主线？是否有资金持续流入？</li>
              <li>是否板块联动？龙头是否继续加强？</li>
              <li>赚钱效应：{earningLabel}</li>
            </ul>
          </div>
        </Panel>

        {/* STEP 3: Stock Selection */}
        <Panel
          key="step3"
          header={<StepHeader step={3} title="个股结构检查" icon="🔍" />}
          style={{ marginBottom: 12, background: '#141414', borderRadius: 10, border: '1px solid #30363d', overflow: 'hidden' }}
        >
          <Row gutter={[12, 12]}>
            {[
              { title: '① 放量长上影线', desc: '有资金进攻但分歧 → 次日承接确认 → 反包机会', color: '#ff7a45' },
              { title: '② 一进二', desc: '情绪加强 → 资金认可 → 容易成小龙头', color: '#1677ff' },
              { title: '③ 横盘突破', desc: '长时间筹码交换 → 突破后易加速', color: '#a0d911' },
              { title: '④ 涨停突破前高', desc: '套牢盘消化 → 资金态度明确 → 主升', color: '#faad14' },
            ].map((item) => (
              <Col span={12} key={item.title}>
                <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: 8, border: `1px solid ${item.color}33` }}>
                  <Text strong style={{ color: item.color, fontSize: 14 }}>{item.title}</Text>
                  <Text type="secondary" style={{ display: 'block', marginTop: 4, fontSize: 12 }}>{item.desc}</Text>
                </div>
              </Col>
            ))}
          </Row>
          <Text type="secondary" style={{ display: 'block', marginTop: 12, fontSize: 12 }}>
            核心逻辑：只做 <Text style={{ color: '#faad14' }}>主线 + 放量 + 突破 + 资金承接</Text>，前往 <a href="/stock-pool" style={{ color: '#1677ff' }}>股票池作战中心</a> 筛选标的
          </Text>
          {selectedDateStr && (
            <div style={{ marginTop: 12, background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '12px 16px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <Text strong style={{ color: '#fff', fontSize: 13 }}>
                {selectedDateStr} 当日股票池 · 共 {poolTotal} 只
              </Text>
              <div style={{ marginTop: 8, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {Object.entries(poolByType).map(([type, count]) => (
                  <Tag key={type} color={type === 'short' ? '#1677ff' : type === 'long' ? '#52c41a' : type === 'watch' ? '#faad14' : 'default'}>
                    {type === 'short' ? '短线' : type === 'long' ? '长线' : type === 'watch' ? '观察' : type}：{count}只
                  </Tag>
                ))}
              </div>
              {watchFocusList.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    重点关注：{watchFocusList.slice(0, 5).map((s) => s.symbol).join('、')}
                    {watchFocusList.length > 5 ? ` 等${watchFocusList.length}只` : ''}
                  </Text>
                </div>
              )}
            </div>
          )}
        </Panel>

        {/* STEP 4: Entry & Exit */}
        <Panel
          key="step4"
          header={<StepHeader step={4} title="分时/买卖确认" icon="⏱️" />}
          style={{ marginBottom: 12, background: '#141414', borderRadius: 10, border: '1px solid #30363d', overflow: 'hidden' }}
        >
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <div style={{ padding: '12px 16px', background: 'rgba(82,196,26,0.06)', borderRadius: 8, border: '1px solid rgba(82,196,26,0.2)' }}>
                <Text strong style={{ color: '#52c41a', fontSize: 14 }}>买入规则</Text>
                <ul style={{ color: '#c9d1d9', margin: '8px 0 0', paddingLeft: 18, fontSize: 12, lineHeight: 2 }}>
                  <li>不追高，只买<Text style={{ color: '#faad14' }}>放量后的回踩确认</Text></li>
                  <li>早盘 10:40 前：观察高开低走/资金承接/放量突破</li>
                  <li>午后 2:40 后：观察尾盘资金态度/抢筹/回流</li>
                  <li>核心买点：<Text strong style={{ color: '#52c41a' }}>放量突破 → 回踩 → 再次放量</Text></li>
                </ul>
              </div>
            </Col>
            <Col span={12}>
              <div style={{ padding: '12px 16px', background: 'rgba(255,77,79,0.06)', borderRadius: 8, border: '1px solid rgba(255,77,79,0.2)' }}>
                <Text strong style={{ color: '#ff4d4f', fontSize: 14 }}>卖出规则</Text>
                <ul style={{ color: '#c9d1d9', margin: '8px 0 0', paddingLeft: 18, fontSize: 12, lineHeight: 2 }}>
                  <li><Text strong style={{ color: '#ff4d4f' }}>跌破买入逻辑 → 立即卖出</Text></li>
                  <li>放量滞涨：抛压增大，资金分歧</li>
                  <li>上冲不过均价线：承接减弱</li>
                  <li>跌破开盘价：情绪转弱</li>
                </ul>
              </div>
            </Col>
          </Row>
        </Panel>

        {/* STEP 5: Position & Risk */}
        <Panel
          key="step5"
          header={<StepHeader step={5} title="仓位与风控" icon="🛡️" passed={fourKdown ? false : null} />}
          style={{ marginBottom: 12, background: '#141414', borderRadius: 10, border: '1px solid #30363d', overflow: 'hidden' }}
        >
          <Row gutter={[16, 16]}>
            <Col span={8}>
              <StatCard label="当前市场阶段" value={posAdvice.range} color={posAdvice.color} sub={posAdvice.label} />
            </Col>
            <Col span={8}>
              <StatCard
                label="连续亏损天数"
                value={consecutiveLoss}
                suffix="天"
                color={consecutiveLoss >= 3 ? '#ff4d4f' : consecutiveLoss >= 2 ? '#faad14' : '#52c41a'}
              />
            </Col>
            <Col span={8}>
              <StatCard
                label="4000家下跌"
                value={fourKdown ? '已触发' : '未触发'}
                color={fourKdown ? '#ff4d4f' : '#52c41a'}
              />
            </Col>
          </Row>
          <div style={{ marginTop: 12, background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '12px 16px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <Text strong style={{ color: '#fff', fontSize: 13 }}>风控规则：</Text>
            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {consecutiveLoss >= 3 ? <WarningOutlined style={{ color: '#ff4d4f' }} /> : <CheckCircleOutlined style={{ color: '#52c41a' }} />}
                <Text style={{ color: consecutiveLoss >= 3 ? '#ff4d4f' : '#8b949e' }}>
                  {consecutiveLoss >= 3 ? '❌ 连续3天亏损 → 强制空仓，停止交易，重新复盘' :
                   consecutiveLoss >= 2 ? '⚠️ 连续2天亏损 → 降低仓位，减少交易频率' :
                   '✅ 未触发连续亏损保护'}
                </Text>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {fourKdown ? <WarningOutlined style={{ color: '#ff4d4f' }} /> : <CheckCircleOutlined style={{ color: '#52c41a' }} />}
                <Text style={{ color: fourKdown ? '#ff4d4f' : '#8b949e' }}>
                  {fourKdown ? '❌ 系统性风险 → 清仓，禁止抄底' : '✅ 未触发系统性风险警报'}
                </Text>
              </div>
            </div>
          </div>
        </Panel>
      </Collapse>

      {/* Daily Checklist */}
      <Card
        style={{
          marginTop: 16, background: '#141414', border: '1px solid #30363d', borderRadius: 10,
        }}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FireOutlined style={{ color: '#faad14' }} />
            <Text strong style={{ color: '#fff', fontSize: 15 }}>📝 今日交易核对清单</Text>
            <Tag>{checkedCount}/7 项已确认</Tag>
          </div>
        }
        extra={isToday ? (
          <Button
            type="primary" icon={<SaveOutlined />} loading={saving}
            onClick={handleSave}
            style={{ background: 'linear-gradient(135deg, #1677ff, #722ed1)', border: 'none' }}
          >
            保存核对记录
          </Button>
        ) : (
          <Text type="secondary" style={{ fontSize: 12 }}>仅在当天可编辑核对清单</Text>
        )}
      >
        {checklistLoading ? (
          <div style={{ textAlign: 'center', padding: 24 }}><Spin /></div>
        ) : (
          <>
            <Progress percent={Math.round((checkedCount / 7) * 100)} showInfo={false} strokeColor={checkedCount === 7 ? '#52c41a' : '#faad14'} />
            <Row gutter={[16, 12]} style={{ marginTop: 16 }}>
              {[
                { key: 'market_good', label: '市场环境良好', desc: '上涨家数≥2800，非退潮期' },
                { key: 'theme_clear', label: '主线题材明确', desc: '有明确的主线板块，资金持续流入' },
                { key: 'stock_breakout', label: '个股放量突破', desc: '符合四种选股形态之一' },
                { key: 'intraday_good', label: '分时承接良好', desc: '站稳均价线，量能配合，回踩不破' },
                { key: 'position_ok', label: '仓位合理', desc: `当前建议仓位 ${posAdvice.range}` },
                { key: 'stoploss_set', label: '止损明确', desc: '买入逻辑已明确，止损位已设定' },
                { key: 'no_emotional', label: '没有情绪化交易', desc: '不临时起意，不盘中冲动追高' },
              ].map((item) => (
                <Col span={24} key={item.key}>
                  <div
                    onClick={() => isToday && handleCheck(item.key)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 16px', borderRadius: 8, cursor: isToday ? 'pointer' : 'default',
                      background: checkItems[item.key] ? 'rgba(82,196,26,0.08)' : 'rgba(255,255,255,0.02)',
                      border: checkItems[item.key] ? '1px solid rgba(82,196,26,0.25)' : '1px solid rgba(255,255,255,0.06)',
                      transition: 'all 0.2s',
                    }}
                  >
                    <Checkbox checked={checkItems[item.key]} onChange={() => handleCheck(item.key)} />
                    <div>
                      <Text strong style={{ color: checkItems[item.key] ? '#52c41a' : '#fff', fontSize: 14 }}>
                        {item.label}
                      </Text>
                      <Text type="secondary" style={{ display: 'block', fontSize: 11 }}>{item.desc}</Text>
                    </div>
                  </div>
                </Col>
              ))}
            </Row>
          </>
        )}
      </Card>

      {/* Quick Reference */}
      <Card
        style={{
          marginTop: 16, background: '#141414', border: '1px solid #30363d', borderRadius: 10,
        }}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ThunderboltOutlined style={{ color: '#1677ff' }} />
            <Text strong style={{ color: '#fff', fontSize: 15 }}>📖 规则速查</Text>
          </div>
        }
      >
        <Collapse ghost size="small" style={{ background: 'transparent' }}>
          <Panel key="buy" header={<Text style={{ color: '#52c41a' }}>买入系统摘要</Text>}>
            <ul style={{ color: '#8b949e', fontSize: 13, lineHeight: 2 }}>
              <li>不追高，只买放量后的回踩确认</li>
              <li>固定买点时间：早盘 10:40 前 / 午后 2:40 后</li>
              <li>分时确认：量能放大、站稳均价线、回踩不破</li>
              <li>核心买点：放量突破 → 回踩 → 再次放量</li>
            </ul>
          </Panel>
          <Panel key="sell" header={<Text style={{ color: '#ff4d4f' }}>卖出系统摘要</Text>}>
            <ul style={{ color: '#8b949e', fontSize: 13, lineHeight: 2 }}>
              <li>止损：跌破买入逻辑立即卖出（非固定亏损止损）</li>
              <li>止盈信号：放量滞涨、上冲不过均价线、跌破开盘价</li>
            </ul>
          </Panel>
          <Panel key="position" header={<Text style={{ color: '#faad14' }}>仓位规则</Text>}>
            <ul style={{ color: '#8b949e', fontSize: 13, lineHeight: 2 }}>
              <li>资金分成 5 份或 10 份，禁止单票重仓</li>
              <li>主升期 60%-100% | 震荡期 30%-50% | 退潮期 0%-20%</li>
              <li>连续2天亏损 → 降低仓位；连续3天 → 强制空仓</li>
            </ul>
          </Panel>
          <Panel key="risk" header={<Text style={{ color: '#ff7a45' }}>风控规则</Text>}>
            <ul style={{ color: '#8b949e', fontSize: 13, lineHeight: 2 }}>
              <li>单笔风险可控，市场风险优先处理</li>
              <li>4000家下跌 → 清仓，禁止抄底</li>
              <li>违规惩罚：停止交易、减仓、转出部分资金</li>
            </ul>
          </Panel>
        </Collapse>
      </Card>
    </div>
  );
};

export default TradePlaybook;
