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

// GetPreviousTradeDate returns the trading date immediately before endDate.
func (r *FundFlowRepository) GetPreviousTradeDate(endDate string) (string, error) {
	var prevDate string
	err := r.quantDb.Model(&models.SectorFundFlow{}).
		Select("MAX(trade_date)").
		Where("trade_date < ?", endDate).
		Scan(&prevDate).Error
	if err != nil {
		return "", err
	}
	// Normalize to YYYY-MM-DD (MySQL may return full timestamp)
	if len(prevDate) > 10 {
		prevDate = prevDate[:10]
	}
	return prevDate, nil
}

// InflowDayStat counts inflow vs total trading days for a sector over a lookback window.
type InflowDayStat struct {
	SectorName string
	InflowDays int
	TotalDays  int
}

// GetInflowDayStats returns, for every sector, how many of the last `days` trading
// dates (up to endDate) had net inflow, plus how many of those dates the sector actually had data.
func (r *FundFlowRepository) GetInflowDayStats(endDate string, days int) (map[string]InflowDayStat, error) {
	// Normalize to YYYY-MM-DD (MySQL may return full timestamp from callers)
	if len(endDate) > 10 {
		endDate = endDate[:10]
	}
	type row struct {
		SectorName string
		InflowDays int
		TotalDays  int
	}
	var rows []row
	err := r.quantDb.Raw(`
		SELECT sector_name,
		       SUM(CASE WHEN net_inflow_amount > 0 THEN 1 ELSE 0 END) AS inflow_days,
		       COUNT(*) AS total_days
		FROM stk_sector_fund_flow
		WHERE trade_date IN (
			SELECT trade_date FROM (
				SELECT DISTINCT trade_date FROM stk_sector_fund_flow
				WHERE trade_date <= ?
				ORDER BY trade_date DESC LIMIT ?
			) AS recent_dates
		)
		GROUP BY sector_name`, endDate, days).Scan(&rows).Error
	if err != nil {
		return nil, err
	}

	stats := make(map[string]InflowDayStat, len(rows))
	for _, r := range rows {
		stats[r.SectorName] = InflowDayStat{
			SectorName: r.SectorName,
			InflowDays: r.InflowDays,
			TotalDays:  r.TotalDays,
		}
	}
	return stats, nil
}
