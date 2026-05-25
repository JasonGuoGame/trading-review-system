package models

import "time"

type StrategyScoreAnalysis struct {
	TradeDate       time.Time `gorm:"primaryKey;type:date" json:"trade_date"`
	StrategyName    string    `gorm:"primaryKey;size:100" json:"strategy_name"`
	ScoreRangeStart int       `gorm:"primaryKey;column:score_range_start" json:"score_range_start"`
	ScoreRangeEnd   int       `gorm:"primaryKey;column:score_range_end" json:"score_range_end"`
	TotalTrades     int       `gorm:"column:total_trades" json:"total_trades"`
	WinRate         float64   `gorm:"column:win_rate;type:decimal(10,2)" json:"win_rate"`
	AvgReturn       float64   `gorm:"column:avg_return;type:decimal(10,2)" json:"avg_return"`
	MaxReturn       float64   `gorm:"column:max_return;type:decimal(10,2)" json:"max_return"`
	MaxDrawdown     float64   `gorm:"column:max_drawdown;type:decimal(10,2)" json:"max_drawdown"`
}

func (StrategyScoreAnalysis) TableName() string {
	return "strategy_score_analysis"
}
