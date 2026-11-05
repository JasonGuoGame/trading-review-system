// Shared ETF cockpit formatting helpers (A-share convention: red = up, green = down).
export const UP = '#ff4d4f'
export const DOWN = '#52c41a'
export const NEUTRAL = '#8b949e'

export const pctColor = (v) => (v > 0 ? UP : v < 0 ? DOWN : NEUTRAL)

export const fmtPct = (v, digits = 2) => {
  if (v == null || Number.isNaN(v)) return '--'
  return `${v > 0 ? '+' : ''}${v.toFixed(digits)}%`
}

export const fmtPctColored = (v, digits = 2) => (
  <span style={{ color: pctColor(v), fontWeight: 600 }}>{fmtPct(v, digits)}</span>
)

export const fmtAmount = (v) => {
  if (v == null || Number.isNaN(v)) return '--'
  if (v >= 1e8) return `${(v / 1e8).toFixed(2)}亿`
  if (v >= 1e4) return `${(v / 1e4).toFixed(2)}万`
  return v.toFixed(0)
}
