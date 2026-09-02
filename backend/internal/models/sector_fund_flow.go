package models

import "time"

// SectorFundFlow represents the daily net capital inflow/outflow of a specific market sector.
// Mapped to the quant_db table `sector_fund_flow`.
type SectorFundFlow struct {
	SectorName      string    `gorm:"primaryKey;size:100;column:sector_name" json:"sector_name"`
	TradeDate       time.Time `gorm:"primaryKey;type:date;column:trade_date" json:"trade_date"`
	NetInflowAmount float64   `gorm:"type:decimal(20,2);column:net_inflow_amount" json:"net_inflow_amount"`
	InflowRate      float64   `gorm:"type:decimal(10,2);column:net_inflow_rate" json:"inflow_rate"`
	TopStock        string    `gorm:"size:100;column:top_stock_name" json:"top_stock"`
	AvgCapitalScore float64   `gorm:"type:decimal(5,2);column:avg_capital_score" json:"avg_capital_score"`
	AvgAttackScore  float64   `gorm:"type:decimal(5,2);column:avg_attack_score" json:"avg_attack_score"`
	SectorCode      string    `gorm:"size:20;column:sector_code" json:"sector_code"`
}

func (SectorFundFlow) TableName() string {
	return "stk_sector_fund_flow"
}
