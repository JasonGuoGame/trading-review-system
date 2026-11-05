package dto

// ============================================================
// ETF 全景驾驶舱 — response payloads
// ============================================================

// EtfMetaResponse carries the filter options plus the latest trade date.
type EtfMetaResponse struct {
	LatestTradeDate string   `json:"latest_trade_date"`
	EtfTypes        []string `json:"etf_types"`
	EtfSubTypes     []string `json:"etf_sub_types"`
	IndustryNames   []string `json:"industry_names"`
}

// EtfBrief is a minimal ETF row reused by observation cards and industry drilldowns.
type EtfBrief struct {
	Symbol       string  `json:"symbol"`
	Name         string  `json:"name"`
	TodayReturn  float64 `json:"today_return"`
	Ret5d        float64 `json:"ret_5d"`
	Amount       float64 `json:"amount"`
	EtfType      string  `json:"etf_type"`
	IndustryName string  `json:"industry_name"`
}

// EtfTypeDist is one bucket of the type-distribution bar.
type EtfTypeDist struct {
	EtfType string `json:"etf_type"`
	Label   string `json:"label"`
	Count   int    `json:"count"`
}

// EtfStrength is the up/flat/down distribution.
type EtfStrength struct {
	Up   int `json:"up"`
	Flat int `json:"flat"`
	Down int `json:"down"`
}

// EtfObservations holds the four 市场观察区 KPI cards.
type EtfObservations struct {
	StrongestBroad    *EtfBrief `json:"strongest_broad"`
	StrongestIndustry *EtfBrief `json:"strongest_industry"`
	WeakestIndustry   *EtfBrief `json:"weakest_industry"`
	MaxAmount         *EtfBrief `json:"max_amount"`
}

// EtfOverviewResponse is the 市场总览 payload.
type EtfOverviewResponse struct {
	TradeDate        string          `json:"trade_date"`
	TotalEtfs        int             `json:"total_etfs"`
	TodayUpCount     int             `json:"today_up_count"`
	TodayFlatCount   int             `json:"today_flat_count"`
	TodayDownCount   int             `json:"today_down_count"`
	TodayUpRatio     float64         `json:"today_up_ratio"`
	Ma20AboveCount   int             `json:"ma20_above_count"`
	Ma20Eligible     int             `json:"ma20_eligible"`
	Ma20AboveRatio   float64         `json:"ma20_above_ratio"`
	Ma60AboveCount   int             `json:"ma60_above_count"`
	Ma60Eligible     int             `json:"ma60_eligible"`
	Ma60AboveRatio   float64         `json:"ma60_above_ratio"`
	TypeDistribution []EtfTypeDist   `json:"type_distribution"`
	Strength         EtfStrength     `json:"strength_distribution"`
	Observations     EtfObservations `json:"observations"`
}

// EtfBroadItem is one of the 8 fixed broad-base representatives.
type EtfBroadItem struct {
	Symbol      string  `json:"symbol"`
	Name        string  `json:"name"`
	TodayReturn float64 `json:"today_return"`
	Ret5d       float64 `json:"ret_5d"`
	Ret20d      float64 `json:"ret_20d"`
}

// EtfTrendSeries is one broad ETF's rebased trend line.
type EtfTrendSeries struct {
	Symbol string    `json:"symbol"`
	Name   string    `json:"name"`
	Values []float64 `json:"values"`
}

// EtfSpreads holds the two style-spread indicators.
type EtfSpreads struct {
	SizeStyle   float64 `json:"size_style"`   // 大小盘强弱差 = R(中证1000,5d) - R(沪深300,5d)
	GrowthValue float64 `json:"growth_value"` // 成长价值强弱差 = R(创业板,5d) - R(上证50,5d)
}

// EtfBroadTrendResponse is the 宽基趋势 payload.
type EtfBroadTrendResponse struct {
	TradeDate  string           `json:"trade_date"`
	Etfs       []EtfBroadItem   `json:"etfs"`
	TrendDates []string         `json:"trend_dates"`
	Trend      []EtfTrendSeries `json:"trend_series"`
	Spreads    EtfSpreads       `json:"spreads"`
}

