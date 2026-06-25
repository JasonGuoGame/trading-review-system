package dto

// ChipRadarResponse holds the 5 radar dimensions
type ChipRadarResponse struct {
	ControlDegree int     `json:"控盘度"`   // main_force_control_score avg
	CapitalFlow   int     `json:"资金流"`    // capital_score avg
	ChipConcentrate int   `json:"筹码集中"`  // 100 - chip_width70*100 avg
	ProfitRatio   int     `json:"获利盘"`    // profit_ratio avg
	ChipMoveUp    int     `json:"筹码上移"`   // peak_move_pct scaled
}

// ChipStockItem is a single row in any chip monitor tab
type ChipStockItem struct {
	Symbol            string  `json:"symbol"`
	StockName         string  `json:"stock_name"`
	BehaviorLabel     string  `json:"behavior_label"`       // behavior_label
	ControlDegree     int     `json:"control_degree"`       // main_force_control_score
	ControlLevel      string  `json:"control_level"`        // control_level
	ChipScore         int     `json:"chip_score"`           // chip_score
	CapitalScore      int     `json:"capital_score"`        // capital_score
	MainNetRatio      float64 `json:"main_net_ratio"`       // fund flow
	MainNetInflow     float64 `json:"main_net_inflow"`      // main_net_inflow (亿元)
	Inflow3d          float64 `json:"inflow_3d"`            // inflow_3d (亿元)
	Inflow5d          float64 `json:"inflow_5d"`            // inflow_5d (亿元)
	InflowDays        int     `json:"inflow_days"`          // inflow_days
	BuyPowerRatio     float64 `json:"buy_power_ratio"`      // buy_power_ratio
	SellPowerRatio    float64 `json:"sell_power_ratio"`     // sell_power_ratio
	VolumePowerRatio  float64 `json:"volume_power_ratio"`   // volume_power_ratio
	ProfitRatio       float64 `json:"profit_ratio"`         // profit_ratio
	BehaviorStrength  float64 `json:"behavior_strength"`    // behavior_strength
	ChipPeakPrice     float64 `json:"chip_peak_price"`      // chip_peak_price
	PeakMovePct       float64 `json:"peak_move_pct"`        // peak_move_pct
	EstimatedMainCost float64 `json:"estimated_main_cost"`  // estimated_main_cost
	CurrentPrice      float64 `json:"current_price"`        // current_price
	ChipWidth70       float64 `json:"chip_width70"`         // chip_width70
	CostProfitPct     float64 `json:"cost_profit_pct"`      // cost_profit_pct
	ChipResonanceScore int   `json:"chip_resonance_score"`  // computed score
	ResonanceRating   string  `json:"resonance_rating"`     // star rating
}

// ChipTabResponse wraps results for a single tab
type ChipTabResponse struct {
	Stocks []ChipStockItem `json:"stocks"`
	Total  int             `json:"total"`
}

// ChipSearchResponse is returned by the stock search endpoint.
type ChipSearchResponse struct {
	Stock     ChipStockItem `json:"stock"`
	MatchTabs []string      `json:"match_tabs"` // e.g. ["accumulation","peak_move"]
}
