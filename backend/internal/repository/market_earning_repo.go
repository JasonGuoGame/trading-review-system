package repository

import (
	"trading-review-system/backend/internal/models"

	"gorm.io/gorm"
)

type MarketEarningRepository struct {
	quantDb *gorm.DB
}

func NewMarketEarningRepository(quantDb *gorm.DB) *MarketEarningRepository {
	return &MarketEarningRepository{quantDb: quantDb}
}

func (r *MarketEarningRepository) GetLatest() (*models.MarketEarningEffect, error) {
	var record models.MarketEarningEffect
	err := r.quantDb.Order("trade_date DESC").First(&record).Error
	if err != nil {
		return nil, err
	}
	return &record, nil
}
