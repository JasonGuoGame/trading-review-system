package models

import "time"

// StkSectorScore maps to trading_review.stk_sector_scores.
type StkSectorScore struct {
	ID              uint      `gorm:"primaryKey" json:"id"`
	TradeDate       time.Time `gorm:"column:trade_date;type:date;not null" json:"trade_date"`
	SectorName      string    `gorm:"column:sector_name;size:64;not null" json:"sector_name"`
	MoneyScore      float64   `gorm:"column:money_score;type:decimal(5,2);default:0.00" json:"money_score"`
	ProfitScore     float64   `gorm:"column:profit_score;type:decimal(5,2);default:0.00" json:"profit_score"`
	LeaderScore     float64   `gorm:"column:leader_score;type:decimal(5,2);default:0.00" json:"leader_score"`
	AttackScore     float64   `gorm:"column:attack_score;type:decimal(5,2);default:0.00" json:"attack_score"`
	ContinuityScore float64   `gorm:"column:continuity_score;type:decimal(5,2);default:0.00" json:"continuity_score"`
	TotalScore      float64   `gorm:"column:total_score;type:decimal(5,2);default:0.00" json:"total_score"`
	RankPos         *int      `gorm:"column:rank_pos" json:"rank_pos"`
	CreatedAt       time.Time `gorm:"column:created_at;autoCreateTime" json:"created_at"`
}

func (StkSectorScore) TableName() string {
	return "stk_sector_scores"
}
