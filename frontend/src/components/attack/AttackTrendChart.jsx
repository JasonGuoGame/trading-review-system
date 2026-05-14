import { Card, Typography } from 'antd'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'

const { Title } = Typography

export default function AttackTrendChart({ data, sectorName }) {
  if (!data || data.length === 0) return null

  return (
    <Card 
      title={<Title level={4} style={{ margin: 0 }}>📈 {sectorName} 攻击趋势</Title>}
      style={{ borderRadius: 12, border: 'none', background: 'rgba(255, 255, 255, 0.02)' }}
    >
      <div style={{ height: 300, width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#722ed1" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#722ed1" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
            <XAxis 
              dataKey="trade_date" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 12 }} 
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 12 }} 
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1f1f1f', 
                border: 'none', 
                borderRadius: 8,
                boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
              }} 
            />
            <Area 
              type="monotone" 
              dataKey="attack_score" 
              name="攻击评分"
              stroke="#722ed1" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorScore)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
