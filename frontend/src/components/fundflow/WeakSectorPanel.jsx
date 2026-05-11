import { Card, Table, Typography, Button } from 'antd'
import { EyeOutlined } from '@ant-design/icons'

const { Text } = Typography

export default function WeakSectorPanel({ data, loading, onRowClick }) {
  const columns = [
    {
      title: '排名',
      dataIndex: 'rank',
      key: 'rank',
      width: 60,
    },
    {
      title: '板块',
      dataIndex: 'sector_name',
      key: 'sector_name',
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: '净流出 (亿)',
      dataIndex: 'total_net_inflow',
      key: 'total_net_inflow',
      render: (val) => <Text style={{ color: '#3f8600', fontWeight: 'bold' }}>{val.toFixed(1)}亿</Text>,
    },
    {
      title: '最新流出率',
      dataIndex: 'today_inflow_rate',
      key: 'today_inflow_rate',
      render: (val) => <Text style={{ color: '#3f8600' }}>{val.toFixed(2)}%</Text>,
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
    <Card title="❄ 资金撤离板块" style={{ marginBottom: 16 }} bodyStyle={{ padding: 0 }}>
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
