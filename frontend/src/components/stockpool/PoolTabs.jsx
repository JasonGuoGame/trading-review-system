import React from 'react';
import { Tabs } from 'antd';
import { ThunderboltOutlined, SmallDashOutlined } from '@ant-design/icons';

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
