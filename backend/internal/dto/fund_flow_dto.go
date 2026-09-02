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
	MarketNetInflow     float64 `json:"market_net_inflow"` // 今日全市场净流入（所有板块合计）
	MarketInflow        float64 `json:"market_inflow"`     // 今日流入板块合计（正）
	MarketOutflow       float64 `json:"market_outflow"`    // 今日流出板块合计（负）
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
	InflowRatio30d  float64 `json:"inflow_ratio_30d"` // 30日流入天数占比 %
	InflowDays30d   int     `json:"inflow_days_30d"`
	TotalDays30d    int     `json:"total_days_30d"`
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
	CapitalScore  float64 `json:"capital_score"`
	AttackScore   float64 `json:"attack_score"`
}

type SectorTrendResponse struct {
	SectorName       string              `json:"sector_name"`
	TrendDays        []SectorTrendDetail `json:"trend_days"`
	TrendSymbol      string              `json:"trend_symbol"`
	LeaderStock      string              `json:"leader_stock"`
	Suggestion       string              `json:"suggestion"`
	CumulativeInflow float64             `json:"cumulative_inflow"`
	InflowDays       int                 `json:"inflow_days"`
	TotalDays        int                 `json:"total_days"`
	LatestInflowRate float64             `json:"latest_inflow_rate"`
}
