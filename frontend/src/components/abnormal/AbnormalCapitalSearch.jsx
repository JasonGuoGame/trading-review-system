import { useState } from 'react'
import { Input, Tag, Typography } from 'antd'
import { SearchOutlined, CloseCircleOutlined } from '@ant-design/icons'

const { Text } = Typography

export default function AbnormalCapitalSearch({ resultCount, onFilterChange }) {
  const [query, setQuery] = useState('')
  const [activeKeyword, setActiveKeyword] = useState('')

  const handleSearch = (value) => {
    const trimmed = value.trim()
    setActiveKeyword(trimmed)
    onFilterChange({ keyword: trimmed || '' })
    setQuery(trimmed)
  }

  const handleClear = () => {
    setQuery('')
    setActiveKeyword('')
    onFilterChange({ keyword: '' })
  }

  const handleChange = (e) => {
    setQuery(e.target.value)
  }

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Input.Search
          placeholder="搜索股票代码或名称，筛选异动资金数据..."
          value={query}
          onChange={handleChange}
          onSearch={handleSearch}
          enterButton={
            <span>
              <SearchOutlined /> 搜索
            </span>
          }
          size="middle"
          allowClear
          onClear={handleClear}
          style={{
            flex: 1,
            background: '#1a1a2e',
            borderColor: '#30363d',
          }}
        />
        {activeKeyword && (
          <Tag
            closable
            onClose={handleClear}
            color="processing"
            style={{
              fontSize: 12,
              padding: '2px 10px',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            筛选: {activeKeyword}
            {resultCount !== undefined && (
              <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 11 }}>
                ({resultCount} 条)
              </Text>
            )}
          </Tag>
        )}
      </div>
      {activeKeyword && resultCount === 0 && (
        <Text type="secondary" style={{ fontSize: 12, marginTop: 4, display: 'block' }}>
          未找到 "{activeKeyword}" 相关的异动资金记录，请尝试其他关键词
        </Text>
      )}
    </div>
  )
}
