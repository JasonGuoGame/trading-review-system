import { Card, Space, DatePicker, Select, Button, Form } from 'antd'
import dayjs from 'dayjs'

const { Option } = Select

export default function FilterBar({ filters, onFilterChange, onReset, onRefresh, loading }) {
  const [form] = Form.useForm()

  const handleValuesChange = (changedValues, allValues) => {
    onFilterChange({
      ...allValues,
      trade_date: allValues.trade_date ? allValues.trade_date.format('YYYY-MM-DD') : '',
    })
  }

  return (
    <Card style={{ marginBottom: 16 }} bodyStyle={{ padding: '16px 24px' }}>
      <Form
        form={form}
        layout="inline"
        initialValues={{
          trade_date: filters.trade_date ? dayjs(filters.trade_date) : null,
          min_vol_ratio: filters.min_vol_ratio,
          min_surge_count: filters.min_surge_count,
          min_surge_ret: filters.min_surge_ret,
          sort: filters.sort,
        }}
        onValuesChange={handleValuesChange}
      >
        <Form.Item name="trade_date" label="跑批日期">
          <DatePicker format="YYYY-MM-DD" placeholder="昨日/今日" />
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
        <Form.Item name="min_surge_count" label="脉冲次数">
          <Select style={{ width: 100 }}>
            <Option value={0}>全部</Option>
            <Option value={1}>&gt; 1次</Option>
            <Option value={3}>&gt; 3次</Option>
            <Option value={5}>&gt; 5次</Option>
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
          </Select>
        </Form.Item>
        <Form.Item>
          <Space>
            <Button onClick={() => {
              form.resetFields()
              onReset()
            }}>重置</Button>
            <Button type="primary" onClick={onRefresh} loading={loading}>刷新</Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  )
}
