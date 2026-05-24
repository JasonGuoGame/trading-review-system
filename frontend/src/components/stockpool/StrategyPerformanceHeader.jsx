import React from 'react';
import { Typography, Spin, Card, Row, Col, Tag } from 'antd';
import { CaretUpOutlined, CaretDownOutlined, MinusOutlined, TrophyOutlined } from '@ant-design/icons';
import {
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import { useGetStrategyPerformanceQuery } from '../../app/api';

const { Title, Text } = Typography;

const ICONS = {
  '1. 短线黑马股': '⚡',
  '2. 价值长线股': '🌊',
  '3. 0轴金叉资金共振': '🔥',
  '4. MACD+BOLL趋势': '🧘',
  '5. 换手率+量比动能': '🚀',
  '6. 赚钱效应': '🏆',
};

const SHORT_NAMES = {
  '1. 短线黑马股': '短线黑马',
  '2. 价值长线股': '价值长线',
  '3. 0轴金叉资金共振': '0轴金叉共振',
  '4. MACD+BOLL趋势': 'MACD+BOLL',
  '5. 换手率+量比动能': '换手率量比',
  '6. 赚钱效应': '赚钱效应',
};

const LINE_COLORS = {
  '1. 短线黑马股': '#ff7a45',
  '2. 价值长线股': '#1677ff',
  '3. 0轴金叉资金共振': '#ff4d4f',
  '4. MACD+BOLL趋势': '#a0d911',
  '5. 换手率+量比动能': '#722ed1',
  '6. 赚钱效应': '#faad14',
};

const CARD_COLORS = {
  1: { bg: 'rgba(250,173,20,0.12)', border: '#faad14' },
  2: { bg: 'rgba(255,255,255,0.06)', border: '#434343' },
  3: { bg: 'rgba(255,255,255,0.04)', border: '#434343' },
  4: { bg: 'rgba(255,255,255,0.03)', border: '#30363d' },
  5: { bg: 'rgba(255,255,255,0.02)', border: '#30363d' },
  6: { bg: 'rgba(255,255,255,0.02)', border: '#30363d' },
};

const StrategyCard = ({ s, rank }) => {
  const color = CARD_COLORS[rank] || CARD_COLORS[6];
  const isTop = rank === 1;
  const hasData = s.win_rate > 0 || s.avg_return !== 0 || s.signal_count > 0;

  return (
    <div
      style={{
        background: color.bg,
        border: `1px solid ${color.border}`,
        borderRadius: 10,
        padding: '12px 14px',
        position: 'relative',
        minWidth: 0,
        opacity: hasData ? 1 : 0.5,
      }}
    >
      {isTop && (
        <div style={{ position: 'absolute', top: -10, right: 8 }}>
          <TrophyOutlined style={{ color: '#faad14', fontSize: 16 }} />
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <Text style={{ fontSize: 16 }}>{ICONS[s.name] || '📊'}</Text>
        <Text strong style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {SHORT_NAMES[s.name] || s.name}
        </Text>
        <Tag
          color={rank === 1 ? 'gold' : 'default'}
          style={{ marginLeft: 'auto', fontSize: 11, lineHeight: '18px', padding: '0 6px' }}
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
        <Text type="secondary" style={{ fontSize: 12 }}>暂无数据</Text>
      )}
    </div>
  );
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const marketPayload = payload.find((p) => p.dataKey === 'market_pct_chg');
  const countPayload = payload.find((p) => p.dataKey === 'market_up_count');
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
        {countPayload && (
          <Text style={{ color: '#8b949e', fontSize: 11, marginLeft: 8 }}>
            上涨 {countPayload.value?.toLocaleString()} 家
          </Text>
        )}
        {marketPayload && (
          <Text style={{ color: marketPayload.value > 0 ? '#52c41a' : '#ff4d4f', fontSize: 12, marginLeft: 8, fontWeight: 600 }}>
            大盘 {marketPayload.value > 0 ? '+' : ''}{marketPayload.value?.toFixed(2)}%
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

const StrategyPerformanceHeader = () => {
  const { data, isFetching } = useGetStrategyPerformanceQuery(10);

  if (isFetching) {
    return (
      <div style={{ marginBottom: 16, textAlign: 'center', padding: 24 }}>
        <Spin tip="加载策略战力数据..." />
      </div>
    );
  }

  if (!data) return null;

  const { strategies = [], trend_data = [], commentary = '' } = data;

  return (
    <div style={{ marginBottom: 16 }}>
      {/* Strategy Cards Row */}
      <Row gutter={[12, 12]}>
        {strategies.map((s) => (
          <Col xs={12} sm={8} md={8} lg={4} key={s.name}>
            <StrategyCard s={s} rank={s.rank} />
          </Col>
        ))}
      </Row>

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
              tick={{ fill: '#8b949e', fontSize: 12 }}
              tickFormatter={(v) => `${v > 0 ? '+' : ''}${v.toFixed(1)}%`}
              tickLine={{ stroke: '#30363d' }}
              label={{ value: '大盘涨幅', angle: 90, position: 'insideRight', fill: '#8b949e', fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: 11 }}
              content={({ payload: legendPayload }) => (
                <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap', marginTop: 4 }}>
                  {legendPayload
                    .filter((e) => e.dataKey !== 'market_pct_chg' && e.dataKey !== 'market_up_count')
                    .map((e) => (
                      <span key={e.dataKey} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
                        <span style={{ width: 10, height: 2, background: e.color, display: 'inline-block', borderRadius: 1 }} />
                        <span style={{ color: '#8b949e' }}>{SHORT_NAMES[e.value] || e.value}</span>
                      </span>
                    ))}
                </div>
              )}
            />
            {/* Market bars on right axis */}
            <Bar
              yAxisId="right"
              dataKey="market_pct_chg"
              name="market_pct_chg"
              fill="rgba(255,255,255,0.08)"
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            />
            {/* Strategy lines on left axis */}
            {strategies.map((s) => (
              <Line
                key={s.name}
                yAxisId="left"
                type="monotone"
                dataKey={(obj) => obj.values?.[s.name] ?? null}
                name={s.name}
                stroke={LINE_COLORS[s.name] || '#ccc'}
                strokeWidth={s.rank === 1 ? 3 : 1.5}
                dot={{ r: 3, fill: LINE_COLORS[s.name] }}
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
    </div>
  );
};

export default StrategyPerformanceHeader;
