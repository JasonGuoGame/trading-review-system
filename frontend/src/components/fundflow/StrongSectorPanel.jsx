import { Card, Table, Typography, Button } from 'antd'
import { EyeOutlined } from '@ant-design/icons'

const { Text } = Typography

export default function StrongSectorPanel({ data, loading, onRowClick }) {
  const columns = [
    {
      title: '排名',
      dataIndex: 'rank',
      key: 'rank',
      width: 60,
      render: (text) => {
        let color = '#595959'
        if (text === 1) color = '#f5222d'
        if (text === 2) color = '#fa8c16'
        if (text === 3) color = '#fadb14'
        return <Text strong style={{ color }}>{text}</Text>
      }
    },
    {
      title: '板块',
      dataIndex: 'sector_name',
      key: 'sector_name',
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: '净流入 (亿)',
      dataIndex: 'total_net_inflow',
      key: 'total_net_inflow',
      render: (val) => <Text style={{ color: '#cf1322', fontWeight: 'bold' }}>+{val.toFixed(1)}亿</Text>,
    },
    {
      title: '最新流入率',
      dataIndex: 'today_inflow_rate',
      key: 'today_inflow_rate',
      render: (val) => <Text style={{ color: val > 0 ? '#cf1322' : '#595959' }}>{val.toFixed(2)}%</Text>,
    },
    {
      title: '3日趋势',
      dataIndex: 'trend_3d',
      key: 'trend_3d',
      render: (val) => <span style={{ fontSize: 16 }}>{val}</span>,
    },
    {
      title: '5日趋势',
      dataIndex: 'trend_5d',
      key: 'trend_5d',
      render: (val) => <span style={{ fontSize: 16 }}>{val}</span>,
    },
    {
      title: '龙头',
      dataIndex: 'leader_stock',
      key: 'leader_stock',
      render: (val) => <Text type="secondary">{val}</Text>,
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Button type="link" icon={<EyeOutlined />} onClick={() => onRowClick(record)}>
          趋势
        </Button>
      ),
    },
  ]

  return (
    <Card title="🔥 持续吸金板块" style={{ marginBottom: 16 }} bodyStyle={{ padding: 0 }}>
      <Table
        columns={columns}
        dataSource={data}
        rowKey="sector_name"
        loading={loading}
        pagination={{ 
          defaultPageSize: 20, 
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50', '100'],
          showTotal: (total) => `共 ${total} 个板块`
        }}
        size="middle"
      />
    </Card>
  )
}
