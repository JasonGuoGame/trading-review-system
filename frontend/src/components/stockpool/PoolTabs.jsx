import React from 'react';
import { Tabs } from 'antd';
import { ThunderboltOutlined, SmallDashOutlined, LineChartOutlined } from '@ant-design/icons';

const PoolTabs = ({ activeKey, onChange }) => {
  const items = [
    {
      key: 'short',
      label: (
        <span>
          <ThunderboltOutlined />
          ⚡ 短线股票池
        </span>
      ),
    },
    {
      key: 'long',
      label: (
        <span>
          <SmallDashOutlined />
          🌊 长线股票池
        </span>
      ),
    },
    {
      key: 'macd_boll',
      label: (
        <span>
          <LineChartOutlined />
          📈 0轴金叉资金共振
        </span>
      ),
    },
    {
      key: 'trend_following',
      label: (
        <span>
          <LineChartOutlined />
          📈 MACD+BOLL
        </span>
      ),
    },
    {
      key: 'turnover_vol',
      label: (
        <span>
          <LineChartOutlined />
          📈 换手率+量比
        </span>
      ),
    },
  ];

  return (
    <Tabs
      activeKey={activeKey}
      onChange={onChange}
      items={items}
      style={{ marginBottom: 16 }}
      tabBarStyle={{ borderBottom: '1px solid #30363d' }}
    />
  );
};

export default PoolTabs;
