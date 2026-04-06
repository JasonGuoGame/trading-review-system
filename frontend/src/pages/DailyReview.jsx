import { useState, useEffect } from 'react'
import {
  Card, Row, Col, Input, Button, DatePicker, message, Spin, Form,
  Select, Slider, Statistic, Space, Tag, Empty, Divider, InputNumber
} from 'antd'
import dayjs from 'dayjs'
import {
  useGetDailyReviewQuery,
  useUpsertDailyReviewMutation,
  useGetMarketBreadthQuery,
  useUpsertMarketBreadthMutation,
} from '../app/api'

const { TextArea } = Input

const mistakesOptions = [
  { label: '追高', value: '追高' },
  { label: '止损失败', value: '止损失败' },
  { label: '过早下车', value: '过早下车' },
  { label: '仓位过重', value: '仓位过重' },
  { label: '频繁交易', value: '频繁交易' },
  { label: '逆势做多/空', value: '逆势' },
]

function DailyReview() {
  const [selectedDate, setSelectedDate] = useState(dayjs())
  const dateStr = selectedDate.format('YYYY-MM-DD')

  // Queries
  const { data: reviewData, isLoading: reviewLoading } = useGetDailyReviewQuery(dateStr)
  const { data: breadthData, isLoading: breadthLoading } = useGetMarketBreadthQuery(dateStr)

  // Mutations
  const [upsertReview, { isLoading: savingReview }] = useUpsertDailyReviewMutation()
  const [upsertBreadth, { isLoading: savingBreadth }] = useUpsertMarketBreadthMutation()

  // Forms
  const [reviewForm] = Form.useForm()
  const [breadthForm] = Form.useForm()

  useEffect(() => {
    if (reviewData) {
      let mistakes = []
      try {
        mistakes = typeof reviewData.mistakes === 'string' ? JSON.parse(reviewData.mistakes) : (reviewData.mistakes || [])
      } catch (e) {
        mistakes = []
      }

      reviewForm.setFieldsValue({
        ...reviewData,
        mistakes,
      })
    } else {
      reviewForm.resetFields()
      reviewForm.setFieldsValue({ emotion_score: 5, discipline_score: 5 })
    }
  }, [reviewData, reviewForm])

  useEffect(() => {
    if (breadthData) {
      breadthForm.setFieldsValue(breadthData)
    } else {
      breadthForm.resetFields()
    }
  }, [breadthData, breadthForm])

  const handleReviewSave = async (values) => {
    try {
      const payload = {
        ...values,
        date: dateStr,
        mistakes: JSON.stringify(values.mistakes || []),
      }
      await upsertReview(payload).unwrap()
      message.success('每日复盘保存成功')
    } catch {
      message.error('保存每日复盘失败')
    }
  }

  const handleBreadthSave = async (values) => {
    try {
      const payload = {
        ...values,
        date: dateStr,
        total_stocks: (values.advancers || 0) + (values.decliners || 0) + (values.flat || 0),
      }
      await upsertBreadth(payload).unwrap()
      message.success('市场宽度保存成功')
    } catch {
      message.error('保存市场宽度失败')
    }
  }

  const handleDateChange = (date) => {
    if (date) setSelectedDate(date)
  }

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>📅 每日复盘与总结</h2>
        <DatePicker
          value={selectedDate}
          onChange={handleDateChange}
          allowClear={false}
          size="large"
          style={{ width: 200 }}
        />
      </div>

      <Row gutter={[16, 16]}>
        {/* Left Column - Market Breadth & Trades */}
        <Col xs={24} lg={8}>
          <Card title="📊 市场宽度（今日）" style={{ marginBottom: 16 }}>
            {breadthLoading ? <Spin /> : (
              <Form form={breadthForm} layout="vertical" onFinish={handleBreadthSave}>
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item label="📈 上涨家数" name="advancers">
                      <InputNumber style={{ width: '100%' }} placeholder="3200" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label="📉 下跌家数" name="decliners">
                      <InputNumber style={{ width: '100%' }} placeholder="1200" />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={16}>
                  <Col span={8}>
                    <Form.Item label="平盘" name="flat">
                      <InputNumber style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item label="🔥 涨停" name="limit_up">
                      <InputNumber style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item label="❄️ 跌停" name="limit_down">
                      <InputNumber style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item shouldUpdate>
                  {() => {
                    const up = breadthForm.getFieldValue('advancers') || 0
                    const down = breadthForm.getFieldValue('decliners') || 0
                    const flat = breadthForm.getFieldValue('flat') || 0
                    const total = up + down + flat
                    const ratio = total > 0 ? (up / total * 100).toFixed(1) : 0
                    
                    let tag = <Tag color="default">数据不足</Tag>
                    if (total > 0) {
                      if (ratio > 70) tag = <Tag color="success">极强 / 普涨</Tag>
                      else if (ratio > 50) tag = <Tag color="processing">偏强</Tag>
                      else if (ratio > 30) tag = <Tag color="warning">偏弱</Tag>
                      else tag = <Tag color="error">极弱 / 普跌</Tag>
                    }

                    return (
                      <div style={{ background: '#141414', padding: 12, borderRadius: 8, marginBottom: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                          <span>总家数: {total}</span>
                          <span>上涨占比: {ratio}%</span>
                        </div>
                        <div>市场情绪: {tag}</div>
                      </div>
                    )
                  }}
                </Form.Item>

                <Button type="primary" htmlType="submit" loading={savingBreadth} block>
                  保存宽度数据
                </Button>
              </Form>
            )}
          </Card>

          <Card title="💰 今日交易统计 (手动录入)" style={{ marginBottom: 16 }}>
            <Form form={reviewForm} layout="vertical" onFinish={handleReviewSave}>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="总盈亏 ($)" name="total_profit">
                    <InputNumber style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="胜率 (%)" name="win_rate">
                    <InputNumber style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item label="交易笔数" name="total_trades">
                    <InputNumber style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>
            </Form>
          </Card>
        </Col>

        {/* Right Column - Deep Review text */}
        <Col xs={24} lg={16}>
          <Card title="📝 复盘详情" bodyStyle={{ padding: '24px' }}>
            {reviewLoading ? <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div> : (
              <Form form={reviewForm} layout="vertical" onFinish={handleReviewSave}>

                <Divider orientation="left">市场与大盘</Divider>
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item label="市场趋势" name="market_trend">
                      <Select options={[
                        { value: 'uptrend', label: '上升趋势' },
                        { value: 'downtrend', label: '下降趋势' },
                        { value: 'ranging', label: '震荡盘整' },
                      ]} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label="主线题材" name="main_theme">
                      <Input placeholder="例如：AI、芯片、新能源..." />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label="赚钱效应" name="money_effect">
                      <Select options={[
                        { value: 'excellent', label: '非常好 (连板多)' },
                        { value: 'good', label: '较好' },
                        { value: 'bad', label: '差 (核按钮多)' },
                        { value: 'terrible', label: '极差 (单边下跌)' },
                      ]} />
                    </Form.Item>
                  </Col>
                </Row>

                <Divider orientation="left">自身执行与情绪</Divider>
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item label="情绪分 (1-10，10为极度平静理性)" name="emotion_score">
                      <Slider min={1} max={10} marks={{ 1: '失控', 5: '一般', 10: '专注' }} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label="纪律分 (1-10，10为完美执行纪律)" name="discipline_score">
                      <Slider min={1} max={10} marks={{ 1: '瞎买', 5: '部分违背', 10: '知行合一' }} />
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <Form.Item label="错误记录" name="mistakes">
                      <Select
                        mode="multiple"
                        allowClear
                        placeholder="今天犯了什么错？"
                        options={mistakesOptions}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <Form.Item label="情绪笔记" name="emotion_notes">
                      <TextArea rows={2} placeholder="记录导致情绪波动的核心原因..." />
                    </Form.Item>
                  </Col>
                </Row>

                <Divider orientation="left">明日计划</Divider>
                <Form.Item label="核心计划" name="plan">
                  <TextArea rows={3} placeholder="整体策略：明天是继续做多还是防守？" />
                </Form.Item>
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item label="关注标的" name="focus_stocks">
                      <TextArea rows={2} placeholder="例如：NVDA, TSLA..." />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label="风险提示" name="risk_points">
                      <TextArea rows={2} placeholder="例如：CPI数据公布前避免重仓..." />
                    </Form.Item>
                  </Col>
                </Row>

                <div style={{ marginTop: 24, textAlign: 'right' }}>
                  <Button type="primary" htmlType="submit" size="large" loading={savingReview} style={{ padding: '0 40px' }}>
                    保存复盘
                  </Button>
                </div>
              </Form>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default DailyReview
