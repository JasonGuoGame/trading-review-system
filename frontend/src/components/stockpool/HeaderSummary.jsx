import React from 'react';
import { Row, Col, Card, Statistic, Tag, Space } from 'antd';
import { RiseOutlined, FallOutlined, FireOutlined, StockOutlined } from '@ant-design/icons';

const HeaderSummary = ({ marketData }) => {
  // Mock data if marketData is not provided
  const data = marketData || {
    status: '强势',
    advancers: 3821,
    decliners: 1210,
    mainThemes: ['机器人', 'AI', '电力'],
    topFund: { name: '机器人', flow: '+82亿' }
  };

  const isStrong = data.status === '强势';

  return (
    <Row gutter={16} style={{ marginBottom: 20 }}>
      <Col span={6}>
        <Card size="small" style={{ background: '#141414', border: '1px solid #30363d' }}>
          <Statistic
            title={<span style={{ color: '#8b949e' }}>市场状态</span>}
            value={data.status}
            valueStyle={{ color: isStrong ? '#ff4d4f' : '#52c41a' }}
            prefix={<FireOutlined />}
          />
        </Card>
      </Col>
      <Col span={6}>
        <Card size="small" style={{ background: '#141414', border: '1px solid #30363d' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Statistic
              title={<span style={{ color: '#8b949e' }}>上涨</span>}
              value={data.advancers}
              valueStyle={{ color: '#ff4d4f' }}
              prefix={<RiseOutlined />}
            />
            <Statistic
              title={<span style={{ color: '#8b949e' }}>下跌</span>}
              value={data.decliners}
              valueStyle={{ color: '#52c41a' }}
              prefix={<FallOutlined />}
            />
          </div>
        </Card>
      </Col>
      <Col span={6}>
        <Card size="small" style={{ background: '#141414', border: '1px solid #30363d' }}>
          <div style={{ marginBottom: 4, color: '#8b949e', fontSize: 14 }}>主线方向</div>
          <Space wrap>
            {data.mainThemes.map(theme => (
              <Tag color="volcano" key={theme}>{theme}</Tag>
            ))}
          </Space>
        </Card>
      </Col>
      <Col span={6}>
        <Card size="small" style={{ background: '#141414', border: '1px solid #30363d' }}>
          <Statistic
            title={<span style={{ color: '#8b949e' }}>今日最强资金</span>}
            value={`${data.topFund.name} ${data.topFund.flow}`}
            valueStyle={{ color: '#ff4d4f', fontSize: 18 }}
            prefix={<StockOutlined />}
          />
        </Card>
      </Col>
    </Row>
  );
};

export default HeaderSummary;
