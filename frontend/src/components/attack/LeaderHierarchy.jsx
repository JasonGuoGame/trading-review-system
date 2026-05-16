import React from 'react'
import { Typography, List, Badge, Space, Tag } from 'antd'

const { Text } = Typography

const LeaderHierarchy = ({ data }) => {
  const items = data || []

  // If data is empty, we can mock or just show a message
  if (items.length === 0) {
    return (
      <div style={{ padding: '20px 0', textAlign: 'center', color: 'rgba(255,255,255,0.45)' }}>
        暂无连板梯队数据
      </div>
    )
  }

  return (
    <List
      dataSource={items}
      renderItem={(item) => (
        <List.Item style={{ borderBottom: '1px solid #30363d', padding: '12px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
            <Space size={16}>
              <Badge 
                count={item.level} 
                style={{ backgroundColor: (item.level || 0) >= 3 ? '#cf1322' : '#d46b08', fontSize: 14, fontWeight: 'bold' }} 
                overflowCount={10}
              />
              <Text strong style={{ color: '#fff', fontSize: 16 }}>{item.level || 1}连板</Text>
            </Space>
            <div style={{ flex: 1, marginLeft: 24, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {(item.stocks || []).map(s => (
                <Tag key={s} color="volcano" style={{ fontSize: 14 }}>{s}</Tag>
              ))}
            </div>
          </div>
        </List.Item>
      )}
    />
  )
}

export default LeaderHierarchy
