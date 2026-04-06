package models

import (
	"time"
)

type Tag struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Name      string    `gorm:"size:50;not null;uniqueIndex" json:"name"`
	Category  string    `gorm:"size:30" json:"category"`
	CreatedAt time.Time `json:"created_at"`
}
