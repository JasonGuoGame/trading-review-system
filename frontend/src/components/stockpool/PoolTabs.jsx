import { Tabs } from 'antd';

const TAB_CONFIG = [
  { key: 'short', emoji: '⚡', label: '短线' },
  { key: 'long', emoji: '🌊', label: '长线' },
  { key: 'macd_boll', emoji: '🔥', label: '0轴金叉' },
  { key: 'trend_following', emoji: '🧘', label: 'MACD+BOLL' },
  { key: 'turnover_vol', emoji: '🚀', label: '换手率量比' },
  { key: 'winner_mode', emoji: '🏆', label: '赢家跟随' },
  { key: 'mf_entry', emoji: '🎯', label: '主力入场' },
  { key: 'divergence_reversal', emoji: '🔄', label: '分歧反包' },
];

const PoolTabs = ({ activeKey, onChange, counts = {}, tabOrder }) => {
  const orderedTabs = tabOrder
    ? tabOrder.map((key) => TAB_CONFIG.find((t) => t.key === key)).filter(Boolean)
    : TAB_CONFIG;

  const items = orderedTabs.map((tab) => {
    const count = counts[tab.key];
    const labelContent = (
      <span style={{ fontSize: 12 }}>
        {tab.emoji} {tab.label}
        {count != null && (
          <span style={{
            marginLeft: 4,
            background: 'rgba(255,255,255,0.1)',
            borderRadius: 10,
            padding: '1px 6px',
            fontSize: 11,
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
      size="small"
      style={{ marginBottom: 16 }}
      tabBarStyle={{ borderBottom: '1px solid #30363d' }}
    />
  );
};

export default PoolTabs;
