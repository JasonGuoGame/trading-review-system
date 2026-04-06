package models

import (
	"time"
)

type ExitPlan struct {
	ID         uint      `gorm:"primaryKey" json:"id"`
	TradeID    uint      `gorm:"uniqueIndex;not null" json:"trade_id"`
	StopLoss   float64   `gorm:"type:decimal(12,4)" json:"stop_loss"`
	TakeProfit float64   `gorm:"type:decimal(12,4)" json:"take_profit"`
	BatchPlan  JSON      `gorm:"type:json" json:"batch_plan"`
	CreatedAt  time.Time `json:"created_at"`
}
