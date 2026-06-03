package models

import "time"

type TradeChecklist struct {
	ID   uint      `gorm:"primaryKey" json:"id"`
	Date time.Time `gorm:"type:date;uniqueIndex;not null" json:"date"`

	MarketGood    bool `gorm:"default:false" json:"market_good"`
	ThemeClear    bool `gorm:"default:false" json:"theme_clear"`
	StockBreakout bool `gorm:"default:false" json:"stock_breakout"`
	IntradayGood  bool `gorm:"default:false" json:"intraday_good"`
	PositionOk    bool `gorm:"default:false" json:"position_ok"`
	StoplossSet   bool `gorm:"default:false" json:"stoploss_set"`
	NoEmotional   bool `gorm:"default:false" json:"no_emotional"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (TradeChecklist) TableName() string {
	return "trade_checklists"
}
