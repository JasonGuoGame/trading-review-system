import {
  BarChartOutlined,
  CaretDownOutlined,
  CaretUpOutlined,
  DownOutlined,
  EyeInvisibleOutlined, EyeOutlined,
  FolderFilled,
  MinusOutlined,
  StarFilled,
  TrophyOutlined,
  UpOutlined
} from '@ant-design/icons';
import { Button, Card, Col, Row, Space, Spin, Tag, Typography, Modal, Table, Radio } from 'antd';
import React, { useState } from 'react';
import { useGetAdvancerBucketStocksQuery } from '../../app/api';
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis, YAxis,
} from 'recharts';
import { useGetStrategyPerformanceQuery } from '../../app/api';
import StrategyScoreAnalysisDrawer from './StrategyScoreAnalysisDrawer';

const { Title, Text } = Typography;

const ICONS = {
  '1. 短线黑马股': '⚡',
  '2. 价值长线股': '🌊',
  '3. 0轴金叉资金共振': '🔥',
  '4. MACD+BOLL趋势': '🧘',
  '5. 换手率+量比动能': '🚀',
  '6. 模式赢家跟随': '🏆',
  '7. 主力资金入场': '🎯',
  '8. 分歧反包策略': '🔄',
  '9. 竞价异动策略': '🔔',
  '四维共振': '📡',
  'GPT资金共振': '🤖',
};

const SHORT_NAMES = {
  '1. 短线黑马股': '短线黑马',
  '2. 价值长线股': '价值长线',
  '3. 0轴金叉资金共振': '0轴金叉共振',
  '4. MACD+BOLL趋势': 'MACD+BOLL',
  '5. 换手率+量比动能': '换手率量比',
  '6. 模式赢家跟随': '赢家跟随',
  '7. 主力资金入场': '主力入场',
  '8. 分歧反包策略': '分歧反包',
  '9. 竞价异动策略': '竞价异动',
  '四维共振': '四维共振',
  'GPT资金共振': 'GPT资金共振',
};

const LINE_COLORS = {
  '1. 短线黑马股': '#ff7a45',
  '2. 价值长线股': '#1677ff',
  '3. 0轴金叉资金共振': '#ff4d4f',
  '4. MACD+BOLL趋势': '#a0d911',
  '5. 换手率+量比动能': '#722ed1',
  '6. 模式赢家跟随': '#faad14',
  '7. 主力资金入场': '#eb2f96',
  '8. 分歧反包策略': '#13c2c2',
  '9. 竞价异动策略': '#722ed1',
  '四维共振': '#2f54eb',
  'GPT资金共振': '#13c2c2',
};

const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? `${parseInt(result[1], 16)},${parseInt(result[2], 16)},${parseInt(result[3], 16)}` : '255,255,255';
};

const CARD_COLORS = {
  1: { bg: 'rgba(250,173,20,0.12)', border: '#faad14' },
  2: { bg: 'rgba(255,255,255,0.06)', border: '#434343' },
  3: { bg: 'rgba(255,255,255,0.04)', border: '#434343' },
  4: { bg: 'rgba(255,255,255,0.03)', border: '#30363d' },
  5: { bg: 'rgba(255,255,255,0.02)', border: '#30363d' },
  6: { bg: 'rgba(255,255,255,0.02)', border: '#30363d' },
  7: { bg: 'rgba(255,255,255,0.02)', border: '#30363d' },
  8: { bg: 'rgba(255,255,255,0.02)', border: '#30363d' },
};

