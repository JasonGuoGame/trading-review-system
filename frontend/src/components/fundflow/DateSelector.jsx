import { Card, Space, DatePicker, Radio, Form } from 'antd'
import dayjs from 'dayjs'

export default function DateSelector({ filters, onFilterChange }) {
  const [form] = Form.useForm()

  const handleValuesChange = (changedValues, allValues) => {
    onFilterChange({
      ...allValues,
      date: allValues.date ? allValues.date.format('YYYY-MM-DD') : '',
    })
  }

  return (
    <Card style={{ marginBottom: 16 }} bodyStyle={{ padding: '16px 24px' }}>
      <Form
        form={form}
        layout="inline"
        initialValues={{
          date: filters.date ? dayjs(filters.date) : dayjs(),
          mode: filters.mode,
          sort: filters.sort,
        }}
        onValuesChange={handleValuesChange}
        style={{ flexWrap: 'wrap', rowGap: 16 }}
      >
        <Form.Item name="date" label="跑批日期">
          <DatePicker format="YYYY-MM-DD" placeholder="选择日期" />
        </Form.Item>
        <Form.Item name="mode" label="分析模式">
          <Radio.Group buttonStyle="solid">
            <Radio.Button value="1d">今日资金</Radio.Button>
            <Radio.Button value="3d">最近3天趋势</Radio.Button>
            <Radio.Button value="5d">最近5天趋势</Radio.Button>
          </Radio.Group>
        </Form.Item>
        <Form.Item name="sort" label="排序方式">
          <Radio.Group buttonStyle="solid">
            <Radio.Button value="inflow">净流入</Radio.Button>
            <Radio.Button value="rate">净流入率</Radio.Button>
            <Radio.Button value="trend">趋势增强</Radio.Button>
          </Radio.Group>
        </Form.Item>
      </Form>
    </Card>
  )
}
