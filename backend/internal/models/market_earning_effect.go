package models

import "time"

type MarketEarningEffect struct {
	TradeDate     time.Time `gorm:"primaryKey;type:date" json:"trade_date"`
	LimitUpScore  int       `gorm:"column:limit_up_score" json:"limit_up_score"`
	TrendScore    int       `gorm:"column:trend_score" json:"trend_score"`
	ThemeScore    int       `gorm:"column:theme_score" json:"theme_score"`
	LowSuckScore  int       `gorm:"column:low_suck_score" json:"low_suck_score"`
	CapacityScore int       `gorm:"column:capacity_score" json:"capacity_score"`
	LossScore     int       `gorm:"column:loss_score" json:"loss_score"`
	MarketStyle   string    `gorm:"column:market_style;size:50" json:"market_style"`
	CreatedAt     time.Time `gorm:"column:created_at" json:"created_at"`
}

func (MarketEarningEffect) TableName() string {
	return "market_earning_effect"
}
