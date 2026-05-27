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
	Symbol       string        `gorm:"primaryKey;size:20;index" json:"symbol"`
	TradeDate    time.Time     `gorm:"primaryKey;type:date" json:"trade_date"`
	PoolType     StockPoolType `gorm:"primaryKey;type:enum('short','long');default:'short'" json:"pool_type"`
	Status       string        `gorm:"primaryKey;size:50" json:"status"`
	StockName    string        `gorm:"size:100" json:"stock_name"`
	SectorName   string        `gorm:"size:100" json:"sector_name"`
	Score        int64         `json:"score"`
	IsWatchFocus int           `gorm:"column:is_watch_focus;default:0" json:"is_watch_focus"`
	Tags         string        `gorm:"type:json" json:"tags"`
	Notes        string        `gorm:"type:text" json:"notes"`
	CreatedAt    time.Time     `json:"created_at"`
	UpdatedAt    time.Time     `json:"updated_at"`
}

type StockPoolSignal struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	Symbol      string    `gorm:"size:20;index" json:"symbol"`
	SignalType  string    `gorm:"size:50" json:"signal_type"`
	SignalValue string    `gorm:"size:100" json:"signal_value"`
	SignalScore int       `json:"signal_score"`
	TradeDate   time.Time `gorm:"type:date" json:"trade_date"`
}
