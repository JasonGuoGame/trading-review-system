import React from 'react';
import { Typography, Spin, Card } from 'antd';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts';
import { useGetMarketEarningEffectQuery } from '../../app/api';

const STYLE_ICONS = {
  '趋势主升': '🌊',
  '容量趋势': '🚀',
  '连板接力': '⚡',
  '主线共振': '🔥',
  '超跌低吸': '🧘',
  '退潮风险': '💀',
};

const RADAR_COLORS = {
  '连板接力': '#ff7a45',
  '趋势主升': '#1677ff',
  '主线共振': '#ff4d4f',
  '超跌低吸': '#a0d911',
  '容量趋势': '#722ed1',
  '退潮风险': '#8c8c8c',
};

const WinnerModeHeader = () => {
  const { data, isFetching } = useGetMarketEarningEffectQuery();

  if (isFetching) {
    return (
      <div style={{ marginBottom: 16, textAlign: 'center', padding: 40 }}>
        <Spin />
      </div>
    );
  }

  if (!data) return null;

  const radarData = (data.radar || []).map((r) => ({
    name: r.name,
    value: r.score,
    fill: RADAR_COLORS[r.name] || '#1677ff',
  }));

  // Find top style
  const topEntry = [...(data.radar || [])].sort((a, b) => b.score - a.score)[0];

  const CustomTick = ({ x, y, payload, ...rest }) => {
    const color = RADAR_COLORS[payload.value] || '#ccc';
    return (
      <text x={x} y={y} textAnchor="middle" fill={color} fontSize={13} fontWeight={500}>
        {payload.value}
      </text>
    );
  };

  return (
    <Card
      style={{
        marginBottom: 16,
        background: 'linear-gradient(135deg, #141414 0%, #1a1a2e 100%)',
        border: '1px solid #30363d',
        borderRadius: 12,
      }}
      bodyStyle={{ padding: '20px 24px' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
        {/* Left — Market Style */}
        <div style={{ flex: '0 0 auto', minWidth: 240 }}>
          <Typography.Text
            type="secondary"
            style={{ fontSize: 13, letterSpacing: 1, textTransform: 'uppercase' }}
          >
            当前市场风格
          </Typography.Text>

          <div style={{ marginTop: 8 }}>
            <Typography.Title
              level={3}
              style={{
                color: '#faad14',
                margin: 0,
                fontSize: 26,
                fontWeight: 700,
              }}
            >
              {data.market_style || (topEntry ? `${topEntry.name}牛市` : '--')}
            </Typography.Title>
          </div>

          {topEntry && (
            <div
              style={{
                marginTop: 12,
                padding: '8px 14px',
                background: 'rgba(250, 173, 20, 0.1)',
                border: '1px solid rgba(250, 173, 20, 0.3)',
                borderRadius: 8,
                display: 'inline-block',
              }}
            >
              <Typography.Text style={{ color: '#faad14', fontSize: 14 }}>
                最强效应：{topEntry.name}（{topEntry.score}分）
              </Typography.Text>
            </div>
          )}

          <div style={{ marginTop: 16 }}>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              数据日期：{data.trade_date}
            </Typography.Text>
          </div>

          {/* Mini legend */}
          <div
            style={{
              marginTop: 16,
              display: 'flex',
              flexWrap: 'wrap',
              gap: '6px 16px',
            }}
          >
            {(data.radar || []).map((r) => (
              <div
                key={r.key}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: RADAR_COLORS[r.name] || '#ccc',
                    display: 'inline-block',
                  }}
                />
                <Typography.Text
                  style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12 }}
                >
                  {r.name} {r.score}
                </Typography.Text>
              </div>
            ))}
          </div>
        </div>

        {/* Right — Radar Chart */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <ResponsiveContainer width="100%" height={320}>
            <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="75%">
              <PolarGrid
                stroke="rgba(255,255,255,0.12)"
                strokeDasharray="3 3"
              />
              <PolarAngleAxis
                dataKey="name"
                tick={CustomTick}
              />
              <PolarRadiusAxis
                domain={[0, 100]}
                tick={false}
                axisLine={false}
              />
              <Radar
                name="赚钱效应"
                dataKey="value"
                stroke="#faad14"
                strokeWidth={2}
                fill="#faad14"
                fillOpacity={0.18}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Card>
  );
};

export default WinnerModeHeader;
