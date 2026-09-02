import React, { useRef, useState } from 'react'
import { Card, Typography, Slider, Input } from 'antd'
import { SearchOutlined } from '@ant-design/icons'

const { Text } = Typography

const INFLOW = '#cf1322'
const OUTFLOW = '#3f8600'

export default function FlowHeatMap({ data, summary }) {
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

  // 今日市场净流入（所有板块合计）
  const net = summary?.market_net_inflow ?? 0
  const inflow = summary?.market_inflow ?? 0
  const outflow = summary?.market_outflow ?? 0 // 负值
  const outflowMag = Math.abs(outflow)
  const totalMag = inflow + outflowMag
  const inflowPct = totalMag > 0 ? (inflow / totalMag) * 100 : 50
  const outflowPct = totalMag > 0 ? (outflowMag / totalMag) * 100 : 50

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
      {/* 今日市场净流入统计 */}
      {summary && (
        <div style={{ marginBottom: 16, padding: '12px 14px', background: '#0d0d0d', borderRadius: 8, border: '1px solid #1f1f1f' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>今日市场净流入</Text>
            <span style={{ fontSize: 24, fontWeight: 700, color: net >= 0 ? INFLOW : OUTFLOW, lineHeight: 1 }}>
              {net >= 0 ? '+' : ''}{net.toFixed(1)}
              <span style={{ fontSize: 13, fontWeight: 500, marginLeft: 2 }}>亿</span>
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Text style={{ fontSize: 11, color: OUTFLOW, minWidth: 70, textAlign: 'right' }}>
              流出 {outflowMag.toFixed(0)}亿
            </Text>
            <div style={{ flex: 1, height: 8, borderRadius: 4, display: 'flex', overflow: 'hidden', background: '#1f1f1f' }}>
              <div style={{ width: `${outflowPct}%`, background: OUTFLOW, transition: 'width 0.3s ease' }} />
              <div style={{ width: 2, background: '#fff', opacity: 0.35 }} />
              <div style={{ width: `${inflowPct}%`, background: INFLOW, transition: 'width 0.3s ease' }} />
            </div>
            <Text style={{ fontSize: 11, color: INFLOW, minWidth: 70 }}>
              流入 {inflow.toFixed(0)}亿
            </Text>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 12 }}>
        <div
          ref={containerRef}
          onScroll={handleScroll}
          style={{
            flex: 1,
            maxHeight: 720,
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
                        backgroundColor: isPositive ? INFLOW : OUTFLOW,
                        borderRadius: 2,
                        minWidth: 2,
                        transition: 'width 0.3s ease'
                      }}
                    />
                    <Text style={{
                      marginLeft: 8,
                      color: isPositive ? INFLOW : OUTFLOW,
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
          <div style={{ height: 720, paddingTop: 10, paddingBottom: 10 }}>
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
