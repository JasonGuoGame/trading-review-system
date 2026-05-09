import { Card, Row, Col, Statistic, Typography } from 'antd'
import { FireOutlined, FallOutlined, BankOutlined, TrophyOutlined } from '@ant-design/icons'

const { Text } = Typography

export default function MarketFlowSummary({ summary }) {
  if (!summary) return null

  return (
    <Card style={{ marginBottom: 16 }} title="📊 资金大盘总览">
      <Row gutter={16}>
        <Col span={6}>
          <Statistic
            title="🔥 净流入板块"
            value={summary.inflow_sector_count}
            valueStyle={{ color: '#cf1322' }}
          />
          <div style={{ marginTop: 8 }}>
            <Text type="secondary">主力净流入总额：</Text>
            <Text strong style={{ color: '#cf1322', fontSize: 16 }}>+{summary.total_net_inflow.toFixed(0)} 亿</Text>
          </div>
        </Col>
        <Col span={6}>
          <Statistic
            title="❄ 净流出板块"
            value={summary.outflow_sector_count}
            valueStyle={{ color: '#3f8600' }}
          />
          <div style={{ marginTop: 8 }}>
            <Text type="secondary">主力净流出总额：</Text>
            <Text strong style={{ color: '#3f8600', fontSize: 16 }}>{summary.total_net_outflow.toFixed(0)} 亿</Text>
          </div>
        </Col>
        <Col span={12}>
          <Card type="inner" style={{ background: '#fafafa' }}>
            <Statistic
              title="🏆 当前最强主线"
              value={summary.strongest_main_sector || '--'}
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#722ed1', fontWeight: 'bold' }}
            />
          </Card>
        </Col>
      </Row>
    </Card>
  )
}