// EtfIndustry is one row of the 行业主题 table.
type EtfIndustry struct {
	IndustryName string  `json:"industry_name"`
	EtfCount     int     `json:"etf_count"`
	TodayAvg     float64 `json:"today_avg"`
	TodayMedian  float64 `json:"today_median"`
	Ret5dAvg     float64 `json:"ret_5d_avg"`
	Ret20dAvg    float64 `json:"ret_20d_avg"`
	UpRatio      float64 `json:"up_ratio"`
	Ma20Ratio    float64 `json:"ma20_ratio"`
	TotalAmount  float64 `json:"total_amount"`
}

// EtfIndustriesResponse is the 行业主题 payload.
type EtfIndustriesResponse struct {
	TradeDate  string        `json:"trade_date"`
	Industries []EtfIndustry `json:"industries"`
}

// EtfIndustryEtfsResponse lists one industry's constituent ETFs.
type EtfIndustryEtfsResponse struct {
	IndustryName string     `json:"industry_name"`
	TradeDate    string     `json:"trade_date"`
	Etfs         []EtfBrief `json:"etfs"`
}

// EtfRotationItem is one row of the 行业轮动 table.
type EtfRotationItem struct {
	IndustryName       string  `json:"industry_name"`
	TodayRank          int     `json:"today_rank"`
	YesterdayRank      int     `json:"yesterday_rank"`
	Rank5d             int     `json:"rank_5d"`
	Ret1d              float64 `json:"ret_1d"`
	Ret5d              float64 `json:"ret_5d"`
	Ret20d             float64 `json:"ret_20d"`
	ConsecutiveTopDays int     `json:"consecutive_top_days"`
	Status             string  `json:"status"`
	DailyRanks         []int   `json:"daily_ranks"`
}

// EtfRotationResponse is the 行业轮动 payload.
type EtfRotationResponse struct {
	TradeDate  string            `json:"trade_date"`
	Industries []EtfRotationItem `json:"industries"`
}

// EtfRankingItem is one row of the ETF 排行 table.
type EtfRankingItem struct {
	Symbol       string  `json:"symbol"`
	Name         string  `json:"name"`
	EtfType      string  `json:"etf_type"`
	EtfSubType   string  `json:"etf_sub_type"`
	IndustryName string  `json:"industry_name"`
	TodayReturn  float64 `json:"today_return"`
	Ret5d        float64 `json:"ret_5d"`
	Ret20d       float64 `json:"ret_20d"`
	Ma20Status   string  `json:"ma20_status"`
	Amount       float64 `json:"amount"`
}

// EtfRankingResponse is the ETF 排行 payload.
type EtfRankingResponse struct {
	TradeDate string           `json:"trade_date"`
	Total     int              `json:"total"`
	Etfs      []EtfRankingItem `json:"etfs"`
}

// EtfKlinePoint is one enriched daily bar for the detail chart.
type EtfKlinePoint struct {
	TradeDate string  `json:"trade_date"`
	Open      float64 `json:"open"`
	High      float64 `json:"high"`
	Low       float64 `json:"low"`
	Close     float64 `json:"close"`
	Volume    int64   `json:"volume"`
	Amount    float64 `json:"amount"`
	Ma5       float64 `json:"ma5"`
	Ma20      float64 `json:"ma20"`
	Ma60      float64 `json:"ma60"`
	Dif       float64 `json:"dif"`
	Dea       float64 `json:"dea"`
	Macd      float64 `json:"macd"`
	Rsi14     float64 `json:"rsi14"`
}

// EtfDetailStats holds the summary stats under the detail header.
type EtfDetailStats struct {
	Ret5d       float64 `json:"ret_5d"`
	Ret20d      float64 `json:"ret_20d"`
	Ret60d      float64 `json:"ret_60d"`
	High20d     float64 `json:"high_20d"`
	Drawdown20d float64 `json:"drawdown_20d"`
	Ma20Status  string  `json:"ma20_status"`
	Ma60Status  string  `json:"ma60_status"`
}

// EtfDetailResponse is the ETF 详情 payload.
type EtfDetailResponse struct {
	Symbol       string          `json:"symbol"`
	Name         string          `json:"name"`
	EtfType      string          `json:"etf_type"`
	EtfSubType   string          `json:"etf_sub_type"`
	IndustryName string          `json:"industry_name"`
	Exchange     string          `json:"exchange"`
	LatestClose  float64         `json:"latest_close"`
	TodayReturn  float64         `json:"today_return"`
	Amount       float64         `json:"amount"`
	Stats        EtfDetailStats  `json:"stats"`
	Klines       []EtfKlinePoint `json:"klines"`
}
