import { Card, Space, Select, Button, Form, InputNumber } from 'antd'
import dayjs from 'dayjs'
import { useGetAbnormalCapitalQuery } from '../../app/api'

const { Option } = Select

export default function FilterBar({ filters, onFilterChange, onReset, onRefresh, loading }) {
  const [form] = Form.useForm()

  // Fetch all data (without sector filter) to aggregate sector counts
  const { data: allData } = useGetAbnormalCapitalQuery(
    { trade_date: filters.trade_date || '', days: filters.days, min_vol_ratio: filters.min_vol_ratio, min_surge_ret: filters.min_surge_ret, sort: filters.sort },
    { refetchOnMountOrArgChange: true }
  )

  // Aggregate sector counts from all stock data
  const sectorOptions = (() => {
    const stocks = allData?.data || []
    const map = {}
    for (const s of stocks) {
      const sectorStr = s.sector_name || ''
      if (!sectorStr) continue
      
      const parts = sectorStr.split(' / ')
      for (let name of parts) {
        name = name.trim()
        if (!name) continue
        map[name] = (map[name] || 0) + 1
      }
    }
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }))
  })()

  const handleValuesChange = (changedValues, allValues) => {
    onFilterChange(allValues)
  }

  return (
    <Card style={{ marginBottom: 16 }} bodyStyle={{ padding: '16px 24px' }}>
      <Form
        form={form}
        layout="inline"
        initialValues={{
          days: filters.days,
          min_vol_ratio: filters.min_vol_ratio,
          min_surge_ret: filters.min_surge_ret,
          sector_name: filters.sector_name,
          sort: filters.sort,
        }}
        onValuesChange={handleValuesChange}
        style={{ flexWrap: 'wrap', rowGap: 8 }}
      >
        <Form.Item name="days" label="最近天数">
          <InputNumber
            min={1}
            max={365}
            style={{ width: 80 }}
            addonAfter="天"
          />
        </Form.Item>
        <Form.Item name="sector_name" label="板块">
          <Select
            style={{ width: 180 }}
            placeholder="全部板块"
            allowClear
            showSearch
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            options={sectorOptions.map(({ name, count }) => ({
              label: `${name}（${count}）`,
              value: name,
            }))}
          />
        </Form.Item>
        <Form.Item name="min_vol_ratio" label="日线爆量">
          <Select style={{ width: 100 }}>
            <Option value={0}>全部</Option>
            <Option value={1}>&gt; 1倍</Option>
            <Option value={2}>&gt; 2倍</Option>
            <Option value={3}>&gt; 3倍</Option>
            <Option value={5}>&gt; 5倍</Option>
          </Select>
        </Form.Item>
        <Form.Item name="min_surge_ret" label="单分最大脉冲">
          <Select style={{ width: 100 }}>
            <Option value={0}>全部</Option>
            <Option value={2}>&gt; 2%</Option>
            <Option value={3}>&gt; 3%</Option>
            <Option value={5}>&gt; 5%</Option>
          </Select>
        </Form.Item>
        <Form.Item name="sort" label="排序方式">
          <Select style={{ width: 120 }}>
            <Option value="score">综合评分 🔥</Option>
            <Option value="vol_ratio">爆量倍数</Option>
            <Option value="surge_count">脉冲频次</Option>
            <Option value="max_surge_ret">最大涨幅</Option>
            <Option value="symbol">股票代码</Option>
          </Select>
        </Form.Item>
        <Form.Item>
          <Space>
            <Button onClick={() => {
              form.resetFields()
              onReset()
            }}>重置</Button>
            <Button type="primary" onClick={() => {
              const allValues = form.getFieldsValue()
              onFilterChange(allValues)
              onRefresh()
            }} loading={loading}>刷新</Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  )
}
