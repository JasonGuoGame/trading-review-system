package repository

import (
	"time"

	"trading-review-system/backend/internal/models"

	"gorm.io/gorm"
)

type MarketBreadthRepository struct {
	db *gorm.DB
}

func NewMarketBreadthRepository(db *gorm.DB) *MarketBreadthRepository {
	return &MarketBreadthRepository{db: db}
}

func (r *MarketBreadthRepository) GetByDate(date time.Time) (*models.MarketBreadth, error) {
	var breadth models.MarketBreadth
	startOfDay := time.Date(date.Year(), date.Month(), date.Day(), 0, 0, 0, 0, date.Location())
	err := r.db.Where("trade_date = ?", startOfDay).First(&breadth).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &breadth, nil
}

func (r *MarketBreadthRepository) Upsert(breadth *models.MarketBreadth) error {
	startOfDay := time.Date(breadth.TradeDate.Year(), breadth.TradeDate.Month(), breadth.TradeDate.Day(), 0, 0, 0, 0, breadth.TradeDate.Location())
	breadth.TradeDate = startOfDay

	var existing models.MarketBreadth
	err := r.db.Where("trade_date = ?", startOfDay).First(&existing).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return r.db.Create(breadth).Error
		}
		return err
	}

	breadth.ID = existing.ID
	breadth.CreatedAt = existing.CreatedAt
	return r.db.Save(breadth).Error
}
