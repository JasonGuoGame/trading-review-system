import { Card, Typography, Tag } from 'antd'
import {
  HourglassOutlined,
  AimOutlined,
  RocketOutlined,
  WarningOutlined,
  RiseOutlined,
  FallOutlined,
  MinusOutlined,
  PauseCircleOutlined,
} from '@ant-design/icons'

const { Text, Title } = Typography

// ── Quadrant: Position × Volume ──────────────────────────────────────────
const QUADRANTS = [
  {
    row: '低位',
    col: '无量',
    icon: <HourglassOutlined />,
    color: '#faad14',
    bg: 'rgba(250, 173, 20, 0.08)',
    label: '等',
    rule: '低位无量要等，错也要等',
    explain: '底部无资金进场信号，耐心等待放量确认。宁可错过也不抄在半山腰。',
    action: '观望',
  },
  {
    row: '低位',
    col: '放量',
    icon: <AimOutlined />,
    color: '#52c41a',
    bg: 'rgba(82, 196, 26, 0.08)',
    label: '跟',
    rule: '低位放量要跟，跟错也要跟',
    explain: '底部放量 = 主力资金进场信号，果断跟随。止损设在放量阳线底部。',
    action: '买入',
  },
  {
    row: '高位',
    col: '无量',
    icon: <RocketOutlined />,
    color: '#1677ff',
    bg: 'rgba(22, 119, 255, 0.08)',
    label: '拿',
    rule: '高位无量要拿，拿错也要拿',
    explain: '高位缩量 = 筹码锁定良好，主力未出货，继续持有享受趋势。',
    action: '持有',
  },
  {
    row: '高位',
    col: '放量',
    icon: <WarningOutlined />,
    color: '#f5222d',
    bg: 'rgba(245, 34, 45, 0.08)',
    label: '跑',
    rule: '高位放量要跑，跑错也要跑',
    explain: '高位放量 = 主力出货信号，放量滞涨更是危险。保住本金永远是第一位。',
    action: '卖出',
  },
]

// ── Volume-Price relationship rules ──────────────────────────────────────
const RELATIONS = [
  {
    signal: '量增价升',
    icon: <RiseOutlined />,
    color: '#52c41a',
    bg: 'rgba(82, 196, 26, 0.1)',
    border: 'rgba(82, 196, 26, 0.35)',
    rule: '量增价升 → 买入',
    explain: '量与价同步向上，多头趋势确立。最健康的上涨形态，顺势做多。',
    action: '买入',
  },
  {
    signal: '量增价减',
    icon: <FallOutlined />,
    color: '#f5222d',
    bg: 'rgba(245, 34, 45, 0.1)',
    border: 'rgba(245, 34, 45, 0.35)',
    rule: '量增价减 → 卖出',
    explain: '放量下跌，空头抛压加大，资金在出逃。不要对抗趋势。',
    action: '卖出',
  },
  {
    signal: '量增价平',
    icon: <MinusOutlined />,
    color: '#fa8c16',
    bg: 'rgba(250, 140, 22, 0.1)',
    border: 'rgba(250, 140, 22, 0.35)',
    rule: '量增价平 → 转阴',
    explain: '放量但价格不动 = 多空分歧加剧，涨不动就可能跌。警惕变盘。',
    action: '减仓',
  },
  {
    signal: '量平价升',
    icon: <RiseOutlined />,
    color: '#1677ff',
    bg: 'rgba(22, 119, 255, 0.1)',
    border: 'rgba(22, 119, 255, 0.35)',
    rule: '量平价升 → 加仓',
    explain: '温和放量持续上涨，趋势稳定推进，可适当增加仓位跟随。',
    action: '加仓',
  },
  {
    signal: '量平价跌',
    icon: <FallOutlined />,
    color: '#cf1322',
    bg: 'rgba(207, 19, 34, 0.1)',
    border: 'rgba(207, 19, 34, 0.35)',
    rule: '量平价跌 → 出局',
    explain: '缩量下跌说明多头无力抵抗，阴跌最磨人，果断离场。',
    action: '离场',
  },
  {
    signal: '量减价升',
    icon: <PauseCircleOutlined />,
    color: '#faad14',
    bg: 'rgba(250, 173, 20, 0.1)',
    border: 'rgba(250, 173, 20, 0.35)',
    rule: '量减价升 → 持有',
    explain: '缩量上涨 = 惜售明显，筹码集中。继续持有但不再追高加仓。',
    action: '持有',
  },
]

const ACTION_COLORS = {
  '买入': '#52c41a',
  '加仓': '#1677ff',
  '持有': '#1677ff',
  '观望': '#faad14',
  '减仓': '#fa8c16',
  '卖出': '#f5222d',
  '离场': '#cf1322',
}

