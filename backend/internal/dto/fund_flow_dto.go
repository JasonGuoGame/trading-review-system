package dto

type FundFlowQuery struct {
	Date string `form:"date"` // Selected date
	Mode string `form:"mode"` // 1d, 3d, 5d
	Sort string `form:"sort"` // inflow, rate, trend
}

type MarketFlowSummary struct {
	InflowSectorCount   int     `json:"inflow_sector_count"`
	OutflowSectorCount  int     `json:"outflow_sector_count"`
	TotalNetInflow      float64 `json:"total_net_inflow"`
	TotalNetOutflow     float64 `json:"total_net_outflow"`
	StrongestMainSector string  `json:"strongest_main_sector"`
}

type SectorFlowItem struct {
	Rank            int     `json:"rank"`
	SectorName      string  `json:"sector_name"`
	TotalNetInflow  float64 `json:"total_net_inflow"`
	TodayInflowRate float64 `json:"today_inflow_rate"`
	Trend           string  `json:"trend"` // Legacy/Summary trend
	Trend3d         string  `json:"trend_3d"`
	Trend5d         string  `json:"trend_5d"`
	LeaderStock     string  `json:"leader_stock"`
}

type SectorFundFlowResponse struct {
	Summary       MarketFlowSummary `json:"summary"`
	StrongSectors []SectorFlowItem  `json:"strong_sectors"`
	WeakSectors   []SectorFlowItem  `json:"weak_sectors"`
	AllSectors    []SectorFlowItem  `json:"all_sectors"` // For heat map
}

type SectorTrendDetail struct {
	TradeDate     string  `json:"trade_date"`
	NetInflow     float64 `json:"net_inflow"`
	NetInflowRate float64 `json:"net_inflow_rate"`
}

type SectorTrendResponse struct {
	SectorName  string              `json:"sector_name"`
	TrendDays   []SectorTrendDetail `json:"trend_days"`
	TrendSymbol string              `json:"trend_symbol"`
	LeaderStock string              `json:"leader_stock"`
	Suggestion  string              `json:"suggestion"`
}
