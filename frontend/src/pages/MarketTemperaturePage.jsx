import { Card, Col, DatePicker, Empty, Modal, Row, Spin, Table, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis, YAxis,
} from 'recharts';
import {
  useGetMarketTemperatureLatestDateQuery,
  useGetMarketTemperatureQuery,
  useGetMarketTemperatureSectorDrillQuery,
} from '../app/api';

const { Title, Text } = Typography;

// 温度状态 → 颜色（红=热，蓝/青=冷）
const rsiColor = (v) => {
  if (v >= 70) return '#ff4d4f';
  if (v >= 60) return '#fa8c16';
  if (v >= 50) return '#a0d911';
  if (v >= 40) return '#8c8c8c';
  if (v >= 30) return '#1677ff';
  return '#13c2c2';
};

const StatCard = ({ label, value, suffix = '', color = '#fff', sub }) => (
  <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '14px 16px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.06)', height: '100%' }}>
    <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>{label}</Text>
    <div style={{ fontSize: 26, fontWeight: 700, color, lineHeight: 1.3, marginTop: 4 }}>{value}{suffix}</div>
    {sub && <Text type="secondary" style={{ fontSize: 10 }}>{sub}</Text>}
  </div>
);

// 温度刻度条：0-30 冷 / 30-50 中性 / 50-70 暖 / 70-100 热，均值处打标记
const TemperatureGauge = ({ value }) => {
  const left = Math.max(0, Math.min(100, value || 0));
  const ticks = [
    { p: 0, t: '0' }, { p: 30, t: '30' }, { p: 50, t: '50' }, { p: 70, t: '70' }, { p: 100, t: '100' },
  ];
  return (
    <div style={{ position: 'relative', margin: '20px 0 6px', paddingTop: 6 }}>
      <div style={{ display: 'flex', height: 12, borderRadius: 6, overflow: 'hidden', background: '#1a1a2e' }}>
        <div style={{ flex: 30, background: '#1677ff' }} />
        <div style={{ flex: 20, background: '#722ed1' }} />
        <div style={{ flex: 20, background: '#fa8c16' }} />
        <div style={{ flex: 30, background: '#ff4d4f' }} />
      </div>
      {ticks.map((t) => (
        <div key={t.p} style={{ position: 'absolute', top: 18, left: `${t.p}%`, transform: 'translateX(-50%)', fontSize: 10, color: '#8c8c8c' }}>
          {t.t}
        </div>
      ))}
      <div style={{
        position: 'absolute', top: -4, left: `calc(${left}% - 6px)`,
        width: 12, height: 24, background: '#fff', borderRadius: 3,
        border: '2px solid #faad14', boxShadow: '0 0 6px rgba(250,173,20,0.6)', transition: 'left 0.3s',
      }} />
      <div style={{ display: 'flex', marginTop: 16 }}>
        <div style={{ flex: 30, textAlign: 'center', fontSize: 10, color: '#8c8c8c' }}>← 冷区</div>
        <div style={{ flex: 20, textAlign: 'center', fontSize: 10, color: '#8c8c8c' }}>中性</div>
        <div style={{ flex: 20, textAlign: 'center', fontSize: 10, color: '#8c8c8c' }}>暖区</div>
        <div style={{ flex: 30, textAlign: 'center', fontSize: 10, color: '#8c8c8c' }}>热区 →</div>
      </div>
    </div>
  );
};

const DistributionBars = ({ distribution }) => {
  const bars = Array.isArray(distribution) ? distribution : [];
  const max = Math.max(...bars.map((b) => b.pct || 0), 1);
  const colors = { '<30': '#13c2c2', '30-50': '#1677ff', '50-70': '#fa8c16', '70-100': '#ff4d4f' };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {bars.map((b) => (
        <div key={b.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 52, fontSize: 12, color: '#8c8c8c', flexShrink: 0 }}>RSI {b.label}</span>
          <div style={{ flex: 1, background: 'rgba(255,255,255,0.04)', borderRadius: 4, height: 14, overflow: 'hidden' }}>
            <div style={{
              width: `${(b.pct / max) * 100}%`, height: '100%',
              background: colors[b.label] || '#fa8c16', borderRadius: 4, transition: 'width 0.3s',
            }} />
          </div>
          <span style={{ width: 52, fontSize: 12, color: '#fff', textAlign: 'right', flexShrink: 0 }}>{b.pct?.toFixed(1)}%</span>
        </div>
      ))}
    </div>
  );
};

