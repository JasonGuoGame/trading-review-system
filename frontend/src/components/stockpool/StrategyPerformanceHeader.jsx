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
import { Button, Card, Col, Row, Space, Spin, Tag, Typography } from 'antd';
import React, { useState } from 'react';
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
              <Text type="secondary" style={{ fontSize: 11 }}>胜率</Text>
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
  const { data, isFetching } = useGetStrategyPerformanceQuery(10, { refetchOnMountOrArgChange: true });
  const [analysisStrategy, setAnalysisStrategy] = useState(null);
  const [selectedStrategy, setSelectedStrategy] = useState(null);

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

  const { strategies = [], trend_data = [], commentary = '' } = data;

  const DELETED_STRATEGIES = ['1. 短线黑马股', '2. 价值长线股'];

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
          <Text strong style={{ color: 'rgba(255,255,255,0.85)', fontSize: 15 }}>
            胜率漂移 + 大盘情绪
          </Text>
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

      {/* AI Commentary */}
      {commentary && (
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
      )}

      {/* Score Analysis Drawer */}
      {analysisStrategy && (
        <StrategyScoreAnalysisDrawer
          strategyName={analysisStrategy}
          onClose={() => setAnalysisStrategy(null)}
        />
      )}
    </div>
  );
};

export default StrategyPerformanceHeader;
