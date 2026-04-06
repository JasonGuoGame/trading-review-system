package models

type TradeTag struct {
	TradeID uint `gorm:"primaryKey" json:"trade_id"`
	TagID   uint `gorm:"primaryKey" json:"tag_id"`
}
