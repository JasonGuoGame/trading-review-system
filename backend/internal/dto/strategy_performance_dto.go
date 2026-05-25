package dto

type StrategyLatest struct {
	Name              string  `json:"name"`
	WinRate           float64 `json:"win_rate"`
	AvgReturn         float64 `json:"avg_return"`
	SignalCount       int     `json:"signal_count"`
	BestReturn        float64 `json:"best_return"`
	WorstReturn       float64 `json:"worst_return"`
	Trend             string  `json:"trend"`
	Rank              int     `json:"rank"`
	BestScoreRange    string  `json:"best_score_range"`
}

type StrategyTrendPoint struct {
	TradeDate     string             `json:"trade_date"`
	Values        map[string]float64 `json:"values"`
	MarketUpCount int                `json:"market_up_count"`
	MarketPctChg  float64            `json:"market_pct_chg"`
}

type StrategyPerformanceResponse struct {
	Strategies []StrategyLatest       `json:"strategies"`
	TrendData  []StrategyTrendPoint   `json:"trend_data"`
	Commentary string                 `json:"commentary"`
}
