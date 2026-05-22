import { useState } from 'react'
import { Card, Typography, Tooltip } from 'antd'
import {
  LoadingOutlined,
  ThunderboltOutlined,
  RiseOutlined,
  RocketOutlined,
  WarningOutlined,
  FallOutlined,
  CaretRightOutlined,
} from '@ant-design/icons'

const { Text, Title } = Typography

const PHASES = [
  {
    key: 'accumulation',
    number: 1,
    name: '吸筹阶段',
    icon: <LoadingOutlined />,
    color: '#1677ff',
    bg: 'rgba(22, 119, 255, 0.12)',
    border: 'rgba(22, 119, 255, 0.35)',
    turnover: '< 3%',
    volumeRatio: '< 1',
    price: '横盘整理',
    signal: '换手 < 3%，量比 < 1',
    explanation: '主力悄悄收集筹码，市场无人关注，是最佳埋伏期。',
    risk: '低风险',
  },
  {
    key: 'launch',
    number: 2,
    name: '启动阶段',
    icon: <ThunderboltOutlined />,
    color: '#52c41a',
    bg: 'rgba(82, 196, 26, 0.12)',
    border: 'rgba(82, 196, 26, 0.35)',
    turnover: '5% - 10%',
    volumeRatio: '3 - 8',
    price: '放量突破',
    signal: '换手 5%-10%，量比 3-8',
    explanation: '低位横盘后突然放量突破，主升浪起点，最关键的上车时机。',
    risk: '低风险',
  },
  {
    key: 'uptrend',
    number: 3,
    name: '主升阶段',
    icon: <RiseOutlined />,
    color: '#fa8c16',
    bg: 'rgba(250, 140, 22, 0.12)',
    border: 'rgba(250, 140, 22, 0.35)',
    turnover: '10% - 25%',
    volumeRatio: '2 - 5',
    price: '连续上涨',
    signal: '换手 10%-25%，量比 2-5',
    explanation: '大资金持续接力，越涨换手越大，游资最爱的赚钱阶段。',
    risk: '中风险',
  },
  {
    key: 'climax',
    number: 4,
    name: '加速高潮',
    icon: <RocketOutlined />,
    color: '#f5222d',
    bg: 'rgba(245, 34, 45, 0.12)',
    border: 'rgba(245, 34, 45, 0.35)',
    turnover: '> 30%',
    volumeRatio: '> 10',
    price: '加速冲顶',
    signal: '换手 > 30%，量比 > 10',
    explanation: '全市场情绪过热，第二天易发生大分歧，谨慎追高。',
    risk: '高风险',
  },
  {
    key: 'distribution',
    number: 5,
    name: '出货阶段',
    icon: <WarningOutlined />,
    color: '#cf1322',
    bg: 'rgba(207, 19, 34, 0.15)',
    border: 'rgba(207, 19, 34, 0.4)',
    turnover: '高位巨量',
    volumeRatio: '高位',
    price: '放量滞涨',
    signal: '换手极高，涨幅极小',
    explanation: '高位放巨量但涨不动 = 大资金在卖，放量滞涨极为危险。',
    risk: '极高风险',
  },
  {
    key: 'ebbing',
    number: 6,
    name: '退潮阶段',
    icon: <FallOutlined />,
    color: '#8c8c8c',
    bg: 'rgba(140, 140, 140, 0.1)',
    border: 'rgba(140, 140, 140, 0.3)',
    turnover: '持续下降',
    volumeRatio: '持续下降',
    price: '阴跌不止',
    signal: '换手↓，量比↓',
    explanation: '资金全面撤退，市场失去兴趣，应空仓观望。',
    risk: '-',
  },
]

export default function TradingPhaseGuide() {
  const [expanded, setExpanded] = useState(null)

  return (
    <Card
      size="small"
      title={
        <span style={{ fontSize: 14, fontWeight: 600 }}>
          📊 短线交易阶段识别指南
        </span>
      }
      style={{ marginBottom: 16, background: '#1a1a2e', border: '1px solid #30363d' }}
      bodyStyle={{ padding: '16px 20px' }}
    >
      {/* Horizontal phase flow */}
      <div
        style={{
          display: 'flex',
          alignItems: 'stretch',
          gap: 0,
          flexWrap: 'wrap',
        }}
      >
        {PHASES.map((phase, idx) => (
          <div
            key={phase.key}
            style={{
              display: 'flex',
              alignItems: 'stretch',
              flex: '1 1 160px',
              minWidth: 150,
            }}
          >
            {/* Phase card */}
            <Tooltip
              title={
                <div style={{ maxWidth: 260 }}>
                  <Text strong style={{ color: phase.color, fontSize: 13 }}>
                    {phase.name} — {phase.risk}
                  </Text>
                  <br />
                  <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>
                    {phase.explanation}
                  </Text>
                </div>
              }
              placement="top"
            >
              <div
                onClick={() => setExpanded(expanded === phase.key ? null : phase.key)}
                style={{
                  flex: 1,
                  background: expanded === phase.key
                    ? `linear-gradient(135deg, ${phase.bg}, ${phase.bg})`
                    : phase.bg,
                  border: `1.5px solid ${expanded === phase.key ? phase.color : phase.border}`,
                  borderRadius: 8,
                  padding: '10px 12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = phase.color
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = `0 4px 12px ${phase.bg}`
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = phase.border
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                {/* Phase header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      background: phase.color,
                      color: '#fff',
                      fontSize: 11,
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {phase.number}
                  </span>
                  <Text
                    strong
                    style={{
                      color: phase.color,
                      fontSize: 13,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {phase.name}
                  </Text>
                </div>

                {/* Key metrics */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11 }}>换手</Text>
                    <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: 500 }}>
                      {phase.turnover}
                    </Text>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11 }}>量比</Text>
                    <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: 500 }}>
                      {phase.volumeRatio}
                    </Text>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11 }}>股价</Text>
                    <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: 500 }}>
                      {phase.price}
                    </Text>
                  </div>
                </div>

                {/* Expanded detail */}
                {expanded === phase.key && (
                  <div
                    style={{
                      marginTop: 4,
                      padding: '8px 10px',
                      background: 'rgba(0,0,0,0.25)',
                      borderRadius: 6,
                      borderLeft: `3px solid ${phase.color}`,
                    }}
                  >
                    <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 11, lineHeight: 1.6 }}>
                      {phase.explanation}
                    </Text>
                    <div style={{ marginTop: 4 }}>
                      <Text style={{ color: phase.color, fontSize: 10, fontWeight: 600 }}>
                        {phase.signal}
                      </Text>
                    </div>
                  </div>
                )}
              </div>
            </Tooltip>

            {/* Arrow connector between phases */}
            {idx < PHASES.length - 1 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 24,
                  flexShrink: 0,
                }}
              >
                <CaretRightOutlined
                  style={{
                    color: 'rgba(255,255,255,0.25)',
                    fontSize: 14,
                  }}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Bottom legend: risk gradient */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          marginTop: 14,
          paddingTop: 12,
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>风险递进:</Text>
        <div
          style={{
            width: 280,
            height: 6,
            borderRadius: 3,
            background: 'linear-gradient(90deg, #1677ff, #52c41a, #fa8c16, #f5222d, #cf1322, #8c8c8c)',
          }}
        />
        <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>
          低风险 → 高风险 → 撤退
        </Text>
      </div>
    </Card>
  )
}
