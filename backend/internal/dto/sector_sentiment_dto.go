package dto

// ============================================================
// 1. 连强信号 — Consistent Strength
// ============================================================

// ConsistentStrengthItem represents a sector that appeared in top-N ranks
// for 3+ days over the past 7 trading days.
type ConsistentStrengthItem struct {
	SectorName string `json:"sector_name"`
	StrongDays int    `json:"strong_days"` // count of days in top 5
	// recent_ranks: rank_pos for last 5 trading days (index 0 = oldest, 4 = newest)
	RecentRanks []*int `json:"recent_ranks"`
}

// ============================================================
// 2. 新面孔信号 — New Faces
// ============================================================

// NewFaceItem represents a sector that jumped from rank>30 to top 5 today.
type NewFaceItem struct {
	SectorName     string `json:"sector_name"`
	TodayRank      int    `json:"today_rank"`
	YesterdayRank  int    `json:"yesterday_rank"`
	RankJump       int    `json:"rank_jump"` // yesterday_rank - today_rank (positive = jumped up)
}

// ============================================================
// 3. 冰点回升信号 — Ice Recovery
// ============================================================

// IceRecoveryItem represents a sector where today's red_rate >= 80
// but the max red_rate over the previous 5 days was < 25.
type IceRecoveryItem struct {
	SectorName    string    `json:"sector_name"`
	RedRate       float64   `json:"red_rate"`
	Prev5dMax     float64   `json:"prev_5d_max"` // max red_rate in the previous 5 days
	Prev5dRates   []float64 `json:"prev_5d_rates"` // red_rate for each of the last 5 days (oldest first)
}

// ============================================================
// 4. 背离信号 — Divergence / Sentiment Scale
// ============================================================

// DivergenceTrendPoint is one day's divergence summary.
type DivergenceTrendPoint struct {
	TradeDate        string  `json:"trade_date"`
	BroadAvgRate     float64 `json:"broad_avg_rate"`     // avg red_rate across broad-type sectors
	IndustryAvgRate  float64 `json:"industry_avg_rate"`  // avg red_rate across industry-type sectors
	IndustryMedRate  float64 `json:"industry_med_rate"`  // median red_rate across industry-type sectors
	HotSectorsCount  int     `json:"hot_sectors_count"`  // count of industry sectors with red_rate >= 80
	TotalSectors     int     `json:"total_sectors"`      // total industry sectors that day
	MarketHeatPct    float64 `json:"market_heat_pct"`    // (hot_sectors / total) * 100
}

// DivergenceResponse is the full divergence signal response.
type DivergenceResponse struct {
	Trend        []DivergenceTrendPoint `json:"trend"`
	LatestStatus *DivergenceTrendPoint  `json:"latest_status"`
	Warning      string                 `json:"warning"` // 风险提示: "healthy" / "fake_prosperity" / "undercurrent"
}

// ============================================================
// 5. 资金抱团度 — Capital Concentration
// ============================================================

// ConcentrationItem is a large sector (>=20 stocks) with red_rate >= 85.
type ConcentrationItem struct {
	SectorName  string  `json:"sector_name"`
	RedRate     float64 `json:"red_rate"`
	TotalStocks int     `json:"total_stocks"`
}

// ============================================================
// Aggregated response for the full page
// ============================================================

// SectorSentimentFullResponse combines all signals.
type SectorSentimentFullResponse struct {
	TradeDate        string                    `json:"trade_date"`
	ConsistentStrength []ConsistentStrengthItem `json:"consistent_strength"`
	NewFaces           []NewFaceItem            `json:"new_faces"`
	IceRecovery        []IceRecoveryItem        `json:"ice_recovery"`
	Divergence         *DivergenceResponse      `json:"divergence"`
	Concentration      []ConcentrationItem      `json:"concentration"`
}
