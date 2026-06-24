package models

import (
	"time"
)

type ExitPlan struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	TradeID     uint      `gorm:"uniqueIndex;not null" json:"trade_id"`
	StopLoss       float64 `gorm:"type:decimal(12,4)" json:"stop_loss"`
	StopLossPct    float64 `gorm:"column:stop_loss_pct;type:decimal(5,2);default:0" json:"stop_loss_pct"`
	TakeProfit     float64 `gorm:"type:decimal(12,4)" json:"take_profit"`
	TakeProfitPct  float64 `gorm:"column:take_profit_pct;type:decimal(5,2);default:0" json:"take_profit_pct"`
	BatchPlan   JSON      `gorm:"type:json" json:"batch_plan"`
	CreatedAt   time.Time `json:"created_at"`
}
