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

type AdvancerRecommendation struct {
	Advancers       int     `json:"advancers"`
	BucketLabel     string  `json:"bucket_label"`
	TopStrategy     string  `json:"top_strategy"`
	TopWinRate      float64 `json:"top_win_rate"`
	TopAvgReturn    float64 `json:"top_avg_return"`
	TopTotalTrades  int     `json:"top_total_trades"`
	AllRanked       []AdvancerRankedStrategy `json:"all_ranked"`
}

type AdvancerRankedStrategy struct {
	Name        string  `json:"name"`
	WinRate     float64 `json:"win_rate"`
	AvgReturn   float64 `json:"avg_return"`
	TotalTrades int     `json:"total_trades"`
}

type StrategyPerformanceResponse struct {
	Strategies     []StrategyLatest         `json:"strategies"`
	TrendData      []StrategyTrendPoint     `json:"trend_data"`
	Commentary     string                   `json:"commentary"`
	Recommendation *AdvancerRecommendation  `json:"recommendation,omitempty"`
}
