package models

import "time"

type StrategyPerformanceHistory struct {
	TradeDate    time.Time `gorm:"primaryKey;type:date" json:"trade_date"`
	StrategyName string    `gorm:"primaryKey;size:100" json:"strategy_name"`
	SignalCount  int       `gorm:"column:signal_count" json:"signal_count"`
	AvgReturn    float64   `gorm:"column:avg_return;type:decimal(10,4)" json:"avg_return"`
	WinRate      float64   `gorm:"column:win_rate;type:decimal(10,4)" json:"win_rate"`
	BestReturn    float64   `gorm:"column:best_return;type:decimal(10,4)" json:"best_return"`
	WorstReturn   float64   `gorm:"column:worst_return;type:decimal(10,4)" json:"worst_return"`
	MarketUpCount int       `gorm:"column:market_up_count" json:"market_up_count"`
	MarketPctChg  float64   `gorm:"column:market_pct_chg;type:decimal(10,4)" json:"market_pct_chg"`
}

func (StrategyPerformanceHistory) TableName() string {
	return "strategy_performance_history"
}