const StrategyCard = ({ s, rank, onAnalyze, isSelected, onSelect, anySelected, onHide }) => {
  const color = CARD_COLORS[rank] || CARD_COLORS[6];
  const isTop = rank === 1;
  const hasData = s.win_rate > 0 || s.avg_return !== 0 || s.signal_count > 0;
  const lineColor = LINE_COLORS[s.name] || '#ccc';
  const dimmed = anySelected && !isSelected;

  return (
    <div
      onClick={() => onSelect?.(s.name)}
      className="strategy-card"
      title={s.name}
      style={{
        background: isSelected ? `rgba(${hexToRgb(lineColor)}, 0.18)` : color.bg,
        border: `1.5px solid ${isSelected ? lineColor : color.border}`,
        borderRadius: 10,
        padding: '10px 10px',
        position: 'relative',
        minWidth: 0,
        cursor: 'pointer',
        opacity: dimmed ? 0.4 : 1,
        transition: 'all 0.2s',
        boxShadow: isSelected ? `0 0 12px rgba(${hexToRgb(lineColor)}, 0.3)` : 'none',
      }}
    >
      <style>{`
        .strategy-card {
          position: relative;
        }
        .strategy-card .hide-btn {
          opacity: 0;
          transition: opacity 0.2s;
        }
        .strategy-card:hover .hide-btn {
          opacity: 0.6;
        }
        .strategy-card .hide-btn:hover {
          opacity: 1 !important;
          color: #ff4d4f !important;
        }
      `}</style>
      {isTop && (
        <div style={{ position: 'absolute', top: -10, right: 8 }}>
          <TrophyOutlined style={{ color: '#faad14', fontSize: 16 }} />
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <Text style={{ fontSize: 16 }}>{ICONS[s.name] || '📊'}</Text>
        <Text strong style={{ color: isSelected ? lineColor : 'rgba(255,255,255,0.85)', fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>
          {SHORT_NAMES[s.name] || s.name}
        </Text>
        <Button
          type="text"
          size="small"
          icon={<EyeInvisibleOutlined style={{ fontSize: 12 }} />}
          onClick={(e) => {
            e.stopPropagation();
            onHide?.(s.name);
          }}
          style={{
            color: 'rgba(255,255,255,0.45)',
            padding: '0 4px',
            height: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          className="hide-btn"
          title="归档/封存此策略"
        />
        <Tag
          color={rank === 1 ? 'gold' : 'default'}
          style={{ fontSize: 11, lineHeight: '18px', padding: '0 6px', margin: 0 }}
        >
          #{rank}
        </Tag>
      </div>

      {hasData ? (
        <>
          <Row gutter={6}>
            <Col span={12}>
              <Text type="secondary" style={{ fontSize: 11 }}>胜率 <span style={{ color: '#6e7681' }}>30日</span></Text>
              <div style={{ fontSize: 15, fontWeight: 600, color: (s.win_rate_30d || 0) > 0.5 ? '#52c41a' : (s.win_rate_30d || 0) > 0.35 ? '#faad14' : '#ff4d4f' }}>
                {((s.win_rate_30d || 0) * 100).toFixed(0)}%
              </div>
            </Col>
            <Col span={12}>
              <Text type="secondary" style={{ fontSize: 11 }}>信号 <span style={{ color: '#6e7681' }}>30日</span></Text>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#c9d1d9' }}>
                {s.signal_count_30d || 0}
              </div>
            </Col>
          </Row>
          <Row gutter={6} style={{ marginTop: 4 }}>
            <Col span={12}>
              <Text type="secondary" style={{ fontSize: 11 }}>昨日胜率</Text>
              <div style={{ fontSize: 20, fontWeight: 700, color: s.win_rate > 0.5 ? '#52c41a' : s.win_rate > 0.35 ? '#faad14' : '#ff4d4f' }}>
                {(s.win_rate * 100).toFixed(0)}%
              </div>
            </Col>
            <Col span={12}>
              <Text type="secondary" style={{ fontSize: 11 }}>收益</Text>
              <div style={{ fontSize: 20, fontWeight: 700, color: s.avg_return > 0 ? '#52c41a' : '#ff4d4f' }}>
                {s.avg_return > 0 ? '+' : ''}{s.avg_return.toFixed(2)}%
              </div>
            </Col>
          </Row>
          {s.best_score_range && (
            <div style={{ marginTop: 8, background: 'rgba(250,173,20,0.1)', borderRadius: 6, padding: '4px 8px', display: 'flex', alignItems: 'center', gap: 4 }}>
              <StarFilled style={{ color: '#faad14', fontSize: 11 }} />
              <Text style={{ color: '#faad14', fontSize: 11 }}>
                最强区间：{s.best_score_range}
              </Text>
            </div>
          )}
          <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text type="secondary" style={{ fontSize: 11 }}>
              {s.signal_count} 信号
            </Text>
            <span style={{ fontSize: 11 }}>
              {s.trend === 'up' ? (
                <Text type="success"><CaretUpOutlined /> 上升</Text>
              ) : s.trend === 'down' ? (
                <Text type="danger"><CaretDownOutlined /> 下降</Text>
              ) : (
                <Text type="secondary"><MinusOutlined /> 走平</Text>
              )}
            </span>
          </div>
        </>
      ) : (
        <Text type="secondary" style={{ fontSize: 12 }}>暂无历史数据</Text>
      )}
      <Button
        type="link"
        size="small"
        icon={<BarChartOutlined />}
        onClick={(e) => { e.stopPropagation(); onAnalyze?.(s.name); }}
        style={{ padding: 0, marginTop: 4, fontSize: 11, color: '#8b949e' }}
      >
        查看分数分析
      </Button>
    </div>
  );
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const srcData = payload[0]?.payload || {};
  const marketPct = srcData.market_pct_chg;
  const upCount = srcData.market_up_count;
  const marketPayload = payload.find((p) => p.dataKey === 'market_pct_chg');
  const strategyPayloads = payload.filter((p) => p.dataKey !== 'market_pct_chg' && p.dataKey !== 'market_up_count');

  return (
    <div style={{
      background: '#1a1a2e',
      border: '1px solid #30363d',
      borderRadius: 8,
      padding: '10px 14px',
    }}>
      <div style={{ marginBottom: 6, borderBottom: '1px solid #30363d', paddingBottom: 6 }}>
        <Text type="secondary" style={{ fontSize: 12 }}>{label}</Text>
        {upCount != null && (
          <Text style={{ color: '#8b949e', fontSize: 11, marginLeft: 8 }}>
            上涨 {upCount.toLocaleString()} 家
          </Text>
        )}
        {marketPct != null && (
          <Text style={{ color: marketPct > 0 ? '#52c41a' : '#ff4d4f', fontSize: 12, marginLeft: 8, fontWeight: 600 }}>
            大盘 {marketPct > 0 ? '+' : ''}{marketPct.toFixed(2)}%
          </Text>
        )}
      </div>
      {strategyPayloads.map((p) => (
        <div key={p.name} style={{ color: p.color, fontSize: 13, marginTop: 2 }}>
          {SHORT_NAMES[p.name] || p.name}: {(p.value * 100).toFixed(0)}%
        </div>
      ))}
    </div>
  );
};

const STRATEGY_TO_TAB = {
  '1. 短线黑马股': 'short',
  '2. 价值长线股': 'long',
  '3. 0轴金叉资金共振': 'macd_boll',
  '4. MACD+BOLL趋势': 'trend_following',
  '5. 换手率+量比动能': 'turnover_vol',
  '6. 模式赢家跟随': 'winner_mode',
  '7. 主力资金入场': 'mf_entry',
  '8. 分歧反包策略': 'divergence_reversal',
  '9. 竞价异动策略': 'auction_surge',
  '四维共振': 'four_dim',
  'GPT资金共振': 'gpt_fund',
};

const StrategyPerformanceHeader = ({ onOrderChange }) => {
  const [days, setDays] = useState(30);
  const { data, isFetching } = useGetStrategyPerformanceQuery(days, { refetchOnMountOrArgChange: true });
  const [analysisStrategy, setAnalysisStrategy] = useState(null);
  const [selectedStrategy, setSelectedStrategy] = useState(null);

  const [collapsedRec, setCollapsedRec] = useState(false);
  const [bucketDialog, setBucketDialog] = useState(null); // { strategy, advMin, advMax, bucketLabel }

  const [hiddenStrategies, setHiddenStrategies] = useState(() => {
    try {
      const saved = localStorage.getItem('hidden_strategies');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [archiveExpanded, setArchiveExpanded] = useState(false);

  const handleHide = (name) => {
    setHiddenStrategies((prev) => {
      const next = [...prev, name];
      localStorage.setItem('hidden_strategies', JSON.stringify(next));
      return next;
    });
    if (selectedStrategy === name) {
      setSelectedStrategy(null);
    }
  };

  const handleShow = (name) => {
    setHiddenStrategies((prev) => {
      const next = prev.filter((n) => n !== name);
      localStorage.setItem('hidden_strategies', JSON.stringify(next));
      return next;
    });
  };

  const handleSelect = (name) => {
    setSelectedStrategy((prev) => prev === name ? null : name);
  };

  React.useEffect(() => {
    if (data?.strategies) {
      const orderedTabs = data.strategies
        .filter((s) => !hiddenStrategies.includes(s.name))
        .map((s) => STRATEGY_TO_TAB[s.name])
        .filter(Boolean);
      onOrderChange?.(orderedTabs);
    }
  }, [data, onOrderChange, hiddenStrategies]);

  if (isFetching) {
    return (
      <div style={{ marginBottom: 16, textAlign: 'center', padding: 24 }}>
        <Spin tip="加载策略战力数据..." />
      </div>
    );
  }

  if (!data) return null;

  const { strategies = [], trend_data = [], commentary = '', recommendation } = data;

  const DELETED_STRATEGIES = ['1. 短线黑马股'];

  const visibleStrategies = strategies.filter((s) => !hiddenStrategies.includes(s.name) && !DELETED_STRATEGIES.includes(s.name));

  return (
    <div style={{ marginBottom: 16 }}>
      {/* Strategy Cards Row */}
      <Row gutter={[12, 12]}>
        {visibleStrategies.map((s) => (
          <Col xs={12} sm={8} md={6} lg={visibleStrategies.length > 0 ? Math.floor(24 / visibleStrategies.length) : 3} key={s.name}>
            <StrategyCard
              s={s}
              rank={s.rank}
              onAnalyze={setAnalysisStrategy}
              isSelected={s.name === selectedStrategy}
              onSelect={handleSelect}
              anySelected={!!selectedStrategy}
              onHide={handleHide}
            />
          </Col>
        ))}
      </Row>

      {/* Archive Collapse Panel */}
      {hiddenStrategies.length > 0 && (
        <div style={{
          marginTop: 12,
          background: '#141414',
          border: '1px solid #30363d',
          borderRadius: 10,
          overflow: 'hidden',
        }}>
          <div
            onClick={() => setArchiveExpanded(!archiveExpanded)}
            style={{
              padding: '10px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              userSelect: 'none',
              background: '#1f1f1f',
            }}
          >
            <Space>
              <FolderFilled style={{ color: '#8b949e' }} />
              <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: 500 }}>
                📁 已封存策略 ({hiddenStrategies.length})
              </span>
            </Space>
            {archiveExpanded ? <UpOutlined style={{ color: '#8b949e', fontSize: 12 }} /> : <DownOutlined style={{ color: '#8b949e', fontSize: 12 }} />}
          </div>

          {archiveExpanded && (
            <div style={{ padding: '12px', borderTop: '1px solid #30363d', background: '#0d1117' }}>
              <Row gutter={[10, 10]}>
                {hiddenStrategies.map((name) => {
                  const s = strategies.find((st) => st.name === name) || { name, avg_return: 0 };
                  const icon = ICONS[name] || '📊';
                  const shortName = SHORT_NAMES[name] || name;
                  const lineColor = LINE_COLORS[name] || '#8b949e';
                  return (
                    <Col xs={12} sm={8} md={6} lg={4} key={name}>
                      <div
                        onClick={() => handleShow(name)}
                        style={{
                          background: 'rgba(255, 255, 255, 0.02)',
                          border: '1.5px dashed #30363d',
                          borderRadius: 8,
                          padding: '8px 12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                          opacity: 0.5,
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.opacity = '1';
                          e.currentTarget.style.borderColor = lineColor;
                          e.currentTarget.style.background = `rgba(${hexToRgb(lineColor)}, 0.08)`;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.opacity = '0.5';
                          e.currentTarget.style.borderColor = '#30363d';
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                        }}
                        title="点击恢复此策略"
                      >
                        <Space size={6} style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
                          <span style={{ fontSize: 14 }}>{icon}</span>
                          <span style={{ color: '#8b949e', fontSize: 12, fontWeight: 500 }}>{shortName}</span>
                        </Space>
                        <EyeOutlined style={{ color: '#8b949e', fontSize: 12, marginLeft: 6 }} />
                      </div>
                    </Col>
                  );
                })}
              </Row>
            </div>
          )}
        </div>
      )}

      {/* Win-Rate Drift Line Chart */}
      <Card
        style={{
          marginTop: 12,
          background: '#141414',
          border: '1px solid #30363d',
          borderRadius: 10,
        }}
        bodyStyle={{ padding: '16px 20px' }}
        title={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <Text strong style={{ color: 'rgba(255,255,255,0.85)', fontSize: 15 }}>
              胜率漂移 + 大盘情绪
            </Text>
            <Radio.Group value={days} onChange={(e) => setDays(e.target.value)} size="small" optionType="button" buttonStyle="solid">
              <Radio.Button value={30}>30天</Radio.Button>
              <Radio.Button value={60}>60天</Radio.Button>
              <Radio.Button value={0}>全部</Radio.Button>
            </Radio.Group>
          </div>
        }
      >
        <ResponsiveContainer width="100%" height={320}>
          <ComposedChart data={trend_data} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
            <XAxis
              dataKey="trade_date"
              tick={(props) => {
                const { x, y, payload: p } = props;
                const d = trend_data.find((t) => t.trade_date === p.value);
                return (
                  <g transform={`translate(${x},${y})`}>
                    <text x={0} y={0} dy={12} textAnchor="middle" fill="#8b949e" fontSize={12}>
                      {p.value.slice(5)}
                    </text>
                    {d && d.market_up_count > 0 && (
                      <text x={0} y={0} dy={28} textAnchor="middle" fill={d.market_pct_chg > 0 ? '#52c41a' : '#ff4d4f'} fontSize={10}>
                        {d.market_pct_chg > 0 ? '+' : ''}{d.market_pct_chg?.toFixed(2)}% | {d.market_up_count}↑
                      </text>
                    )}
                  </g>
                );
              }}
              tickLine={{ stroke: '#30363d' }}
              height={50}
            />
            {/* Left Y-axis: win rate */}
            <YAxis
              yAxisId="left"
              tick={{ fill: '#8b949e', fontSize: 12 }}
              domain={[0, 1]}
              tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
              tickLine={{ stroke: '#30363d' }}
              label={{ value: '胜率', angle: -90, position: 'insideLeft', fill: '#8b949e', fontSize: 12 }}
            />
            {/* Right Y-axis: market avg % change */}
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fill: '#ffffff', fontSize: 12 }}
              tickFormatter={(v) => `${v > 0 ? '+' : ''}${v.toFixed(1)}%`}
              tickLine={{ stroke: '#30363d' }}
              label={{ value: '大盘涨幅', angle: 90, position: 'insideRight', fill: '#ffffff', fontSize: 12 }}
            />
            <ReferenceLine yAxisId="right" y={0} stroke="#ffffff" strokeOpacity={0.35} strokeDasharray="3 3" />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: 11 }}
              content={({ payload: legendPayload }) => (
                <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap', marginTop: 4 }}>
                  {legendPayload
                    .filter((e) => e.dataKey !== 'market_pct_chg' && e.dataKey !== 'market_up_count' && !hiddenStrategies.includes(e.value))
                    .map((e) => {
                      const isActive = e.value === selectedStrategy;
                      const dimmed = selectedStrategy && !isActive;
                      return (
                        <span
                          key={e.dataKey}
                          onClick={() => handleSelect(e.value)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            fontSize: 11,
                            cursor: 'pointer',
                            opacity: dimmed ? 0.4 : 1,
                            padding: '2px 4px',
                            borderRadius: 3,
                            background: isActive ? `rgba(${hexToRgb(e.color)}, 0.2)` : 'transparent',
                            transition: 'all 0.2s',
                          }}
                        >
                          <span style={{ width: 10, height: 2, background: e.color, display: 'inline-block', borderRadius: 1 }} />
                          <span style={{ color: isActive ? e.color : '#8b949e' }}>{SHORT_NAMES[e.value] || e.value}</span>
                        </span>
                      );
                    })}
                </div>
              )}
            />
            {/* Market bars on right axis */}
            <Bar
              yAxisId="right"
              dataKey="market_pct_chg"
              name="market_pct_chg"
              shape={(props) => {
                const { x, y, width, height, value } = props;
                if (value == null || height == null) return null;
                const fill = value >= 0 ? 'rgba(207,19,34,0.55)' : 'rgba(82,196,26,0.55)';
                const rx = Math.min(width / 2, 4);
                return <rect x={x} y={y} width={width} height={Math.max(height, 2)} fill={fill} rx={rx} />;
              }}
              maxBarSize={40}
            />
            {/* Strategy lines on left axis — hidden strategies are excluded */}
            {visibleStrategies.map((s) => (
              <Line
                key={s.name}
                yAxisId="left"
                type="monotone"
                dataKey={(obj) => obj.values?.[s.name] ?? null}
                name={s.name}
                stroke={LINE_COLORS[s.name] || '#ccc'}
                strokeWidth={s.name === selectedStrategy ? 3 : s.rank === 1 ? 2 : 1.5}
                strokeOpacity={selectedStrategy && s.name !== selectedStrategy ? 0.15 : 1}
                dot={{ r: s.name === selectedStrategy ? 5 : 3, fill: LINE_COLORS[s.name] }}
                activeDot={{ r: 6 }}
                connectNulls
              />
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      </Card>

      {/* Market Breadth Strategy Recommendation */}
      {recommendation ? (
        <Card
          style={{
            marginTop: 12,
            background: 'rgba(250,173,20,0.08)',
            border: '1px solid rgba(250,173,20,0.3)',
            borderRadius: 10,
          }}
          bodyStyle={{ padding: collapsedRec ? '0' : '16px 20px', display: collapsedRec ? 'none' : 'block' }}
          title={
            <div
              onClick={() => setCollapsedRec(!collapsedRec)}
              style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', userSelect: 'none' }}
            >
              <Space>
                <TrophyOutlined style={{ color: '#faad14' }} />
                <Text strong style={{ color: '#faad14', fontSize: 14 }}>
                  大盘红盘率策略推荐
                </Text>
                <Tag color="gold" style={{ fontSize: 11 }}>
                  {recommendation.bucket_label} · {recommendation.advancers}只上涨
                </Tag>
                {!collapsedRec && (
                  <Text strong style={{ color: '#52c41a', fontSize: 13 }}>
                    🏆 {recommendation.top_strategy} {(recommendation.top_win_rate * 100).toFixed(0)}%
                  </Text>
                )}
              </Space>
              {collapsedRec ? <DownOutlined style={{ color: '#8b949e' }} /> : <UpOutlined style={{ color: '#8b949e' }} />}
            </div>
          }
        >
          <div style={{ marginBottom: 12 }}>
            <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12 }}>
              当前上涨 {recommendation.advancers} 只股票，处于红盘率分段
              <Text strong style={{ color: '#faad14' }}> {recommendation.bucket_label} </Text>
              。在此市场环境下，历史胜率最高的策略是：
            </Text>
          </div>

          {/* Top Pick */}
          <div style={{
            background: 'rgba(250,173,20,0.12)',
            border: '1px solid rgba(250,173,20,0.25)',
            borderRadius: 8,
            padding: '12px 16px',
            marginBottom: 12,
          }}>
            <Row align="middle">
              <Col flex="auto">
                <Text style={{ color: '#faad14', fontSize: 16, fontWeight: 700 }}>
                  🏆 {recommendation.top_strategy}
                </Text>
                <div style={{ marginTop: 4 }}>
                  <Text style={{ color: '#52c41a', fontSize: 22, fontWeight: 700 }}>
                    {(recommendation.top_win_rate * 100).toFixed(0)}%
                  </Text>
                  <Text type="secondary" style={{ fontSize: 12, marginLeft: 6 }}>胜率</Text>
                  <Text style={{ color: recommendation.top_avg_return > 0 ? '#52c41a' : '#ff4d4f', fontSize: 14, fontWeight: 600, marginLeft: 12 }}>
                    {recommendation.top_avg_return > 0 ? '+' : ''}{recommendation.top_avg_return.toFixed(2)}%
                  </Text>
                  <Text type="secondary" style={{ fontSize: 12, marginLeft: 4 }}>平均收益</Text>
                </div>
              </Col>
              <Col>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  {recommendation.top_total_trades} 笔交易
                </Text>
              </Col>
            </Row>
          </div>

          {/* All Rankings */}
          {recommendation.all_ranked && recommendation.all_ranked.length > 1 && (
            <div>
              <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 6 }}>
                同分段各策略胜率排名：
              </Text>
              {recommendation.all_ranked.map((s, i) => {
                const color = LINE_COLORS[s.name] || '#8b949e';
                const isTop = i === 0;
                return (
                  <div key={s.name}
                    onDoubleClick={() => setBucketDialog({
                      strategy: s.name,
                      advMin: recommendation.adv_min,
                      advMax: recommendation.adv_max,
                      bucketLabel: recommendation.bucket_label,
                    })}
                    title="双击查看该策略在此红盘率区间的所有股票"
                    style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '4px 8px',
                    marginBottom: 2,
                    background: isTop ? 'rgba(250,173,20,0.08)' : 'transparent',
                    borderRadius: 4,
                    cursor: 'pointer',
                  }}>
                    <Space size={8}>
                      <span style={{ color, fontSize: 12, fontWeight: isTop ? 700 : 400 }}>
                        #{i + 1}
                      </span>
                      <span style={{ color: '#c9d1d9', fontSize: 12 }}>
                        {SHORT_NAMES[s.name] || s.name}
                      </span>
                    </Space>
                    <Space size={16}>
                      <span style={{ color: '#52c41a', fontSize: 12, fontWeight: 600 }}>
                        {(s.win_rate * 100).toFixed(0)}%
                      </span>
                      <span style={{ color: '#8b949e', fontSize: 11 }}>
                        {s.total_trades}笔
                      </span>
                    </Space>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      ) : commentary ? (
        <Card
          style={{
            marginTop: 12,
            background: 'rgba(22,119,255,0.06)',
            border: '1px solid rgba(22,119,255,0.2)',
            borderRadius: 10,
          }}
          bodyStyle={{ padding: '12px 20px' }}
        >
          <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, lineHeight: 1.8 }}>
            {commentary}
          </Text>
        </Card>
      ) : null}

      {/* Score Analysis Drawer */}
      {analysisStrategy && (
        <StrategyScoreAnalysisDrawer
          strategyName={analysisStrategy}
          onClose={() => setAnalysisStrategy(null)}
        />
      )}

      {/* Advancer Bucket Stocks Dialog */}
      <BucketStocksDialog
        open={bucketDialog}
        onClose={() => setBucketDialog(null)}
      />
    </div>
  );
};

const BucketStocksDialog = ({ open, onClose }) => {
  const strategy = open?.strategy || '';
  const bucketLabel = open?.bucketLabel || '';
  const { data: stocks = [], isFetching } = useGetAdvancerBucketStocksQuery(
    { strategy, adv_min: open?.advMin ?? 0, adv_max: open?.advMax ?? 0, days: 30 },
    { skip: !open },
  );

  const columns = [
    { title: '日期', dataIndex: 'trade_date', width: 100 },
    { title: '代码', dataIndex: 'symbol', width: 90 },
    { title: '名称', dataIndex: 'stock_name', width: 80 },
    { title: '评分', dataIndex: 'score', width: 60, align: 'right' },
    {
      title: '收益', dataIndex: 'return_pct', width: 80, align: 'right',
      render: (v, r) => r.has_kline
        ? <span style={{ color: v > 0 ? '#52c41a' : '#ff4d4f' }}>{v > 0 ? '+' : ''}{v.toFixed(2)}%</span>
        : <span style={{ color: '#8b949e' }}>-</span>,
    },
    {
      title: '胜负', dataIndex: 'is_win', width: 60, align: 'center',
      render: (v, r) => r.has_kline ? (v ? '✅' : '❌') : '-',
    },
    { title: '状态', dataIndex: 'status', width: 100 },
  ];

  const wins = stocks.filter(s => s.is_win).length;
  const total = stocks.filter(s => s.has_kline).length;

  return (
    <Modal
      title={`${SHORT_NAMES[strategy] || strategy} — 红盘率分段 ${bucketLabel} 股票明细`}
      open={!!open}
      onCancel={onClose}
      width={800}
      footer={null}
    >
      {total > 0 && (
        <div style={{ marginBottom: 12 }}>
          <Tag color="gold">{bucketLabel} 红盘率区间</Tag>
          <Tag color="blue">{stocks.length} 只股票</Tag>
          <Tag color={wins / total > 0.5 ? 'green' : 'red'}>
            胜率 {total > 0 ? (wins / total * 100).toFixed(0) : 0}% ({wins}/{total})
          </Tag>
        </div>
      )}
      <Table
        columns={columns}
        dataSource={stocks}
        rowKey={(r) => `${r.symbol}_${r.trade_date}`}
        loading={isFetching}
        size="small"
        pagination={{ pageSize: 20 }}
        scroll={{ y: 400 }}
      />
    </Modal>
  );
};

export default StrategyPerformanceHeader;