const MarketTemperaturePage = () => {
  const [selectedDate, setSelectedDate] = useState(null);
  const { data: latestDate } = useGetMarketTemperatureLatestDateQuery();

  useEffect(() => {
    if (latestDate && !selectedDate) {
      setSelectedDate(dayjs(latestDate));
    }
  }, [latestDate, selectedDate]);

  const selectedDateStr = selectedDate ? selectedDate.format('YYYY-MM-DD') : undefined;
  const { data, isLoading, isFetching } = useGetMarketTemperatureQuery(
    { trade_date: selectedDateStr },
    { skip: !selectedDateStr },
  );

  const market = data?.market;
  const trend = Array.isArray(data?.trend) ? data.trend : [];
  const sectors = Array.isArray(data?.sectors) ? data.sectors : [];
  const radar = data?.radar;

  const [drill, setDrill] = useState(null); // { sector, trade_date }
  const { data: drillData, isFetching: drillLoading } = useGetMarketTemperatureSectorDrillQuery(
    drill ? { sector_name: drill.sector.sector_name, trade_date: drill.trade_date } : undefined,
    { skip: !drill },
  );
  const openDrill = (sector) => setDrill({ sector, trade_date: selectedDateStr });

  const hotSectors = useMemo(
    () => [...sectors].filter((s) => s.delta_rsi > 0).sort((a, b) => b.delta_rsi - a.delta_rsi).slice(0, 8),
    [sectors],
  );
  const coldSectors = useMemo(
    () => [...sectors].filter((s) => s.delta_rsi < 0).sort((a, b) => a.delta_rsi - b.delta_rsi).slice(0, 8),
    [sectors],
  );

  const columns = [
    {
      title: '板块', dataIndex: 'sector_name', key: 'sector_name',
      render: (t, r) => (
        <span
          style={{ color: '#40a9ff', cursor: 'pointer', borderBottom: '1px dashed #40a9ff' }}
          title="点击查看 30 日 RSI 漂移"
        >
          {r.status} {t}
        </span>
      ),
    },
    {
      title: '平均RSI', dataIndex: 'avg_rsi', key: 'avg_rsi', sorter: (a, b) => a.avg_rsi - b.avg_rsi,
      render: (v) => <span style={{ color: rsiColor(v), fontWeight: 600 }}>{v.toFixed(1)}</span>,
    },
    { title: '中位RSI', dataIndex: 'median_rsi', key: 'median_rsi', render: (v) => v.toFixed(1) },
    { title: 'RSI>70', dataIndex: 'rsi_gt70_pct', key: 'rsi_gt70_pct', render: (v) => `${v.toFixed(0)}%` },
    { title: 'RSI>50', dataIndex: 'rsi_gt50_pct', key: 'rsi_gt50_pct', render: (v) => `${v.toFixed(0)}%` },
    { title: 'RSI<30', dataIndex: 'rsi_lt30_pct', key: 'rsi_lt30_pct', render: (v) => `${v.toFixed(0)}%` },
    { title: '股票数', dataIndex: 'stock_count', key: 'stock_count' },
    {
      title: 'ΔRSI', dataIndex: 'delta_rsi', key: 'delta_rsi', sorter: (a, b) => a.delta_rsi - b.delta_rsi,
      render: (v) => (
        <span style={{ color: v >= 0 ? '#ff4d4f' : '#52c41a', fontWeight: 600 }}>
          {v > 0 ? '+' : ''}{v.toFixed(1)}
        </span>
      ),
    },
  ];

  const radarItems = [
    { key: 'super_strong', label: '🔥 超强', desc: 'RSI ≥ 80', color: '#ff4d4f' },
    { key: 'strong', label: '🟠 偏强', desc: '70 ~ 80', color: '#fa8c16' },
    { key: 'normal', label: '🟢 正常', desc: '40 ~ 70', color: '#52c41a' },
    { key: 'weak', label: '🔵 偏弱', desc: '30 ~ 40', color: '#1677ff' },
    { key: 'super_weak', label: '❄ 超弱', desc: '< 30', color: '#13c2c2' },
  ];

  return (
    <div style={{ padding: '24px', background: '#0a0a0a', minHeight: '100vh' }}>
      <header style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={2} style={{ color: '#fff', margin: 0 }}>🌡️ 市场温度 / RSI 情绪</Title>
          <Text type="secondary">全市场 RSI 横截面分布 · 板块温度 · 个股 RSI 雷达</Text>
        </div>
        <DatePicker
          value={selectedDate}
          onChange={(d) => setSelectedDate(d || null)}
          allowClear={false}
          style={{ background: '#1a1a2e', borderColor: '#30363d', color: '#fff' }}
        />
      </header>

      {isLoading && !data ? (
        <div style={{ textAlign: 'center', padding: 60 }}><Spin size="large" /></div>
      ) : !data || !market ? (
        <Empty description="暂无数据" style={{ padding: 60 }} />
      ) : (
        <>
          {/* 市场温度 */}
          <Card style={{ background: '#141414', border: '1px solid #30363d', borderRadius: 10, marginBottom: 16 }} styles={{ body: { padding: '16px 20px' } }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Text strong style={{ color: '#fff', fontSize: 15 }}>市场 RSI 温度</Text>
              <Tag color={market.avg_rsi >= 60 ? 'red' : market.avg_rsi >= 50 ? 'orange' : market.avg_rsi >= 40 ? 'default' : 'blue'} style={{ fontSize: 13, padding: '2px 12px' }}>
                {market.status}
              </Tag>
            </div>
            <Row gutter={[12, 12]} style={{ marginBottom: 12 }}>
              <Col span={4}><StatCard label="市场平均 RSI" value={market.avg_rsi.toFixed(1)} color={rsiColor(market.avg_rsi)} /></Col>
              <Col span={4}><StatCard label="市场中位数 RSI" value={market.median_rsi.toFixed(1)} color={rsiColor(market.median_rsi)} /></Col>
              <Col span={4}><StatCard label="RSI > 70（超买）" value={market.rsi_gt70_pct.toFixed(1)} suffix="%" color="#ff4d4f" /></Col>
              <Col span={4}><StatCard label="RSI > 50（强势）" value={market.rsi_gt50_pct.toFixed(1)} suffix="%" color="#fa8c16" /></Col>
              <Col span={4}><StatCard label="RSI < 30（超卖）" value={market.rsi_lt30_pct.toFixed(1)} suffix="%" color="#13c2c2" /></Col>
              <Col span={4}>
                <StatCard
                  label="市场扩散度"
                  value={`${market.diffusion_pct > 0 ? '+' : ''}${market.diffusion_pct.toFixed(1)}`}
                  suffix="%"
                  color={market.diffusion_pct >= 0 ? '#ff4d4f' : '#52c41a'}
                  sub={`昨日 RSI>50 ${market.prev_gt50_pct.toFixed(1)}%`}
                />
              </Col>
            </Row>
            <TemperatureGauge value={market.avg_rsi} />
            <div style={{ marginTop: 16 }}>
              <Text strong style={{ color: '#fff', fontSize: 13, display: 'block', marginBottom: 8 }}>市场 RSI 分布</Text>
              <DistributionBars distribution={market.distribution} />
            </div>
          </Card>

          {/* 趋势图 */}
          <Card style={{ background: '#141414', border: '1px solid #30363d', borderRadius: 10, marginBottom: 16 }} styles={{ body: { padding: '16px 20px' } }}>
            <Text strong style={{ color: '#fff', fontSize: 15, display: 'block', marginBottom: 12 }}>市场温度趋势（平均 RSI · 中位数 RSI）</Text>
            {trend.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={trend} margin={{ top: 8, right: 16, left: -12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#30363d" />
                  <XAxis dataKey="trade_date" tickFormatter={(d) => d.slice(5).replace('-', '/')} stroke="#8c8c8c" fontSize={11} />
                  <YAxis domain={[40, 60]} stroke="#8c8c8c" fontSize={11} />
                  <Tooltip contentStyle={{ background: '#141414', border: '1px solid #30363d', color: '#fff' }} />
                  <Legend />
                  <Line type="monotone" dataKey="avg_rsi" name="平均 RSI" stroke="#faad14" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="median_rsi" name="中位数 RSI" stroke="#1677ff" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <Empty description="暂无趋势数据" />
            )}
          </Card>

          {/* 板块温度表 */}
          <Card style={{ background: '#141414', border: '1px solid #30363d', borderRadius: 10, marginBottom: 16 }} styles={{ body: { padding: '16px 20px' } }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text strong style={{ color: '#fff', fontSize: 15 }}>板块温度（按平均 RSI 降序）</Text>
              <Text type="secondary" style={{ fontSize: 12 }}>💡 点击板块查看 30 日漂移</Text>
            </div>
            <Table
              rowKey="sector_name"
              columns={columns}
              dataSource={sectors}
              size="small"
              pagination={{ pageSize: 20, hideOnSinglePage: true }}
              loading={isFetching}
              onRow={(record) => ({
                onClick: () => openDrill(record),
                style: { cursor: 'pointer' },
              })}
              style={{ background: 'transparent' }}
            />
          </Card>

          {/* 升温榜 / 降温榜 */}
          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            <Col span={12}>
              <Card style={{ background: '#141414', border: '1px solid #30363d', borderRadius: 10 }} styles={{ body: { padding: '16px 20px' } }}>
                <Text strong style={{ color: '#ff4d4f', fontSize: 15 }}>🔥 板块升温榜</Text>
                <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {hotSectors.length > 0 ? hotSectors.map((s, i) => (
                    <div key={s.sector_name} onClick={() => openDrill(s)} title="点击查看 30 日 RSI 漂移" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'rgba(255,77,79,0.04)', borderRadius: 6, border: '1px solid rgba(255,77,79,0.15)', cursor: 'pointer' }}>
                      <span>
                        <Text style={{ color: '#8b949e', marginRight: 8 }}>#{i + 1}</Text>
                        <Text style={{ color: '#40a9ff', borderBottom: '1px dashed #40a9ff' }}>{s.sector_name}</Text>
                        <Text type="secondary" style={{ fontSize: 11, marginLeft: 8 }}>RSI {s.avg_rsi.toFixed(1)}</Text>
                      </span>
                      <Text style={{ color: '#ff4d4f', fontWeight: 600 }}>+{s.delta_rsi.toFixed(1)}</Text>
                    </div>
                  )) : <Text type="secondary">暂无升温板块</Text>}
                </div>
              </Card>
            </Col>
            <Col span={12}>
              <Card style={{ background: '#141414', border: '1px solid #30363d', borderRadius: 10 }} styles={{ body: { padding: '16px 20px' } }}>
                <Text strong style={{ color: '#52c41a', fontSize: 15 }}>❄ 板块降温榜</Text>
                <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {coldSectors.length > 0 ? coldSectors.map((s, i) => (
                    <div key={s.sector_name} onClick={() => openDrill(s)} title="点击查看 30 日 RSI 漂移" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'rgba(82,196,26,0.04)', borderRadius: 6, border: '1px solid rgba(82,196,26,0.15)', cursor: 'pointer' }}>
                      <span>
                        <Text style={{ color: '#8b949e', marginRight: 8 }}>#{i + 1}</Text>
                        <Text style={{ color: '#40a9ff', borderBottom: '1px dashed #40a9ff' }}>{s.sector_name}</Text>
                        <Text type="secondary" style={{ fontSize: 11, marginLeft: 8 }}>RSI {s.avg_rsi.toFixed(1)}</Text>
                      </span>
                      <Text style={{ color: '#52c41a', fontWeight: 600 }}>{s.delta_rsi.toFixed(1)}</Text>
                    </div>
                  )) : <Text type="secondary">暂无降温板块</Text>}
                </div>
              </Card>
            </Col>
          </Row>

          {/* 个股 RSI 雷达 */}
          <Card style={{ background: '#141414', border: '1px solid #30363d', borderRadius: 10 }} styles={{ body: { padding: '16px 20px' } }}>
            <Text strong style={{ color: '#fff', fontSize: 15, display: 'block', marginBottom: 12 }}>个股 RSI 雷达（全市场分档）</Text>
            <Row gutter={[12, 12]}>
              {radarItems.map((item) => (
                <Col span={24 / radarItems.length} key={item.key}>
                  <div style={{ textAlign: 'center', padding: '14px 8px', background: 'rgba(255,255,255,0.03)', borderRadius: 8, border: `1px solid ${item.color}44`, height: '100%' }}>
                    <div style={{ fontSize: 12, color: item.color, fontWeight: 600 }}>{item.label}</div>
                    <div style={{ fontSize: 26, fontWeight: 700, color: '#fff', lineHeight: 1.3, margin: '4px 0' }}>
                      {(radar?.[item.key] ?? 0).toLocaleString()}<span style={{ fontSize: 13, color: '#8c8c8c' }}> 只</span>
                    </div>
                    <div style={{ fontSize: 10, color: '#8c8c8c' }}>{item.desc}</div>
                  </div>
                </Col>
              ))}
            </Row>
          </Card>
        </>
      )}

      <Modal
        open={!!drill}
        onCancel={() => setDrill(null)}
        footer={null}
        width={860}
        title={drill ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            <span>{drill.sector.status} {drill.sector.sector_name}</span>
            <Text type="secondary" style={{ fontWeight: 400, fontSize: 13 }}>
              30 日 RSI 漂移 · 截至 {drill.trade_date}
            </Text>
          </span>
        ) : ''}
        styles={{ body: { maxHeight: 'calc(100vh - 180px)', overflowY: 'auto' } }}
      >
        {drill && (
          <>
            {/* 板块当前温度概览 */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
              {[
                { label: '平均 RSI', v: drill.sector.avg_rsi.toFixed(1), c: rsiColor(drill.sector.avg_rsi) },
                { label: '中位 RSI', v: drill.sector.median_rsi.toFixed(1), c: rsiColor(drill.sector.median_rsi) },
                { label: '成分股', v: drill.sector.stock_count, c: '#fff' },
                { label: 'ΔRSI', v: `${drill.sector.delta_rsi > 0 ? '+' : ''}${drill.sector.delta_rsi.toFixed(1)}`, c: drill.sector.delta_rsi >= 0 ? '#ff4d4f' : '#52c41a' },
              ].map((s) => (
                <div key={s.label} style={{ flex: '1 1 120px', background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '10px 12px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: 11, color: '#8c8c8c' }}>{s.label}</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: s.c, lineHeight: 1.3 }}>{s.v}</div>
                </div>
              ))}
            </div>

            {/* 30 日 RSI 漂移图 */}
            <Text strong style={{ color: '#fff', fontSize: 14, display: 'block', marginBottom: 8 }}>30 日 RSI 漂移（平均 · 中位）</Text>
            {drillLoading && !drillData ? (
              <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>
            ) : drillData && drillData.trend?.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={drillData.trend} margin={{ top: 8, right: 16, left: -12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#30363d" />
                  <XAxis dataKey="trade_date" tickFormatter={(d) => d.slice(5).replace('-', '/')} stroke="#8c8c8c" fontSize={11} />
                  <YAxis domain={[20, 80]} stroke="#8c8c8c" fontSize={11} />
                  <Tooltip contentStyle={{ background: '#141414', border: '1px solid #30363d', color: '#fff' }} />
                  <Legend />
                  <ReferenceLine y={70} stroke="#ff4d4f" strokeDasharray="4 4" label={{ value: '超买 70', fill: '#ff4d4f', fontSize: 10, position: 'insideTopRight' }} />
                  <ReferenceLine y={50} stroke="#8c8c8c" strokeDasharray="4 4" label={{ value: '中性 50', fill: '#8c8c8c', fontSize: 10, position: 'insideRight' }} />
                  <ReferenceLine y={30} stroke="#13c2c2" strokeDasharray="4 4" label={{ value: '超卖 30', fill: '#13c2c2', fontSize: 10, position: 'insideBottomRight' }} />
                  <Line type="monotone" dataKey="avg_rsi" name="平均 RSI" stroke="#faad14" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="median_rsi" name="中位数 RSI" stroke="#1677ff" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <Empty description="暂无漂移数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}

            {/* RSI 最高 TOP5 */}
            <Text strong style={{ color: '#fff', fontSize: 14, display: 'block', margin: '20px 0 10px' }}>当前 RSI 最高 TOP5</Text>
            {drillData && drillData.top_stocks?.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {drillData.top_stocks.map((st, i) => (
                  <div key={st.symbol} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'rgba(255,255,255,0.04)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)' }}>
                    <span style={{
                      width: 24, height: 24, borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0,
                      background: i === 0 ? '#faad14' : i === 1 ? '#a6a6a6' : i === 2 ? '#cd7f32' : '#30363d',
                    }}>{i + 1}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Text style={{ color: '#fff', fontSize: 13 }}>{st.name}</Text>
                      <Text type="secondary" style={{ fontSize: 11, marginLeft: 8 }}>{st.symbol}</Text>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 18, fontWeight: 700, color: rsiColor(st.rsi), lineHeight: 1.2 }}>{st.rsi.toFixed(1)}</div>
                      <div style={{ fontSize: 10, color: '#8c8c8c' }}>30日峰值 {st.peak_rsi.toFixed(1)}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Text type="secondary">暂无成分股数据</Text>
            )}
          </>
        )}
      </Modal>
    </div>
  );
};

export default MarketTemperaturePage;
