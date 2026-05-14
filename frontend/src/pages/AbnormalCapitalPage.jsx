import { useState, useEffect } from 'react'
import { Typography, message } from 'antd'
import dayjs from 'dayjs'
import FilterBar from '../components/abnormal/FilterBar'
import SummaryBar from '../components/abnormal/SummaryBar'
import StockTable from '../components/abnormal/StockTable'
import DetailDrawer from '../components/abnormal/DetailDrawer'
import { useGetAbnormalCapitalQuery } from '../app/api'

const { Title } = Typography

export default function AbnormalCapitalPage() {
  const [filters, setFilters] = useState({
    trade_date: '',
    days: 1,
    min_vol_ratio: 0,
    min_surge_ret: 0,
    sector_name: '',
    sort: 'score',
  })
  
  const { data, isLoading, refetch, isFetching } = useGetAbnormalCapitalQuery(filters, { 
    refetchOnMountOrArgChange: true 
  })

  const [drawerVisible, setDrawerVisible] = useState(false)
  const [selectedStock, setSelectedStock] = useState(null)

  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }

  const handleReset = () => {
    setFilters({
      trade_date: '',
      days: 1,
      min_vol_ratio: 0,
      min_surge_ret: 0,
      sector_name: '',
      sort: 'score',
    })
  }

  const handleRefresh = async () => {
    try {
      await refetch()
      message.success('数据已刷新')
    } catch {
      message.error('刷新失败')
    }
  }

  const handleRowClick = (record) => {
    setSelectedStock(record)
    setDrawerVisible(true)
  }

  return (
    <div className="page-container">
      <Title level={2} style={{ marginBottom: 24 }}>⚡ 异动资金雷达</Title>
      
      <FilterBar 
        filters={filters} 
        onFilterChange={handleFilterChange} 
        onReset={handleReset} 
        onRefresh={handleRefresh}
        loading={isFetching}
      />

      <SummaryBar summary={data?.summary} />

      <StockTable 
        data={data?.data || []} 
        loading={isLoading || isFetching} 
        onRowClick={handleRowClick}
      />

      <DetailDrawer 
        visible={drawerVisible} 
        data={selectedStock} 
        onClose={() => setDrawerVisible(false)} 
      />
    </div>
  )
}
