import { Card, Typography } from 'antd'

const { Text } = Typography

export default function FlowHeatMap({ data }) {
  if (!data || data.length === 0) return null

  // Find max absolute value for scaling
  const maxAbsFlow = Math.max(...data.map(d => Math.abs(d.total_net_inflow)))
  if (maxAbsFlow === 0) return null

  return (
    <Card title="🌡️ 资金热力图" style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {data.map(item => {
          const isPositive = item.total_net_inflow > 0
          const widthPercent = (Math.abs(item.total_net_inflow) / maxAbsFlow) * 100
          
          return (
            <div key={item.sector_name} style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ width: 100, textAlign: 'right', paddingRight: 16 }}>
                <Text strong>{item.sector_name}</Text>
              </div>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                <div 
                  style={{ 
                    height: 24, 
                    width: `${widthPercent}%`,
                    backgroundColor: isPositive ? '#cf1322' : '#3f8600',
                    borderRadius: 4,
                    minWidth: 4, // Ensures even very small values have a visible bar
                    transition: 'width 0.3s ease'
                  }} 
                />
                <Text style={{ 
                  marginLeft: 8, 
                  color: isPositive ? '#cf1322' : '#3f8600',
                  fontWeight: 'bold'
                }}>
                  {isPositive ? '+' : ''}{item.total_net_inflow.toFixed(1)}亿
                </Text>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
