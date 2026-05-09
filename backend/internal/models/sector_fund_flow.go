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
}

func (SectorFundFlow) TableName() string {
	return "stk_sector_fund_flow"
}
