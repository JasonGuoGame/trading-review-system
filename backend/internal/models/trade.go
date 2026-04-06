package models

import (
	"time"
)

type Trade struct {
	ID              uint       `gorm:"primaryKey" json:"id"`
	Symbol          string     `gorm:"size:20;not null" json:"symbol"`
	Strategy        string     `gorm:"size:50" json:"strategy"`
	SetupType       string     `gorm:"size:50" json:"setup_type"`
	Status          string     `gorm:"size:10;default:open" json:"status"` // open / closed
	Direction       string     `gorm:"size:10;default:long" json:"direction"` // long / short
	EntryDate       *time.Time `json:"entry_date"`
	ExitDate        *time.Time `json:"exit_date"`
	TotalPnl        float64    `gorm:"type:decimal(12,2);default:0" json:"total_pnl"`
	TotalPnlPct     float64    `gorm:"type:decimal(8,2);default:0" json:"total_pnl_pct"`
	MaxDrawdown     float64    `gorm:"type:decimal(8,2);default:0" json:"max_drawdown"`
	HoldingDays     int        `gorm:"default:0" json:"holding_days"`
	ExecutionScore  string     `gorm:"size:1" json:"execution_score"` // A/B/C/D
	MarketCondition string     `gorm:"size:20" json:"market_condition"`
	CreatedAt       time.Time  `json:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at"`

	// Associations
	Orders        []Order        `gorm:"foreignKey:TradeID" json:"orders,omitempty"`
	EntryDecision *EntryDecision `gorm:"foreignKey:TradeID" json:"entry_decision,omitempty"`
	ExitPlan      *ExitPlan      `gorm:"foreignKey:TradeID" json:"exit_plan,omitempty"`
	Tags          []Tag          `gorm:"many2many:trade_tags" json:"tags,omitempty"`
	Review        *Review        `gorm:"foreignKey:TradeID" json:"review,omitempty"`
}
