package dto

// --- Analysis DTOs ---

type SignalStat struct {
	Signal   string  `json:"signal"`
	Total    int64   `json:"total"`
	Wins     int64   `json:"wins"`
	WinRate  float64 `json:"win_rate"`
	AvgPnl   float64 `json:"avg_pnl"`
}

type TagStat struct {
	TagName  string  `json:"tag_name"`
	Category string  `json:"category"`
	Count    int64   `json:"count"`
	TotalPnl float64 `json:"total_pnl"`
	AvgPnl   float64 `json:"avg_pnl"`
}

type MarketStat struct {
	Condition string  `json:"condition"`
	Total     int64   `json:"total"`
	Wins      int64   `json:"wins"`
	WinRate   float64 `json:"win_rate"`
	TotalPnl  float64 `json:"total_pnl"`
}

type ExecutionStat struct {
	Score    string  `json:"score"`
	Total    int64   `json:"total"`
	Wins     int64   `json:"wins"`
	WinRate  float64 `json:"win_rate"`
	AvgPnl   float64 `json:"avg_pnl"`
	TotalPnl float64 `json:"total_pnl"`
}
