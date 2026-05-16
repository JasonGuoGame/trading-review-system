package models

import "time"

type StkMarketAttackLog struct {
	TradeDate       time.Time `gorm:"primaryKey;column:trade_date"`
	Symbol          string    `gorm:"primaryKey;column:symbol"`
	Name            string    `gorm:"column:name"`
	SectorName      string    `gorm:"primaryKey;column:sector_name"`
	AmountToday     float64   `gorm:"column:amount_today"`
	AmountYesterday float64   `gorm:"column:amount_yesterday"`
	PctChg          float64   `gorm:"column:pct_chg"`
	SectorNewCount  int       `gorm:"column:sector_new_count"`
	SectorNewAmount float64   `gorm:"column:sector_new_amount"`
	LastUpdate      time.Time `gorm:"column:last_update"`
	ClosePos        float64   `gorm:"column:close_pos"`
	ActionType      string    `gorm:"column:action_type"`
}

func (StkMarketAttackLog) TableName() string {
	return "stk_market_attack_log"
}
