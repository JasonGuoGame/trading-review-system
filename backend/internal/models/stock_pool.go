package models

import (
	"time"
)

type StockPoolType string

const (
	StockPoolTypeShort StockPoolType = "short"
	StockPoolTypeLong  StockPoolType = "long"
)

type StockPool struct {
	ID         uint          `gorm:"primaryKey" json:"id"`
	Symbol     string        `gorm:"size:20;index" json:"symbol"`
	StockName  string        `gorm:"size:100" json:"stock_name"`
	PoolType   StockPoolType `gorm:"type:enum('short','long');default:'short'" json:"pool_type"`
	SectorName string        `gorm:"size:100" json:"sector_name"`
	Score      int           `json:"score"`
	Status     string        `gorm:"size:50" json:"status"`
	Tags       string        `gorm:"type:json" json:"tags"` // JSON string
	Notes      string        `gorm:"type:text" json:"notes"`
	CreatedAt  time.Time     `json:"created_at"`
	UpdatedAt  time.Time     `json:"updated_at"`
}

type StockPoolSignal struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	Symbol      string    `gorm:"size:20;index" json:"symbol"`
	SignalType  string    `gorm:"size:50" json:"signal_type"`
	SignalValue string    `gorm:"size:100" json:"signal_value"`
	SignalScore int       `json:"signal_score"`
	TradeDate   time.Time `gorm:"type:date" json:"trade_date"`
}
