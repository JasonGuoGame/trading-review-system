package dto

// IntradayTurnoverMark is one hour-mark comparison of cumulative intraday turnover
// (成交额环比) between the selected date and the previous trading day.
// Only marks up to the latest available minute are returned.
type IntradayTurnoverMark struct {
	Mark   string  `json:"mark"`   // 整点时刻，如 "10:00"
	Today  float64 `json:"today"`  // 截至该时刻的累计成交额（亿）
	Prev   float64 `json:"prev"`   // 上一交易日同时刻累计成交额（亿）
	Change float64 `json:"change"` // 环比 %
}
