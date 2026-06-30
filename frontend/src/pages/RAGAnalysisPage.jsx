import { useState } from 'react'
import {
  Row, Col, Card, Typography, Input, Button, Tag, Space, Spin, Empty,
  Divider, Collapse,
} from 'antd'
import {
  RobotOutlined, SendOutlined, BulbOutlined, FileTextOutlined,
  ClearOutlined, FilterOutlined, LinkOutlined,
} from '@ant-design/icons'
import { useAnalyzeRagMutation } from '../app/api'

const { Title, Text, Paragraph } = Typography
const { TextArea } = Input

const RAGAnalysisPage = () => {
  const [query, setQuery] = useState('')
  const [author, setAuthor] = useState('')
  const [analyzeRag, { isLoading }] = useAnalyzeRagMutation()
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const handleAnalyze = async () => {
    if (!query.trim()) return
    setError(null)
    setResult(null)
    try {
      const data = await analyzeRag({ query: query.trim(), author: author.trim() || undefined }).unwrap()
      setResult(data)
    } catch (err) {
      setError(err?.data?.message || err?.message || '分析失败')
    }
  }

  const handleClear = () => {
    setQuery('')
    setAuthor('')
    setResult(null)
    setError(null)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleAnalyze()
    }
  }

  // Helper to render markdown-like text with simple formatting
  const renderStructuredText = (text) => {
    if (!text) return <Empty description="暂无内容" image={Empty.PRESENTED_IMAGE_SIMPLE} />
    return text.split('\n').map((line, i) => {
      const trimmed = line.trim()
      if (!trimmed) return <br key={i} />
      // Numbered headings
      if (/^\d+[\.\、]/.test(trimmed)) {
        return (
          <div key={i} style={{ fontWeight: 600, color: '#1677ff', marginTop: i > 0 ? 8 : 0, marginBottom: 4 }}>
            {trimmed}
          </div>
        )
      }
      // Bullet points
      if (trimmed.startsWith('-') || trimmed.startsWith('·')) {
        return (
          <div key={i} style={{ paddingLeft: 16, color: '#c9d1d9', marginBottom: 2 }}>
            {trimmed}
          </div>
        )
      }
      return <div key={i} style={{ color: '#c9d1d9', marginBottom: 2 }}>{trimmed}</div>
    })
  }

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1400, margin: '0 auto' }}>
      {/* Page Header */}
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ color: '#e6e6e6', margin: 0 }}>
          <RobotOutlined style={{ marginRight: 8, color: '#1677ff' }} />
          AI 投研分析
        </Title>
        <Text type="secondary" style={{ color: '#8b949e' }}>
          基于水木论坛帖子进行 RAG 检索 + DeepSeek R1 推理分析
        </Text>
      </div>

      {/* Query Input Area */}
      <Card
        style={{
          background: '#161b22',
          border: '1px solid #21262d',
          borderRadius: 8,
          marginBottom: 24,
        }}
        bodyStyle={{ padding: 20 }}
      >
        <Row gutter={[16, 12]}>
          <Col span={24}>
            <TextArea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入你的问题，例如：半导体还能追吗？"
              autoSize={{ minRows: 2, maxRows: 4 }}
              style={{
                background: '#0d1117',
                color: '#c9d1d9',
                border: '1px solid #30363d',
                borderRadius: 6,
                fontSize: 15,
              }}
            />
          </Col>
          <Col xs={24} sm={8}>
            <Input
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="作者筛选（可选）"
              prefix={<FilterOutlined style={{ color: '#8b949e' }} />}
              style={{
                background: '#0d1117',
                color: '#c9d1d9',
                border: '1px solid #30363d',
                borderRadius: 6,
              }}
              allowClear
            />
          </Col>
          <Col xs={24} sm={16}>
            <Space>
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={handleAnalyze}
                loading={isLoading}
                disabled={!query.trim()}
                size="large"
                style={{ borderRadius: 6 }}
              >
                开始分析
              </Button>
              <Button
                icon={<ClearOutlined />}
                onClick={handleClear}
                disabled={isLoading}
                style={{ borderRadius: 6 }}
              >
                清空
              </Button>
              <Text type="secondary" style={{ color: '#6e7681', fontSize: 12 }}>
                Ctrl+Enter 快捷发送
              </Text>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Loading State */}
      {isLoading && (
        <Card
          style={{
            background: '#161b22',
            border: '1px solid #21262d',
            borderRadius: 8,
            marginBottom: 24,
            textAlign: 'center',
            padding: 60,
          }}
        >
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>
            <Text style={{ color: '#8b949e', fontSize: 15 }}>
              <RobotOutlined style={{ marginRight: 8 }} />
              DeepSeek R1 正在分析中，请稍候…
            </Text>
          </div>
          <div style={{ marginTop: 8 }}>
            <Text style={{ color: '#6e7681', fontSize: 12 }}>
              检索相关帖子 → 构建上下文 → 推理分析 → 生成报告
            </Text>
          </div>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Card
          style={{
            background: '#1c1317',
            border: '1px solid #da3633',
            borderRadius: 8,
            marginBottom: 24,
          }}
        >
          <Text style={{ color: '#f85149' }}>❌ {error}</Text>
        </Card>
      )}

      {/* Results Area: Left/Right Split */}
      {result && !isLoading && (
        <>
          <Row gutter={24} style={{ marginBottom: 24 }}>
            {/* Left Panel: Thinking Process */}
            <Col xs={24} lg={12}>
              <Card
                title={
                  <Space>
                    <BulbOutlined style={{ color: '#d29922' }} />
                    <span style={{ color: '#e6e6e6' }}>🧠 DeepSeek R1 思考过程</span>
                  </Space>
                }
                style={{
                  background: '#161b22',
                  border: '1px solid #21262d',
                  borderRadius: 8,
                  height: '100%',
                  minHeight: 400,
                }}
                bodyStyle={{ padding: 16, maxHeight: 600, overflow: 'auto' }}
                headStyle={{ borderBottom: '1px solid #21262d' }}
              >
                <div style={{ fontSize: 14, lineHeight: '1.8' }}>
                  {renderStructuredText(result.thinking)}
                </div>
              </Card>
            </Col>

            {/* Right Panel: Report */}
            <Col xs={24} lg={12}>
              <Card
                title={
                  <Space>
                    <FileTextOutlined style={{ color: '#1677ff' }} />
                    <span style={{ color: '#e6e6e6' }}>📈 技术分析报告</span>
                  </Space>
                }
                style={{
                  background: '#161b22',
                  border: '1px solid #21262d',
                  borderRadius: 8,
                  height: '100%',
                  minHeight: 400,
                }}
                bodyStyle={{ padding: 16, maxHeight: 600, overflow: 'auto' }}
                headStyle={{ borderBottom: '1px solid #21262d' }}
              >
                <div style={{ fontSize: 14, lineHeight: '1.8' }}>
                  {renderStructuredText(result.report)}
                </div>
              </Card>
            </Col>
          </Row>

          {/* Sources */}
          {result.sources && result.sources.length > 0 && (
            <Card
              title={
                <Space>
                  <LinkOutlined style={{ color: '#3fb950' }} />
                  <span style={{ color: '#e6e6e6' }}>📚 检索资料来源（{result.sources.length} 条）</span>
                </Space>
              }
              style={{
                background: '#161b22',
                border: '1px solid #21262d',
                borderRadius: 8,
              }}
              bodyStyle={{ padding: 16 }}
              headStyle={{ borderBottom: '1px solid #21262d' }}
            >
              <Collapse
                ghost
                style={{ background: 'transparent' }}
                items={[
                  {
                    key: 'sources',
                    label: <Text style={{ color: '#8b949e' }}>展开查看检索到的帖子摘要</Text>,
                    children: (
                      <div>
                        {result.sources.map((src, idx) => (
                          <div
                            key={idx}
                            style={{
                              padding: '8px 12px',
                              marginBottom: 6,
                              background: '#0d1117',
                              borderRadius: 4,
                              border: '1px solid #21262d',
                            }}
                          >
                            <Tag color="blue" style={{ marginRight: 8 }}>#{idx + 1}</Tag>
                            <Text style={{ color: '#c9d1d9', fontSize: 13 }}>{src}</Text>
                          </div>
                        ))}
                      </div>
                    ),
                  },
                ]}
              />
            </Card>
          )}
        </>
      )}

      {/* Empty state when no query performed yet */}
      {!result && !isLoading && !error && (
        <Card
          style={{
            background: '#161b22',
            border: '1px solid #21262d',
            borderRadius: 8,
            textAlign: 'center',
            padding: 60,
          }}
        >
          <RobotOutlined style={{ fontSize: 48, color: '#30363d', marginBottom: 16 }} />
          <div>
            <Text style={{ color: '#8b949e', fontSize: 15 }}>
              输入你的问题，AI 将基于论坛资料为你提供分析
            </Text>
          </div>
          <div style={{ marginTop: 12 }}>
            <Space wrap>
              <Tag
                style={{ cursor: 'pointer', padding: '4px 12px' }}
                onClick={() => setQuery('半导体还能追吗？')}
              >
                半导体还能追吗？
              </Tag>
              <Tag
                style={{ cursor: 'pointer', padding: '4px 12px' }}
                onClick={() => setQuery('AI概念股现在是什么阶段？')}
              >
                AI概念股现在是什么阶段？
              </Tag>
              <Tag
                style={{ cursor: 'pointer', padding: '4px 12px' }}
                onClick={() => setQuery('新质生产力方向怎么看？')}
              >
                新质生产力方向怎么看？
              </Tag>
            </Space>
          </div>
        </Card>
      )}
    </div>
  )
}

export default RAGAnalysisPage
