package models

import (
	"time"
)

type Order struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	TradeID     uint      `gorm:"not null;index" json:"trade_id"`
	OrderType   string    `gorm:"size:10;not null" json:"order_type"` // buy / sell
	Price       float64   `gorm:"type:decimal(12,4);not null" json:"price"`
	Quantity    float64   `gorm:"type:decimal(12,4)" json:"quantity"`
	PositionPct float64   `gorm:"type:decimal(5,2)" json:"position_pct"`
	OrderDate   time.Time `json:"order_date"`
	Reason      string    `gorm:"type:text" json:"reason"`
	CreatedAt   time.Time `json:"created_at"`
}
