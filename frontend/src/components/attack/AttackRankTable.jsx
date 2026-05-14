import { Table, Tag, Typography, Progress, Button } from 'antd'
import { ArrowRightOutlined } from '@ant-design/icons'

const { Text } = Typography

export default function AttackRankTable({ data, loading, onRowClick }) {
  const maxScore = Math.max(...data.map(item => item.attack_score), 100)

  const columns = [
    {
      title: '排名',
      key: 'rank',
      width: 60,
      render: (_, __, index) => <Text type="secondary">{index + 1}</Text>,
    },
    {
      title: '板块名称',
      dataIndex: 'sector_name',
      key: 'sector_name',
      render: (text) => <Text strong style={{ fontSize: 16 }}>{text}</Text>,
    },
    {
      title: '攻击强度 (评分)',
      dataIndex: 'attack_score',
      key: 'attack_score',
      sorter: (a, b) => a.attack_score - b.attack_score,
      render: (score) => (
        <div style={{ width: 150 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>强度</Text>
            <Text strong style={{ color: score > 100 ? '#cf1322' : '#d46b08' }}>{score.toFixed(1)}</Text>
          </div>
          <Progress 
            percent={(score / maxScore) * 100} 
            showInfo={false} 
            strokeColor={score > 100 ? '#cf1322' : '#faad14'}
            size="small"
          />
        </div>
      ),
    },
    {
      title: '新发标的数量',
      dataIndex: 'new_stock_count',
      key: 'new_stock_count',
      render: (count) => <Text strong>{count} 只</Text>,
    },
    {
      title: '新发总金额',
      dataIndex: 'new_total_amount',
      key: 'new_total_amount',
      render: (amount) => <Text style={{ color: '#faad14' }}>{amount.toFixed(2)} 亿</Text>,
    },
    {
      title: '板块龙头 (今日)',
      dataIndex: 'leader_stock',
      key: 'leader_stock',
      render: (text) => <Tag color="volcano">{text}</Tag>,
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Button 
          type="link" 
          icon={<ArrowRightOutlined />} 
          onClick={() => onRowClick(record)}
        >
          查看详情
        </Button>
      ),
    },
  ]

  return (
    <Table
      columns={columns}
      dataSource={data}
      rowKey="sector_name"
      loading={loading}
      pagination={false}
      style={{ background: 'transparent' }}
      onRow={(record) => ({
        onClick: () => onRowClick(record),
        style: { cursor: 'pointer' }
      })}
    />
  )
}
