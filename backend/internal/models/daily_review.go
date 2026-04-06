package models

import (
	"time"
)

type DailyReview struct {
	ID              uint      `gorm:"primaryKey" json:"id"`
	Date            time.Time `gorm:"type:date;uniqueIndex;not null" json:"date"`
	
	// Market
	MarketTrend     string    `gorm:"size:50" json:"market_trend"`
	MarketPhase     string    `gorm:"size:50" json:"market_phase"`
	MainTheme       string    `gorm:"size:255" json:"main_theme"`
	MoneyEffect     string    `gorm:"size:50" json:"money_effect"`

	// Trades stats
	TotalTrades     int       `json:"total_trades"`
	TotalProfit     float64   `gorm:"type:decimal(12,4)" json:"total_profit"`
	WinRate         float64   `gorm:"type:decimal(5,2)" json:"win_rate"`

	// Mistakes
	Mistakes        JSON      `gorm:"type:json" json:"mistakes"`

	// Emotion & Discipline
	EmotionScore    int       `json:"emotion_score"`
	DisciplineScore int       `json:"discipline_score"`
	EmotionNotes    string    `gorm:"type:text" json:"emotion_notes"`

	// Tomorrow Plan
	Plan            string    `gorm:"type:text" json:"plan"`
	FocusStocks     string    `gorm:"type:text" json:"focus_stocks"`
	RiskPoints      string    `gorm:"type:text" json:"risk_points"`

	CreatedAt       time.Time `json:"created_at"`
}
