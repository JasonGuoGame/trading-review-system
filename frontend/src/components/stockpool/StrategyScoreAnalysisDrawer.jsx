import React, { useState, useMemo } from 'react';
import { Drawer, Typography, Spin, Table, Tag, Empty, Row, Col } from 'antd';
import { TrophyOutlined, RiseOutlined, FallOutlined } from '@ant-design/icons';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, ReferenceLine,
} from 'recharts';
import { useGetStrategyScoreAnalysisQuery } from '../../app/api';

const { Title, Text } = Typography;

const SCORE_COLORS = [
  '#ff4d4f', '#ff7a45', '#faad14', '#a0d911', '#52c41a', '#1677ff',
];

const heatColor = (value, min, max) => {
  if (value == null) return 'rgba(255,255,255,0.02)';
  const range = max - min || 1;
  const t = (value - min) / range;
  if (t > 0.7) return `rgba(82,196,26,${0.2 + t * 0.5})`;
  if (t > 0.4) return `rgba(250,173,20,${0.2 + t * 0.4})`;
  return `rgba(255,77,79,${0.15 + t * 0.35})`;
};

const StrategyScoreAnalysisDrawer = ({ strategyName, onClose }) => {
  const [selectedBin, setSelectedBin] = useState(null);
  const { data, isFetching } = useGetStrategyScoreAnalysisQuery(
    { strategy: strategyName, days: 30 },
  );

  const heatmapData = useMemo(() => {
    if (!data) return { dates: [], bins: [], cells: {} };
    const { dates, bin_labels: bins, heatmap } = data;
    const cells = {};
    const safeHeatmap = heatmap || [];
    for (const h of safeHeatmap) {
      const key = `${h.trade_date}|${h.bin_key}`;
      cells[key] = h;
    }
    // Calculate min/max win rate for coloring
    let minWr = 100, maxWr = 0;
    for (const h of safeHeatmap) {
      if (h.win_rate < minWr) minWr = h.win_rate;
      if (h.win_rate > maxWr) maxWr = h.win_rate;
    }
    return { dates: dates || [], bins: bins || [], cells, minWr, maxWr };
  }, [data]);

  const trendChartData = useMemo(() => {
    if (!data || !selectedBin) return [];
    const pts = data.bin_trends?.[selectedBin] || [];
    return pts;
  }, [data, selectedBin]);

  // Auto-select best bin
  React.useEffect(() => {
    if (data?.best_bin && !selectedBin) {
      const bestKey = `${data.best_bin.range_start}-${data.best_bin.range_end}`;
      setSelectedBin(bestKey);
    }
  }, [data]);

  const binsColumns = [
    { title: '分数段', dataIndex: 'range_label', key: 'range_label', render: (v) => <Text strong style={{ color: '#fff' }}>{v}</Text> },
    { title: '平均胜率', dataIndex: 'avg_win_rate', key: 'avg_win_rate', sorter: (a, b) => a.avg_win_rate - b.avg_win_rate,
      render: (v) => <Text style={{ color: v > 60 ? '#52c41a' : v > 40 ? '#faad14' : '#ff4d4f', fontWeight: 600 }}>{v.toFixed(1)}%</Text> },
    { title: '平均收益', dataIndex: 'avg_return', key: 'avg_return', sorter: (a, b) => a.avg_return - b.avg_return,
      render: (v) => <Text style={{ color: v > 0 ? '#52c41a' : '#ff4d4f' }}>{v > 0 ? '+' : ''}{v.toFixed(2)}%</Text> },
    { title: '信号数', dataIndex: 'total_trades', key: 'total_trades' },
    { title: '稳定性', dataIndex: 'stability', key: 'stability', sorter: (a, b) => a.stability - b.stability,
      render: (v) => <Text style={{ color: v > 0.5 ? '#52c41a' : '#faad14' }}>{(v * 100).toFixed(0)}%</Text> },
  ];

  const icon = data?.strategy_name
    ? ({ '1.': '⚡', '2.': '🌊', '3.': '🔥', '4.': '🧘', '5.': '🚀', '6.': '🏆' }[data.strategy_name.slice(0, 2)] || '📊')
    : '📊';

  return (
    <Drawer
      title={
        <span>
          {icon} {strategyName} — 分数段趋势分析
        </span>
      }
      placement="right"
      onClose={onClose}
      open={true}
      width={820}
      headerStyle={{ background: '#141414', borderBottom: '1px solid #30363d' }}
      bodyStyle={{ background: '#0d1117', color: '#c9d1d9', padding: '20px' }}
    >
      {isFetching ? (
        <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" tip="加载分数段分析..." /></div>
      ) : !data ? (
        <Empty description="暂无数据" />
      ) : (
        <>
          {/* KPI Overview */}
          {data.best_bin && (
            <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
              <Col span={6}>
                <div style={{ background: 'rgba(250,173,20,0.08)', border: '1px solid rgba(250,173,20,0.2)', borderRadius: 8, padding: '12px 16px', textAlign: 'center' }}>
                  <Text type="secondary" style={{ fontSize: 11 }}>最强区间</Text>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#faad14' }}>
                    {data.best_bin.range_label} <TrophyOutlined style={{ fontSize: 14 }} />
                  </div>
                </div>
              </Col>
              <Col span={6}>
                <div style={{ background: 'rgba(82,196,26,0.06)', border: '1px solid rgba(82,196,26,0.15)', borderRadius: 8, padding: '12px 16px', textAlign: 'center' }}>
                  <Text type="secondary" style={{ fontSize: 11 }}>区间胜率</Text>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#52c41a' }}>{data.best_bin.avg_win_rate.toFixed(1)}%</div>
                </div>
              </Col>
              <Col span={6}>
                <div style={{ background: 'rgba(22,119,255,0.06)', border: '1px solid rgba(22,119,255,0.15)', borderRadius: 8, padding: '12px 16px', textAlign: 'center' }}>
                  <Text type="secondary" style={{ fontSize: 11 }}>区间收益</Text>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#1677ff' }}>{data.best_bin.avg_return > 0 ? '+' : ''}{data.best_bin.avg_return.toFixed(2)}%</div>
                </div>
              </Col>
              <Col span={6}>
                <div style={{ background: 'rgba(255,77,79,0.06)', border: '1px solid rgba(255,77,79,0.15)', borderRadius: 8, padding: '12px 16px', textAlign: 'center' }}>
                  <Text type="secondary" style={{ fontSize: 11 }}>信号数</Text>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#ff4d4f' }}>{data.best_bin.total_trades}</div>
                </div>
              </Col>
            </Row>
          )}

          {/* Heatmap */}
          <Title level={5} style={{ color: '#c9d1d9', marginTop: 0 }}>
            分数段稳定性热力图（胜率%）
          </Title>
          {(heatmapData.dates || []).length > 0 ? (
            <div style={{ overflowX: 'auto', marginBottom: 20 }}>
              <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 12 }}>
                <thead>
                  <tr>
                    <th style={{ padding: '6px 10px', background: '#1a1a2e', borderBottom: '1px solid #30363d', color: '#8b949e', textAlign: 'left' }}>分数段</th>
                    {heatmapData.dates.map((d) => (
                      <th key={d} style={{ padding: '6px 8px', background: '#1a1a2e', borderBottom: '1px solid #30363d', color: '#8b949e', textAlign: 'center', whiteSpace: 'nowrap' }}>
                        {d.slice(5)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {heatmapData.bins.map((bin) => (
                    <tr key={bin}>
                      <td style={{
                        padding: '8px 10px', borderBottom: '1px solid rgba(255,255,255,0.04)',
                        color: '#fff', fontWeight: 500, cursor: 'pointer',
                        background: selectedBin === bin ? 'rgba(22,119,255,0.15)' : 'transparent',
                      }}
                        onClick={() => setSelectedBin(bin)}
                      >
                        {bin.replace('-', '-')}
                      </td>
                      {heatmapData.dates.map((d) => {
                        const cell = heatmapData.cells[`${d}|${bin}`];
                        return (
                          <td key={d} style={{
                            padding: '6px 8px', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.04)',
                            background: cell ? heatColor(cell.win_rate, heatmapData.minWr, heatmapData.maxWr) : 'rgba(255,255,255,0.01)',
                            color: cell ? (cell.win_rate > 60 ? '#52c41a' : cell.win_rate > 40 ? '#faad14' : '#ff4d4f') : '#8b949e',
                            fontWeight: cell ? 600 : 400, cursor: cell ? 'pointer' : 'default',
                          }}
                            title={cell ? `胜率:${cell.win_rate}% 收益:${cell.avg_return}% 信号:${cell.total_trades}` : ''}
                          >
                            {cell ? `${cell.win_rate.toFixed(0)}%` : '-'}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty description="暂无热力图数据" />
          )}

          {/* Selected bin trend */}
          {selectedBin && trendChartData.length > 0 && (
            <>
              <Title level={5} style={{ color: '#c9d1d9' }}>
                分数段 [{selectedBin}] 趋势
              </Title>
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Text type="secondary" style={{ fontSize: 12 }}>胜率走势</Text>
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={trendChartData}>
                      <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                      <XAxis dataKey="trade_date" tick={{ fill: '#8b949e', fontSize: 11 }} />
                      <YAxis tick={{ fill: '#8b949e', fontSize: 11 }} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                      <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid #30363d', borderRadius: 8 }} />
                      <ReferenceLine y={50} stroke="rgba(255,255,255,0.12)" strokeDasharray="3 3" />
                      <Line type="monotone" dataKey="win_rate" stroke="#52c41a" strokeWidth={2} dot={{ r: 3, fill: '#52c41a' }} name="胜率%" />
                    </LineChart>
                  </ResponsiveContainer>
                </Col>
                <Col span={12}>
                  <Text type="secondary" style={{ fontSize: 12 }}>收益走势</Text>
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={trendChartData}>
                      <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                      <XAxis dataKey="trade_date" tick={{ fill: '#8b949e', fontSize: 11 }} />
                      <YAxis tick={{ fill: '#8b949e', fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
                      <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid #30363d', borderRadius: 8 }} />
                      <ReferenceLine y={0} stroke="rgba(255,255,255,0.15)" />
                      <Line type="monotone" dataKey="avg_return" stroke="#1677ff" strokeWidth={2} dot={{ r: 3, fill: '#1677ff' }} name="收益%" />
                    </LineChart>
                  </ResponsiveContainer>
                </Col>
              </Row>
            </>
          )}

          {/* Bin Ranking */}
          <Title level={5} style={{ color: '#c9d1d9', marginTop: 20 }}>
            分数段战力排行榜
          </Title>
          <Table
            columns={binsColumns}
            dataSource={data?.bins || []}
            rowKey="range_label"
            size="small"
            pagination={false}
            style={{ background: '#141414' }}
            onRow={(record) => ({
              onClick: () => setSelectedBin(`${record.range_start}-${record.range_end}`),
              style: {
                cursor: 'pointer',
                background: selectedBin === `${record.range_start}-${record.range_end}` ? 'rgba(22,119,255,0.1)' : 'transparent',
              },
            })}
          />
        </>
      )}
    </Drawer>
  );
};

export default StrategyScoreAnalysisDrawer;
