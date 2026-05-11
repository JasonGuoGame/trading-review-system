import React, { useRef, useState, useEffect } from 'react'
import { Card, Typography, Slider, Input, Space } from 'antd'
import { SearchOutlined } from '@ant-design/icons'

const { Text } = Typography

export default function FlowHeatMap({ data }) {
  const containerRef = useRef(null)
  const [searchText, setSearchText] = useState('')
  const [scrollValue, setScrollValue] = useState(0)

  if (!data || data.length === 0) return null

  const filteredData = data.filter(item => 
    item.sector_name.toLowerCase().includes(searchText.toLowerCase())
  )

  // Find max absolute value for scaling
  const maxAbsFlow = Math.max(...data.map(d => Math.abs(d.total_net_inflow)))
  if (maxAbsFlow === 0) return null

  const handleScroll = () => {
    if (containerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current
      const maxScroll = scrollHeight - clientHeight
      if (maxScroll > 0) {
        setScrollValue((scrollTop / maxScroll) * 100)
      }
    }
  }

  const handleSliderChange = (val) => {
    if (containerRef.current) {
      const { scrollHeight, clientHeight } = containerRef.current
      const maxScroll = scrollHeight - clientHeight
      containerRef.current.scrollTop = (val / 100) * maxScroll
      setScrollValue(val)
    }
  }

  return (
    <Card 
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>🌡️ 资金热力图</span>
          <Input 
            size="small" 
            placeholder="搜索板块" 
            prefix={<SearchOutlined />} 
            style={{ width: 120 }}
            onChange={e => setSearchText(e.target.value)}
            allowClear
          />
        </div>
      } 
      style={{ marginBottom: 16 }}
      bodyStyle={{ padding: '12px' }}
    >
      <div style={{ display: 'flex', gap: 12 }}>
        <div 
          ref={containerRef}
          onScroll={handleScroll}
          style={{ 
            flex: 1, 
            maxHeight: 500, 
            overflowY: 'auto', 
            paddingRight: 8,
            scrollbarWidth: 'none', // Hide default scrollbar for cleaner look with slider
            msOverflowStyle: 'none'
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filteredData.map(item => {
              const isPositive = item.total_net_inflow > 0
              const widthPercent = (Math.abs(item.total_net_inflow) / maxAbsFlow) * 100
              
              return (
                <div key={item.sector_name} style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{ width: 90, textAlign: 'right', paddingRight: 12 }}>
                    <Text strong style={{ fontSize: 13 }}>{item.sector_name}</Text>
                  </div>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                    <div 
                      style={{ 
                        height: 20, 
                        width: `${widthPercent}%`,
                        backgroundColor: isPositive ? '#cf1322' : '#3f8600',
                        borderRadius: 2,
                        minWidth: 2,
                        transition: 'width 0.3s ease'
                      }} 
                    />
                    <Text style={{ 
                      marginLeft: 8, 
                      color: isPositive ? '#cf1322' : '#3f8600',
                      fontWeight: 'bold',
                      fontSize: 12
                    }}>
                      {isPositive ? '+' : ''}{item.total_net_inflow.toFixed(1)}亿
                    </Text>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
        
        {filteredData.length > 10 && (
          <div style={{ height: 500, paddingTop: 10, paddingBottom: 10 }}>
            <Slider 
              vertical 
              value={scrollValue} 
              onChange={handleSliderChange}
              reverse
              tooltip={{ open: false }}
            />
          </div>
        )}
      </div>
    </Card>
  )
}
