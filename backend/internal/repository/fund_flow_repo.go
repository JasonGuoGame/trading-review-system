package repository

import (
	"time"
	"trading-review-system/backend/internal/models"

	"gorm.io/gorm"
)

type FundFlowRepository struct {
	quantDb *gorm.DB // Use quant_db
}

func NewFundFlowRepository(quantDb *gorm.DB) *FundFlowRepository {
	return &FundFlowRepository{quantDb: quantDb}
}

// GetFlowsByLastNDates returns records for the last N distinct trading dates up to endDate.
func (r *FundFlowRepository) GetFlowsByLastNDates(endDate string, n int) ([]models.SectorFundFlow, error) {
	var dates []time.Time
	err := r.quantDb.Model(&models.SectorFundFlow{}).
		Where("trade_date <= ?", endDate).
		Distinct("trade_date").
		Order("trade_date DESC").
		Limit(n).
		Pluck("trade_date", &dates).Error

	if err != nil || len(dates) == 0 {
		return nil, err
	}

	var dateStrings []string
	for _, d := range dates {
		dateStrings = append(dateStrings, d.Format("2006-01-02"))
	}

	var records []models.SectorFundFlow
	err = r.quantDb.Model(&models.SectorFundFlow{}).
		Where("trade_date IN ?", dateStrings).
		Order("trade_date DESC, net_inflow_amount DESC").
		Find(&records).Error
	return records, err
}

// GetSectorTrend returns the last N days of data for a specific sector up to endDate.
func (r *FundFlowRepository) GetSectorTrend(sectorName string, endDate string, limit int) ([]models.SectorFundFlow, error) {
	var records []models.SectorFundFlow
	query := r.quantDb.Where("sector_name = ?", sectorName)
	if endDate != "" {
		query = query.Where("trade_date <= ?", endDate)
	}
	err := query.Order("trade_date DESC").Limit(limit).Find(&records).Error
	return records, err
}

// GetLatestTradeDate gets the most recent trade date in the table
func (r *FundFlowRepository) GetLatestTradeDate() (string, error) {
	var latestDate string
	err := r.quantDb.Model(&models.SectorFundFlow{}).Select("MAX(trade_date)").Scan(&latestDate).Error
	return latestDate, err
}
