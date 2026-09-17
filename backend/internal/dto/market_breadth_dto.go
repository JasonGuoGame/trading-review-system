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

// RisingSectorStock is a capital-abnormal (资金异动) stock that belongs to a
// fast-rising sector.
type RisingSectorStock struct {
	Symbol      string  `json:"symbol"`
	Name        string  `json:"name"`
	VolRatio    float64 `json:"vol_ratio"`     // 日线爆量倍数
	SurgeCount  int     `json:"surge_count"`   // 分时脉冲次数
	MaxSurgeRet float64 `json:"max_surge_ret"` // 单分最大涨幅%
}

// RisingSectorWithStocks is one of the fastest-rising sectors (by rank_change in
// the latest intraday snapshot) plus the capital-abnormal stocks belonging to it.
type RisingSectorWithStocks struct {
	SectorName string              `json:"sector_name"`
	RankPos    int                 `json:"rank_pos"`
	RankChange int                 `json:"rank_change"`
	TotalScore float64             `json:"total_score"`
	Stocks     []RisingSectorStock `json:"stocks"`
}

// RisingSectorsWithSnapshot wraps the fastest-rising sectors together with the
// snapshot time (snapshot_time) they were read from, so the frontend can surface
// which intraday snapshot the ranking corresponds to.
type RisingSectorsWithSnapshot struct {
	SnapshotTime string                   `json:"snapshot_time"` // "2026-09-17 15:24:44"，历史收盘数据为空串
	Sectors      []RisingSectorWithStocks `json:"sectors"`
}
