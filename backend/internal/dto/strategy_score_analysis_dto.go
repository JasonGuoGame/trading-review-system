package dto

type ScoreBinSummary struct {
	RangeLabel  string  `json:"range_label"`
	RangeStart  int     `json:"range_start"`
	RangeEnd    int     `json:"range_end"`
	AvgWinRate  float64 `json:"avg_win_rate"`
	AvgReturn   float64 `json:"avg_return"`
	TotalTrades int     `json:"total_trades"`
	Stability   float64 `json:"stability"`
	MaxReturn   float64 `json:"max_return"`
	MaxDrawdown float64 `json:"max_drawdown"`
}

type StrategyScoreHeatmapCell struct {
	TradeDate   string  `json:"trade_date"`
	BinKey      string  `json:"bin_key"`
	WinRate     float64 `json:"win_rate"`
	AvgReturn   float64 `json:"avg_return"`
	TotalTrades int     `json:"total_trades"`
}

type ScoreTrendPoint struct {
	TradeDate   string  `json:"trade_date"`
	WinRate     float64 `json:"win_rate"`
	AvgReturn   float64 `json:"avg_return"`
	MaxReturn   float64 `json:"max_return"`
	MaxDrawdown float64 `json:"max_drawdown"`
}

type StrategyStockDetail struct {
	Symbol     string  `json:"symbol"`
	StockName  string  `json:"stock_name"`
	SectorName string  `json:"sector_name"`
	Score      int64   `json:"score"`
	Status     string  `json:"status"`
	Notes      string  `json:"notes"`
	CloseToday float64 `json:"close_today"`
	OpenNext   float64 `json:"open_next"`
	CloseNext  float64 `json:"close_next"`
	IsWin      bool    `json:"is_win"`
}

type StrategyStocksResponse struct {
	StrategyName string                `json:"strategy_name"`
	TradeDate    string                `json:"trade_date"`
	BinKey       string                `json:"bin_key"`
	Stocks       []StrategyStockDetail `json:"stocks"`
}

type StrategyScoreAnalysisResponse struct {
	StrategyName string                         `json:"strategy_name"`
	BestBin      *ScoreBinSummary               `json:"best_bin"`
	Bins         []ScoreBinSummary              `json:"bins"`
	Heatmap      []StrategyScoreHeatmapCell     `json:"heatmap"`
	BinTrends    map[string][]ScoreTrendPoint   `json:"bin_trends"`
	Dates        []string                       `json:"dates"`
	BinLabels    []string                       `json:"bin_labels"`
	Advancers    map[string]int                 `json:"advancers"`
}

type StatusHeatmapCell struct {
	TradeDate   string  `json:"trade_date"`
	Status      string  `json:"status"`
	WinRate     float64 `json:"win_rate"`
	TotalTrades int     `json:"total_trades"`
}

type StatusHeatmapResponse struct {
	StrategyName string             `json:"strategy_name"`
	Dates        []string           `json:"dates"`
	Statuses     []string           `json:"statuses"`
	Heatmap      []StatusHeatmapCell `json:"heatmap"`
}

type ModeRankingItem struct {
	Status            string  `json:"status"`
	TotalTrades       int     `json:"total_trades"`
	WinRate           float64 `json:"win_rate"`
	BestScoreRange    string  `json:"best_score_range"`
	BestScoreWinRate  float64 `json:"best_score_win_rate"`
	BestScoreTrades   int     `json:"best_score_trades"`
}

type ModeRankingResponse struct {
	StrategyName string            `json:"strategy_name"`
	Items        []ModeRankingItem `json:"items"`
}

type StatusScoreTrendPoint struct {
	TradeDate string  `json:"trade_date"`
	WinRate   float64 `json:"win_rate"`
	AvgReturn float64 `json:"avg_return"`
	Total     int     `json:"total"`
}

type StatusScoreTrendResponse struct {
	StrategyName  string                 `json:"strategy_name"`
	Status        string                 `json:"status"`
	ScoreRange    string                 `json:"score_range"`
	Trend         []StatusScoreTrendPoint `json:"trend"`
}
