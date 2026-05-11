import React from 'react';
import { Drawer, Descriptions, Tag, Space, Button, Divider, List, Typography, Badge } from 'antd';
import { PlusCircleOutlined, StarOutlined, DeleteOutlined, WarningOutlined, CheckCircleOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const StockDetailDrawer = ({ visible, stock, onClose }) => {
  if (!stock) return null;

  return (
    <Drawer
      title={
        <Space>
          <span style={{ fontSize: 20 }}>{stock.stock_name}</span>
          <span style={{ color: '#8b949e', fontSize: 14 }}>({stock.symbol})</span>
        </Space>
      }
      placement="right"
      onClose={onClose}
      open={visible}
      width={450}
      headerStyle={{ background: '#141414', borderBottom: '1px solid #30363d' }}
      bodyStyle={{ background: '#0d1117', color: '#c9d1d9' }}
    >
      <Descriptions column={1} size="small">
        <Descriptions.Item label={<Text type="secondary">所属板块</Text>}>
          <Tag color="blue">{stock.sector_name}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label={<Text type="secondary">当前评分</Text>}>
          <Text strong style={{ color: stock.score > 80 ? '#ff4d4f' : '#faad14', fontSize: 18 }}>
            {stock.score}
          </Text>
        </Descriptions.Item>
      </Descriptions>

      <Divider style={{ borderColor: '#30363d' }} />

      <Title level={5} style={{ color: '#c9d1d9' }}>资金情况</Title>
      <Text type="secondary">连续 3 日净流入，主力吸筹明显</Text>
      
      <Divider style={{ borderColor: '#30363d' }} />

      <Title level={5} style={{ color: '#c9d1d9' }}>技术形态</Title>
      <Space direction="vertical" style={{ width: '100%' }}>
        <Space><CheckCircleOutlined style={{ color: '#52c41a' }} /> <Text>长下影确认</Text></Space>
        <Space><CheckCircleOutlined style={{ color: '#52c41a' }} /> <Text>二次放量</Text></Space>
        <Space><CheckCircleOutlined style={{ color: '#52c41a' }} /> <Text>站上 MA5</Text></Space>
      </Space>

      <Divider style={{ borderColor: '#30363d' }} />

      <Title level={5} style={{ color: '#c9d1d9' }}>风险提示</Title>
      <Space>
        <WarningOutlined style={{ color: '#faad14' }} />
        <Text style={{ color: '#faad14' }}>高位分歧，注意回撤风险</Text>
      </Space>

      <Divider style={{ borderColor: '#30363d' }} />

      <Title level={5} style={{ color: '#c9d1d9' }}>操作</Title>
      <Space direction="vertical" style={{ width: '100%' }}>
        <Button type="primary" block icon={<PlusCircleOutlined />} style={{ background: '#238636', borderColor: '#238636' }}>
          加入交易
        </Button>
        <Button block icon={<StarOutlined />}>
          加入重点观察
        </Button>
        <Button danger block icon={<DeleteOutlined />}>
          移出股票池
        </Button>
      </Space>
    </Drawer>
  );
};

export default StockDetailDrawer;
