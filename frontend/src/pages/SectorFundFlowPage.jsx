import { useState } from 'react'
import { Row, Col, Typography, Spin } from 'antd'
import DateSelector from '../components/fundflow/DateSelector'
import MarketFlowSummary from '../components/fundflow/MarketFlowSummary'
import StrongSectorPanel from '../components/fundflow/StrongSectorPanel'
import WeakSectorPanel from '../components/fundflow/WeakSectorPanel'
import FlowHeatMap from '../components/fundflow/FlowHeatMap'
import SectorTrendDrawer from '../components/fundflow/SectorTrendDrawer'
import { useGetSectorFundFlowQuery } from '../app/api'

const { Title } = Typography

export default function SectorFundFlowPage() {
  const [filters, setFilters] = useState({
    date: '',
    mode: '1d', // 1d, 3d, 5d
    sort: 'inflow', // inflow, rate, trend
  })

  const [drawerVisible, setDrawerVisible] = useState(false)
  const [selectedSector, setSelectedSector] = useState(null)

  const { data, isFetching } = useGetSectorFundFlowQuery(filters, { 
    refetchOnMountOrArgChange: true 
  })

  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }

  const handleRowClick = (record) => {
    setSelectedSector(record.sector_name)
    setDrawerVisible(true)
  }

  return (
    <div className="page-container">
      <Title level={2} style={{ marginBottom: 24 }}>🌊 市场资金流向监控</Title>
      
      <DateSelector filters={filters} onFilterChange={handleFilterChange} />

      {isFetching ? (
        <div style={{ textAlign: 'center', padding: 100 }}>
          <Spin size="large" />
        </div>
      ) : data ? (
        <>
          <MarketFlowSummary summary={data.summary} />
          
          <Row gutter={16}>
            <Col span={16}>
              <StrongSectorPanel 
                data={data.strong_sectors || []} 
                loading={isFetching}
                onRowClick={handleRowClick}
              />
              <WeakSectorPanel 
                data={data.weak_sectors || []} 
                loading={isFetching}
                onRowClick={handleRowClick}
              />
            </Col>
            <Col span={8}>
              <FlowHeatMap data={data.all_sectors || []} />
            </Col>
          </Row>
        </>
      ) : null}

      <SectorTrendDrawer 
        visible={drawerVisible} 
        sectorName={selectedSector} 
        endDate={filters.date}
        onClose={() => setDrawerVisible(false)} 
      />
    </div>
  )
}
