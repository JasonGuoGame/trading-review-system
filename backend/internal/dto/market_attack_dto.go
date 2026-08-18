package dto

type LeaderHierarchyItem struct {
	Level  int      `json:"level"` // 5, 4, 3, 2, 1
	Stocks []string `json:"stocks"`
}

type MarketAttackTopItem struct {
	SectorName      string  `json:"sector_name"`
	NewStockCount   int     `json:"new_stock_count"`
	NewTotalAmount  float64 `json:"new_total_amount"`
	AttackScore      float64 `json:"attack_score"`
	RetreatScore     float64 `json:"retreat_score"`
	NetScore         float64 `json:"net_score"`
	LeaderStock      string  `json:"leader_stock"`
	LeaderPct        float64 `json:"leader_pct"`
	LeaderIsLimitUp  bool    `json:"leader_is_limitup"`
	Trend            string  `json:"trend"` // 启动/主升/高潮/分歧/退潮
	AttackCount      int     `json:"attack_count"`
	RetreatCount     int     `json:"retreat_count"`
	AttackAmount     float64 `json:"attack_amount"`
	RetreatAmount    float64 `json:"retreat_amount"`
	LimitUpCount     int     `json:"limit_up_count"`
	LimitDownCount   int     `json:"limit_down_count"`
	AttackRatio      float64 `json:"attack_ratio"`
}

type MarketAttackSummary struct {
	TotalNewStocks   int     `json:"total_new_stocks"`
	TopAttackSector  string  `json:"top_attack_sector"`
	MaxAttackAmount  float64 `json:"max_attack_amount"`
	ActiveSectorCount int     `json:"active_sector_count"`
}

type MarketAttackTopResponse struct {
	Summary         MarketAttackSummary    `json:"summary"`
	AttackList      []MarketAttackTopItem `json:"attack_list"`
	RetreatList     []MarketAttackTopItem `json:"retreat_list"`
	LeaderHierarchy []LeaderHierarchyItem `json:"leader_hierarchy"`
}

type AttackStockDetail struct {
	Symbol          string  `json:"symbol"`
	Name            string  `json:"name"`
	AmountYesterday float64 `json:"amount_yesterday"`
	AmountToday     float64 `json:"amount_today"`
	AmountDiff      float64 `json:"amount_diff"`
	PctChg          float64 `json:"pct_chg"`
	ClosePos        float64 `json:"close_pos"`
	ActionType      string  `json:"action_type"`
	IsLeader        bool    `json:"is_leader"`
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

// TopVolumeStock represents a single stock in the top-volume ranking.
type TopVolumeStock struct {
	Symbol       string   `json:"symbol"`
	StockName    string   `json:"stock_name"`
	SectorName   string   `json:"sector_name"`
	Concepts     []string `json:"concepts"`
	Close        float64  `json:"close"`
	Volume       int64    `json:"volume"`
	Amount       float64  `json:"amount"`
	TurnoverRate float64  `json:"turnover_rate"`
	PctChange    float64  `json:"pct_change"`
	Count30d     int      `json:"count_30d"` // appearances in top 50 over last 30 trading days
}

// TopConceptItem holds a concept name and its occurrence count.
type TopConceptItem struct {
	Name  string `json:"name"`
	Count int    `json:"count"`
}

// TopVolumeResponse is the API response for top-volume stocks.
type TopVolumeResponse struct {
	TradeDate    string           `json:"trade_date"`
	Stocks       []TopVolumeStock `json:"stocks"`
	TopConcepts  []TopConceptItem `json:"top_concepts"`
	TopIndustries []TopConceptItem `json:"top_industries"`
}

// LimitSectorItem holds the count of a limit event type per sector.
type LimitSectorItem struct {
	SectorName string `json:"sector_name"`
	Count      int    `json:"count"`
}

// LimitSummaryResponse is the API response for limit-up/down/broken summary.
type LimitSummaryResponse struct {
	TradeDate   string            `json:"trade_date"`
	LimitUp     []LimitSectorItem `json:"limit_up"`
	BrokenLimit []LimitSectorItem `json:"broken_limit"`
	LimitDown   []LimitSectorItem `json:"limit_down"`
}

// LimitStockItem holds a single stock with its limit event info.
type LimitStockItem struct {
	Symbol    string  `json:"symbol"`
	StockName string  `json:"stock_name"`
	Close     float64 `json:"close"`
	PctChg    float64 `json:"pct_chg"`
	EventType string  `json:"event_type"`
}

// LimitStocksResponse is the API response for stocks in a sector+event_type.
type LimitStocksResponse struct {
	TradeDate  string           `json:"trade_date"`
	SectorName string           `json:"sector_name"`
	EventType  string           `json:"event_type"`
	Stocks     []LimitStockItem `json:"stocks"`
}
