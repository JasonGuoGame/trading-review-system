import { Table, Tag, Button, Typography } from 'antd'
import { EyeOutlined } from '@ant-design/icons'
import { formatDate } from '../../utils/format'

const { Text } = Typography

export default function StockTable({ data, loading, onRowClick }) {
  const getVolColor = (vol) => {
    if (vol > 3) return '#cf1322'
    if (vol >= 2) return '#d46b08'
    return '#8c8c8c'
  }

  const getStatusTag = (record) => {
    if (record.vol_ratio > 3 && record.surge_count > 5) {
      return <Tag color="error" style={{ fontSize: 13 }}>🔥 强势</Tag>
    } else if (record.vol_ratio > 2) {
      return <Tag color="warning" style={{ fontSize: 13 }}>⚡ 活跃</Tag>
    }
    return <Tag color="default" style={{ fontSize: 13 }}>普通</Tag>
  }

  const columns = [
    {
      title: '股票代码',
      dataIndex: 'symbol',
      key: 'symbol',
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: '异动时间',
      dataIndex: 'trade_date',
      key: 'trade_date',
      render: (val) => formatDate(val),
    },
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '爆量倍数',
      dataIndex: 'vol_ratio',
      key: 'vol_ratio',
      render: (val) => <Text style={{ color: getVolColor(val), fontWeight: 'bold' }}>{val.toFixed(1)}x</Text>,
    },
    {
      title: '脉冲次数',
      dataIndex: 'surge_count',
      key: 'surge_count',
    },
    {
      title: '最大分时涨幅',
      dataIndex: 'max_surge_ret',
      key: 'max_surge_ret',
      render: (val) => <Text style={{ color: val > 0 ? '#cf1322' : '#3f8600' }}>{val > 0 ? '+' : ''}{val.toFixed(2)}%</Text>,
    },
    {
      title: '状态',
      key: 'status',
      render: (_, record) => getStatusTag(record),
    },
    {
      title: '综合评分',
      dataIndex: 'score',
      key: 'score',
      render: (val) => <Text strong style={{ color: '#722ed1' }}>{val.toFixed(2)}</Text>,
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Button 
          type="link" 
          icon={<EyeOutlined />} 
          onClick={() => onRowClick(record)}
        >
          查看
        </Button>
      ),
    },
  ]

  return (
    <Table
      columns={columns}
      dataSource={data}
      rowKey="symbol"
      loading={loading}
      pagination={{ pageSize: 20 }}
    />
  )
}
