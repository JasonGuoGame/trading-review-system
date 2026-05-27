import React, { useState, useMemo } from 'react';
import { Drawer, Typography, Spin, Table, Tag, Empty, Row, Col, Button } from 'antd';
import { TrophyOutlined, RiseOutlined, FallOutlined } from '@ant-design/icons';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, ReferenceLine,
} from 'recharts';
import { useGetStrategyScoreAnalysisQuery, useGetStrategyStocksQuery } from '../../app/api';

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

const thStyle = {
  padding: '8px 12px',
  borderBottom: '1px solid #30363d',
  color: '#8b949e',
  fontWeight: 500,
  textAlign: 'left',
  whiteSpace: 'nowrap',
};

const tdStyle = {
  padding: '8px 12px',
  color: '#c9d1d9',
};

const StrategyScoreAnalysisDrawer = ({ strategyName, onClose }) => {
  const [selectedBin, setSelectedBin] = useState(null);
  const [selectedCell, setSelectedCell] = useState(null);
  const { data, isFetching } = useGetStrategyScoreAnalysisQuery(
    { strategy: strategyName, days: 30 },
  );

  const cellBin = selectedCell?.bin || '';
  const dashIdx = cellBin.indexOf('-');
  const scoreMin = dashIdx > -1 ? parseInt(cellBin.slice(0, dashIdx), 10) : 0;
  const scoreMax = dashIdx > -1 ? parseInt(cellBin.slice(dashIdx + 1), 10) : 0;

  const { data: stocksData, isFetching: stocksLoading } = useGetStrategyStocksQuery(
    { strategy: strategyName, trade_date: selectedCell?.date, score_min: scoreMin, score_max: scoreMax },
    { skip: !selectedCell },
  );

  const handleCellClick = (date, bin) => {
    if (selectedCell?.date === date && selectedCell?.bin === bin) {
      setSelectedCell(null);
    } else {
      setSelectedCell({ date, bin });
    }
  };

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
                        const isCellSelected = selectedCell?.date === d && selectedCell?.bin === bin;
                        return (
                          <td key={d}
                            onClick={() => cell && handleCellClick(d, bin)}
                            style={{
                              padding: '6px 8px', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.04)',
                              background: cell ? heatColor(cell.win_rate, heatmapData.minWr, heatmapData.maxWr) : 'rgba(255,255,255,0.01)',
                              color: cell ? (cell.win_rate > 60 ? '#52c41a' : cell.win_rate > 40 ? '#faad14' : '#ff4d4f') : '#8b949e',
                              fontWeight: cell ? 600 : 400, cursor: cell ? 'pointer' : 'default',
                              outline: isCellSelected ? '2px solid #fff' : 'none',
                              outlineOffset: -2,
                              position: 'relative',
                              zIndex: isCellSelected ? 1 : 0,
                            }}
                            title={cell ? `点击查看当天股票明细 | 胜率:${cell.win_rate}% 收益:${cell.avg_return}% 信号:${cell.total_trades}` : ''}
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

          {/* Selected Cell Stock Detail Panel */}
          {selectedCell && (
            <div style={{
              marginBottom: 20,
              background: '#141414',
              border: '1px solid #30363d',
              borderRadius: 10,
              overflow: 'hidden',
            }}>
              <div style={{
                padding: '12px 20px',
                borderBottom: '1px solid #30363d',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <Text strong style={{ color: '#fff', fontSize: 14 }}>
                  当日选股明细 · {selectedCell.date} · {selectedCell.bin.replace('-', '-')}分 · {strategyName}
                </Text>
                <Button type="text" size="small" style={{ color: '#8b949e' }} onClick={() => setSelectedCell(null)}>
                  收起
                </Button>
              </div>
              {stocksLoading ? (
                <div style={{ textAlign: 'center', padding: 24 }}><Spin size="small" /></div>
              ) : !stocksData?.stocks?.length ? (
                <div style={{ textAlign: 'center', padding: 24 }}>
                  <Text type="secondary">该日期暂无符合条件的股票</Text>
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.04)' }}>
                      <th style={thStyle}>股票代码</th>
                      <th style={thStyle}>股票名称</th>
                      <th style={thStyle}>板块</th>
                      <th style={thStyle}>评分</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>当日收</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>次日开</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>次日收</th>
                      <th style={thStyle}>胜负</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stocksData.stocks.map((s) => (
                      <tr key={s.symbol} style={{
                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                        background: s.is_win ? 'rgba(82,196,26,0.06)' : 'rgba(255,77,79,0.06)',
                      }}>
                        <td style={tdStyle}><Text style={{ color: '#8b949e', fontSize: 12 }}>{s.symbol}</Text></td>
                        <td style={tdStyle}><Text style={{ color: '#fff', fontWeight: 500 }}>{s.stock_name}</Text></td>
                        <td style={tdStyle}><Text style={{ color: '#8b949e' }}>{s.sector_name || '-'}</Text></td>
                        <td style={tdStyle}>
                          <span style={{ color: s.score > 90 ? '#ff4d4f' : s.score > 80 ? '#faad14' : '#52c41a', fontWeight: 600 }}>
                            {s.score}
                          </span>
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'right' }}><Text style={{ color: '#fff' }}>{s.close_today.toFixed(2)}</Text></td>
                        <td style={{ ...tdStyle, textAlign: 'right' }}><Text style={{ color: '#8b949e' }}>{s.open_next.toFixed(2)}</Text></td>
                        <td style={{ ...tdStyle, textAlign: 'right' }}>
                          <Text style={{
                            color: s.close_next > s.close_today ? '#52c41a' : '#ff4d4f',
                            fontWeight: 600,
                          }}>
                            {s.close_next.toFixed(2)}
                          </Text>
                        </td>
                        <td style={tdStyle}>
                          <Tag color={s.is_win ? 'success' : 'error'} style={{ margin: 0 }}>
                            {s.is_win ? '胜' : '负'}
                          </Tag>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
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
