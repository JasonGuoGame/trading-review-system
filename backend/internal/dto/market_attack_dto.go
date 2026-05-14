package dto

type MarketAttackTopItem struct {
	SectorName      string  `json:"sector_name"`
	NewStockCount   int     `json:"new_stock_count"`
	NewTotalAmount  float64 `json:"new_total_amount"`
	AttackScore     float64 `json:"attack_score"`
	LeaderStock     string  `json:"leader_stock"`
	Trend           string  `json:"trend"` // Up/Down/Stable
}

type MarketAttackSummary struct {
	TotalNewStocks   int     `json:"total_new_stocks"`
	TopAttackSector  string  `json:"top_attack_sector"`
	MaxAttackAmount  float64 `json:"max_attack_amount"`
	ActiveSectorCount int     `json:"active_sector_count"`
}

type MarketAttackTopResponse struct {
	Summary MarketAttackSummary    `json:"summary"`
	TopList []MarketAttackTopItem `json:"top_list"`
}

type AttackStockDetail struct {
	Symbol          string  `json:"symbol"`
	Name            string  `json:"name"`
	AmountYesterday float64 `json:"amount_yesterday"`
	AmountToday     float64 `json:"amount_today"`
	AmountDiff      float64 `json:"amount_diff"`
	PctChg          float64 `json:"pct_chg"`
}

type SectorAttackDetail struct {
	SectorName string              `json:"sector_name"`
	Stocks     []AttackStockDetail `json:"stocks"`
}

type AttackTrendItem struct {
	TradeDate   string  `json:"trade_date"`
	AttackScore float64 `json:"attack_score"`
}

type MarketAttackTrendResponse struct {
	SectorName string            `json:"sector_name"`
	Trend      []AttackTrendItem `json:"trend"`
}
