package models

import "time"

type StkDailyKline struct {
	Symbol       string    `gorm:"primaryKey;size:20;column:symbol" json:"symbol"`
	TradeDate    time.Time `gorm:"primaryKey;type:date;column:trade_date" json:"trade_date"`
	Open         float64   `gorm:"type:decimal(18,4);column:open" json:"open"`
	High         float64   `gorm:"type:decimal(18,4);column:high" json:"high"`
	Low          float64   `gorm:"type:decimal(18,4);column:low" json:"low"`
	Close        float64   `gorm:"type:decimal(18,4);column:close" json:"close"`
	Volume       int64     `gorm:"type:bigint;column:volume" json:"volume"`
	Amount       float64   `gorm:"type:decimal(20,4);column:amount" json:"amount"`
	TurnoverRate float64   `gorm:"type:decimal(10,4);column:turnover_rate" json:"turnover_rate"`
	PerFactor    float64   `gorm:"type:decimal(18,8);column:per_factor" json:"per_factor"`
}

func (StkDailyKline) TableName() string {
	return "stk_daily_kline"
}
