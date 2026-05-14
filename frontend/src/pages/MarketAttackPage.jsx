import { useState } from 'react'
import { Typography, Row, Col, DatePicker, Space, Button, Spin, Card } from 'antd'
import dayjs from 'dayjs'
import { ReloadOutlined } from '@ant-design/icons'
import AttackSummary from '../components/attack/AttackSummary'
import AttackRankTable from '../components/attack/AttackRankTable'
import AttackTrendChart from '../components/attack/AttackTrendChart'
import SectorDetailDrawer from '../components/attack/SectorDetailDrawer'
import { useGetTopMarketAttacksQuery, useGetSectorAttackTrendQuery } from '../app/api'

const { Title } = Typography

export default function MarketAttackPage() {
  const [tradeDate, setTradeDate] = useState(dayjs().format('YYYY-MM-DD'))
  const [selectedSector, setSelectedSector] = useState(null)

  const { data, isLoading, isFetching, refetch } = useGetTopMarketAttacksQuery(
    { trade_date: tradeDate },
    { refetchOnMountOrArgChange: true }
  )

  const { data: trendData } = useGetSectorAttackTrendQuery(
    { sector_name: selectedSector || (data?.top_list?.[0]?.sector_name) },
    { skip: !selectedSector && !data?.top_list?.[0]?.sector_name }
  )

  const handleRowClick = (record) => {
    setSelectedSector(record.sector_name)
  }

  return (
    <div className="page-container" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>🎯 主线攻击雷达</Title>
        <Space>
          <DatePicker 
            value={dayjs(tradeDate)} 
            onChange={(date) => setTradeDate(date ? date.format('YYYY-MM-DD') : '')} 
            allowClear={false}
          />
          <Button icon={<ReloadOutlined />} onClick={() => refetch()} loading={isFetching}>
            刷新
          </Button>
        </Space>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '100px' }}>
          <Spin size="large" tip="探测市场攻击信号中..." />
        </div>
      ) : (
        <>
          <AttackSummary summary={data?.summary} />

          <Row gutter={16}>
            <Col span={16}>
              <Card 
                title="🔥 热门攻击板块排名" 
                style={{ borderRadius: 12, border: 'none', background: 'rgba(255, 255, 255, 0.02)' }}
              >
                <AttackRankTable 
                  data={data?.top_list || []} 
                  loading={isFetching} 
                  onRowClick={handleRowClick}
                />
              </Card>
            </Col>
            <Col span={8}>
              <AttackTrendChart 
                data={trendData?.trend || []} 
                sectorName={selectedSector || data?.top_list?.[0]?.sector_name} 
              />
              
              <Card 
                style={{ marginTop: 16, borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #722ed1 0%, #1677ff 100%)', color: '#fff' }}
              >
                <Title level={4} style={{ color: '#fff', marginBottom: 8 }}>💡 策略提示</Title>
                <Typography.Paragraph style={{ color: 'rgba(255,255,255,0.85)' }}>
                  主线攻击雷达通过监测板块内多个标的同时出现“爆量”行为来识别机构资金的合力攻击。
                  <br /><br />
                  - <strong>攻击评分 {'>'} 100</strong>：代表极高强度的合力攻击，通常意味着主线行情的爆发。
                  <br />
                  - <strong>新发标的</strong>：指今日首次触发爆量逻辑的股票。
                </Typography.Paragraph>
              </Card>
            </Col>
          </Row>
        </>
      )}

      <SectorDetailDrawer 
        visible={!!selectedSector} 
        sectorName={selectedSector} 
        tradeDate={tradeDate}
        onClose={() => setSelectedSector(null)} 
      />
    </div>
  )
}
