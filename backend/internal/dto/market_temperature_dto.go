package dto

// MarketTemperatureResponse is the full market-temperature page payload.
type MarketTemperatureResponse struct {
	TradeDate string                   `json:"trade_date"`
	Market    MarketTemperatureSummary `json:"market"`
	Trend     []MarketTemperatureTrend `json:"trend"`
	Sectors   []SectorTemperature      `json:"sectors"`
	Radar     RSIRadar                 `json:"radar"`
}

// MarketTemperatureSummary aggregates the cross-sectional RSI distribution of
// every stock on the trade date into a single "market temperature" reading.
type MarketTemperatureSummary struct {
	AvgRSI       float64           `json:"avg_rsi"`        // 市场平均 RSI
	MedianRSI    float64           `json:"median_rsi"`     // 市场中位数 RSI
	RsiGt70Pct   float64           `json:"rsi_gt70_pct"`   // RSI > 70 占比（超买）
	RsiGt50Pct   float64           `json:"rsi_gt50_pct"`   // RSI > 50 占比（强势）
	RsiLt30Pct   float64           `json:"rsi_lt30_pct"`   // RSI < 30 占比（超卖）
	Rsi30To50Pct float64           `json:"rsi_30_50_pct"`  // 30 <= RSI <= 50 占比
	Distribution []RSIDistribution `json:"distribution"`   // 4 档分布（<30 / 30-50 / 50-70 / 70-100）
	PrevGt50Pct  float64           `json:"prev_gt50_pct"`  // 昨日 RSI > 50 占比
	DiffusionPct float64           `json:"diffusion_pct"`  // 市场扩散度 = 今日 - 昨日
	Status       string            `json:"status"`         // 温度状态（🔥极热/🟠强势/…）
}

// RSIDistribution is one bucket of the RSI distribution bar.
type RSIDistribution struct {
	Label string  `json:"label"` // "<30" / "30-50" / "50-70" / "70-100"
	Pct   float64 `json:"pct"`   // 0-100
}

// MarketTemperatureTrend is one trading day's market RSI for the trend chart.
type MarketTemperatureTrend struct {
	TradeDate  string  `json:"trade_date"`
	AvgRSI     float64 `json:"avg_rsi"`
	MedianRSI  float64 `json:"median_rsi"`
}

// SectorTemperature aggregates one sector's member-stock RSI on the trade date.
type SectorTemperature struct {
	SectorName string  `json:"sector_name"`
	AvgRSI     float64 `json:"avg_rsi"`
	MedianRSI  float64 `json:"median_rsi"`
	RsiGt70Pct float64 `json:"rsi_gt70_pct"`
	RsiGt50Pct float64 `json:"rsi_gt50_pct"`
	RsiLt30Pct float64 `json:"rsi_lt30_pct"`
	StockCount int     `json:"stock_count"`
	DeltaRSI   float64 `json:"delta_rsi"` // 今日均RSI - 昨日均RSI
	Status     string  `json:"status"`
}

// RSIRadar buckets every stock's RSI into 5 temperature bands.
type RSIRadar struct {
	SuperStrong int `json:"super_strong"` // RSI >= 80
	Strong      int `json:"strong"`       // 70 <= RSI < 80
	Normal      int `json:"normal"`       // 40 <= RSI < 70
	Weak        int `json:"weak"`         // 30 <= RSI < 40
	SuperWeak   int `json:"super_weak"`   // RSI < 30
}

// SectorDrillResponse is the drill-down payload for a single sector: its 30-day
// RSI drift plus its highest-RSI member stocks.
type SectorDrillResponse struct {
	SectorName string           `json:"sector_name"`
	TradeDate  string           `json:"trade_date"`
	Trend      []SectorRSITrend `json:"trend"`
	TopStocks  []SectorTopStock `json:"top_stocks"`
}

// SectorRSITrend is one trading day's avg/median RSI for a single sector.
type SectorRSITrend struct {
	TradeDate string  `json:"trade_date"`
	AvgRSI    float64 `json:"avg_rsi"`
	MedianRSI float64 `json:"median_rsi"`
}

// SectorTopStock is one of a sector's highest-RSI member stocks.
type SectorTopStock struct {
	Symbol  string  `json:"symbol"`
	Name    string  `json:"name"`
	RSI     float64 `json:"rsi"`      // 最新交易日 RSI
	PeakRSI float64 `json:"peak_rsi"` // 30 日内 RSI 峰值
}
