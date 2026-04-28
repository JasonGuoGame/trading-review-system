package models

import "time"

type StkCapitalAbnormal struct {
	Symbol      string    `gorm:"primaryKey;size:20;column:symbol" json:"symbol"`
	Name        string    `gorm:"size:100;column:name" json:"name"`
	TradeDate   time.Time `gorm:"primaryKey;type:date;column:trade_date" json:"trade_date"`
	VolRatio    float64   `gorm:"type:decimal(10,2);column:vol_ratio" json:"vol_ratio"`
	SurgeCount  int       `gorm:"type:int;column:surge_count" json:"surge_count"`
	MaxSurgeRet float64   `gorm:"type:decimal(10,2);column:max_surge_ret" json:"max_surge_ret"`
	SurgeTimes  string    `gorm:"type:text;column:surge_times" json:"surge_times"`
	LastUpdate  time.Time `gorm:"type:datetime;column:last_update" json:"last_update"`
	Score       float64   `gorm:"-" json:"score"` // Dynamically calculated
}

func (StkCapitalAbnormal) TableName() string {
	return "stk_capital_abnormal"
}
