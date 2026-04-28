import { Drawer, Descriptions, Timeline, Button, Space, Tag, Typography } from 'antd'
import { PlusCircleOutlined, LineChartOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'

const { Title, Text } = Typography

export default function DetailDrawer({ visible, data, onClose }) {
  const navigate = useNavigate()

  if (!data) return null

  // Parse surge_times logic (could be "09:45,10:12" or JSON)
  let timesList = []
  if (data.surge_times) {
    try {
      // First try to parse as JSON
      const parsed = JSON.parse(data.surge_times)
      if (Array.isArray(parsed)) {
        timesList = parsed
      } else {
        timesList = data.surge_times.split(',').map(s => s.trim())
      }
    } catch {
      // Fallback to comma delimited
      timesList = data.surge_times.split(',').map(s => s.trim()).filter(Boolean)
    }
  }

  const handleJoinTrade = () => {
    // Navigate to trade creation prefilling symbol, strategy and signal.
    const url = `/trades/new?symbol=${data.symbol}&strategy=资金异动&signal=资金异动`
    navigate(url)
  }

  const getActionAdvice = () => {
    if (data.vol_ratio > 3 && data.surge_count > 5) return '【强关注】适合上车'
    if (data.vol_ratio > 2 && data.surge_count > 2) return '【可关注】加入自选观察'
    return '【观望】继续确认'
  }

  return (
    <Drawer
      title={`${data.name}（${data.symbol}）`}
      placement="right"
      onClose={onClose}
      visible={visible}
      width={400}
      extra={
        <Space>
          <Button type="primary" icon={<PlusCircleOutlined />} onClick={handleJoinTrade}>
            加入交易
          </Button>
        </Space>
      }
    >
      <Descriptions column={1} bordered size="small" style={{ marginBottom: 24 }}>
        <Descriptions.Item label="爆量倍数">
          <Text strong style={{ color: '#cf1322' }}>{data.vol_ratio.toFixed(1)}x</Text>
        </Descriptions.Item>
        <Descriptions.Item label="脉冲次数">
          <Text strong>{data.surge_count}</Text>
        </Descriptions.Item>
        <Descriptions.Item label="单次最大拉升">
          <Text strong style={{ color: '#cf1322' }}>+{data.max_surge_ret.toFixed(2)}%</Text>
        </Descriptions.Item>
        <Descriptions.Item label="综合评分">
          <Text strong style={{ color: '#722ed1' }}>{data.score.toFixed(2)}</Text>
        </Descriptions.Item>
      </Descriptions>

      <Title level={5}>资金行为</Title>
      <div style={{ marginBottom: 24 }}>
        <Tag color="magenta">持续脉冲上涨</Tag>
        {data.vol_ratio > 3 && <Tag color="red">主力爆量</Tag>}
      </div>

      <Title level={5}>操作建议</Title>
      <div style={{ marginBottom: 24 }}>
        <Text strong>{getActionAdvice()}</Text>
      </div>

      <Title level={5}>异动时间点</Title>
      {timesList.length > 0 ? (
        <Timeline mode="left">
          {timesList.map((time, idx) => (
            <Timeline.Item key={idx} color={idx === timesList.length - 1 ? 'red' : 'blue'}>
              {time}
            </Timeline.Item>
          ))}
        </Timeline>
      ) : (
        <Text type="secondary">无具体时间点记录</Text>
      )}

      <div style={{ marginTop: 32 }}>
        <Button block icon={<LineChartOutlined />}>查看分时图</Button>
      </div>
    </Drawer>
  )
}
