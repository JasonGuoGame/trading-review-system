package repository

import (
	"time"

	"trading-review-system/backend/internal/models"

	"gorm.io/gorm"
)

type TradeChecklistRepository struct {
	db *gorm.DB
}

func NewTradeChecklistRepository(db *gorm.DB) *TradeChecklistRepository {
	return &TradeChecklistRepository{db: db}
}

func (r *TradeChecklistRepository) GetByDate(date time.Time) (*models.TradeChecklist, error) {
	var c models.TradeChecklist
	startOfDay := time.Date(date.Year(), date.Month(), date.Day(), 0, 0, 0, 0, date.Location())
	err := r.db.Where("date = ?", startOfDay).First(&c).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &c, nil
}

func (r *TradeChecklistRepository) Upsert(c *models.TradeChecklist) error {
	startOfDay := time.Date(c.Date.Year(), c.Date.Month(), c.Date.Day(), 0, 0, 0, 0, c.Date.Location())
	c.Date = startOfDay

	var existing models.TradeChecklist
	err := r.db.Where("date = ?", startOfDay).First(&existing).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return r.db.Create(c).Error
		}
		return err
	}

	c.ID = existing.ID
	c.CreatedAt = existing.CreatedAt
	return r.db.Save(c).Error
}
