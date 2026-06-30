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

func (r *MarketBreadthRepository) GetAdvancersByDates(dates []string) (map[string]int, error) {
	if len(dates) == 0 {
		return map[string]int{}, nil
	}
	var rows []models.MarketBreadth
	err := r.db.Where("trade_date IN ?", dates).Find(&rows).Error
	if err != nil {
		return nil, err
	}
	result := make(map[string]int, len(rows))
	for _, row := range rows {
		result[row.TradeDate.Format("2006-01-02")] = row.Advancers
	}
	return result, nil
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

// GetTopSectorScores returns the top N sectors by total_score for a given date.
func (r *MarketBreadthRepository) GetTopSectorScores(tradeDate string, limit int) ([]models.StkSectorScore, error) {
	var scores []models.StkSectorScore
	err := r.db.Where("trade_date = ?", tradeDate).
		Order("total_score DESC").
		Limit(limit).
		Find(&scores).Error
	return scores, err
}

// GetLatestAdvancers returns the advancers count for the most recent trade_date.
func (r *MarketBreadthRepository) GetLatestAdvancers() (int, error) {
	var advancers int
	err := r.db.Model(&models.MarketBreadth{}).
		Select("advancers").
		Order("trade_date DESC").
		Limit(1).
		Scan(&advancers).Error
	return advancers, err
}