export default function VolumePriceStrategy() {
  return (
    <Card
      size="small"
      title={
        <span style={{ fontSize: 14, fontWeight: 600 }}>
          📊 量价关系交易策略
        </span>
      }
      style={{ marginBottom: 16, background: '#1a1a2e', border: '1px solid #30363d' }}
      bodyStyle={{ padding: '16px 20px' }}
    >
      {/* ── Section 1: Position × Volume Quadrant ── */}
      <Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>
        位置 × 成交量 决策矩阵
      </Text>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 8, marginBottom: 16 }}>
        {/* Header row */}
        <div style={{
          gridColumn: '1 / -1',
          display: 'grid',
          gridTemplateColumns: '80px 1fr 1fr',
          gap: 10,
          alignItems: 'center',
        }}>
          <span />
          <Text strong style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11, textAlign: 'center' }}>无量</Text>
          <Text strong style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11, textAlign: 'center' }}>放量</Text>
        </div>

        {/* Row: 低位 */}
        <div style={{
          gridColumn: '1 / -1',
          display: 'grid',
          gridTemplateColumns: '80px 1fr 1fr',
          gap: 10,
          alignItems: 'stretch',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(59, 130, 246, 0.1)',
            borderRadius: 8,
            border: '1px solid rgba(59, 130, 246, 0.2)',
          }}>
            <Text strong style={{ color: '#59a9ff', fontSize: 12, textAlign: 'center' }}>低位</Text>
          </div>
          {QUADRANTS.filter(q => q.row === '低位').map(q => (
            <div
              key={q.col}
              style={{
                background: q.bg,
                border: `1.5px solid ${q.border || q.color}`,
                borderRadius: 8,
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                transition: 'all 0.2s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ color: q.color, fontSize: 16 }}>{q.icon}</span>
                  <Text strong style={{ color: q.color, fontSize: 13 }}>{q.rule}</Text>
                </div>
                <Tag color={q.action === '买入' || q.action === '持有' ? 'green' : q.action === '卖出' ? 'red' : 'gold'} style={{ margin: 0, fontSize: 11 }}>
                  {q.action}
                </Tag>
              </div>
              <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11, lineHeight: 1.5 }}>
                {q.explain}
              </Text>
            </div>
          ))}
        </div>

        {/* Row: 高位 */}
        <div style={{
          gridColumn: '1 / -1',
          display: 'grid',
          gridTemplateColumns: '80px 1fr 1fr',
          gap: 10,
          alignItems: 'stretch',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(245, 34, 45, 0.08)',
            borderRadius: 8,
            border: '1px solid rgba(245, 34, 45, 0.2)',
          }}>
            <Text strong style={{ color: '#ff7875', fontSize: 12, textAlign: 'center' }}>高位</Text>
          </div>
          {QUADRANTS.filter(q => q.row === '高位').map(q => (
            <div
              key={q.col}
              style={{
                background: q.bg,
                border: `1.5px solid ${q.border || q.color}`,
                borderRadius: 8,
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                transition: 'all 0.2s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ color: q.color, fontSize: 16 }}>{q.icon}</span>
                  <Text strong style={{ color: q.color, fontSize: 13 }}>{q.rule}</Text>
                </div>
                <Tag color={q.action === '买入' || q.action === '持有' ? 'green' : q.action === '卖出' ? 'red' : 'gold'} style={{ margin: 0, fontSize: 11 }}>
                  {q.action}
                </Tag>
              </div>
              <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11, lineHeight: 1.5 }}>
                {q.explain}
              </Text>
            </div>
          ))}
        </div>
      </div>

      {/* ── Section 2: Volume-Price Relations ── */}
      <Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>
        量价关系 信号速查
      </Text>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 10,
        marginTop: 8,
      }}>
        {RELATIONS.map(r => (
          <div
            key={r.signal}
            style={{
              background: r.bg,
              border: `1.5px solid ${r.border}`,
              borderRadius: 8,
              padding: '10px 12px',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ color: r.color, fontSize: 14 }}>{r.icon}</span>
                <Text strong style={{ color: r.color, fontSize: 12 }}>{r.rule}</Text>
              </div>
              <Tag style={{ margin: 0, fontSize: 10, color: ACTION_COLORS[r.action], borderColor: ACTION_COLORS[r.action], background: 'transparent' }}>
                {r.action}
              </Tag>
            </div>
            <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, lineHeight: 1.5 }}>
              {r.explain}
            </Text>
          </div>
        ))}
      </div>
    </Card>
  )
}
