package repository

import (
	"trading-review-system/backend/internal/models"

	"gorm.io/gorm"
)

type StrategyPerformanceRepository struct {
	db *gorm.DB
}

func NewStrategyPerformanceRepository(db *gorm.DB) *StrategyPerformanceRepository {
	return &StrategyPerformanceRepository{db: db}
}

func (r *StrategyPerformanceRepository) GetHistory(strategyNames []string, days int) ([]models.StrategyPerformanceHistory, error) {
	var records []models.StrategyPerformanceHistory
	query := r.db.Where("strategy_name IN ?", strategyNames).Order("trade_date ASC")
	if days > 0 {
		query = query.Limit(days * len(strategyNames))
	}
	err := query.Find(&records).Error
	return records, err
}

func (r *StrategyPerformanceRepository) GetLatest(strategyNames []string) ([]models.StrategyPerformanceHistory, error) {
	subQuery := r.db.Model(&models.StrategyPerformanceHistory{}).
		Select("MAX(trade_date)").
		Where("strategy_name IN ?", strategyNames).
		Group("strategy_name")

	var records []models.StrategyPerformanceHistory
	err := r.db.Where("strategy_name IN ? AND trade_date IN (?)", strategyNames, subQuery).
		Find(&records).Error
	return records, err
}
