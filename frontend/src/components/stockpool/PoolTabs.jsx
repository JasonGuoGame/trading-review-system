import { LineChartOutlined, SmallDashOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { Tabs, Badge } from 'antd';

const TAB_CONFIG = [
  { key: 'short', icon: <ThunderboltOutlined />, emoji: '⚡', label: '短线股票池' },
  { key: 'long', icon: <SmallDashOutlined />, emoji: '🌊', label: '长线股票池' },
  { key: 'macd_boll', icon: <LineChartOutlined />, emoji: '📈', label: '0轴金叉资金共振' },
  { key: 'trend_following', icon: <LineChartOutlined />, emoji: '📈', label: 'MACD+BOLL' },
  { key: 'turnover_vol', icon: <LineChartOutlined />, emoji: '📈', label: '换手率+量比' },
  { key: 'winner_mode', icon: <LineChartOutlined />, emoji: '🏆', label: '赚钱效应' },
];

const PoolTabs = ({ activeKey, onChange, counts = {}, tabOrder }) => {
  const orderedTabs = tabOrder
    ? tabOrder.map((key) => TAB_CONFIG.find((t) => t.key === key)).filter(Boolean)
    : TAB_CONFIG;

  const items = orderedTabs.map((tab) => {
    const count = counts[tab.key];
    const labelContent = (
      <span>
        {tab.icon}
        {' '}{tab.emoji} {tab.label}
        {count != null && (
          <span style={{
            marginLeft: 6,
            background: 'rgba(255,255,255,0.1)',
            borderRadius: 10,
            padding: '1px 8px',
            fontSize: 12,
            color: 'rgba(255,255,255,0.65)',
          }}>
            {count}
          </span>
        )}
      </span>
    );
    return { key: tab.key, label: labelContent };
  });

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
