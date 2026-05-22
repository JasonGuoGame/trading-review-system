import { useEffect } from 'react'
import { Modal, Form, Input, Select, message } from 'antd'
import { useCreateStockPoolMutation } from '../../app/api'

const { Option } = Select

const POOL_OPTIONS = [
  { value: 'short', label: '⚡ 短线股票池' },
  { value: 'long', label: '🌊 长线股票池' },
  { value: 'macd_boll', label: '📈 0轴金叉资金共振' },
  { value: 'trend_following', label: '📈 MACD+BOLL' },
  { value: 'turnover_vol', label: '📈 换手率+量比' },
]

export default function AddStockModal({ open, poolType, onClose, onSuccess }) {
  const [form] = Form.useForm()
  const [createStock, { isLoading }] = useCreateStockPoolMutation()

  useEffect(() => {
    if (open) {
      form.resetFields()
      form.setFieldsValue({ pool_type: poolType || 'short' })
    }
  }, [open, poolType, form])

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      await createStock(values).unwrap()
      message.success(`已添加 ${values.stock_name} (${values.symbol}) 到股票池`)
      form.resetFields()
      onSuccess()
      onClose()
    } catch (err) {
      if (err?.data?.error) {
        message.error(err.data.error)
      } else if (err?.status !== undefined) {
        // RTK Query unwrap error — ignore validation errors (already shown by form)
      }
    }
  }

  return (
    <Modal
      title="添加股票到股票池"
      open={open}
      onOk={handleSubmit}
      onCancel={onClose}
      confirmLoading={isLoading}
      okText="添加"
      cancelText="取消"
      destroyOnClose
      styles={{
        body: { padding: '20px 24px' },
      }}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{ pool_type: poolType || 'short' }}
      >
        <Form.Item
          name="symbol"
          label="股票代码"
          rules={[{ required: true, message: '请输入股票代码' }]}
        >
          <Input placeholder="例如: 600123" maxLength={20} />
        </Form.Item>

        <Form.Item
          name="stock_name"
          label="股票名称"
          rules={[{ required: true, message: '请输入股票名称' }]}
        >
          <Input placeholder="例如: 中国西电" maxLength={100} />
        </Form.Item>

        <Form.Item
          name="pool_type"
          label="股票池类型"
          rules={[{ required: true, message: '请选择股票池类型' }]}
        >
          <Select placeholder="选择股票池">
            {POOL_OPTIONS.map(opt => (
              <Option key={opt.value} value={opt.value}>{opt.label}</Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="sector_name"
          label="所属板块"
        >
          <Input placeholder="例如: 电力" maxLength={100} />
        </Form.Item>

        <Form.Item
          name="status"
          label="状态标签"
        >
          <Input placeholder="例如: 短线爆发黑马" maxLength={50} />
        </Form.Item>

        <Form.Item
          name="notes"
          label="备注"
        >
          <Input.TextArea
            placeholder="可填写入选理由、技术形态等..."
            rows={3}
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}
