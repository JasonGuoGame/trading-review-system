import React, { useState, useMemo } from 'react'
import { Typography, Row, Col, DatePicker, Space, Button, Spin, Card, Divider, Tag, Statistic, Progress } from 'antd'
import dayjs from 'dayjs'
import { ReloadOutlined, FireOutlined, SwapOutlined } from '@ant-design/icons'
import BattlefieldOverview from '../components/attack/BattlefieldOverview'
import ThermalBattlefield from '../components/attack/ThermalBattlefield'
import LeaderHierarchy from '../components/attack/LeaderHierarchy'
import AttackTrendChart from '../components/attack/AttackTrendChart'
import SectorDetailDrawer from '../components/attack/SectorDetailDrawer'
import { useGetTopMarketAttacksQuery, useGetSectorAttackTrendQuery } from '../app/api'

const { Title, Text } = Typography

const MarketAttackPage = () => {
  const [tradeDate, setTradeDate] = useState(dayjs().format('YYYY-MM-DD'))
  const [selectedSector, setSelectedSector] = useState(null)

  const { data, isLoading, isFetching, refetch } = useGetTopMarketAttacksQuery(
    { trade_date: tradeDate },
    { refetchOnMountOrArgChange: true }
  )

  const attackList = data?.attack_list || data?.attackList || []
  const retreatList = data?.retreat_list || data?.retreatList || []
  const summary = data?.summary || {}

  console.log('DEBUG: MarketAttack data', { data, attackList, retreatList })

  const { attackSectors, retreatSectors } = useMemo(() => {
    const attack = Array.isArray(attackList) ? attackList : []
    const retreat = Array.isArray(retreatList) ? retreatList : []
    return { attackSectors: attack, retreatSectors: retreat }
  }, [attackList, retreatList])

  const combinedList = useMemo(() => [...attackSectors, ...retreatSectors], [attackSectors, retreatSectors])

  const handleRowClick = (record) => {
    const netScore = record.net_score || record.netScore || 0
    setSelectedSector({ name: record.sector_name || record.sectorName, isRetreat: netScore < 0 })
  }

  const { data: trendData } = useGetSectorAttackTrendQuery(
    { sector_name: selectedSector?.name || (attackList.length > 0 ? attackList[0].sector_name : '') },
    { skip: !selectedSector && attackList.length === 0 }
  )

  const temperature = Math.min(((summary.total_new_stocks || 0) / 200) * 100, 100)
  const isHot = (summary.total_new_stocks || 0) > 100

  return (
    <div className="page-container" style={{ padding: '24px', background: '#0a0a0a', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0, color: '#fff' }}>A股情绪周期</Title>
        <Space>
          <DatePicker 
            value={dayjs(tradeDate)} 
            onChange={(date) => setTradeDate(date ? date.format('YYYY-MM-DD') : '')} 
            allowClear={false}
            style={{ background: '#141414', borderColor: '#30363d', color: '#fff' }}
          />
          <Button 
            icon={<ReloadOutlined />} 
            onClick={() => refetch()} 
            loading={isFetching}
            style={{ background: '#141414', borderColor: '#30363d', color: '#fff' }}
          >
            刷新
          </Button>
        </Space>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '100px' }}>
          <Spin size="large" tip="探测全场战况中..." />
        </div>
      ) : (
        <>
          <Card 
            style={{ background: '#141414', border: '1px solid #30363d', borderRadius: 12, marginBottom: 32 }}
            bodyStyle={{ padding: '16px 24px' }}
          >
            <Row gutter={24} align="middle">
              <Col span={6}>
                <Statistic 
                  title={<Text style={{ color: 'rgba(255,255,255,0.45)' }}>全场异动个股</Text>}
                  value={summary.total_new_stocks || 0}
                  valueStyle={{ color: '#fff', fontSize: 28, fontWeight: 'bold' }}
                  suffix={<Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14 }}>只</Text>}
                />
              </Col>
              <Col span={6}>
                <Statistic 
                  title={<Text style={{ color: 'rgba(255,255,255,0.45)' }}>最强攻击板块</Text>}
                  value={summary.top_attack_sector || '无'}
                  valueStyle={{ color: '#ff4d4f', fontSize: 24, fontWeight: 'bold' }}
                />
              </Col>
              <Col span={6}>
                <Statistic 
                  title={<Text style={{ color: 'rgba(255,255,255,0.45)' }}>最大攻击金额</Text>}
                  value={summary.max_attack_amount || 0}
                  precision={2}
                  valueStyle={{ color: '#faad14', fontSize: 28, fontWeight: 'bold' }}
                  suffix={<Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14 }}>亿</Text>}
                />
              </Col>
              <Col span={6}>
                <div style={{ paddingLeft: 24, borderLeft: '1px solid #30363d' }}>
                  <Text style={{ color: 'rgba(255,255,255,0.45)', display: 'block', marginBottom: 8 }}>市场情绪温度</Text>
                  <Progress 
                    percent={temperature} 
                    strokeColor={{ '0%': '#3f8600', '100%': '#cf1322' }}
                    showInfo={false}
                  />
                  <Text style={{ color: '#fff', fontSize: 12, marginTop: 4 }}>
                    {isHot ? '战况激烈' : '氛围清冷'}
                  </Text>
                </div>
              </Col>
            </Row>
          </Card>

          <div style={{ marginBottom: 32 }}>
            <Title level={3} style={{ color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
              <SwapOutlined /> 战场总览
            </Title>
            <Row gutter={24}>
              <Col span={12}>
                <BattlefieldOverview 
                  title="进攻阵营" 
                  type="attack" 
                  sectors={attackSectors} 
                  onSectorClick={handleRowClick}
                />
              </Col>
              <Col span={12}>
                <BattlefieldOverview 
                  title="撤退阵营" 
                  type="retreat" 
                  sectors={retreatSectors} 
                  onSectorClick={handleRowClick}
                />
              </Col>
            </Row>
          </div>

          <Row gutter={24}>
            <Col span={16}>
              <div style={{ marginBottom: 32 }}>
                <Title level={4} style={{ color: '#fff', marginBottom: 16 }}>热力战场</Title>
                <ThermalBattlefield 
                  data={combinedList} 
                  onSectorClick={handleRowClick}
                />
              </div>

              <Row gutter={24}>
                <Col span={12}>
                  <Card 
                    title={<span style={{ color: '#fff' }}><FireOutlined /> 龙头梯队</span>}
                    style={{ background: '#141414', border: '1px solid #30363d', borderRadius: 12 }}
                  >
                    <LeaderHierarchy data={data?.leader_hierarchy} />
                  </Card>
                </Col>
                <Col span={12}>
                   <AttackTrendChart 
                    data={trendData?.trend || []} 
                    sectorName={selectedSector?.name || (attackList.length > 0 ? attackList[0].sector_name : '未选择')} 
                  />
                </Col>
              </Row>
            </Col>

            <Col span={8}>
              <Card 
                style={{ borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #722ed1 0%, #1677ff 100%)', color: '#fff' }}
              >
                <Title level={4} style={{ color: '#fff', marginBottom: 16 }}>情绪周期洞察</Title>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div>
                    <Text style={{ color: '#fff', fontWeight: 'bold' }}>主线净强度 (Net Score)</Text>
                    <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, margin: '8px 0 0 0' }}>
                      Net Score = 进攻强度 - 撤退强度。该指标是识别市场主线切换的核心锚点。
                    </p>
                  </div>
                  <Divider style={{ margin: '12px 0', borderColor: 'rgba(255,255,255,0.2)' }} />
                  <div>
                    <Text style={{ color: '#fff', fontWeight: 'bold' }}>周期识别</Text>
                    <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      <Tag color="volcano">启动</Tag>
                      <Tag color="red">主升</Tag>
                      <Tag color="magenta">高潮</Tag>
                      <Tag color="orange">分歧</Tag>
                      <Tag color="green">退潮</Tag>
                    </div>
                  </div>
                </Space>
              </Card>

              <Card 
                title={<span style={{ color: '#fff' }}>资金迁徙预测</span>}
                style={{ marginTop: 16, background: '#141414', border: '1px solid #30363d', borderRadius: 12 }}
              >
                <div style={{ color: 'rgba(255,255,255,0.45)', textAlign: 'center', padding: '24px 0' }}>
                  <SwapOutlined style={{ fontSize: 32, marginBottom: 16, display: 'block', margin: '0 auto 16px' }} />
                  即将根据多日数据自动识别资金流向...
                </div>
              </Card>
            </Col>
          </Row>
        </>
      )}

      <SectorDetailDrawer 
        visible={!!selectedSector} 
        sectorName={selectedSector?.name} 
        isRetreat={selectedSector?.isRetreat}
        tradeDate={tradeDate}
        onClose={() => setSelectedSector(null)} 
      />
    </div>
  )
}

export default MarketAttackPage
