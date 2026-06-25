package models

import "time"

type StkChipFactor struct {
	TradeDate              time.Time `gorm:"primaryKey;type:date" json:"trade_date"`
	Symbol                 string    `gorm:"primaryKey;size:20" json:"symbol"`
	ChipPeakPrice          float64   `gorm:"column:chip_peak_price;type:decimal(10,2)" json:"chip_peak_price"`
	CurrentPrice           float64   `gorm:"column:current_price;type:decimal(10,2)" json:"current_price"`
	ProfitRatio            float64   `gorm:"column:profit_ratio;type:decimal(5,2)" json:"profit_ratio"`
	Chip70Low              float64   `gorm:"column:chip70_low;type:decimal(10,2)" json:"chip70_low"`
	Chip70High             float64   `gorm:"column:chip70_high;type:decimal(10,2)" json:"chip70_high"`
	Chip90Low              float64   `gorm:"column:chip90_low;type:decimal(10,2)" json:"chip90_low"`
	Chip90High             float64   `gorm:"column:chip90_high;type:decimal(10,2)" json:"chip90_high"`
	ChipWidth70            float64   `gorm:"column:chip_width70;type:decimal(8,4)" json:"chip_width70"`
	PeakDistance           float64   `gorm:"column:peak_distance;type:decimal(8,4)" json:"peak_distance"`
	ChipScore              int       `gorm:"column:chip_score" json:"chip_score"`
	CreatedAt              time.Time `gorm:"column:created_at" json:"created_at"`
	PeakMovePct            float64   `gorm:"column:peak_move_pct;type:decimal(10,4)" json:"peak_move_pct"`
	EstimatedMainCost      float64   `gorm:"column:estimated_main_cost;type:decimal(10,2)" json:"estimated_main_cost"`
	CostProfitPct          float64   `gorm:"column:cost_profit_pct;type:decimal(10,2)" json:"cost_profit_pct"`
	MainForceControlScore  int       `gorm:"column:main_force_control_score;default:0" json:"main_force_control_score"`
	ControlLevel           string    `gorm:"column:control_level;size:20" json:"control_level"`
	CapitalControlScore    float64   `gorm:"column:capital_control_score;type:decimal(6,2)" json:"capital_control_score"`
	Behavior               int       `gorm:"column:behavior;default:0" json:"behavior"`
	BehaviorStrength       float64   `gorm:"column:behavior_strength;type:decimal(6,2)" json:"behavior_strength"`
	BehaviorLabel          string    `gorm:"column:behavior_label;size:20" json:"behavior_label"`
}

func (StkChipFactor) TableName() string {
	return "stk_chip_factor"
}

type StkStockFundFlow struct {
	TradeDate           time.Time `gorm:"primaryKey;type:date" json:"trade_date"`
	Symbol              string    `gorm:"primaryKey;size:20" json:"symbol"`
	StockName           string    `gorm:"column:stock_name;size:50" json:"stock_name"`
	MainNetInflow       float64   `gorm:"column:main_net_inflow;type:decimal(18,2)" json:"main_net_inflow"`
	SuperLargeNetInflow float64   `gorm:"column:super_large_net_inflow;type:decimal(18,2)" json:"super_large_net_inflow"`
	LargeNetInflow      float64   `gorm:"column:large_net_inflow;type:decimal(18,2)" json:"large_net_inflow"`
	MediumNetInflow     float64   `gorm:"column:medium_net_inflow;type:decimal(18,2)" json:"medium_net_inflow"`
	SmallNetInflow      float64   `gorm:"column:small_net_inflow;type:decimal(18,2)" json:"small_net_inflow"`
	MainNetRatio        float64   `gorm:"column:main_net_ratio;type:decimal(10,2)" json:"main_net_ratio"`
	SuperLargeRatio     float64   `gorm:"column:super_large_ratio;type:decimal(10,2)" json:"super_large_ratio"`
	LargeRatio          float64   `gorm:"column:large_ratio;type:decimal(10,2)" json:"large_ratio"`
	Inflow3d            float64   `gorm:"column:inflow_3d;type:decimal(18,2)" json:"inflow_3d"`
	Inflow5d            float64   `gorm:"column:inflow_5d;type:decimal(18,2)" json:"inflow_5d"`
	Inflow10d           float64   `gorm:"column:inflow_10d;type:decimal(18,2)" json:"inflow_10d"`
	InflowDays          int       `gorm:"column:inflow_days;default:0" json:"inflow_days"`
	RankMarket          int       `gorm:"column:rank_market" json:"rank_market"`
	CapitalScore        int       `gorm:"column:capital_score;default:0" json:"capital_score"`
	BuyPowerRatio       float64   `gorm:"column:buy_power_ratio;type:decimal(8,2)" json:"buy_power_ratio"`
	SellPowerRatio      float64   `gorm:"column:sell_power_ratio;type:decimal(8,2)" json:"sell_power_ratio"`
	VolumePowerRatio    float64   `gorm:"column:volume_power_ratio;type:decimal(10,2)" json:"volume_power_ratio"`
	AttackScore         int       `gorm:"column:attack_score;default:0" json:"attack_score"`
	ActiveBuyAmount     float64   `gorm:"column:active_buy_amount;type:decimal(18,2)" json:"active_buy_amount"`
}

func (StkStockFundFlow) TableName() string {
	return "stk_stock_fund_flow"
}

// AccumulationRow holds one row from the 主力吸筹榜 JOIN query.
type AccumulationRow struct {
	Symbol                string  `gorm:"column:symbol"`
	StockName             string  `gorm:"column:stock_name"`
	Behavior              int     `gorm:"column:behavior"`
	BehaviorLabel         string  `gorm:"column:behavior_label"`
	BehaviorStrength      float64 `gorm:"column:behavior_strength"`
	MainForceControlScore int     `gorm:"column:main_force_control_score"`
	ControlLevel          string  `gorm:"column:control_level"`
	ChipScore             int     `gorm:"column:chip_score"`
	ProfitRatio           float64 `gorm:"column:profit_ratio"`
	ChipPeakPrice         float64 `gorm:"column:chip_peak_price"`
	PeakMovePct           float64 `gorm:"column:peak_move_pct"`
	EstimatedMainCost     float64 `gorm:"column:estimated_main_cost"`
	CurrentPrice          float64 `gorm:"column:current_price"`
	ChipWidth70           float64 `gorm:"column:chip_width70"`
	CostProfitPct         float64 `gorm:"column:cost_profit_pct"`
	CapitalScore          int     `gorm:"column:capital_score"`
	MainNetRatio          float64 `gorm:"column:main_net_ratio"`
	MainNetInflow         float64 `gorm:"column:main_net_inflow"`
	Inflow3d              float64 `gorm:"column:inflow_3d"`
	Inflow5d              float64 `gorm:"column:inflow_5d"`
	InflowDays            int     `gorm:"column:inflow_days"`
	BuyPowerRatio         float64 `gorm:"column:buy_power_ratio"`
	SellPowerRatio        float64 `gorm:"column:sell_power_ratio"`
	VolumePowerRatio      float64 `gorm:"column:volume_power_ratio"`
}
