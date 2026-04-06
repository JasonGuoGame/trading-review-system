package dto

// --- Dashboard DTOs ---

type DashboardSummary struct {
	TotalPnl    float64 `json:"total_pnl"`
	WinRate     float64 `json:"win_rate"`
	MaxDrawdown float64 `json:"max_drawdown"`
	TradeCount  int64   `json:"trade_count"`
	WinCount    int64   `json:"win_count"`
	LossCount   int64   `json:"loss_count"`
}

type EquityCurvePoint struct {
	Date       string  `json:"date"`
	CumulativePnl float64 `json:"cumulative_pnl"`
}

type WinRatePoint struct {
	Date    string  `json:"date"`
	WinRate float64 `json:"win_rate"`
}

type ScoreDistribution struct {
	Score string `json:"score"`
	Count int64  `json:"count"`
}

type WinRateResponse struct {
	Trend        []WinRatePoint      `json:"trend"`
	Distribution []ScoreDistribution `json:"distribution"`
}
