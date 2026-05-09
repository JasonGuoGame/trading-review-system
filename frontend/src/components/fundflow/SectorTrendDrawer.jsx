import { Drawer, Typography, Timeline, Tag, Spin } from 'antd'
import { useGetSectorTrendQuery } from '../../app/api'

const { Title, Text } = Typography

export default function SectorTrendDrawer({ visible, sectorName, endDate, onClose }) {
  const { data: trendData, isFetching } = useGetSectorTrendQuery(
    { sector: sectorName, end_date: endDate },
    { skip: !visible || !sectorName }
  )

  return (
    <Drawer
      title={`${sectorName || ''}板块 - 资金趋势`}
      placement="right"
      onClose={onClose}
      visible={visible}
      width={400}
    >
      {isFetching ? (
        <div style={{ textAlign: 'center', padding: 50 }}><Spin /></div>
      ) : trendData ? (
        <>
          <div style={{ marginBottom: 24 }}>
            <Title level={5}>趋势</Title>
            <div style={{ fontSize: 24 }}>{trendData.trend_symbol}</div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <Title level={5}>操作建议</Title>
            <Text strong style={{ 
              color: trendData.suggestion.includes('关注') ? '#cf1322' : 
                     trendData.suggestion.includes('规避') ? '#3f8600' : '#faad14',
              fontSize: 16
            }}>
              {trendData.suggestion}
            </Text>
          </div>

          {trendData.leader_stock && (
            <div style={{ marginBottom: 24 }}>
              <Title level={5}>龙头股</Title>
              <Tag color="magenta" style={{ fontSize: 14, padding: '4px 8px' }}>
                {trendData.leader_stock}
              </Tag>
            </div>
          )}

          <div style={{ marginBottom: 24 }}>
            <Title level={5}>最近5日资金流入</Title>
            <Timeline mode="left" style={{ marginTop: 16 }}>
              {trendData.trend_days.map((day, idx) => (
                <Timeline.Item 
                  key={idx} 
                  color={day.net_inflow > 0 ? 'red' : 'green'}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: 250 }}>
                    <Text>{day.trade_date}</Text>
                    <Text strong style={{ color: day.net_inflow > 0 ? '#cf1322' : '#3f8600' }}>
                      {day.net_inflow > 0 ? '+' : ''}{day.net_inflow.toFixed(1)}亿 
                      ({day.net_inflow_rate > 0 ? '+' : ''}{day.net_inflow_rate.toFixed(2)}%)
                    </Text>
                  </div>
                </Timeline.Item>
              ))}
            </Timeline>
          </div>
        </>
      ) : (
        <Text type="secondary">暂无数据</Text>
      )}
    </Drawer>
  )
}
