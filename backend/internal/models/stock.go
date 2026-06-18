package models

// StkStock maps to the stocks table (basic stock info).
type StkStock struct {
	Symbol string `gorm:"primaryKey;size:20" json:"symbol"`
	Name   string `gorm:"size:50" json:"name"`
}

func (StkStock) TableName() string {
	return "stocks"
}
