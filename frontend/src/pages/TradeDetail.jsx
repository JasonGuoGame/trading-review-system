import { useParams, useNavigate } from 'react-router-dom'
import {
  Card, Row, Col, Tag, Button, Spin, Descriptions, Timeline, Typography,
  Divider, Space, Popconfirm, message, Modal, Input, Empty, Switch, InputNumber, Slider, Tooltip
} from 'antd'
import {
  ArrowLeftOutlined, EditOutlined, DeleteOutlined,
  CheckCircleOutlined, CloseCircleOutlined, PlusOutlined, MinusOutlined, TagsOutlined, QuestionCircleOutlined
} from '@ant-design/icons'
import { useState } from 'react'
import { useGetTradeDetailQuery, useDeleteTradeMutation, useUpsertReviewMutation, useSetTradeTagsMutation, useGetTagsQuery, useCreateOrderMutation, useUpdateOrderMutation, useUpdateTradeMutation } from '../app/api'
import { formatMoney, formatPercent, formatDate, getPnlClass, getScoreColor, getOrderColor, getOrderLabel } from '../utils/format'
import { TagSelector, getTagColor } from '../components/TagSelector'

const { Title, Text, Paragraph } = Typography
const { TextArea } = Input

function TradeDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data, isLoading } = useGetTradeDetailQuery(id)
  const { data: allTags } = useGetTagsQuery()
  const [deleteTrade] = useDeleteTradeMutation()
  const [upsertReview] = useUpsertReviewMutation()
  const [setTradeTags] = useSetTradeTagsMutation()

  const [reviewModal, setReviewModal] = useState(false)
  const [reviewForm, setReviewForm] = useState({})
  const [tagModal, setTagModal] = useState(false)
  const [selectedTagNames, setSelectedTagNames] = useState([])

  const [updateTrade] = useUpdateTradeMutation()
  const [scoreModal, setScoreModal] = useState(false)
  const [scoreForm, setScoreForm] = useState({})

  const [createOrder] = useCreateOrderMutation()
  const [updateOrder] = useUpdateOrderMutation()
  const [buyModal, setBuyModal] = useState(false)
  const [sellModal, setSellModal] = useState(false)
  const [editingOrderId, setEditingOrderId] = useState(null)
  const [orderForm, setOrderForm] = useState({
    price: null,
    quantity: null,
    position_pct: null,
    reason: '',
    is_rule_followed: true,
  })

  if (isLoading) {
    return <div style={{ textAlign: 'center', padding: 100 }}><Spin size="large" /></div>
  }

  if (!data) {
    return <Empty description="交易不存在" style={{ padding: 100 }} />
  }

  const { trade, orders, entry_decision, exit_plan, tags, review } = data

  const handleDelete = async () => {
    try {
      await deleteTrade(id).unwrap()
      message.success('交易已删除')
      navigate('/trades')
    } catch {
      message.error('删除失败')
    }
  }

  const handleReviewSave = async () => {
    try {
      await upsertReview({ tradeId: id, ...reviewForm }).unwrap()
      message.success('复盘已保存')
      setReviewModal(false)
    } catch {
      message.error('保存失败')
    }
  }

  const openReviewModal = () => {
    setReviewForm({
      did_right: review?.did_right || '',
      mistakes: review?.mistakes || '',
      improvements: review?.improvements || '',
      replay: review?.replay || '',
    })
    setReviewModal(true)
  }

  const openTagModal = () => {
    setSelectedTagNames(tags?.map((t) => t.name) || [])
    setTagModal(true)
  }

  const handleTagSave = async () => {
    try {
      const tag_ids = selectedTagNames.map(name => allTags.find(t => t.name === name)?.id).filter(Boolean)
      await setTradeTags({ tradeId: id, tag_ids }).unwrap()
      message.success('标签已更新')
      setTagModal(false)
    } catch {
      message.error('更新失败')
    }
  }

  const openScoreModal = () => {
    setScoreForm({
      entry_score: trade.entry_score || 0,
      market_score: trade.market_score || 0,
      execution_score: trade.execution_score || 0,
      risk_score: trade.risk_score || 0,
      outcome_score: trade.outcome_score || 0,
    })
    setScoreModal(true)
  }

  const handleScoreSave = async () => {
    try {
      await updateTrade({
        id,
        ...scoreForm
      }).unwrap()
      message.success('评分已更新')
      setScoreModal(false)
    } catch {
      message.error('更新评分失败')
    }
  }

  const openBuyModal = () => {
    setEditingOrderId(null)
    setOrderForm({ price: null, quantity: null, position_pct: null, reason: '', is_rule_followed: true })
    setBuyModal(true)
  }

  const openSellModal = () => {
    setEditingOrderId(null)
    setOrderForm({ price: null, quantity: null, position_pct: null, reason: '', is_rule_followed: true })
    setSellModal(true)
  }

  const openEditOrderModal = (order) => {
    setEditingOrderId(order.id)
    let parsedReason = order.reason || ''
    let is_rule_followed = true
    if (parsedReason.startsWith('[√ 已按规则] ')) {
      parsedReason = parsedReason.replace('[√ 已按规则] ', '')
      is_rule_followed = true
    } else if (parsedReason.startsWith('[× 未按规则] ')) {
      parsedReason = parsedReason.replace('[× 未按规则] ', '')
      is_rule_followed = false
    }

    setOrderForm({
      price: order.price,
      quantity: order.quantity,
      position_pct: order.position_pct,
      reason: parsedReason,
      is_rule_followed,
    })
    
    if (order.order_type === 'buy') {
      setBuyModal(true)
    } else {
      setSellModal(true)
    }
  }

  const handleOrderSubmit = async (type) => {
    try {
      let finalReason = orderForm.reason || ''
      if (orderForm.is_rule_followed !== null) {
         const ruleText = orderForm.is_rule_followed ? '[√ 已按规则]' : '[× 未按规则]'
         finalReason = `${ruleText} ${finalReason}`
      }

      const payload = {
        tradeId: id,
        order_type: type,
        price: Number(orderForm.price) || 0,
        quantity: Number(orderForm.quantity) || 0,
        position_pct: Number(orderForm.position_pct) || 0,
        reason: finalReason,
        order_date: new Date().toISOString().split('T')[0],
      }

      if (!payload.price) {
        message.warning('请输入价格')
        return
      }

      if (editingOrderId) {
        await updateOrder({ id: editingOrderId, ...payload }).unwrap()
        message.success(`${type === 'buy' ? '买入' : '卖出'}订单已更新`)
      } else {
        await createOrder(payload).unwrap()
        message.success(`${type === 'buy' ? '买入' : '卖出'}订单已提交`)
      }
      
      setBuyModal(false)
      setSellModal(false)
      setEditingOrderId(null)
    } catch {
      message.error('提交订单失败')
    }
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/trades')}>返回</Button>
          <Title level={3} style={{ margin: 0 }}>
            {trade.symbol}
            <Tag color={trade.direction === 'long' ? 'green' : 'red'} style={{ marginLeft: 8 }}>
              {trade.direction === 'long' ? '做多' : '做空'}
            </Tag>
            <Tag color={trade.status === 'open' ? 'processing' : 'default'} style={{ marginLeft: 4 }}>
              {trade.status === 'open' ? '持仓中' : '已平仓'}
            </Tag>
          </Title>
        </Space>
        <Space>
          <Popconfirm title="确定删除此交易？" onConfirm={handleDelete} okText="删除" cancelText="取消">
            <Button danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      </div>

      {/* ActionBar ⭐⭐⭐⭐⭐ */}
      <Card style={{ marginBottom: 16, background: '#141414' }} bodyStyle={{ padding: 16 }}>
        <Space size="middle" wrap>
          <Button type="primary" style={{ background: '#52c41a', borderColor: '#52c41a' }} icon={<PlusOutlined />} onClick={openBuyModal}>
            买入
          </Button>
          <Button type="primary" danger icon={<MinusOutlined />} onClick={openSellModal}>
            卖出
          </Button>
          <Button icon={<EditOutlined />} onClick={() => navigate(`/trades/${id}/edit`)}>
            编辑交易
          </Button>
          <Button icon={<TagsOutlined />} onClick={openTagModal}>
            添加标签
          </Button>
        </Space>
      </Card>

      {/* Trade Summary */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} md={8}>
          <Card>
            <Statistic title="总盈亏" value={trade.total_pnl} prefix="$" precision={2} className={getPnlClass(trade.total_pnl)} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Statistic title="盈亏 %" value={trade.total_pnl_pct} suffix="%" precision={2} className={getPnlClass(trade.total_pnl_pct)} />
          </Card>
        </Col>
        <Col xs={24} md={4}>
          <Card>
            <Statistic title="持仓天数" value={
              (() => {
                if (!trade.entry_date) return 0
                const start = new Date(trade.entry_date)
                const end = trade.status === 'closed' && trade.exit_date ? new Date(trade.exit_date) : new Date()
                return Math.max(0, Math.floor((end - start) / (1000 * 60 * 60 * 24)))
              })()
            } suffix="天" />
          </Card>
        </Col>
        <Col xs={24} md={4}>
          <Card>
            <div style={{ marginBottom: 8, color: '#999', fontSize: 14 }}>综合评分</div>
            {trade.grade ? (
              <Tag color={getScoreColor(trade.grade)} style={{ fontSize: 20, padding: '4px 16px' }}>
                {trade.grade}
              </Tag>
            ) : <Text type="secondary">未评分</Text>}
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        {/* Left Column */}
        <Col xs={24} lg={14}>
          {/* Entry Decision Card ⭐ */}
          <Card title="🎯 入场决策" style={{ marginBottom: 16 }}>
            {entry_decision ? (
              <Descriptions column={1} size="small" labelStyle={{ color: '#999', width: 100 }}>
                <Descriptions.Item label="策略">{entry_decision.strategy || '--'}</Descriptions.Item>
                <Descriptions.Item label="设置类型">{entry_decision.setup_type || '--'}</Descriptions.Item>
                <Descriptions.Item label="信号">
                  {(() => {
                    try {
                      const signals = typeof entry_decision.signals === 'string'
                        ? JSON.parse(entry_decision.signals)
                        : entry_decision.signals
                      return signals?.map((s, i) => <Tag key={i} color="blue">{s}</Tag>) || '--'
                    } catch { return '--' }
                  })()}
                </Descriptions.Item>
                <Descriptions.Item label="指标">
                  {(() => {
                    try {
                      const indicators = typeof entry_decision.indicators === 'string'
                        ? JSON.parse(entry_decision.indicators)
                        : entry_decision.indicators
                      if (!indicators || typeof indicators !== 'object') return '--'
                      return Object.entries(indicators).map(([k, v]) => (
                        <Tag key={k}>{k}: {v}</Tag>
                      ))
                    } catch { return '--' }
                  })()}
                </Descriptions.Item>
                <Descriptions.Item label="买入理由">
                  <Paragraph style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                    {entry_decision.reason || '--'}
                  </Paragraph>
                </Descriptions.Item>
              </Descriptions>
            ) : (
              <Empty description="未填写入场决策" />
            )}
          </Card>

          {/* Exit Plan Card */}
          <Card title="🚪 出场计划" style={{ marginBottom: 16 }}>
            {exit_plan ? (
              <Descriptions column={2} size="small" labelStyle={{ color: '#999' }}>
                <Descriptions.Item label="止损价">
                  <Text type="danger">${exit_plan.stop_loss || '--'}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="止盈价">
                  <Text type="success">${exit_plan.take_profit || '--'}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="分批计划" span={2}>
                  {(() => {
                    try {
                      const plan = typeof exit_plan.batch_plan === 'string'
                        ? JSON.parse(exit_plan.batch_plan)
                        : exit_plan.batch_plan
                      if (!plan || !Array.isArray(plan)) return '--'
                      return plan.map((p, i) => (
                        <Tag key={i}>{p.pct}% @ ${p.target}</Tag>
                      ))
                    } catch { return '--' }
                  })()}
                </Descriptions.Item>
              </Descriptions>
            ) : (
              <Empty description="未填写出场计划" />
            )}
          </Card>

          {/* Orders Timeline ⭐⭐⭐ */}
          <Card title="📅 订单时间线" style={{ marginBottom: 16 }}>
            {orders?.length > 0 ? (
              <Timeline
                className="order-timeline"
                items={orders.map((order) => ({
                  color: getOrderColor(order.order_type),
                  children: (
                    <div style={{
                      background: '#1a1a1a',
                      padding: '12px 16px',
                      borderRadius: 8,
                      border: `1px solid ${order.order_type === 'buy' ? 'rgba(82,196,26,0.2)' : 'rgba(255,77,79,0.2)'}`,
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <Space>
                          <Tag color={order.order_type === 'buy' ? 'green' : 'red'}>
                            {getOrderLabel(order.order_type)}
                          </Tag>
                          <Text strong>${order.price}</Text>
                        </Space>
                        <Space>
                          <Text type="secondary" style={{ fontSize: 12 }}>{formatDate(order.order_date)}</Text>
                          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEditOrderModal(order)} />
                        </Space>
                      </div>
                      <div style={{ display: 'flex', gap: 16, fontSize: 13 }}>
                        {order.position_pct > 0 && <span>仓位: {order.position_pct}%</span>}
                        {order.quantity > 0 && <span>数量: {order.quantity}</span>}
                      </div>
                      {order.reason && (
                        <div style={{ marginTop: 6, color: '#999', fontSize: 13 }}>
                          💬 {order.reason}
                        </div>
                      )}
                    </div>
                  ),
                }))}
              />
            ) : (
              <Empty description="暂无订单记录" />
            )}
          </Card>
        </Col>

        {/* Right Column */}
        <Col xs={24} lg={10}>
          {/* Trade Info */}
          <Card title="📋 基本信息" style={{ marginBottom: 16 }}>
            <Descriptions column={1} size="small" labelStyle={{ color: '#999', width: 90 }}>
              <Descriptions.Item label="策略">{trade.strategy || '--'}</Descriptions.Item>
              <Descriptions.Item label="设置类型">{trade.setup_type || '--'}</Descriptions.Item>
              <Descriptions.Item label="市场环境">{trade.market_condition || '--'}</Descriptions.Item>
              <Descriptions.Item label="最大回撤">{trade.max_drawdown ? `${trade.max_drawdown}%` : '--'}</Descriptions.Item>
              <Descriptions.Item label="入场日期">{formatDate(trade.entry_date)}</Descriptions.Item>
              <Descriptions.Item label="出场日期">{formatDate(trade.exit_date)}</Descriptions.Item>
            </Descriptions>
          </Card>

          {/* Tags Panel */}
          <Card
            title="🏷️ 标签"
            style={{ marginBottom: 16 }}
            extra={<Button type="link" onClick={openTagModal}>编辑</Button>}
          >
            {tags?.length > 0 ? (
              <Space wrap>
                {tags.map((tag) => (
                  <Tag
                    key={tag.id}
                    color={getTagColor(tag.category)}
                    style={{ fontSize: 14, padding: '4px 12px' }}
                  >
                    {tag.name} {tag.category === 'mistake' && '❌'}
                  </Tag>
                ))}
              </Space>
            ) : (
              <Empty description="暂无标签" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </Card>

          {/* Score Panel ⭐⭐⭐ */}
          <Card
            title="🏆 交易评分"
            style={{ marginBottom: 16 }}
            extra={<Button type="link" onClick={openScoreModal}>编辑</Button>}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text type="secondary">1️⃣ 入场质量</Text>
              <Text strong>{trade.entry_score || 0} <span style={{ color: '#999', fontWeight: 'normal', fontSize: 12 }}>/ 30</span></Text>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text type="secondary">2️⃣ 市场环境</Text>
              <Text strong>{trade.market_score || 0} <span style={{ color: '#999', fontWeight: 'normal', fontSize: 12 }}>/ 20</span></Text>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text type="secondary">3️⃣ 执行纪律</Text>
              <Text strong>{trade.execution_score || 0} <span style={{ color: '#999', fontWeight: 'normal', fontSize: 12 }}>/ 25</span></Text>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text type="secondary">4️⃣ 风控</Text>
              <Text strong>{trade.risk_score || 0} <span style={{ color: '#999', fontWeight: 'normal', fontSize: 12 }}>/ 15</span></Text>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <Text type="secondary">5️⃣ 结果</Text>
              <Text strong>{trade.outcome_score || 0} <span style={{ color: '#999', fontWeight: 'normal', fontSize: 12 }}>/ 10</span></Text>
            </div>
            
            <Divider style={{ margin: '12px 0' }} />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text strong style={{ fontSize: 16 }}>总分 (Total)</Text>
              <div>
                <Text strong style={{ fontSize: 20, marginRight: 8 }}>{trade.total_score || 0}</Text>
                {trade.grade ? <Tag color={getScoreColor(trade.grade)} style={{ fontSize: 16 }}>{trade.grade}</Tag> : <Text type="secondary">未评级</Text>}
              </div>
            </div>
          </Card>

          {/* Review Panel ⭐⭐⭐ */}
          <Card
            title="📝 复盘"
            style={{ marginBottom: 16 }}
            extra={<Button type="link" onClick={openReviewModal}>编辑</Button>}
          >
            {review ? (
              <div>
                {review.did_right && (
                  <div style={{ marginBottom: 12 }}>
                    <Text style={{ color: '#52c41a' }}><CheckCircleOutlined /> 做对的</Text>
                    <Paragraph style={{ marginTop: 4, whiteSpace: 'pre-wrap', color: '#d9d9d9' }}>
                      {review.did_right}
                    </Paragraph>
                  </div>
                )}
                {review.mistakes && (
                  <div style={{ marginBottom: 12 }}>
                    <Text style={{ color: '#ff4d4f' }}><CloseCircleOutlined /> 错误</Text>
                    <Paragraph style={{ marginTop: 4, whiteSpace: 'pre-wrap', color: '#d9d9d9' }}>
                      {review.mistakes}
                    </Paragraph>
                  </div>
                )}
                {review.improvements && (
                  <div style={{ marginBottom: 12 }}>
                    <Text style={{ color: '#faad14' }}>💡 改进</Text>
                    <Paragraph style={{ marginTop: 4, whiteSpace: 'pre-wrap', color: '#d9d9d9' }}>
                      {review.improvements}
                    </Paragraph>
                  </div>
                )}
                {review.replay && (
                  <div>
                    <Text style={{ color: '#1677ff' }}>🔄 复盘要点</Text>
                    <Paragraph style={{ marginTop: 4, whiteSpace: 'pre-wrap', color: '#d9d9d9' }}>
                      {review.replay}
                    </Paragraph>
                  </div>
                )}
              </div>
            ) : (
              <Empty description="暂无复盘记录">
                <Button type="primary" onClick={openReviewModal}>写复盘</Button>
              </Empty>
            )}
          </Card>
        </Col>
      </Row>

      {/* Review Modal */}
      <Modal
        title="📝 编辑复盘"
        open={reviewModal}
        onOk={handleReviewSave}
        onCancel={() => setReviewModal(false)}
        width={640}
        okText="保存"
        cancelText="取消"
      >
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 4, color: '#52c41a' }}>✅ 做对的</label>
          <TextArea rows={3} value={reviewForm.did_right} onChange={(e) => setReviewForm((p) => ({ ...p, did_right: e.target.value }))} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 4, color: '#ff4d4f' }}>❌ 错误</label>
          <TextArea rows={3} value={reviewForm.mistakes} onChange={(e) => setReviewForm((p) => ({ ...p, mistakes: e.target.value }))} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 4, color: '#faad14' }}>💡 改进</label>
          <TextArea rows={3} value={reviewForm.improvements} onChange={(e) => setReviewForm((p) => ({ ...p, improvements: e.target.value }))} />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: 4, color: '#1677ff' }}>🔄 复盘要点</label>
          <TextArea rows={3} value={reviewForm.replay} onChange={(e) => setReviewForm((p) => ({ ...p, replay: e.target.value }))} />
        </div>
      </Modal>

      {/* Tag Modal */}
      <Modal
        title="🏷️ 编辑标签"
        open={tagModal}
        onOk={handleTagSave}
        onCancel={() => setTagModal(false)}
        okText="保存"
        cancelText="取消"
        width={500}
      >
        <div style={{ padding: '20px 0', minHeight: 200 }}>
          <TagSelector
            value={selectedTagNames}
            onChange={setSelectedTagNames}
            maxCount={5}
            allowedCategories={['strategy', 'mistake', 'industry', 'emotion']}
          />
          <div style={{ marginTop: 12, color: '#888', fontSize: 13 }}>
            每笔交易最多标记 5 个核心要素 (建议优先标注 策略、主线 与 错误)。
          </div>
        </div>
      </Modal>

      {/* Buy Order Modal */}
      <Modal
        title="➕ 买入"
        open={buyModal}
        onOk={() => handleOrderSubmit('buy')}
        onCancel={() => setBuyModal(false)}
        okText="提交"
        cancelText="取消"
        okButtonProps={{ style: { background: '#52c41a', borderColor: '#52c41a' } }}
      >
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8 }}>价格：</label>
          <InputNumber style={{ width: '100%' }} value={orderForm.price} onChange={(v) => setOrderForm(p => ({ ...p, price: v }))} addonBefore="$" />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8 }}>数量：</label>
          <InputNumber style={{ width: '100%' }} value={orderForm.quantity} onChange={(v) => setOrderForm(p => ({ ...p, quantity: v }))} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8 }}>仓位%：</label>
          <InputNumber style={{ width: '100%' }} value={orderForm.position_pct} onChange={(v) => setOrderForm(p => ({ ...p, position_pct: v }))} addonAfter="%" />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8 }}>原因：</label>
          <TextArea rows={3} value={orderForm.reason} onChange={(e) => setOrderForm(p => ({ ...p, reason: e.target.value }))} placeholder="例如：回踩20日线 + 放量" />
        </div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <label style={{ marginRight: 16 }}>是否按规则：</label>
          <Switch checked={orderForm.is_rule_followed} onChange={(v) => setOrderForm(p => ({ ...p, is_rule_followed: v }))} checkedChildren="√" unCheckedChildren="×" />
        </div>
      </Modal>

      {/* Sell Order Modal */}
      <Modal
        title="➖ 卖出"
        open={sellModal}
        onOk={() => handleOrderSubmit('sell')}
        onCancel={() => setSellModal(false)}
        okText="提交"
        cancelText="取消"
        okButtonProps={{ danger: true }}
      >
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8 }}>价格：</label>
          <InputNumber style={{ width: '100%' }} value={orderForm.price} onChange={(v) => setOrderForm(p => ({ ...p, price: v }))} addonBefore="$" />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8 }}>数量：</label>
          <InputNumber style={{ width: '100%' }} value={orderForm.quantity} onChange={(v) => setOrderForm(p => ({ ...p, quantity: v }))} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8 }}>仓位%：</label>
          <InputNumber style={{ width: '100%' }} value={orderForm.position_pct} onChange={(v) => setOrderForm(p => ({ ...p, position_pct: v }))} addonAfter="%" />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8 }}>原因：</label>
          <TextArea rows={3} value={orderForm.reason} onChange={(e) => setOrderForm(p => ({ ...p, reason: e.target.value }))} placeholder="例如：到达阻力位止盈" />
        </div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <label style={{ marginRight: 16 }}>是否按规则：</label>
          <Switch checked={orderForm.is_rule_followed} onChange={(v) => setOrderForm(p => ({ ...p, is_rule_followed: v }))} checkedChildren="√" unCheckedChildren="×" />
        </div>
      </Modal>

      {/* Score Modal */}
      <Modal
        title="编辑交易评分"
        visible={scoreModal}
        onOk={handleScoreSave}
        onCancel={() => setScoreModal(false)}
        width={500}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span>
                <span style={{ marginRight: 8 }}>🟢 1️⃣ 入场质量 Entry</span>
                <Tooltip title={<div>是否符合策略<br/>是否在合理买点<br/>是否追高</div>}>
                  <QuestionCircleOutlined style={{ color: '#999' }} />
                </Tooltip>
              </span>
              <span>{scoreForm.entry_score} / 30</span>
            </div>
            <Slider min={0} max={30} value={scoreForm.entry_score} onChange={(v) => setScoreForm({ ...scoreForm, entry_score: v })} />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span>
                <span style={{ marginRight: 8 }}>🔵 2️⃣ 市场环境 Market</span>
                <Tooltip title={<div>是否在强势市场操作<br/>是否逆势交易<br/>是否顺主线</div>}>
                  <QuestionCircleOutlined style={{ color: '#999' }} />
                </Tooltip>
              </span>
              <span>{scoreForm.market_score} / 20</span>
            </div>
            <Slider min={0} max={20} value={scoreForm.market_score} onChange={(v) => setScoreForm({ ...scoreForm, market_score: v })} />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span>
                <span style={{ marginRight: 8 }}>🟡 3️⃣ 执行纪律 Execution</span>
                <Tooltip title={<div>是否按计划买<br/>是否按计划卖<br/>是否止损<br/><br/>参考：<br/>完全执行 → 20~25<br/>部分执行 → 10~20<br/>随意操作 → 0~10</div>}>
                  <QuestionCircleOutlined style={{ color: '#999' }} />
                </Tooltip>
              </span>
              <span>{scoreForm.execution_score} / 25</span>
            </div>
            <Slider min={0} max={25} value={scoreForm.execution_score} onChange={(v) => setScoreForm({ ...scoreForm, execution_score: v })} />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span>
                <span style={{ marginRight: 8 }}>🔴 4️⃣ 风控 Risk</span>
                <Tooltip title={<div>仓位是否合理<br/>止损是否及时<br/>是否重仓赌</div>}>
                  <QuestionCircleOutlined style={{ color: '#999' }} />
                </Tooltip>
              </span>
              <span>{scoreForm.risk_score} / 15</span>
            </div>
            <Slider min={0} max={15} value={scoreForm.risk_score} onChange={(v) => setScoreForm({ ...scoreForm, risk_score: v })} />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span>
                <span style={{ marginRight: 8 }}>🟣 5️⃣ 结果 Outcome</span>
                <Tooltip title={<div>盈利/亏损<br/>盈亏比</div>}>
                  <QuestionCircleOutlined style={{ color: '#999' }} />
                </Tooltip>
              </span>
              <span>{scoreForm.outcome_score} / 10</span>
            </div>
            <Slider min={0} max={10} value={scoreForm.outcome_score} onChange={(v) => setScoreForm({ ...scoreForm, outcome_score: v })} />
          </div>
        </div>
      </Modal>

    </div>
  )
}

// Inline Statistic component for trade detail
function Statistic({ title, value, prefix, suffix, precision, className }) {
  const formatted = precision != null ? Number(value).toFixed(precision) : value
  return (
    <div>
      <div style={{ color: '#999', fontSize: 14, marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 24, fontWeight: 600 }} className={className}>
        {prefix}{formatted}{suffix}
      </div>
    </div>
  )
}

export default TradeDetail
