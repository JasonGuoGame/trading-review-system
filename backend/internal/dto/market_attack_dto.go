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
