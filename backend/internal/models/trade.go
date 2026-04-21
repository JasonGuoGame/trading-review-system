package models

import (
	"time"

	"gorm.io/gorm"
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
	EntryScore      int        `gorm:"default:0" json:"entry_score"`
	MarketScore     int        `gorm:"default:0" json:"market_score"`
	ExecutionScore  int        `gorm:"default:0" json:"execution_score"`
	RiskScore       int        `gorm:"default:0" json:"risk_score"`
	OutcomeScore    int        `gorm:"default:0" json:"outcome_score"`
	TotalScore      int        `gorm:"default:0" json:"total_score"`
	Grade           string     `gorm:"size:2" json:"grade"`
	MarketCondition string     `gorm:"size:20" json:"market_condition"`
	IsSimulated     bool       `gorm:"default:false" json:"is_simulated"`
	CreatedAt       time.Time  `json:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at"`

	// Associations
	Orders        []Order        `gorm:"foreignKey:TradeID" json:"orders,omitempty"`
	EntryDecision *EntryDecision `gorm:"foreignKey:TradeID" json:"entry_decision,omitempty"`
	ExitPlan      *ExitPlan      `gorm:"foreignKey:TradeID" json:"exit_plan,omitempty"`
	Tags          []Tag          `gorm:"many2many:trade_tags" json:"tags,omitempty"`
	Review        *Review        `gorm:"foreignKey:TradeID" json:"review,omitempty"`
}

func (t *Trade) BeforeSave(tx *gorm.DB) (err error) {
	if t.EntryScore > 0 || t.MarketScore > 0 || t.ExecutionScore > 0 || t.RiskScore > 0 || t.OutcomeScore > 0 {
		t.TotalScore = t.EntryScore + t.MarketScore + t.ExecutionScore + t.RiskScore + t.OutcomeScore
		if t.TotalScore >= 90 {
			t.Grade = "S"
		} else if t.TotalScore >= 80 {
			t.Grade = "A"
		} else if t.TotalScore >= 70 {
			t.Grade = "B"
		} else if t.TotalScore >= 60 {
			t.Grade = "C"
		} else {
			t.Grade = "D"
		}
	}
	return
}
