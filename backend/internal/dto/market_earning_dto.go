package dto

type RadarEntry struct {
	Name  string `json:"name"`
	Key   string `json:"key"`
	Score int    `json:"score"`
}

type MarketEarningEffectResponse struct {
	TradeDate   string       `json:"trade_date"`
	MarketStyle string       `json:"market_style"`
	Radar       []RadarEntry `json:"radar"`
}
