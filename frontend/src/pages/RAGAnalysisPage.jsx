import { useState } from 'react'
import {
  Row, Col, Card, Typography, Input, Button, Tag, Space, Spin, Empty,
  Select, Badge, List,
} from 'antd'
import {
  RobotOutlined, SendOutlined, BulbOutlined, FileTextOutlined,
  ClearOutlined, FireOutlined, UserOutlined, TrendingOutlined,
} from '@ant-design/icons'
import { useAnalyzeRagMutation, useGetRagHotTopicsQuery, useGetRagAuthorsQuery } from '../app/api'

const { Title, Text, Paragraph } = Typography
const { TextArea } = Input

const RAGAnalysisPage = () => {
  const [query, setQuery] = useState('')
  const [author, setAuthor] = useState('')
  const [analyzeRag, { isLoading }] = useAnalyzeRagMutation()
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const { data: hotTopics = [] } = useGetRagHotTopicsQuery()
  const { data: authors = [] } = useGetRagAuthorsQuery()

  const handleAnalyze = async () => {
    if (!query.trim()) return
    setError(null)
    setResult(null)
    try {
      const data = await analyzeRag({ query: query.trim(), author: author || undefined }).unwrap()
      setResult(data)
    } catch (err) {
      setError(err?.data?.message || err?.message || '分析失败')
    }
  }

  const handleClear = () => {
    setQuery('')
    setAuthor(undefined)
    setResult(null)
    setError(null)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleAnalyze()
    }
  }

  const renderStructuredText = (text) => {
    if (!text) return <Empty description="暂无内容" image={Empty.PRESENTED_IMAGE_SIMPLE} />
    return text.split('\n').map((line, i) => {
      const trimmed = line.trim()
      if (!trimmed) return <br key={i} />
      if (/^\d+[\.\、]/.test(trimmed)) {
        return <div key={i} style={{ fontWeight: 600, color: '#1677ff', marginTop: i > 0 ? 8 : 0, marginBottom: 4 }}>{trimmed}</div>
      }
      if (trimmed.startsWith('-') || trimmed.startsWith('·')) {
        return <div key={i} style={{ paddingLeft: 16, color: '#c9d1d9', marginBottom: 2 }}>{trimmed}</div>
      }
      return <div key={i} style={{ color: '#c9d1d9', marginBottom: 2 }}>{trimmed}</div>
    })
  }

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1500, margin: '0 auto' }}>
      <Title level={3} style={{ color: '#e6e6e6', margin: 0, marginBottom: 4 }}>
        <RobotOutlined style={{ marginRight: 8, color: '#1677ff' }} />
        AI 投研分析
      </Title>
      <Text type="secondary" style={{ color: '#8b949e' }}>
        基于水木论坛帖子进行 RAG 检索 + DeepSeek R1 推理分析
      </Text>

      <Row gutter={24} style={{ marginTop: 20 }}>
        {/* === Left Sidebar === */}
        <Col xs={24} lg={6}>
          {/* Hot Topics */}
          <Card
            title={<span><FireOutlined style={{ color: '#fa8c16', marginRight: 8 }} />今日热议</span>}
            style={{ background: '#161b22', border: '1px solid #21262d', borderRadius: 8, marginBottom: 16 }}
            bodyStyle={{ padding: '8px 12px' }}
            headStyle={{ borderBottom: '1px solid #21262d', minHeight: 'auto' }}
          >
            {hotTopics.length > 0 ? (
              <List
                size="small"
                dataSource={hotTopics}
                renderItem={(t, i) => (
                  <List.Item
                    style={{ padding: '6px 0', borderBottom: '1px solid #21262d', cursor: 'pointer' }}
                    onClick={() => setQuery(t.topic + ' 怎么看？')}
                  >
                    <Space>
                      <Tag color={i === 0 ? 'red' : i === 1 ? 'orange' : 'default'} style={{ fontSize: 11 }}>
                        #{i + 1}
                      </Tag>
                      <Text style={{ color: '#c9d1d9', fontSize: 13 }}>{t.topic}</Text>
                    </Space>
                    <Badge count={t.count} size="small" style={{ backgroundColor: '#30363d' }} />
                  </List.Item>
                )}
              />
            ) : (
              <Text type="secondary" style={{ fontSize: 12 }}>暂无今日数据</Text>
            )}
          </Card>

          {/* Author Filter */}
          <Card
            title={<span><UserOutlined style={{ color: '#1677ff', marginRight: 8 }} />作者筛选</span>}
            style={{ background: '#161b22', border: '1px solid #21262d', borderRadius: 8 }}
            bodyStyle={{ padding: '12px' }}
            headStyle={{ borderBottom: '1px solid #21262d', minHeight: 'auto' }}
          >
            <Select
              showSearch
              allowClear
              placeholder="选择作者（可选）"
              value={author || undefined}
              onChange={(val) => setAuthor(val || '')}
              style={{ width: '100%' }}
              options={[
                { label: '🌐 全场（不限作者）', value: '' },
                ...authors.map((a) => ({ label: a, value: a })),
              ]}
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
            />
          </Card>
        </Col>

        {/* === Main Content === */}
        <Col xs={24} lg={18}>
          {/* Query Input */}
          <Card
            style={{ background: '#161b22', border: '1px solid #21262d', borderRadius: 8, marginBottom: 20 }}
            bodyStyle={{ padding: 20 }}
          >
            <TextArea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入你的问题，例如：半导体还能追吗？"
              autoSize={{ minRows: 2, maxRows: 4 }}
              style={{
                background: '#0d1117', color: '#c9d1d9',
                border: '1px solid #30363d', borderRadius: 6, fontSize: 15,
              }}
            />
            <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Space>
                <Button type="primary" icon={<SendOutlined />} onClick={handleAnalyze}
                  loading={isLoading} disabled={!query.trim()} size="large" style={{ borderRadius: 6 }}>
                  开始分析
                </Button>
                <Button icon={<ClearOutlined />} onClick={handleClear}
                  disabled={isLoading} style={{ borderRadius: 6 }}>清空</Button>
                <Text type="secondary" style={{ color: '#6e7681', fontSize: 12 }}>Ctrl+Enter</Text>
              </Space>
              <Space wrap>
                <Tag style={{ cursor: 'pointer' }} onClick={() => setQuery('半导体还能追吗？')}>半导体还能追吗？</Tag>
                <Tag style={{ cursor: 'pointer' }} onClick={() => setQuery('AI概念股现在是什么阶段？')}>AI概念股什么阶段？</Tag>
                <Tag style={{ cursor: 'pointer' }} onClick={() => setQuery('版上讨论最热的股票是什么？')}>讨论最热的股票</Tag>
              </Space>
            </div>
          </Card>

          {/* Loading */}
          {isLoading && (
            <Card style={{ background: '#161b22', border: '1px solid #21262d', borderRadius: 8, textAlign: 'center', padding: 60 }}>
              <Spin size="large" />
              <div style={{ marginTop: 16 }}>
                <Text style={{ color: '#8b949e', fontSize: 15 }}>
                  <RobotOutlined style={{ marginRight: 8 }} />DeepSeek R1 正在分析中…
                </Text>
              </div>
            </Card>
          )}

          {/* Error */}
          {error && (
            <Card style={{ background: '#1c1317', border: '1px solid #da3633', borderRadius: 8, marginBottom: 20 }}>
              <Text style={{ color: '#f85149' }}>❌ {error}</Text>
            </Card>
          )}

          {/* Results */}
          {result && !isLoading && (
            <Row gutter={20}>
              <Col xs={24} lg={12}>
                <Card
                  title={<Space><BulbOutlined style={{ color: '#d29922' }} /><span style={{ color: '#e6e6e6' }}>🧠 思考过程</span></Space>}
                  style={{ background: '#161b22', border: '1px solid #21262d', borderRadius: 8, marginBottom: 20 }}
                  bodyStyle={{ padding: 16, maxHeight: 600, overflow: 'auto' }}
                  headStyle={{ borderBottom: '1px solid #21262d' }}
                >
                  <div style={{ fontSize: 14, lineHeight: '1.8' }}>{renderStructuredText(result.thinking)}</div>
                </Card>
              </Col>
              <Col xs={24} lg={12}>
                <Card
                  title={<Space><FileTextOutlined style={{ color: '#1677ff' }} /><span style={{ color: '#e6e6e6' }}>📈 分析报告</span></Space>}
                  style={{ background: '#161b22', border: '1px solid #21262d', borderRadius: 8, marginBottom: 20 }}
                  bodyStyle={{ padding: 16, maxHeight: 600, overflow: 'auto' }}
                  headStyle={{ borderBottom: '1px solid #21262d' }}
                >
                  <div style={{ fontSize: 14, lineHeight: '1.8' }}>{renderStructuredText(result.report)}</div>
                </Card>
              </Col>
            </Row>
          )}

          {/* Sources */}
          {result?.sources?.length > 0 && !isLoading && (
            <Card
              title={<span style={{ color: '#e6e6e6' }}>📚 检索来源（{result.sources.length} 条）</span>}
              style={{ background: '#161b22', border: '1px solid #21262d', borderRadius: 8 }}
              bodyStyle={{ padding: '8px 16px' }}
              headStyle={{ borderBottom: '1px solid #21262d' }}
            >
              {result.sources.map((src, idx) => (
                <div key={idx} style={{ padding: '4px 0', borderBottom: '1px solid #21262d' }}>
                  <Tag color="blue" style={{ marginRight: 8 }}>#{idx + 1}</Tag>
                  <Text style={{ color: '#c9d1d9', fontSize: 13 }}>{src}</Text>
                </div>
              ))}
            </Card>
          )}

          {/* Empty State */}
          {!result && !isLoading && !error && (
            <Card style={{ background: '#161b22', border: '1px solid #21262d', borderRadius: 8, textAlign: 'center', padding: 60 }}>
              <RobotOutlined style={{ fontSize: 48, color: '#30363d', marginBottom: 16 }} />
              <div><Text style={{ color: '#8b949e', fontSize: 15 }}>输入问题，AI 基于论坛资料为你分析</Text></div>
            </Card>
          )}
        </Col>
      </Row>
    </div>
  )
}

export default RAGAnalysisPage
