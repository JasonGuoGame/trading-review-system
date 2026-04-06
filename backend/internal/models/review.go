package models

import (
	"time"
)

type Review struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	TradeID      uint      `gorm:"uniqueIndex;not null" json:"trade_id"`
	DidRight     string    `gorm:"type:text" json:"did_right"`
	Mistakes     string    `gorm:"type:text" json:"mistakes"`
	Improvements string    `gorm:"type:text" json:"improvements"`
	Replay       string    `gorm:"type:text" json:"replay"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}
