import { Row, Col, Card, Spin, Empty, Table, Tag } from 'antd'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts'
import {
  useGetSignalAnalysisQuery,
  useGetTagAnalysisQuery,
  useGetMarketAnalysisQuery,
  useGetExecutionAnalysisQuery,
  useGetEmotionAnalysisQuery,
  useGetMistakeAnalysisQuery,
} from '../app/api'
import { LineChart, Line } from 'recharts'

const COLORS = ['#1677ff', '#52c41a', '#faad14', '#ff4d4f', '#722ed1', '#13c2c2', '#eb2f96']

function Analysis() {
  const { data: signals, isLoading: loadingSignals } = useGetSignalAnalysisQuery()
  const { data: tags, isLoading: loadingTags } = useGetTagAnalysisQuery()
  const { data: market, isLoading: loadingMarket } = useGetMarketAnalysisQuery()
  const { data: execution, isLoading: loadingExec } = useGetExecutionAnalysisQuery()
  const { data: emotionData, isLoading: loadingEmotion } = useGetEmotionAnalysisQuery()
  const { data: mistakeData, isLoading: loadingMistakes } = useGetMistakeAnalysisQuery()

  const signalColumns = [
    { title: '信号', dataIndex: 'signal', key: 'signal' },
    { title: '次数', dataIndex: 'total', key: 'total' },
    { title: '胜次', dataIndex: 'wins', key: 'wins' },
    {
      title: '胜率',
      dataIndex: 'win_rate',
      key: 'win_rate',
      render: (v) => <span style={{ color: v >= 50 ? '#52c41a' : '#ff4d4f' }}>{v?.toFixed(1)}%</span>,
    },
    {
      title: '平均盈亏',
      dataIndex: 'avg_pnl',
      key: 'avg_pnl',
      render: (v) => (
        <span style={{ color: v >= 0 ? '#52c41a' : '#ff4d4f' }}>
          {v >= 0 ? '+' : ''}${v?.toFixed(2)}
        </span>
      ),
    },
  ]

  const tagColumns = [
    { title: '标签', dataIndex: 'tag_name', key: 'tag_name' },
    { title: '分类', dataIndex: 'category', key: 'category', render: (v) => <Tag>{v}</Tag> },
    { title: '次数', dataIndex: 'count', key: 'count' },
    {
      title: '总盈亏',
      dataIndex: 'total_pnl',
      key: 'total_pnl',
      render: (v) => (
        <span style={{ color: v >= 0 ? '#52c41a' : '#ff4d4f', fontWeight: 600 }}>
          {v >= 0 ? '+' : ''}${v?.toFixed(2)}
        </span>
      ),
    },
    {
      title: '平均盈亏',
      dataIndex: 'avg_pnl',
      key: 'avg_pnl',
      render: (v) => (
        <span style={{ color: v >= 0 ? '#52c41a' : '#ff4d4f' }}>
          {v >= 0 ? '+' : ''}${v?.toFixed(2)}
        </span>
      ),
    },
  ]

  return (
    <div className="page-container">
      <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 24 }}>📊 分析中心</h2>

      <Row gutter={[16, 16]}>
        {/* Signal Analysis */}
        <Col xs={24} lg={12}>
          <Card title="🔔 信号分析 — 各信号胜率">
            {loadingSignals ? (
              <div style={{ textAlign: 'center', padding: 60 }}><Spin /></div>
            ) : signals?.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={signals} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                    <XAxis type="number" domain={[0, 100]} stroke="#666" />
                    <YAxis type="category" dataKey="signal" width={100} stroke="#666" fontSize={12} />
                    <Tooltip contentStyle={{ background: '#1f1f1f', border: '1px solid #333', borderRadius: 8 }} />
                    <Bar dataKey="win_rate" name="胜率%" fill="#1677ff" radius={[0, 4, 4, 0]}>
                      {signals.map((entry, idx) => (
                        <Cell key={idx} fill={entry.win_rate >= 50 ? '#52c41a' : '#ff4d4f'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <Table columns={signalColumns} dataSource={signals} rowKey="signal" size="small" pagination={false} style={{ marginTop: 16 }} />
              </>
            ) : (
              <Empty description="暂无信号数据" style={{ padding: 40 }} />
            )}
          </Card>
        </Col>

        {/* Tag Analysis */}
        <Col xs={24} lg={12}>
          <Card title="🏷️ 标签分析 — 哪些错误最多/最亏钱">
            {loadingTags ? (
              <div style={{ textAlign: 'center', padding: 60 }}><Spin /></div>
            ) : tags?.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={tags}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                    <XAxis dataKey="tag_name" stroke="#666" fontSize={12} />
                    <YAxis stroke="#666" />
                    <Tooltip contentStyle={{ background: '#1f1f1f', border: '1px solid #333', borderRadius: 8 }} />
                    <Bar dataKey="total_pnl" name="总盈亏" radius={[4, 4, 0, 0]}>
                      {tags.map((entry, idx) => (
                        <Cell key={idx} fill={entry.total_pnl >= 0 ? '#52c41a' : '#ff4d4f'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <Table columns={tagColumns} dataSource={tags} rowKey="tag_name" size="small" pagination={false} style={{ marginTop: 16 }} />
              </>
            ) : (
              <Empty description="暂无标签数据" style={{ padding: 40 }} />
            )}
          </Card>
        </Col>

        {/* Market Analysis */}
        <Col xs={24} lg={12}>
          <Card title="🌍 市场分析 — 不同环境下的表现">
            {loadingMarket ? (
              <div style={{ textAlign: 'center', padding: 60 }}><Spin /></div>
            ) : market?.length > 0 ? (
              <Row gutter={16}>
                <Col span={12}>
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={market}
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        paddingAngle={3}
                        dataKey="total"
                        nameKey="condition"
                        label={({ condition, total }) => `${condition}: ${total}`}
                      >
                        {market.map((_, idx) => (
                          <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ background: '#1f1f1f', border: '1px solid #333', borderRadius: 8 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </Col>
                <Col span={12}>
                  <div style={{ padding: '20px 0' }}>
                    {market.map((m, i) => (
                      <div key={i} style={{
                        display: 'flex', justifyContent: 'space-between', padding: '8px 0',
                        borderBottom: '1px solid #262626',
                      }}>
                        <span>{m.condition}</span>
                        <span>
                          胜率 <strong style={{ color: m.win_rate >= 50 ? '#52c41a' : '#ff4d4f' }}>{m.win_rate}%</strong>
                          {' | '}
                          <span style={{ color: m.total_pnl >= 0 ? '#52c41a' : '#ff4d4f' }}>
                            ${m.total_pnl}
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>
                </Col>
              </Row>
            ) : (
              <Empty description="暂无市场数据" style={{ padding: 40 }} />
            )}
          </Card>
        </Col>

        {/* Execution Analysis */}
        <Col xs={24} lg={12}>
          <Card title="⚡ 执行分析 — 按规则 vs 不按规则">
            {loadingExec ? (
              <div style={{ textAlign: 'center', padding: 60 }}><Spin /></div>
            ) : execution?.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={execution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                    <XAxis dataKey="score" stroke="#666" />
                    <YAxis yAxisId="left" stroke="#666" />
                    <YAxis yAxisId="right" orientation="right" stroke="#666" />
                    <Tooltip contentStyle={{ background: '#1f1f1f', border: '1px solid #333', borderRadius: 8 }} />
                    <Legend />
                    <Bar yAxisId="left" dataKey="total_pnl" name="总盈亏" fill="#1677ff" radius={[4, 4, 0, 0]} />
                    <Bar yAxisId="right" dataKey="win_rate" name="胜率%" fill="#52c41a" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                <div style={{ marginTop: 16 }}>
                  {execution.map((e) => (
                    <div key={e.score} style={{
                      display: 'flex', justifyContent: 'space-between', padding: '8px 12px',
                      borderBottom: '1px solid #262626',
                    }}>
                      <span>
                        <Tag color={e.score === 'A' ? 'green' : e.score === 'B' ? 'blue' : e.score === 'C' ? 'orange' : 'red'}>
                          {e.score}
                        </Tag>
                        {e.total} 笔交易
                      </span>
                      <span>
                        胜率 <strong style={{ color: e.win_rate >= 50 ? '#52c41a' : '#ff4d4f' }}>{e.win_rate}%</strong>
                        {' | 平均 '}
                        <span style={{ color: e.avg_pnl >= 0 ? '#52c41a' : '#ff4d4f' }}>
                          ${e.avg_pnl}
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <Empty description="暂无执行数据" style={{ padding: 40 }} />
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        {/* Mistakes Analysis */}
        <Col xs={24} lg={12}>
          <Card title="❌ 错误统计 — 避免同样错误">
            {loadingMistakes ? (
              <div style={{ textAlign: 'center', padding: 60 }}><Spin /></div>
            ) : mistakeData?.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={mistakeData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="count"
                    nameKey="mistake"
                    label={({ mistake, count }) => `${mistake}: ${count}`}
                  >
                    {mistakeData.map((_, idx) => (
                      <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#1f1f1f', border: '1px solid #333', borderRadius: 8 }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Empty description="暂无错误统计" style={{ padding: 40 }} />
            )}
          </Card>
        </Col>

        {/* Emotion vs Profit Analysis */}
        <Col xs={24} lg={12}>
          <Card title="🧠 情绪 VS 盈利 — 情绪控制才是核心">
            {loadingEmotion ? (
              <div style={{ textAlign: 'center', padding: 60 }}><Spin /></div>
            ) : emotionData?.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={emotionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                  <XAxis dataKey="date" stroke="#666" fontSize={12} />
                  <YAxis yAxisId="left" stroke="#666" />
                  <YAxis yAxisId="right" orientation="right" stroke="#666" domain={[0, 10]} />
                  <Tooltip contentStyle={{ background: '#1f1f1f', border: '1px solid #333', borderRadius: 8 }} />
                  <Legend />
                  <Bar yAxisId="left" type="monotone" dataKey="total_profit" name="当日盈亏($)" fill="#1677ff" barSize={20} />
                  <Line yAxisId="right" type="monotone" dataKey="emotion_score" name="情绪分" stroke="#faad14" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <Empty description="暂无情绪数据" style={{ padding: 40 }} />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Analysis
