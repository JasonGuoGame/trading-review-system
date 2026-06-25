import React, { useState, useMemo } from 'react';
import { Drawer, Typography, Spin, Table, Tag, Empty, Row, Col, Button } from 'antd';
import { TrophyOutlined, RiseOutlined, FallOutlined } from '@ant-design/icons';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, ReferenceLine,
} from 'recharts';
import { useGetStrategyScoreAnalysisQuery, useGetStrategyStocksQuery, useGetStatusHeatmapQuery, useGetModeRankingQuery, useGetStatusRankingQuery, useGetStatusScoreTrendQuery } from '../../app/api';

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
  const [selectedStatusCell, setSelectedStatusCell] = useState(null);
  const [selectedRankingStatus, setSelectedRankingStatus] = useState(null);
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

  const isTurnoverVol = strategyName === '5. 换手率+量比动能';
  const { data: statusHeatmap } = useGetStatusHeatmapQuery(
    { days: 30 },
    { skip: !isTurnoverVol },
  );
  const { data: statusRanking } = useGetStatusRankingQuery(
    { strategy: 'turnover_vol', days: 30 },
    { skip: !isTurnoverVol },
  );

  const statusBinDash = (selectedRankingStatus?.best_score_range || '').indexOf('-');
  const statusScoreMin = statusBinDash > -1 ? parseInt(selectedRankingStatus?.best_score_range?.slice(0, statusBinDash), 10) : 0;
  const statusScoreMax = statusBinDash > -1 ? parseInt(selectedRankingStatus?.best_score_range?.slice(statusBinDash + 1), 10) : 0;
  const { data: statusScoreTrend } = useGetStatusScoreTrendQuery(
    { strategy: 'turnover_vol', status: selectedRankingStatus?.status, score_min: statusScoreMin, score_max: statusScoreMax, days: 30 },
    { skip: !selectedRankingStatus },
  );

  const { data: statusStocksData, isFetching: statusStocksLoading } = useGetStrategyStocksQuery(
    { strategy: strategyName, trade_date: selectedStatusCell?.date, score_min: 0, score_max: 100, status: selectedStatusCell?.status },
    { skip: !selectedStatusCell },
  );

  const isWinnerMode = strategyName === '6. 模式赢家跟随';
  const { data: modeRanking } = useGetModeRankingQuery(
    { days: 30 },
    { skip: !isWinnerMode },
  );

  const handleStatusCellClick = (date, status) => {
    if (selectedStatusCell?.date === date && selectedStatusCell?.status === status) {
      setSelectedStatusCell(null);
    } else {
      setSelectedStatusCell({ date, status });
    }
  };

  const bestStatusItem = useMemo(() => {
    if (!statusRanking?.items?.length) return null;
    return statusRanking.items.reduce((a, b) =>
      b.best_score_win_rate > a.best_score_win_rate ? b : a
    );
  }, [statusRanking]);

  const bestModeItem = useMemo(() => {
    if (!modeRanking?.items?.length) return null;
    return modeRanking.items.reduce((a, b) =>
      b.best_score_win_rate > a.best_score_win_rate ? b : a
    );
  }, [modeRanking]);

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

  const activeTrendData = useMemo(() => {
    if (selectedRankingStatus && statusScoreTrend?.trend?.length > 0) {
      return { type: 'status', data: statusScoreTrend.trend, label: `${selectedRankingStatus.status} · 分数段 [${selectedBin}]` };
    }
    if (trendChartData.length > 0) {
      return { type: 'generic', data: trendChartData, label: `分数段 [${selectedBin}]` };
    }
    return null;
  }, [selectedRankingStatus, statusScoreTrend, trendChartData, selectedBin]);

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
      width={960}
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
          {isTurnoverVol && bestStatusItem ? (
            <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
              <Col span={6}>
                <div style={{ background: 'rgba(250,173,20,0.08)', border: '1px solid rgba(250,173,20,0.2)', borderRadius: 8, padding: '12px 16px', textAlign: 'center' }}>
                  <Text type="secondary" style={{ fontSize: 11 }}>最强状态</Text>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#faad14' }}>
                    {bestStatusItem.status} <TrophyOutlined style={{ fontSize: 14 }} />
                  </div>
                </div>
              </Col>
              <Col span={6}>
                <div style={{ background: 'rgba(22,119,255,0.06)', border: '1px solid rgba(22,119,255,0.15)', borderRadius: 8, padding: '12px 16px', textAlign: 'center' }}>
                  <Text type="secondary" style={{ fontSize: 11 }}>最佳分数段</Text>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#1677ff' }}>
                    {bestStatusItem.best_score_range}
                  </div>
                </div>
              </Col>
              <Col span={6}>
                <div style={{ background: 'rgba(82,196,26,0.06)', border: '1px solid rgba(82,196,26,0.15)', borderRadius: 8, padding: '12px 16px', textAlign: 'center' }}>
                  <Text type="secondary" style={{ fontSize: 11 }}>最佳段胜率</Text>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#52c41a' }}>{bestStatusItem.best_score_win_rate.toFixed(1)}%</div>
                </div>
              </Col>
              <Col span={6}>
                <div style={{ background: 'rgba(255,77,79,0.06)', border: '1px solid rgba(255,77,79,0.15)', borderRadius: 8, padding: '12px 16px', textAlign: 'center' }}>
                  <Text type="secondary" style={{ fontSize: 11 }}>信号数</Text>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#ff4d4f' }}>{bestStatusItem.best_score_trades || bestStatusItem.total_trades}</div>
                </div>
              </Col>
            </Row>
          ) : isWinnerMode && bestModeItem ? (
            <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
              <Col span={6}>
                <div style={{ background: 'rgba(250,173,20,0.08)', border: '1px solid rgba(250,173,20,0.2)', borderRadius: 8, padding: '12px 16px', textAlign: 'center' }}>
                  <Text type="secondary" style={{ fontSize: 11 }}>最强模式</Text>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#faad14' }}>
                    {bestModeItem.status} <TrophyOutlined style={{ fontSize: 14 }} />
                  </div>
                </div>
              </Col>
              <Col span={6}>
                <div style={{ background: 'rgba(22,119,255,0.06)', border: '1px solid rgba(22,119,255,0.15)', borderRadius: 8, padding: '12px 16px', textAlign: 'center' }}>
                  <Text type="secondary" style={{ fontSize: 11 }}>最佳分数段</Text>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#1677ff' }}>
                    {bestModeItem.best_score_range}
                  </div>
                </div>
              </Col>
              <Col span={6}>
                <div style={{ background: 'rgba(82,196,26,0.06)', border: '1px solid rgba(82,196,26,0.15)', borderRadius: 8, padding: '12px 16px', textAlign: 'center' }}>
                  <Text type="secondary" style={{ fontSize: 11 }}>最佳段胜率</Text>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#52c41a' }}>{bestModeItem.best_score_win_rate.toFixed(1)}%</div>
                </div>
              </Col>
              <Col span={6}>
                <div style={{ background: 'rgba(255,77,79,0.06)', border: '1px solid rgba(255,77,79,0.15)', borderRadius: 8, padding: '12px 16px', textAlign: 'center' }}>
                  <Text type="secondary" style={{ fontSize: 11 }}>信号数</Text>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#ff4d4f' }}>{bestModeItem.best_score_trades || bestModeItem.total_trades}</div>
                </div>
              </Col>
            </Row>
          ) : data.best_bin && (
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
                  {/* Advancers row — market breadth */}
                  <tr>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid rgba(255,77,79,0.2)', color: '#ff4d4f', fontWeight: 600, fontSize: 11, background: 'rgba(255,77,79,0.04)' }}>
                      上涨家数
                    </td>
                    {heatmapData.dates.map((d) => {
                      const adv = (data.advancers && data.advancers[d]) ?? '--'
                      return (
                        <td key={d} style={{ padding: '6px 8px', textAlign: 'center', borderBottom: '1px solid rgba(255,77,79,0.2)', color: '#ff4d4f', fontWeight: 600, fontSize: 12, background: 'rgba(255,77,79,0.04)' }}>
                          {adv}
                        </td>
                      )
                    })}
                  </tr>
                  {heatmapData.bins.map((bin) => (
                    <tr key={bin}>
                      <td style={{
                        padding: '8px 10px', borderBottom: '1px solid rgba(255,255,255,0.04)',
                        color: '#fff', fontWeight: 500, cursor: 'pointer',
                        background: selectedBin === bin ? 'rgba(22,119,255,0.15)' : 'transparent',
                      }}
                        onClick={() => { setSelectedBin(bin); setSelectedRankingStatus(null); }}
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

          {/* Status Heatmap (turnover_vol only) */}
          {isTurnoverVol && statusHeatmap && (statusHeatmap.dates || []).length > 0 && (
            <>
              <Title level={5} style={{ color: '#c9d1d9', marginTop: 24 }}>
                交易状态稳定性热力图（胜率%）
              </Title>
              <div style={{ overflowX: 'auto', marginBottom: 20 }}>
                <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 12 }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '6px 10px', background: '#1a1a2e', borderBottom: '1px solid #30363d', color: '#8b949e', textAlign: 'left' }}>状态</th>
                      {statusHeatmap.dates.map((d) => (
                        <th key={d} style={{ padding: '6px 8px', background: '#1a1a2e', borderBottom: '1px solid #30363d', color: '#8b949e', textAlign: 'center', whiteSpace: 'nowrap' }}>
                          {d.slice(5)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {statusHeatmap.statuses.map((status) => (
                      <tr key={status}>
                        <td style={{
                          padding: '8px 10px', borderBottom: '1px solid rgba(255,255,255,0.04)',
                          color: '#fff', fontWeight: 500,
                        }}>
                          {status}
                        </td>
                        {statusHeatmap.dates.map((d) => {
                          const cell = statusHeatmap.heatmap?.find((h) => h.trade_date === d && h.status === status);
                          const wr = cell?.win_rate || 0;
                          const trades = cell?.total_trades || 0;
                          const isSel = selectedStatusCell?.date === d && selectedStatusCell?.status === status;
                          const bgColor = trades === 0 ? 'rgba(255,255,255,0.01)'
                            : wr > 60 ? `rgba(82,196,26,${0.2 + wr / 200})`
                            : wr > 40 ? `rgba(250,173,20,${0.2 + wr / 200})`
                            : `rgba(255,77,79,${0.15 + wr / 200})`;
                          const textColor = trades === 0 ? '#8b949e'
                            : wr > 60 ? '#52c41a' : wr > 40 ? '#faad14' : '#ff4d4f';
                          return (
                            <td key={d}
                              onClick={() => trades > 0 && handleStatusCellClick(d, status)}
                              style={{
                                padding: '6px 8px', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.04)',
                                background: bgColor,
                                color: textColor,
                                fontWeight: trades > 0 ? 600 : 400,
                                cursor: trades > 0 ? 'pointer' : 'default',
                                outline: isSel ? '2px solid #fff' : 'none',
                                outlineOffset: -2,
                                position: 'relative',
                                zIndex: isSel ? 1 : 0,
                              }}
                              title={trades > 0 ? `点击查看当天股票明细 | ${status} | 胜率:${wr.toFixed(1)}% | 信号:${trades}` : ''}
                            >
                              {trades > 0 ? `${wr.toFixed(0)}%` : '-'}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Status Power Ranking */}
              {statusRanking && (statusRanking.items || []).length > 0 && (
                <>
                  <Title level={5} style={{ color: '#c9d1d9', marginTop: 20 }}>交易状态战力排行榜</Title>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginBottom: 20 }}>
                    <thead>
                      <tr style={{ background: 'rgba(255,255,255,0.04)' }}>
                        <th style={thStyle}>排名</th>
                        <th style={thStyle}>状态</th>
                        <th style={thStyle}>信号数</th>
                        <th style={thStyle}>平均胜率</th>
                        <th style={thStyle}>最佳分数段</th>
                        <th style={thStyle}>最佳段信号数</th>
                        <th style={thStyle}>最佳段胜率</th>
                      </tr>
                    </thead>
                    <tbody>
                      {statusRanking.items.map((r, i) => (
                        <tr key={r.status} onClick={() => { if (r.best_score_range !== '-') { setSelectedBin(r.best_score_range); setSelectedRankingStatus(r); } }} style={{
                          borderBottom: '1px solid rgba(255,255,255,0.04)',
                          cursor: r.best_score_range !== '-' ? 'pointer' : 'default',
                          background: selectedRankingStatus?.status === r.status ? 'rgba(22,119,255,0.1)' : 'transparent',
                        }}>
                          <td style={tdStyle}>
                            <Text strong style={{ color: i === 0 ? '#faad14' : '#8b949e' }}>#{i + 1}</Text>
                          </td>
                          <td style={tdStyle}><Text strong style={{ color: '#fff' }}>{r.status}</Text></td>
                          <td style={tdStyle}><Text style={{ color: '#ff4d4f', fontWeight: 600 }}>{r.total_trades}</Text></td>
                          <td style={tdStyle}>
                            <Text style={{ color: r.win_rate > 60 ? '#52c41a' : r.win_rate > 40 ? '#faad14' : '#ff4d4f', fontWeight: 600 }}>
                              {r.win_rate.toFixed(1)}%
                            </Text>
                          </td>
                          <td style={tdStyle}>
                            <Tag color="purple">{r.best_score_range}</Tag>
                          </td>
                          <td style={tdStyle}><Text style={{ color: '#8b949e', fontWeight: 600 }}>{r.best_score_trades || 0}</Text></td>
                          <td style={tdStyle}>
                            <Text style={{ color: r.best_score_win_rate > 60 ? '#52c41a' : r.best_score_win_rate > 40 ? '#faad14' : '#ff4d4f', fontWeight: 600 }}>
                              {r.best_score_win_rate > 0 ? `${r.best_score_win_rate.toFixed(1)}%` : '-'}
                            </Text>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
            </>
          )}

          {/* Status Cell Stock Detail Panel */}
          {selectedStatusCell && (
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
                {(() => {
                  const winCount = statusStocksData?.stocks?.filter((s) => s.is_win).length || 0;
                  const total = statusStocksData?.stocks?.length || 0;
                  const lossCount = total - winCount;
                  const liveWR = total > 0 ? ((winCount / total) * 100).toFixed(0) : 0;
                  return (
                    <div>
                      <Text strong style={{ color: '#fff', fontSize: 14 }}>
                        状态选股明细 · {selectedStatusCell.date} · {selectedStatusCell.status} · {strategyName}
                      </Text>
                      {total > 0 && (
                        <span style={{ marginLeft: 12, fontSize: 13 }}>
                          <Tag color="success" style={{ margin: 0 }}>{winCount}胜</Tag>
                          <Tag color="error" style={{ margin: '0 4px' }}>{lossCount}负</Tag>
                          <Text style={{ color: liveWR > 50 ? '#52c41a' : '#ff4d4f', fontWeight: 600 }}>
                            胜率 {liveWR}%
                          </Text>
                        </span>
                      )}
                    </div>
                  );
                })()}
                <Button type="text" size="small" style={{ color: '#8b949e' }} onClick={() => setSelectedStatusCell(null)}>
                  收起
                </Button>
              </div>
              {statusStocksLoading ? (
                <div style={{ textAlign: 'center', padding: 24 }}><Spin size="small" /></div>
              ) : !statusStocksData?.stocks?.length ? (
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
                      <th style={thStyle}>逻辑演绎</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>当日收</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>次日开</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>次日收</th>
                      <th style={thStyle}>胜负</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statusStocksData.stocks.map((s) => (
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
                        <td style={{ ...tdStyle, maxWidth: 180, whiteSpace: 'normal', wordWrap: 'break-word', fontSize: 12 }}>
                          <Text style={{ color: '#8b949e' }}>{s.notes || '-'}</Text>
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
                {(() => {
                  const winCount = stocksData?.stocks?.filter((s) => s.is_win).length || 0;
                  const total = stocksData?.stocks?.length || 0;
                  const lossCount = total - winCount;
                  const liveWR = total > 0 ? ((winCount / total) * 100).toFixed(0) : 0;
                  return (
                    <div>
                      <Text strong style={{ color: '#fff', fontSize: 14 }}>
                        当日选股明细 · {selectedCell.date} · {selectedCell.bin.replace('-', '-')}分 · {strategyName}
                      </Text>
                      {total > 0 && (
                        <span style={{ marginLeft: 12, fontSize: 13 }}>
                          <Tag color="success" style={{ margin: 0 }}>{winCount}胜</Tag>
                          <Tag color="error" style={{ margin: '0 4px' }}>{lossCount}负</Tag>
                          <Text style={{ color: liveWR > 50 ? '#52c41a' : '#ff4d4f', fontWeight: 600 }}>
                            胜率 {liveWR}%
                          </Text>
                        </span>
                      )}
                    </div>
                  );
                })()}
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
                      <th style={thStyle}>逻辑演绎</th>
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
                        <td style={{ ...tdStyle, maxWidth: 200, whiteSpace: 'normal', wordWrap: 'break-word', fontSize: 12 }}>
                          <Text style={{ color: '#8b949e' }}>{s.notes || '-'}</Text>
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
          {activeTrendData && activeTrendData.type === 'status' && (
            <>
              <Title level={5} style={{ color: '#c9d1d9' }}>{activeTrendData.label} 趋势</Title>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={activeTrendData.data}>
                  <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                  <XAxis dataKey="trade_date" tick={{ fill: '#8b949e', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#8b949e', fontSize: 11 }} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                  <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid #30363d', borderRadius: 8 }}
                    formatter={(value) => [`${Number(value).toFixed(1)}%`, '胜率']}
                  />
                  <ReferenceLine y={50} stroke="rgba(255,255,255,0.12)" strokeDasharray="3 3" />
                  <Line type="monotone" dataKey="win_rate" stroke="#eb2f96" strokeWidth={2} dot={{ r: 4, fill: '#eb2f96' }} name="胜率%" />
                </LineChart>
              </ResponsiveContainer>
            </>
          )}
          {activeTrendData && activeTrendData.type === 'generic' && (
            <>
              <Title level={5} style={{ color: '#c9d1d9' }}>{activeTrendData.label} 趋势</Title>
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Text type="secondary" style={{ fontSize: 12 }}>胜率走势</Text>
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={activeTrendData.data}>
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
                    <LineChart data={activeTrendData.data}>
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

          {/* Mode Ranking (winner_mode only) */}
          {isWinnerMode && modeRanking && (modeRanking.items || []).length > 0 && (
            <>
              <Title level={5} style={{ color: '#c9d1d9', marginTop: 20 }}>
                赚钱效应状态战力排行榜
              </Title>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginBottom: 20 }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.04)' }}>
                    <th style={thStyle}>排名</th>
                    <th style={thStyle}>赚钱模式</th>
                    <th style={thStyle}>信号数</th>
                    <th style={thStyle}>胜率</th>
                    <th style={thStyle}>最佳分数段</th>
                    <th style={thStyle}>最佳段胜率</th>
                  </tr>
                </thead>
                <tbody>
                  {modeRanking.items.map((r, i) => (
                    <tr key={r.status} style={{
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                    }}>
                      <td style={tdStyle}>
                        <Text strong style={{ color: i === 0 ? '#faad14' : '#8b949e' }}>#{i + 1}</Text>
                      </td>
                      <td style={tdStyle}><Text strong style={{ color: '#fff' }}>{r.status}</Text></td>
                      <td style={tdStyle}><Text style={{ color: '#ff4d4f', fontWeight: 600 }}>{r.total_trades}</Text></td>
                      <td style={tdStyle}>
                        <Text style={{ color: r.win_rate > 60 ? '#52c41a' : r.win_rate > 40 ? '#faad14' : '#ff4d4f', fontWeight: 600 }}>
                          {r.win_rate.toFixed(1)}%
                        </Text>
                      </td>
                      <td style={tdStyle}>
                        <Tag color="purple">{r.best_score_range}</Tag>
                      </td>
                      <td style={tdStyle}>
                        <Text style={{ color: r.best_score_win_rate > 60 ? '#52c41a' : r.best_score_win_rate > 40 ? '#faad14' : '#ff4d4f', fontWeight: 600 }}>
                          {r.best_score_win_rate > 0 ? `${r.best_score_win_rate.toFixed(1)}%` : '-'}
                        </Text>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
              onClick: () => { setSelectedBin(`${record.range_start}-${record.range_end}`); setSelectedRankingStatus(null); },
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
