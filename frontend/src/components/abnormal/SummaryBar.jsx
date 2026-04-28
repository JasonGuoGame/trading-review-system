import { Card, Row, Col, Statistic } from 'antd'
import { FireOutlined, StockOutlined, BarChartOutlined, TrophyOutlined } from '@ant-design/icons'

export default function SummaryBar({ summary }) {
  if (!summary) return null

  return (
    <Card style={{ marginBottom: 16 }} title="📊 今日异动总览">
      <Row gutter={16}>
        <Col span={6}>
          <Statistic
            title="异动股票数"
            value={summary.total_stocks}
            prefix={<TrophyOutlined />}
            valueStyle={{ color: '#1677ff' }}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="强异动数"
            value={summary.strong_stocks}
            prefix={<FireOutlined />}
            valueStyle={{ color: '#cf1322' }}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="平均爆量"
            value={summary.avg_vol_ratio}
            precision={2}
            suffix="x"
            prefix={<BarChartOutlined />}
            valueStyle={{ color: '#faad14' }}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="平均脉冲次数"
            value={summary.avg_surge_count}
            precision={1}
            prefix={<StockOutlined />}
            valueStyle={{ color: '#52c41a' }}
          />
        </Col>
      </Row>
    </Card>
  )
}
