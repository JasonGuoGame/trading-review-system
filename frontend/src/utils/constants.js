// Strategy options
export const STRATEGIES = [
  '趋势跟踪',
  '均值回归',
  '突破交易',
  '动量交易',
  '波段交易',
  '日内交易',
  '事件驱动',
  '其他',
]

// Setup types
export const SETUP_TYPES = [
  '突破',
  '回调',
  '反转',
  '区间震荡',
  '缺口',
  '形态',
  '其他',
]

// Signal options
export const SIGNALS = [
  'MACD金叉',
  'MACD死叉',
  'RSI超卖',
  'RSI超买',
  '放量突破',
  '缩量回调',
  '均线金叉',
  '均线死叉',
  '布林带突破',
  'KDJ金叉',
  '形态突破',
  '支撑位反弹',
  '压力位突破',
]

// Execution scores
export const SCORES = ['A', 'B', 'C', 'D']

// Market conditions
export const MARKET_CONDITIONS = [
  '强势上涨',
  '震荡上行',
  '横盘震荡',
  '震荡下行',
  '强势下跌',
]

// Tag categories
export const TAG_CATEGORIES = [
  '策略',
  '错误',
  '心态',
  '执行',
  '市场',
  '其他',
]

// Order types
export const ORDER_TYPES = [
  { value: 'buy', label: '买入', color: '#52c41a' },
  { value: 'sell', label: '卖出', color: '#ff4d4f' },
]
