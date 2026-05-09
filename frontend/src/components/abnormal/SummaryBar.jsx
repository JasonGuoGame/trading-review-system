import { Card, Row, Col, Statistic, Tag, Typography, Space } from 'antd'
import { FireOutlined, StockOutlined, BarChartOutlined, TrophyOutlined, AppstoreOutlined } from '@ant-design/icons'

const { Text } = Typography

export default function SummaryBar({ summary }) {
  if (!summary) return null

  const topSectors = (summary.sector_stats || []).slice(0, 8)

  return (
    <Card style={{ marginBottom: 16 }} title="📊 今日异动总览">
      <Row gutter={16} style={{ marginBottom: topSectors.length > 0 ? 20 : 0 }}>
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

      {topSectors.length > 0 && (
        <div>
          <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <AppstoreOutlined style={{ color: '#722ed1' }} />
            <Text strong style={{ color: '#722ed1' }}>板块分布</Text>
          </div>
          <Space wrap size={[0, 8]}>
            {topSectors.map((sector) => (
              <Tag
                key={sector.sector_name}
                color="purple"
                style={{
                  padding: '4px 10px',
                  fontSize: 13,
                  borderRadius: 6,
                }}
              >
                {sector.sector_name}
                <span style={{ marginLeft: 6, fontWeight: 'bold' }}>{sector.count}</span>
                <span style={{ marginLeft: 4, fontSize: 11, opacity: 0.7 }}>
                  ({sector.avg_vol_ratio.toFixed(1)}x)
                </span>
                {sector.strong_count > 0 && (
                  <span style={{ marginLeft: 4 }}>🔥{sector.strong_count}</span>
                )}
              </Tag>
            ))}
          </Space>
        </div>
      )}
    </Card>
  )
}
