import React, { useState, useMemo } from 'react'
import { Select, Tag, message } from 'antd'
import { useGetTagsQuery } from '../app/api'

const categoryNames = {
  strategy: '策略',
  industry: '行业 / 主线',
  mistake: '错误',
  emotion: '情绪',
  market: '市场环境',
  result: '结果',
}

const getTagColor = (category) => {
  switch (category) {
    case 'strategy': return 'blue'
    case 'industry': return 'purple'
    case 'mistake': return 'red'
    case 'emotion': return 'orange'
    case 'market': return 'cyan'
    case 'result': return 'green'
    default: return 'default'
  }
}

// Map database tags into Select.Option groups
export const TagSelector = ({ value = [], onChange, maxCount = 5, placeholder = "+ 添加标签", style, allowedCategories }) => {
  const { data: tags = [], isLoading } = useGetTagsQuery()

  const options = useMemo(() => {
    let filteredTags = tags
    if (allowedCategories && allowedCategories.length > 0) {
      filteredTags = tags.filter(t => allowedCategories.includes(t.category))
    }

    const grouped = filteredTags.reduce((acc, tag) => {
      const cat = tag.category || 'other'
      if (!acc[cat]) acc[cat] = []
      acc[cat].push(tag)
      return acc
    }, {})

    return Object.entries(grouped).map(([category, items]) => ({
      label: categoryNames[category] || '其它',
      options: items.map(tag => ({
        label: tag.name,
        value: tag.name,
        category: category,
      })),
    }))
  }, [tags])

  const handleChange = (selectedValues) => {
    if (selectedValues.length > maxCount) {
      message.warning(`最多只能选择 ${maxCount} 个标签`)
      return
    }
    onChange?.(selectedValues)
  }

  // Custom Tag rendering to give color
  const tagRender = (props) => {
    const { label, value, closable, onClose } = props
    const onPreventMouseDown = (event) => {
      event.preventDefault()
      event.stopPropagation()
    }
    // Find the tag category
    const tagObj = tags.find(t => t.name === value)
    const color = getTagColor(tagObj?.category)

    return (
      <Tag
        color={color}
        onMouseDown={onPreventMouseDown}
        closable={closable}
        onClose={onClose}
        style={{ marginRight: 3 }}
      >
        {label} {tagObj?.category === 'mistake' && '❌'}
      </Tag>
    )
  }

  return (
    <Select
      mode="multiple"
      allowClear
      style={{ width: '100%', ...style }}
      placeholder={placeholder}
      onChange={handleChange}
      value={value}
      options={options}
      loading={isLoading}
      tagRender={tagRender}
      showSearch
      filterOption={(input, option) =>
        (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
      }
    />
  )
}

export { getTagColor }
