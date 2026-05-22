import { useState } from 'react'
import { Input, Card, Tag, Typography, Space, Spin, Empty } from 'antd'
import { SearchOutlined, CloseCircleOutlined } from '@ant-design/icons'
import { useSearchStockPoolQuery } from '../../app/api'

const { Text } = Typography

const POOL_LABELS = {
  short: '⚡ 短线',
  long: '🌊 长线',
  macd_boll: '📈 0轴金叉',
  trend_following: '📈 MACD+BOLL',
  turnover_vol: '📈 换手率+量比',
}

const POOL_COLORS = {
  short: 'red',
  long: 'blue',
  macd_boll: 'purple',
  trend_following: 'green',
  turnover_vol: 'orange',
}

export default function StockPoolSearch() {
  const [query, setQuery] = useState('')
  const [search, setSearch] = useState('')

  const { data: results, isFetching } = useSearchStockPoolQuery(search, {
    skip: !search,
  })

  const handleSearch = (value) => {
    const trimmed = value.trim()
    if (!trimmed) return
    setSearch(trimmed)
  }

  const handleClear = () => {
    setQuery('')
    setSearch('')
  }

  return (
    <div style={{ marginBottom: 16 }}>
      <Input.Search
        placeholder="搜索股票代码或名称，查找所属股票池..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onSearch={handleSearch}
        enterButton={
          <span>
            <SearchOutlined /> 搜索
          </span>
        }
        size="middle"
        allowClear
        onClear={handleClear}
        loading={isFetching}
        style={{
          background: '#1a1a2e',
          borderColor: '#30363d',
        }}
      />

      {/* Results panel */}
      {isFetching && (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <Spin size="small" />
          <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>搜索中...</Text>
        </div>
      )}

      {!isFetching && results && results.length === 0 && search && (
        <Card
          size="small"
          style={{
            marginTop: 8,
            background: '#1a1a2e',
            border: '1px solid #30363d',
          }}
          bodyStyle={{ padding: '16px' }}
        >
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={<Text type="secondary">未找到 "{search}" 相关的股票池记录</Text>}
          />
        </Card>
      )}

      {!isFetching && results && results.length > 0 && (
        <Card
          size="small"
          style={{
            marginTop: 8,
            background: '#1a1a2e',
            border: '1px solid #30363d',
          }}
          title={
            <Space>
              <SearchOutlined style={{ color: '#8b949e' }} />
              <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13 }}>
                搜索 "{search}" — 找到 {results.length} 个结果
              </Text>
              <CloseCircleOutlined
                onClick={handleClear}
                style={{ color: '#8b949e', cursor: 'pointer', fontSize: 14 }}
              />
            </Space>
          }
          bodyStyle={{ padding: '12px 20px' }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {results.map((item) => (
              <div
                key={item.symbol}
                style={{
                  padding: '12px 16px',
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: 8,
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                {/* Stock info header */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 10,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Text strong style={{ color: '#fff', fontSize: 15 }}>
                      {item.stock_name}
                    </Text>
                    <Tag
                      style={{
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        color: '#8b949e',
                        fontSize: 12,
                      }}
                    >
                      {item.symbol}
                    </Tag>
                    {item.sector_name && (
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {item.sector_name}
                      </Text>
                    )}
                  </div>
                </div>

                {/* Pool tags */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {item.pools.map((pool) => (
                    <div
                      key={pool.pool_type}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '6px 12px',
                        background: 'rgba(255,255,255,0.04)',
                        borderRadius: 6,
                        border: '1px solid rgba(255,255,255,0.08)',
                      }}
                    >
                      <Tag
                        color={POOL_COLORS[pool.pool_type] || 'default'}
                        style={{ margin: 0, fontSize: 11 }}
                      >
                        {POOL_LABELS[pool.pool_type] || pool.pool_type}
                      </Tag>
                      <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 11 }}>
                        {pool.status}
                      </Text>
                      <Text style={{ color: '#faad14', fontSize: 11, fontWeight: 600 }}>
                        评分 {pool.score}
                      </Text>
                      <Text type="secondary" style={{ fontSize: 10 }}>
                        {pool.trade_date}
                      </Text>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
