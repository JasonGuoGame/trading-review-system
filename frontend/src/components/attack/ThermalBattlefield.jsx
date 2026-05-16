import React from 'react'
import { Row, Col, Card, Typography, Tooltip } from 'antd'

const { Text } = Typography

const ThermalBattlefield = ({ data, onSectorClick }) => {
  // Sort by absolute score to show most active ones
  const sectors = data || []
  const sortedData = [...sectors].sort((a, b) => {
    const scoreA = (a.attack_score || 0) + (a.retreat_score || 0)
    const scoreB = (b.attack_score || 0) + (b.retreat_score || 0)
    return scoreB - scoreA
  }).slice(0, 12)

  const getBgColor = (netScore) => {
    if (netScore > 50) return 'linear-gradient(135deg, #5c0011 0%, #cf1322 100%)'
    if (netScore > 0) return 'linear-gradient(135deg, #871400 0%, #fa541c 100%)'
    if (netScore < -50) return 'linear-gradient(135deg, #135200 0%, #3f8600 100%)'
    if (netScore < 0) return 'linear-gradient(135deg, #003a8c 0%, #1677ff 100%)'
    return '#1f1f1f'
  }

  return (
    <Row gutter={[12, 12]}>
      {sortedData.map((s) => {
        const netScore = s.net_score || 0
        const attackCount = s.attack_count || 0
        const retreatCount = s.retreat_count || 0

        return (
          <Col span={6} key={s.sector_name}>
            <Tooltip title={`进攻: ${attackCount} | 撤退: ${retreatCount}`}>
              <Card
                hoverable
                onClick={() => onSectorClick(s)}
                style={{
                  background: getBgColor(netScore),
                  border: 'none',
                  borderRadius: 8,
                  height: 100,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  textAlign: 'center'
                }}
                bodyStyle={{ padding: 8, width: '100%' }}
              >
                <Text strong style={{ color: '#fff', fontSize: 16, display: 'block' }}>{s.sector_name}</Text>
                <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 20, fontWeight: '900' }}>
                  {netScore.toFixed(0)}
                </Text>
                <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 10 }}>净强度</Text>
              </Card>
            </Tooltip>
          </Col>
        )
      })}
    </Row>
  )
}

export default ThermalBattlefield
