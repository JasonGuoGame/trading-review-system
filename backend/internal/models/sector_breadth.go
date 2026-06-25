package models

import "time"

// StkSectorBreadth maps to stk_sector_breadths in the main trading_review database.
type StkSectorBreadth struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	TradeDate   time.Time `gorm:"column:trade_date;type:date;not null" json:"trade_date"`
	SectorName  string    `gorm:"column:sector_name;size:64;not null" json:"sector_name"`
	SectorType  string    `gorm:"column:sector_type;size:16;not null" json:"sector_type"` // broad / industry
	RedRate     float64   `gorm:"column:red_rate;type:decimal(5,2);not null" json:"red_rate"`
	Advancers   int       `gorm:"column:advancers;not null" json:"advancers"`
	TotalStocks int       `gorm:"column:total_stocks;not null" json:"total_stocks"`
	RankPos     *int      `gorm:"column:rank_pos" json:"rank_pos"`
	CreatedAt   time.Time `gorm:"column:created_at;autoCreateTime" json:"created_at"`
}

func (StkSectorBreadth) TableName() string {
	return "stk_sector_breadths"
}
