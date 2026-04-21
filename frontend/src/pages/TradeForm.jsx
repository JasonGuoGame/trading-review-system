import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Card, Form, Input, Select, DatePicker, InputNumber, Button, Row, Col,
  Checkbox, Divider, Space, message, Spin,
} from 'antd'
import { SaveOutlined, PlusOutlined, MinusCircleOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import {
  useCreateTradeMutation,
  useUpdateTradeMutation,
  useGetTradeDetailQuery,
  useUpsertEntryDecisionMutation,
  useUpsertExitPlanMutation,
} from '../app/api'
import { STRATEGIES, SETUP_TYPES, SIGNALS, SCORES, MARKET_CONDITIONS } from '../utils/constants'

const { TextArea } = Input
const { Option } = Select

function TradeForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = !!id
  const [form] = Form.useForm()
  const [createTrade] = useCreateTradeMutation()
  const [updateTrade] = useUpdateTradeMutation()
  const [upsertEntryDecision] = useUpsertEntryDecisionMutation()
  const [upsertExitPlan] = useUpsertExitPlanMutation()
  const { data: tradeDetail, isLoading } = useGetTradeDetailQuery(id, { skip: !isEdit })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (isEdit && tradeDetail) {
      const { trade, entry_decision, exit_plan } = tradeDetail
      const signals = (() => {
        try {
          return typeof entry_decision?.signals === 'string'
            ? JSON.parse(entry_decision.signals)
            : entry_decision?.signals || []
        } catch { return [] }
      })()
      const batchPlan = (() => {
        try {
          return typeof exit_plan?.batch_plan === 'string'
            ? JSON.parse(exit_plan.batch_plan)
            : exit_plan?.batch_plan || []
        } catch { return [] }
      })()

      form.setFieldsValue({
        symbol: trade.symbol,
        strategy: trade.strategy,
        setup_type: trade.setup_type,
        direction: trade.direction,
        entry_date: trade.entry_date ? dayjs(trade.entry_date) : null,
        exit_date: trade.exit_date ? dayjs(trade.exit_date) : null,
        total_pnl: trade.total_pnl,
        total_pnl_pct: trade.total_pnl_pct,
        max_drawdown: trade.max_drawdown,
        holding_days: trade.holding_days,
        market_condition: trade.market_condition,
        is_simulated: trade.is_simulated || false,
        status: trade.status,
        // Entry Decision
        ed_strategy: entry_decision?.strategy,
        ed_setup_type: entry_decision?.setup_type,
        ed_signals: signals,
        ed_reason: entry_decision?.reason,
        // Exit Plan
        stop_loss: exit_plan?.stop_loss,
        take_profit: exit_plan?.take_profit,
        batch_plan: batchPlan,
      })
    }
  }, [isEdit, tradeDetail, form])

  const handleSubmit = async (values) => {
    setSubmitting(true)
    try {
      const tradeData = {
        symbol: values.symbol,
        strategy: values.strategy,
        setup_type: values.setup_type,
        direction: values.direction || 'long',
        entry_date: values.entry_date?.format('YYYY-MM-DD'),
        market_condition: values.market_condition,
        is_simulated: values.is_simulated || false,
      }

      let tradeId = id

      if (isEdit) {
        await updateTrade({
          id,
          ...tradeData,
          exit_date: values.exit_date?.format('YYYY-MM-DD'),
          total_pnl: values.total_pnl,
          total_pnl_pct: values.total_pnl_pct,
          max_drawdown: values.max_drawdown,
          holding_days: values.holding_days,
          status: values.status,
        }).unwrap()
      } else {
        const entryDecision = values.ed_strategy || values.ed_signals?.length > 0 || values.ed_reason
          ? {
              strategy: values.ed_strategy,
              setup_type: values.ed_setup_type,
              signals: values.ed_signals || [],
              indicators: {},
              reason: values.ed_reason || '',
            }
          : undefined

        const exitPlan = values.stop_loss || values.take_profit
          ? {
              stop_loss: values.stop_loss || 0,
              take_profit: values.take_profit || 0,
              batch_plan: values.batch_plan || [],
            }
          : undefined

        const result = await createTrade({
          ...tradeData,
          entry_decision: entryDecision,
          exit_plan: exitPlan,
        }).unwrap()
        tradeId = result.data?.id
      }

      // For edit mode, also update entry decision and exit plan
      if (isEdit && tradeId) {
        if (values.ed_strategy || values.ed_signals?.length > 0 || values.ed_reason) {
          await upsertEntryDecision({
            tradeId,
            strategy: values.ed_strategy || '',
            setup_type: values.ed_setup_type || '',
            signals: values.ed_signals || [],
            indicators: {},
            reason: values.ed_reason || '',
          }).unwrap()
        }

        if (values.stop_loss || values.take_profit) {
          await upsertExitPlan({
            tradeId,
            stop_loss: values.stop_loss || 0,
            take_profit: values.take_profit || 0,
            batch_plan: values.batch_plan || [],
          }).unwrap()
        }
      }

      message.success(isEdit ? '交易已更新' : '交易已创建')
      navigate(tradeId ? `/trades/${tradeId}` : '/trades')
    } catch (err) {
      message.error('操作失败: ' + (err.data?.message || '未知错误'))
    } finally {
      setSubmitting(false)
    }
  }

  if (isEdit && isLoading) {
    return <div style={{ textAlign: 'center', padding: 100 }}><Spin size="large" /></div>
  }

  return (
    <div className="page-container">
      <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 24 }}>
        {isEdit ? '✏️ 编辑交易' : '➕ 新建交易'}
      </h2>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{ direction: 'long', status: 'open', is_simulated: false }}
      >
        {/* Basic Info */}
        <Card title="📋 基本信息" extra={
          <Form.Item name="is_simulated" valuePropName="checked" style={{ marginBottom: 0 }}>
            <Checkbox>🧪 模拟交易</Checkbox>
          </Form.Item>
        } style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item name="symbol" label="股票代码" rules={[{ required: true, message: '请输入股票代码' }]}>
                <Input placeholder="如 AAPL" size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="strategy" label="策略类型">
                <Select placeholder="选择策略" allowClear>
                  {STRATEGIES.map((s) => <Option key={s} value={s}>{s}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="direction" label="方向">
                <Select>
                  <Option value="long">做多</Option>
                  <Option value="short">做空</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item name="entry_date" label="入场日期">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item name="market_condition" label="市场环境">
                <Select placeholder="选择环境" allowClear>
                  {MARKET_CONDITIONS.map((m) => <Option key={m} value={m}>{m}</Option>)}
                </Select>
              </Form.Item>
            </Col>

            {isEdit && (
              <>
                <Col xs={24} md={6}>
                  <Form.Item name="exit_date" label="出场日期">
                    <DatePicker style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={6}>
                  <Form.Item name="status" label="状态">
                    <Select>
                      <Option value="open">持仓中</Option>
                      <Option value="closed">已平仓</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </>
            )}
          </Row>

          {isEdit && (
            <Row gutter={16}>
              <Col xs={12} md={6}>
                <Form.Item name="total_pnl" label="总盈亏 ($)">
                  <InputNumber style={{ width: '100%' }} step={0.01} />
                </Form.Item>
              </Col>
              <Col xs={12} md={6}>
                <Form.Item name="total_pnl_pct" label="盈亏 (%)">
                  <InputNumber style={{ width: '100%' }} step={0.01} />
                </Form.Item>
              </Col>
              <Col xs={12} md={6}>
                <Form.Item name="max_drawdown" label="最大回撤 (%)">
                  <InputNumber style={{ width: '100%' }} min={0} step={0.01} />
                </Form.Item>
              </Col>
              <Col xs={12} md={3}>
                <Form.Item name="holding_days" label="持仓天数">
                  <InputNumber style={{ width: '100%' }} min={0} />
                </Form.Item>
              </Col>
            </Row>
          )}
        </Card>

        {/* Entry Decision ⭐⭐⭐ */}
        <Card title="🎯 入场决策" style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name="ed_strategy" label="策略">
                <Select placeholder="选择策略" allowClear>
                  {STRATEGIES.map((s) => <Option key={s} value={s}>{s}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="ed_setup_type" label="设置类型">
                <Select placeholder="选择类型" allowClear>
                  {SETUP_TYPES.map((s) => <Option key={s} value={s}>{s}</Option>)}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="ed_signals" label="信号 (可多选)">
            <Checkbox.Group>
              <Row>
                {SIGNALS.map((s) => (
                  <Col xs={12} md={8} lg={6} key={s}>
                    <Checkbox value={s} style={{ marginBottom: 8 }}>{s}</Checkbox>
                  </Col>
                ))}
              </Row>
            </Checkbox.Group>
          </Form.Item>
          <Form.Item name="ed_reason" label="买入理由">
            <TextArea rows={4} placeholder="描述你的买入理由..." />
          </Form.Item>
        </Card>

        {/* Exit Plan */}
        <Card title="🚪 出场计划" style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col xs={12} md={8}>
              <Form.Item name="stop_loss" label="止损价">
                <InputNumber style={{ width: '100%' }} min={0} step={0.01} placeholder="止损价格" />
              </Form.Item>
            </Col>
            <Col xs={12} md={8}>
              <Form.Item name="take_profit" label="止盈价">
                <InputNumber style={{ width: '100%' }} min={0} step={0.01} placeholder="止盈价格" />
              </Form.Item>
            </Col>
          </Row>

          <Divider>分批出场计划</Divider>
          <Form.List name="batch_plan">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Row key={key} gutter={16} style={{ marginBottom: 8 }}>
                    <Col xs={10}>
                      <Form.Item {...restField} name={[name, 'pct']} label="仓位 %">
                        <InputNumber style={{ width: '100%' }} min={1} max={100} placeholder="50" />
                      </Form.Item>
                    </Col>
                    <Col xs={10}>
                      <Form.Item {...restField} name={[name, 'target']} label="目标价">
                        <InputNumber style={{ width: '100%' }} min={0} step={0.01} placeholder="10.50" />
                      </Form.Item>
                    </Col>
                    <Col xs={4} style={{ display: 'flex', alignItems: 'center', paddingTop: 30 }}>
                      <MinusCircleOutlined onClick={() => remove(name)} style={{ fontSize: 20, color: '#ff4d4f' }} />
                    </Col>
                  </Row>
                ))}
                <Button type="dashed" onClick={() => add()} icon={<PlusOutlined />} style={{ width: '100%' }}>
                  添加分批计划
                </Button>
              </>
            )}
          </Form.List>
        </Card>

        {/* Submit */}
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Space size="large">
            <Button size="large" onClick={() => navigate(-1)}>取消</Button>
            <Button type="primary" size="large" icon={<SaveOutlined />} htmlType="submit" loading={submitting}>
              {isEdit ? '保存修改' : '创建交易'}
            </Button>
          </Space>
        </div>
      </Form>
    </div>
  )
}

export default TradeForm
