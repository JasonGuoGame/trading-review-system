package repository

import (
	"trading-review-system/backend/internal/models"

	"gorm.io/gorm"
)

type MarketAttackRepository struct {
	db *gorm.DB // This will be quantDb
}

func NewMarketAttackRepository(db *gorm.DB) *MarketAttackRepository {
	return &MarketAttackRepository{db: db}
}

func (r *MarketAttackRepository) GetLatestTradeDate() (string, error) {
	var latest string
	err := r.db.Model(&models.StkMarketAttackLog{}).Select("MAX(trade_date)").Scan(&latest).Error
	return latest, err
}

func (r *MarketAttackRepository) GetAttackLogs(date string) ([]models.StkMarketAttackLog, error) {
	var logs []models.StkMarketAttackLog
	err := r.db.Where("trade_date = ?", date).Find(&logs).Error
	return logs, err
}

func (r *MarketAttackRepository) GetSectorStocks(date, sectorName string) ([]models.StkMarketAttackLog, error) {
	var logs []models.StkMarketAttackLog
	err := r.db.Where("trade_date = ? AND sector_name = ?", date, sectorName).Find(&logs).Error
	return logs, err
}

func (r *MarketAttackRepository) GetHistoricalSectorStats(sectorName string, limit int) ([]models.StkMarketAttackLog, error) {
	var logs []models.StkMarketAttackLog
	// We need unique trade_date + sector_name records.
	// Since the table has symbol, we use a subquery or grouping to get the sector stats per day.
	err := r.db.Table("stk_market_attack_log").
		Select("trade_date, sector_name, MAX(sector_new_count) as sector_new_count, MAX(sector_new_amount) as sector_new_amount").
		Where("sector_name = ?", sectorName).
		Group("trade_date, sector_name").
		Order("trade_date DESC").
		Limit(limit).
		Scan(&logs).Error
	return logs, err
}
