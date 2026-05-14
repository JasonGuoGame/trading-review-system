import { Drawer, Table, Tag, Typography, Space, Statistic, Row, Col } from 'antd'
import { useGetSectorAttackDetailQuery } from '../../app/api'

const { Title, Text } = Typography

export default function SectorDetailDrawer({ visible, sectorName, tradeDate, onClose }) {
  const { data, isLoading } = useGetSectorAttackDetailQuery(
    { name: sectorName, trade_date: tradeDate },
    { skip: !visible || !sectorName }
  )

  const columns = [
    {
      title: '股票',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{text}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>{record.symbol}</Text>
        </Space>
      ),
    },
    {
      title: '今日成交',
      dataIndex: 'amount_today',
      key: 'amount_today',
      render: (val) => <Text style={{ color: '#faad14', fontWeight: 'bold' }}>{val.toFixed(2)} 亿</Text>,
    },
    {
      title: '较昨日增量',
      dataIndex: 'amount_diff',
      key: 'amount_diff',
      render: (val) => (
        <Text style={{ color: val > 0 ? '#cf1322' : '#3f8600' }}>
          {val > 0 ? '+' : ''}{val.toFixed(2)} 亿
        </Text>
      ),
    },
    {
      title: '涨跌幅',
      dataIndex: 'pct_chg',
      key: 'pct_chg',
      render: (val) => (
        <Tag color={val > 0 ? 'red' : 'green'}>
          {val > 0 ? '+' : ''}{val.toFixed(2)}%
        </Tag>
      ),
    },
  ]

  return (
    <Drawer
      title={`🎯 板块攻击详情: ${sectorName}`}
      placement="right"
      width={600}
      onClose={onClose}
      visible={visible}
      bodyStyle={{ paddingBottom: 80 }}
    >
      {isLoading ? (
        <div style={{ padding: 40, textAlign: 'center' }}>加载中...</div>
      ) : (
        <>
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col span={12}>
              <Statistic title="覆盖标的数" value={data?.stocks?.length || 0} suffix="只" />
            </Col>
            <Col span={12}>
              <Statistic 
                title="板块平均涨幅" 
                value={data?.stocks?.reduce((acc, s) => acc + s.pct_chg, 0) / (data?.stocks?.length || 1)} 
                precision={2} 
                suffix="%" 
              />
            </Col>
          </Row>

          <Table 
            columns={columns} 
            dataSource={data?.stocks || []} 
            rowKey="symbol"
            pagination={false}
          />
        </>
      )}
    </Drawer>
  )
}
