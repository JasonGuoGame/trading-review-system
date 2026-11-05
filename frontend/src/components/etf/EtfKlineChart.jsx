import { Card } from 'antd'
import { Bar, CartesianGrid, Cell, ComposedChart, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { UP, DOWN } from './format'

const tooltipStyle = { background: '#141414', border: '1px solid #333', borderRadius: 8 }

const EtfKlineChart = ({ klines }) => {
  const chartData = (klines || []).map((k) => ({
    trade_date: k.trade_date,
    wick: [k.low, k.high],
    body: [Math.min(k.open, k.close), Math.max(k.open, k.close)],
    up: k.close >= k.open,
    ma5: k.ma5 || null, ma20: k.ma20 || null, ma60: k.ma60 || null,
    dif: k.dif || null, dea: k.dea || null, macd: k.macd || null, rsi14: k.rsi14 || null,
  }))

  return (
    <div>
      <Card title="K线图（MA5 / MA20 / MA60）" size="small" style={{ marginBottom: 16 }}>
        <ResponsiveContainer width="100%" height={320}>
          <ComposedChart data={chartData}>
            <CartesianGrid stroke="#30363d" strokeDasharray="3 3" />
            <XAxis dataKey="trade_date" tick={{ fill: '#8b949e', fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
            <YAxis yAxisId="price" domain={['auto', 'auto']} tick={{ fill: '#8b949e', fontSize: 11 }} />
            <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#c9d1d9' }} />
            <Bar yAxisId="price" dataKey="wick" fill="#8b949e" barSize={1} isAnimationActive={false} />
            <Bar yAxisId="price" dataKey="body" barSize={6} isAnimationActive={false}>
              {chartData.map((d, i) => <Cell key={i} fill={d.up ? UP : DOWN} />)}
            </Bar>
            <Line yAxisId="price" type="monotone" dataKey="ma5" stroke="#faad14" strokeWidth={1.2} dot={false} connectNulls />
            <Line yAxisId="price" type="monotone" dataKey="ma20" stroke="#1677ff" strokeWidth={1.2} dot={false} connectNulls />
            <Line yAxisId="price" type="monotone" dataKey="ma60" stroke="#eb2f96" strokeWidth={1.2} dot={false} connectNulls />
          </ComposedChart>
        </ResponsiveContainer>
      </Card>

      <Card title="MACD（DIF / DEA / 柱）" size="small" style={{ marginBottom: 16 }}>
        <ResponsiveContainer width="100%" height={140}>
          <ComposedChart data={chartData}>
            <CartesianGrid stroke="#30363d" strokeDasharray="3 3" />
            <XAxis dataKey="trade_date" hide />
            <YAxis domain={['auto', 'auto']} tick={{ fill: '#8b949e', fontSize: 10 }} />
            <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#c9d1d9' }} />
            <Bar dataKey="macd" barSize={3} isAnimationActive={false}>
              {chartData.map((d, i) => <Cell key={i} fill={d.macd >= 0 ? UP : DOWN} />)}
            </Bar>
            <Line type="monotone" dataKey="dif" stroke="#faad14" strokeWidth={1.2} dot={false} connectNulls />
            <Line type="monotone" dataKey="dea" stroke="#1677ff" strokeWidth={1.2} dot={false} connectNulls />
          </ComposedChart>
        </ResponsiveContainer>
      </Card>

      <Card title="RSI14" size="small">
        <ResponsiveContainer width="100%" height={120}>
          <ComposedChart data={chartData}>
            <CartesianGrid stroke="#30363d" strokeDasharray="3 3" />
            <XAxis dataKey="trade_date" tick={{ fill: '#8b949e', fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
            <YAxis domain={[0, 100]} tick={{ fill: '#8b949e', fontSize: 10 }} />
            <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#c9d1d9' }} />
            <ReferenceLine y={70} stroke={UP} strokeDasharray="4 4" />
            <ReferenceLine y={30} stroke={DOWN} strokeDasharray="4 4" />
            <Line type="monotone" dataKey="rsi14" stroke="#13c2c2" strokeWidth={1.4} dot={false} connectNulls />
          </ComposedChart>
        </ResponsiveContainer>
      </Card>
    </div>
  )
}

export default EtfKlineChart
