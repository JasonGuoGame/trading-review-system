import React, { useState, useMemo } from 'react'
import { Typography, Row, Col, DatePicker, Space, Button, Spin, Card, Divider, Tag, Statistic, Progress } from 'antd'
import dayjs from 'dayjs'
import { ReloadOutlined, FireOutlined, SwapOutlined } from '@ant-design/icons'
import BattlefieldOverview from '../components/attack/BattlefieldOverview'
import ThermalBattlefield from '../components/attack/ThermalBattlefield'
import LeaderHierarchy from '../components/attack/LeaderHierarchy'
import AttackTrendChart from '../components/attack/AttackTrendChart'
import SectorDetailDrawer from '../components/attack/SectorDetailDrawer'
import { useGetTopMarketAttacksQuery, useGetSectorAttackTrendQuery, useGetTopVolumeStocksQuery } from '../app/api'

const { Title, Text } = Typography

const MarketAttackPage = () => {
  const [tradeDate, setTradeDate] = useState(dayjs().format('YYYY-MM-DD'))
  const [selectedSector, setSelectedSector] = useState(null)

  const { data, isLoading, isFetching, refetch } = useGetTopMarketAttacksQuery(
    { trade_date: tradeDate },
    { refetchOnMountOrArgChange: true }
  )

  const attackList = data?.attack_list || data?.attackList || []
  const retreatList = data?.retreat_list || data?.retreatList || []
  const summary = data?.summary || {}

  const { data: volumeData } = useGetTopVolumeStocksQuery(tradeDate, { skip: !tradeDate })
  const rawVolumeStocks = volumeData?.stocks || []
  const topConcepts = volumeData?.top_concepts || []
  const topIndustries = volumeData?.top_industries || []
  const [selectedConcept, setSelectedConcept] = useState(null)

  const [volSortKey, setVolSortKey] = useState('amount')
  const [volSortDir, setVolSortDir] = useState('desc')

  const filteredVolumeStocks = useMemo(() => {
    if (!selectedConcept) return rawVolumeStocks
    return rawVolumeStocks.filter((s) => (s.concepts || []).includes(selectedConcept))
  }, [rawVolumeStocks, selectedConcept])

  const topVolumeStocks = useMemo(() => {
    const sorted = [...filteredVolumeStocks]
    const dir = volSortDir === 'asc' ? 1 : -1
    sorted.sort((a, b) => {
      const vA = a[volSortKey] ?? 0
      const vB = b[volSortKey] ?? 0
      if (typeof vA === 'string') return vA.localeCompare(vB) * dir
      return (vA - vB) * dir
    })
    return sorted
  }, [filteredVolumeStocks, volSortKey, volSortDir])

  const handleVolSort = (key) => {
    if (volSortKey === key) {
      setVolSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setVolSortKey(key)
      setVolSortDir(key === 'amount' ? 'desc' : 'asc')
    }
  }

  const volSortArrow = (key) => {
    if (volSortKey !== key) return null
    return volSortDir === 'asc' ? ' ▲' : ' ▼'
  }

  console.log('DEBUG: MarketAttack data', { data, attackList, retreatList })

  const { attackSectors, retreatSectors } = useMemo(() => {
    const attack = Array.isArray(attackList) ? attackList : []
    const retreat = Array.isArray(retreatList) ? retreatList : []
    return { attackSectors: attack, retreatSectors: retreat }
  }, [attackList, retreatList])

  const combinedList = useMemo(() => [...attackSectors, ...retreatSectors], [attackSectors, retreatSectors])

  const handleRowClick = (record) => {
    const netScore = record.net_score || record.netScore || 0
    setSelectedSector({ name: record.sector_name || record.sectorName, isRetreat: netScore < 0 })
  }

  const { data: trendData } = useGetSectorAttackTrendQuery(
    { sector_name: selectedSector?.name || (attackList.length > 0 ? attackList[0].sector_name : '') },
    { skip: !selectedSector && attackList.length === 0 }
  )

  const temperature = Math.min(((summary.total_new_stocks || 0) / 200) * 100, 100)
  const isHot = (summary.total_new_stocks || 0) > 100

  return (
    <div className="page-container" style={{ padding: '24px', background: '#0a0a0a', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0, color: '#fff' }}>A股情绪周期</Title>
        <Space>
          <DatePicker 
            value={dayjs(tradeDate)} 
            onChange={(date) => setTradeDate(date ? date.format('YYYY-MM-DD') : '')} 
            allowClear={false}
            style={{ background: '#141414', borderColor: '#30363d', color: '#fff' }}
          />
          <Button 
            icon={<ReloadOutlined />} 
            onClick={() => refetch()} 
            loading={isFetching}
            style={{ background: '#141414', borderColor: '#30363d', color: '#fff' }}
          >
            刷新
          </Button>
        </Space>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '100px' }}>
          <Spin size="large" tip="探测全场战况中..." />
        </div>
      ) : (
        <>
          <Card 
            style={{ background: '#141414', border: '1px solid #30363d', borderRadius: 12, marginBottom: 32 }}
            bodyStyle={{ padding: '16px 24px' }}
          >
            <Row gutter={24} align="middle">
              <Col span={6}>
                <Statistic 
                  title={<Text style={{ color: 'rgba(255,255,255,0.45)' }}>全场异动个股</Text>}
                  value={summary.total_new_stocks || 0}
                  valueStyle={{ color: '#fff', fontSize: 28, fontWeight: 'bold' }}
                  suffix={<Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14 }}>只</Text>}
                />
              </Col>
              <Col span={6}>
                <Statistic 
                  title={<Text style={{ color: 'rgba(255,255,255,0.45)' }}>最强攻击板块</Text>}
                  value={summary.top_attack_sector || '无'}
                  valueStyle={{ color: '#ff4d4f', fontSize: 24, fontWeight: 'bold' }}
                />
              </Col>
              <Col span={6}>
                <Statistic 
                  title={<Text style={{ color: 'rgba(255,255,255,0.45)' }}>最大攻击金额</Text>}
                  value={summary.max_attack_amount || 0}
                  precision={2}
                  valueStyle={{ color: '#faad14', fontSize: 28, fontWeight: 'bold' }}
                  suffix={<Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14 }}>亿</Text>}
                />
              </Col>
              <Col span={6}>
                <div style={{ paddingLeft: 24, borderLeft: '1px solid #30363d' }}>
                  <Text style={{ color: 'rgba(255,255,255,0.45)', display: 'block', marginBottom: 8 }}>市场情绪温度</Text>
                  <Progress 
                    percent={temperature} 
                    strokeColor={{ '0%': '#3f8600', '100%': '#cf1322' }}
                    showInfo={false}
                  />
                  <Text style={{ color: '#fff', fontSize: 12, marginTop: 4 }}>
                    {isHot ? '战况激烈' : '氛围清冷'}
                  </Text>
                </div>
              </Col>
            </Row>
          </Card>

          <div style={{ marginBottom: 32 }}>
            <Title level={3} style={{ color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
              <SwapOutlined /> 战场总览
            </Title>
            <div style={{ display: 'flex', gap: 0 }}>
              <div style={{
                resize: 'horizontal', overflow: 'auto',
                minWidth: 200, maxWidth: 500, flex: 1,
                paddingRight: 8, position: 'relative',
              }}>
                <div style={{
                  position: 'absolute', top: 0, right: 0, width: 6, height: 16,
                  background: '#30363d', borderRadius: '0 0 0 4px', cursor: 'ew-resize', zIndex: 1,
                }} />
                <div style={{
                  position: 'absolute', bottom: 0, right: 0, width: 6, height: 16,
                  background: '#30363d', borderRadius: '4px 0 0 0', cursor: 'ew-resize', zIndex: 1,
                }} />
                <BattlefieldOverview
                  title="进攻阵营"
                  type="attack"
                  sectors={attackSectors}
                  onSectorClick={handleRowClick}
                />
              </div>
              <div style={{
                resize: 'horizontal', overflow: 'auto',
                minWidth: 200, maxWidth: 500, flex: 1,
                paddingRight: 8, position: 'relative',
              }}>
                <div style={{
                  position: 'absolute', top: 0, right: 0, width: 6, height: 16,
                  background: '#30363d', borderRadius: '0 0 0 4px', cursor: 'ew-resize', zIndex: 1,
                }} />
                <div style={{
                  position: 'absolute', bottom: 0, right: 0, width: 6, height: 16,
                  background: '#30363d', borderRadius: '4px 0 0 0', cursor: 'ew-resize', zIndex: 1,
                }} />
                <BattlefieldOverview
                  title="撤退阵营"
                  type="retreat"
                  sectors={retreatSectors}
                  onSectorClick={handleRowClick}
                />
              </div>
              <div style={{
                resize: 'horizontal', overflow: 'auto',
                minWidth: 300, maxWidth: 900, flex: 2,
                paddingRight: 8, position: 'relative',
              }}>
                <div style={{
                  position: 'absolute', top: 0, right: 0, width: 6, height: 16,
                  background: '#30363d', borderRadius: '0 0 0 4px', cursor: 'ew-resize', zIndex: 1,
                }} />
                <div style={{
                  position: 'absolute', bottom: 0, right: 0, width: 6, height: 16,
                  background: '#30363d', borderRadius: '4px 0 0 0', cursor: 'ew-resize', zIndex: 1,
                }} />
                <Card
                  title={<span style={{ color: '#1677ff' }}>📊 成交量前50{selectedConcept ? <span style={{ fontSize: 12, color: '#b37feb' }}> · {selectedConcept} ({filteredVolumeStocks.length})</span> : ''}</span>}
                  style={{ background: '#141414', border: '1px solid #30363d', borderRadius: 12, height: '100%' }}
                  bodyStyle={{ padding: '8px 12px', maxHeight: 520, overflowY: 'auto' }}
                >
                  {topVolumeStocks.length === 0 ? (
                    <Spin />
                  ) : (
                    <div>
                      {/* Header */}
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 4,
                        padding: '4px 0 6px', borderBottom: '1px solid #30363d',
                        fontSize: 11, color: '#8b949e', fontWeight: 600,
                      }}>
                        <span style={{ width: 22, textAlign: 'right', flexShrink: 0 }}>#</span>
                        <span onClick={() => handleVolSort('stock_name')} style={{ width: 52, flexShrink: 0, cursor: 'pointer', color: volSortKey === 'stock_name' ? '#58a6ff' : '#8b949e', userSelect: 'none' }}>股票{volSortArrow('stock_name')}</span>
                        <span onClick={() => handleVolSort('symbol')} style={{ width: 74, flexShrink: 0, cursor: 'pointer', color: volSortKey === 'symbol' ? '#58a6ff' : '#8b949e', userSelect: 'none' }}>代码{volSortArrow('symbol')}</span>
                        <span onClick={() => handleVolSort('sector_name')} style={{ minWidth: 50, flex: 1, cursor: 'pointer', color: volSortKey === 'sector_name' ? '#58a6ff' : '#8b949e', userSelect: 'none' }}>板块{volSortArrow('sector_name')}</span>
                        <span onClick={() => handleVolSort('pct_change')} style={{ width: 50, textAlign: 'right', flexShrink: 0, cursor: 'pointer', color: volSortKey === 'pct_change' ? '#58a6ff' : '#8b949e', userSelect: 'none' }}>涨跌{volSortArrow('pct_change')}</span>
                        <span onClick={() => handleVolSort('amount')} style={{ width: 56, textAlign: 'right', flexShrink: 0, cursor: 'pointer', color: volSortKey === 'amount' ? '#58a6ff' : '#8b949e', userSelect: 'none' }}>成交额{volSortArrow('amount')}</span>
                      </div>
                      {/* Rows */}
                      {topVolumeStocks.map((s, i) => (
                        <div
                          key={s.symbol}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 4,
                            padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.04)',
                            fontSize: 12,
                          }}
                        >
                          <span style={{ color: '#8b949e', width: 22, textAlign: 'right', flexShrink: 0 }}>
                            {i + 1}
                          </span>
                          <span style={{ color: '#c9d1d9', fontWeight: 500, width: 52, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexShrink: 0 }}>
                            {s.stock_name || '--'}
                          </span>
                          <span style={{ color: '#58a6ff', width: 74, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12, flexShrink: 0 }}>
                            {s.symbol}
                          </span>
                          <span style={{ color: '#8b949e', fontSize: 10, minWidth: 50, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {s.sector_name || '--'}
                          </span>
                          <span style={{ color: s.pct_change >= 0 ? '#e84749' : '#3f8600', width: 50, textAlign: 'right', fontWeight: 500, flexShrink: 0 }}>
                            {s.pct_change >= 0 ? '+' : ''}{s.pct_change?.toFixed(1)}%
                          </span>
                          <span style={{ color: '#8b949e', width: 56, textAlign: 'right', fontSize: 11, flexShrink: 0 }}>
                            {(s.amount / 1e8).toFixed(1)}亿
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  {topConcepts.length > 0 && (
                    <div style={{
                      marginTop: 12, paddingTop: 10,
                      borderTop: '1px solid #30363d',
                    }}>
                      <div style={{ fontSize: 11, color: '#8b949e', marginBottom: 6, fontWeight: 600 }}>
                        🔥 前50成交量最多概念 Top {topConcepts.length}
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {topConcepts.map((c, i) => {
                          const isActive = selectedConcept === c.name
                          return (
                            <Tag
                              key={c.name}
                              color={isActive ? 'purple' : undefined}
                              style={{
                                fontSize: 11, margin: 0, cursor: 'pointer',
                                background: isActive ? '#531dab' : undefined,
                                borderColor: isActive ? '#b37feb' : undefined,
                              }}
                              onClick={() => setSelectedConcept(isActive ? null : c.name)}
                            >
                              {c.name}
                              <span style={{ color: isActive ? '#fff' : '#b37feb', marginLeft: 4, fontWeight: 600 }}>{c.count}</span>
                            </Tag>
                          )
                        })}
                        {selectedConcept && (
                          <Tag color="default" style={{ fontSize: 10, margin: 0, cursor: 'pointer' }} onClick={() => setSelectedConcept(null)}>
                            ✕ 清除
                          </Tag>
                        )}
                      </div>
                    </div>
                  )}
                  {topIndustries.length > 0 && (
                    <div style={{
                      marginTop: 10, paddingTop: 10,
                      borderTop: '1px solid #30363d',
                    }}>
                      <div style={{ fontSize: 11, color: '#8b949e', marginBottom: 6, fontWeight: 600 }}>
                        🏭 前50成交量最多行业 Top {topIndustries.length}
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {topIndustries.map((c, i) => (
                          <Tag key={c.name} color="blue" style={{ fontSize: 11, margin: 0 }}>
                            {c.name}
                            <span style={{ color: '#91caff', marginLeft: 4, fontWeight: 600 }}>{c.count}</span>
                          </Tag>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              </div>
            </div>
          </div>

          <Row gutter={24}>
            <Col span={16}>
              <div style={{ marginBottom: 32 }}>
                <Title level={4} style={{ color: '#fff', marginBottom: 16 }}>热力战场</Title>
                <ThermalBattlefield 
                  data={combinedList} 
                  onSectorClick={handleRowClick}
                />
              </div>

              <Row gutter={24}>
                <Col span={12}>
                  <Card 
                    title={<span style={{ color: '#fff' }}><FireOutlined /> 龙头梯队</span>}
                    style={{ background: '#141414', border: '1px solid #30363d', borderRadius: 12 }}
                  >
                    <LeaderHierarchy data={data?.leader_hierarchy} />
                  </Card>
                </Col>
                <Col span={12}>
                   <AttackTrendChart 
                    data={trendData?.trend || []} 
                    sectorName={selectedSector?.name || (attackList.length > 0 ? attackList[0].sector_name : '未选择')} 
                  />
                </Col>
              </Row>
            </Col>

            <Col span={8}>
              <Card 
                style={{ borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #722ed1 0%, #1677ff 100%)', color: '#fff' }}
              >
                <Title level={4} style={{ color: '#fff', marginBottom: 16 }}>情绪周期洞察</Title>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div>
                    <Text style={{ color: '#fff', fontWeight: 'bold' }}>主线净强度 (Net Score)</Text>
                    <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, margin: '8px 0 0 0' }}>
                      Net Score = 进攻强度 - 撤退强度。该指标是识别市场主线切换的核心锚点。
                    </p>
                  </div>
                  <Divider style={{ margin: '12px 0', borderColor: 'rgba(255,255,255,0.2)' }} />
                  <div>
                    <Text style={{ color: '#fff', fontWeight: 'bold' }}>周期识别</Text>
                    <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      <Tag color="volcano">启动</Tag>
                      <Tag color="red">主升</Tag>
                      <Tag color="magenta">高潮</Tag>
                      <Tag color="orange">分歧</Tag>
                      <Tag color="green">退潮</Tag>
                    </div>
                  </div>
                </Space>
              </Card>

              <Card 
                title={<span style={{ color: '#fff' }}>资金迁徙预测</span>}
                style={{ marginTop: 16, background: '#141414', border: '1px solid #30363d', borderRadius: 12 }}
              >
                <div style={{ color: 'rgba(255,255,255,0.45)', textAlign: 'center', padding: '24px 0' }}>
                  <SwapOutlined style={{ fontSize: 32, marginBottom: 16, display: 'block', margin: '0 auto 16px' }} />
                  即将根据多日数据自动识别资金流向...
                </div>
              </Card>
            </Col>
          </Row>
        </>
      )}

      <SectorDetailDrawer 
        visible={!!selectedSector} 
        sectorName={selectedSector?.name} 
        isRetreat={selectedSector?.isRetreat}
        tradeDate={tradeDate}
        onClose={() => setSelectedSector(null)} 
      />
    </div>
  )
}

export default MarketAttackPage
