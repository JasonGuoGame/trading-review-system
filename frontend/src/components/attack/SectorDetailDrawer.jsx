import React from 'react'
import { Drawer, Table, Tag, Typography, Space, Statistic, Row, Col, Progress, Spin } from 'antd'
import { FireOutlined } from '@ant-design/icons'
import { useGetSectorAttackDetailQuery } from '../../app/api'

const { Title, Text } = Typography

const SectorDetailDrawer = ({ visible, sectorName, isRetreat, tradeDate, onClose }) => {
  const { data, isLoading } = useGetSectorAttackDetailQuery(
    { name: sectorName, trade_date: tradeDate },
    { skip: !visible || !sectorName }
  )

  const stocks = data?.stocks || []

  const columns = [
    {
      title: '股票',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Space direction="vertical" size={0}>
          <Text strong style={{ color: '#fff' }}>{text}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>{record.symbol}</Text>
        </Space>
      ),
    },
    {
      title: '龙头',
      dataIndex: 'is_leader',
      key: 'is_leader',
      render: (isLeader) => (
        isLeader ? <Tag color="gold" icon={<FireOutlined />}>龙头</Tag> : null
      ),
      align: 'center',
    },
    {
      title: '今日成交',
      dataIndex: 'amount_today',
      key: 'amount_today',
      render: (val) => <Text style={{ color: '#faad14', fontWeight: 'bold' }}>{(val || 0).toFixed(2)} 亿</Text>,
    },
    {
      title: '较昨日增量',
      dataIndex: 'amount_diff',
      key: 'amount_diff',
      render: (val) => {
        const v = val || 0
        return (
          <Text style={{ color: v > 0 ? '#cf1322' : '#3f8600' }}>
            {v > 0 ? '+' : ''}{v.toFixed(2)} 亿
          </Text>
        )
      },
    },
    {
      title: '涨跌幅',
      dataIndex: 'pct_chg',
      key: 'pct_chg',
      render: (val) => {
        const v = val || 0
        return (
          <Tag color={v > 0 ? 'red' : 'green'}>
            {v > 0 ? '+' : ''}{v.toFixed(2)}%
          </Tag>
        )
      },
    },
    {
      title: '收盘位置',
      dataIndex: 'close_pos',
      key: 'close_pos',
      render: (val) => {
        const v = val || 0
        const percent = v * 100
        let color = '#8b949e'
        if (v > 0.6) color = '#cf1322'
        if (v < 0.3) color = '#3f8600'
        
        return (
          <div style={{ width: 80 }}>
            <Text style={{ fontSize: 12, display: 'block', textAlign: 'center', color: 'rgba(255,255,255,0.65)' }}>
              {percent.toFixed(0)}%
            </Text>
            <Progress 
              percent={percent} 
              size="small" 
              showInfo={false} 
              strokeColor={color}
            />
          </div>
        )
      },
    },
    {
      title: '动作性质',
      dataIndex: 'action_type',
      key: 'action_type',
      render: (type) => (
        <Tag color={type === '进攻' ? 'red' : type === '撤退' ? 'green' : 'default'}>
          {type || '中性'}
        </Tag>
      ),
    },
  ]

  const attackCount = stocks.filter(s => s.action_type === '进攻').length
  const retreatCount = stocks.filter(s => s.action_type === '撤退').length
  const limitCount = isRetreat ? stocks.filter(s => (s.pct_chg || 0) < -9.5).length : stocks.filter(s => (s.pct_chg || 0) > 9.5).length
  const titleText = isRetreat ? `🛡️ 板块撤退详情: ${sectorName}` : `🎯 板块攻击详情: ${sectorName}`
  const limitTitle = isRetreat ? '跌停数量' : '涨停数量'
  const limitColor = isRetreat ? '#3f8600' : '#ff4d4f'

  return (
    <Drawer
      title={<span style={{ color: '#fff' }}>{titleText}</span>}
      placement="right"
      width={700}
      onClose={onClose}
      open={visible}
      styles={{ body: { paddingBottom: 80, background: '#141414' }, header: { background: '#1f1f1f', borderBottom: '1px solid #30363d' } }}
    >
      {isLoading ? (
        <div style={{ padding: 40, textAlign: 'center' }}>
          <Spin tip="加载深度战报中..." />
        </div>
      ) : (
        <>
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col span={6}>
              <Statistic 
                title={<Text style={{ color: 'rgba(255,255,255,0.45)' }}>覆图标的数</Text>} 
                value={stocks.length} 
                valueStyle={{ color: '#fff' }}
                suffix="只" 
              />
            </Col>
            <Col span={6}>
              <Statistic 
                title={<Text style={{ color: 'rgba(255,255,255,0.45)' }}>{limitTitle}</Text>} 
                value={limitCount} 
                valueStyle={{ color: limitColor }}
                suffix="只" 
              />
            </Col>
            <Col span={6}>
              <Statistic 
                title={<Text style={{ color: 'rgba(255,255,255,0.45)' }}>进攻个股</Text>} 
                value={attackCount} 
                valueStyle={{ color: '#cf1322' }}
                suffix="只" 
              />
            </Col>
            <Col span={6}>
              <Statistic 
                title={<Text style={{ color: 'rgba(255,255,255,0.45)' }}>撤退个股</Text>} 
                value={retreatCount} 
                valueStyle={{ color: '#3f8600' }}
                suffix="只" 
              />
            </Col>
          </Row>

          <Table 
            columns={columns} 
            dataSource={stocks} 
            rowKey="symbol"
            pagination={false}
            size="small"
            style={{ background: 'transparent' }}
          />
        </>
      )}
    </Drawer>
  )
}

export default SectorDetailDrawer
