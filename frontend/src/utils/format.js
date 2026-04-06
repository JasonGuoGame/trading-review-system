import dayjs from 'dayjs'

// Format currency
export const formatMoney = (value) => {
  if (value == null) return '--'
  const prefix = value >= 0 ? '+' : ''
  return `${prefix}$${Math.abs(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// Format percentage
export const formatPercent = (value) => {
  if (value == null) return '--'
  const prefix = value >= 0 ? '+' : ''
  return `${prefix}${value.toFixed(2)}%`
}

// Format date
export const formatDate = (date) => {
  if (!date) return '--'
  return dayjs(date).format('YYYY-MM-DD')
}

// Get PnL CSS class
export const getPnlClass = (value) => {
  if (value > 0) return 'pnl-positive'
  if (value < 0) return 'pnl-negative'
  return 'pnl-zero'
}

// Get score CSS class
export const getScoreClass = (score) => {
  return `score-${score}`
}

// Get score tag color
export const getScoreColor = (score) => {
  const colors = { A: 'green', B: 'blue', C: 'orange', D: 'red' }
  return colors[score] || 'default'
}

// Get order type color
export const getOrderColor = (type) => {
  return type === 'buy' ? '#52c41a' : '#ff4d4f'
}

// Get order type label
export const getOrderLabel = (type) => {
  return type === 'buy' ? '买入' : '卖出'
}
