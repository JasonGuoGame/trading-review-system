import { Card, Row, Col, Statistic, Typography } from 'antd'
import { RocketOutlined, DollarOutlined, AppstoreOutlined, FireOutlined } from '@ant-design/icons'

const { Text } = Typography

export default function AttackSummary({ summary }) {
  if (!summary) return null

  return (
    <Card style={{ marginBottom: 16, borderRadius: 12, border: 'none', background: 'rgba(255, 255, 255, 0.02)' }}>
      <Row gutter={[24, 24]}>
        <Col span={6}>
          <Statistic
            title={<Text type="secondary">今日新发爆量标的</Text>}
            value={summary.total_new_stocks}
            prefix={<RocketOutlined style={{ color: '#1677ff' }} />}
            valueStyle={{ color: '#1677ff', fontWeight: 'bold' }}
            suffix="只"
          />
        </Col>
        <Col span={6}>
          <Statistic
            title={<Text type="secondary">攻击最强板块</Text>}
            value={summary.top_attack_sector}
            prefix={<FireOutlined style={{ color: '#cf1322' }} />}
            valueStyle={{ color: '#cf1322', fontWeight: 'bold', fontSize: 20 }}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title={<Text type="secondary">板块最高攻击金额</Text>}
            value={summary.max_attack_amount}
            precision={2}
            prefix={<DollarOutlined style={{ color: '#faad14' }} />}
            suffix="亿"
            valueStyle={{ color: '#faad14', fontWeight: 'bold' }}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title={<Text type="secondary">活跃板块总数</Text>}
            value={summary.active_sector_count}
            prefix={<AppstoreOutlined style={{ color: '#52c41a' }} />}
            valueStyle={{ color: '#52c41a', fontWeight: 'bold' }}
            suffix="个"
          />
        </Col>
      </Row>
    </Card>
  )
}
