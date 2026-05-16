import React from 'react'
import { Card, Typography } from 'antd'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'

const { Title, Text } = Typography

const AttackTrendChart = ({ data, sectorName }) => {
  const chartData = Array.isArray(data) ? data : []

  return (
    <Card 
      title={<Text style={{ color: '#fff' }}>{sectorName || '板块'} 攻击趋势</Text>}
      style={{ background: '#141414', border: '1px solid #30363d', borderRadius: 12, height: '100%' }}
    >
      <div style={{ height: 300, width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorAttack" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ff4d4f" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#ff4d4f" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
            <XAxis 
              dataKey="trade_date" 
              stroke="#8b949e" 
              fontSize={10}
              tickFormatter={(str) => str ? str.substring(5) : ''}
            />
            <YAxis stroke="#8b949e" fontSize={10} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1f1f1f', 
                border: 'none', 
                borderRadius: 8,
                boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                color: '#fff'
              }}
              itemStyle={{ color: '#ff4d4f' }}
            />
            <Area 
              type="monotone" 
              dataKey="attack_score" 
              stroke="#ff4d4f" 
              fillOpacity={1} 
              fill="url(#colorAttack)" 
              name="攻击强度"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}

export default AttackTrendChart
