package models

import (
	"time"
)

type MarketBreadth struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	TradeDate    time.Time `gorm:"type:date;uniqueIndex;not null" json:"trade_date"`
	TotalStocks  int       `json:"total_stocks"`
	Advancers    int       `json:"advancers"`
	Decliners    int       `json:"decliners"`
	Flat         int       `json:"flat"`
	LimitUp      int       `json:"limit_up"`
	LimitDown    int       `json:"limit_down"`
	CreatedAt    time.Time `json:"created_at"`
}
