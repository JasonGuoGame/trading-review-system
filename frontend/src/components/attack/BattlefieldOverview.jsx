import React from 'react'
import { Card, Row, Col, Typography, Tag, Space, Progress } from 'antd'
import { FireOutlined, AlertOutlined } from '@ant-design/icons'

const { Text, Title } = Typography

const BattlefieldOverview = ({ title, type, sectors, onSectorClick }) => {
  const isAttack = type === 'attack'
  const accentColor = isAttack ? '#cf1322' : '#3f8600'
  const bgColor = isAttack ? 'rgba(207, 19, 34, 0.05)' : 'rgba(63, 134, 0, 0.05)'

  return (
    <Card 
      title={<span style={{ color: '#fff' }}>{title}</span>}
      style={{ 
        background: '#141414', 
        border: `1px solid ${isAttack ? 'rgba(207,19,34,0.3)' : 'rgba(63,134,0,0.3)'}`,
        borderRadius: 12,
        boxShadow: isAttack ? '0 0 20px rgba(207,19,34,0.1)' : '0 0 20px rgba(63,134,0,0.1)'
      }}
      bodyStyle={{ padding: '16px' }}
    >
      <Row gutter={[16, 16]}>
        {(sectors || []).map((s) => {
          const sectorName = s.sector_name || s.sectorName
          const trendLabel = s.trend_label || s.trendLabel || s.trend
          const attackAmount = s.attack_amount || s.attackAmount || 0
          const retreatAmount = s.retreat_amount || s.retreatAmount || 0
          const netScore = s.net_score || s.netScore || 0
          const attackScore = s.attack_score || s.attackScore || 0
          const retreatScore = s.retreat_score || s.retreatScore || 0

          return (
            <Col span={24} key={sectorName}>
              <div 
                onClick={() => onSectorClick && onSectorClick(s)}
                style={{ 
                  padding: '16px', 
                  background: bgColor, 
                  borderRadius: 8, 
                  cursor: 'pointer',
                  border: '1px solid transparent',
                  transition: 'all 0.3s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = accentColor}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'transparent'}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <Title level={5} style={{ color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                      {isAttack ? <FireOutlined style={{ color: '#ff4d4f' }} /> : <AlertOutlined style={{ color: '#73d13d' }} />}
                      {sectorName}
                    </Title>
                    <Space style={{ marginTop: 8 }}>
                      <Tag color={isAttack ? 'volcano' : 'green'}>{trendLabel || (isAttack ? '进攻' : '退潮')}</Tag>
                      <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12 }}>
                        金额: <span style={{ color: '#fff' }}>{(isAttack ? attackAmount : retreatAmount).toFixed(2)}亿</span>
                      </Text>
                    </Space>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 20, fontWeight: 'bold', color: accentColor }}>
                      {netScore.toFixed(1)}
                    </div>
                    <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)' }}>NET SCORE</Text>
                  </div>
                </div>
                
                <div style={{ marginTop: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>进攻强度</Text>
                    <Text style={{ fontSize: 12, color: '#fff' }}>{attackScore.toFixed(1)}</Text>
                  </div>
                  <Progress 
                    percent={Math.min(attackScore * 10, 100)} 
                    size="small" 
                    showInfo={false} 
                    strokeColor="#ff4d4f" 
                    trailColor="rgba(255,255,255,0.05)"
                  />
                </div>

                {retreatScore > 0 && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>撤退压力</Text>
                      <Text style={{ fontSize: 12, color: '#fff' }}>{retreatScore.toFixed(1)}</Text>
                    </div>
                    <Progress 
                      percent={Math.min(retreatScore * 10, 100)} 
                      size="small" 
                      showInfo={false} 
                      strokeColor="#73d13d" 
                      trailColor="rgba(255,255,255,0.05)"
                    />
                  </div>
                )}
              </div>
            </Col>
          )
        })}
        {(!sectors || sectors.length === 0) && (
          <Col span={24}>
            <div style={{ padding: '40px 0', textAlign: 'center', color: 'rgba(255,255,255,0.25)' }}>
              暂无数据
            </div>
          </Col>
        )}
      </Row>
    </Card>
  )
}

export default BattlefieldOverview
