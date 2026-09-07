package repository

import (
	"time"

	"trading-review-system/backend/internal/models"

	"gorm.io/gorm"
)

type MarketBreadthRepository struct {
	db      *gorm.DB
	quantDb *gorm.DB
}

func NewMarketBreadthRepository(db *gorm.DB, quantDb *gorm.DB) *MarketBreadthRepository {
	return &MarketBreadthRepository{db: db, quantDb: quantDb}
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

// MarketBreadthSnapshot holds date-level market breadth summary.
type MarketBreadthSnapshot struct {
	Advancers int
	UpRatio   float64
}

// GetBreadthSnapshots returns advancers and up_ratio for the given dates.
func (r *MarketBreadthRepository) GetBreadthSnapshots(dates []string) (map[string]MarketBreadthSnapshot, error) {
	if len(dates) == 0 {
		return map[string]MarketBreadthSnapshot{}, nil
	}
	var rows []models.MarketBreadth
	err := r.db.Where("trade_date IN ?", dates).Find(&rows).Error
	if err != nil {
		return nil, err
	}
	result := make(map[string]MarketBreadthSnapshot, len(rows))
	for _, row := range rows {
		result[row.TradeDate.Format("2006-01-02")] = MarketBreadthSnapshot{
			Advancers: row.Advancers,
			UpRatio:   row.UpRatio,
		}
	}
	return result, nil
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

// IntradayCumulative holds cumulative minute-level turnover (amount, in yuan) up to
// each hour mark, plus the latest minute present for the day.
type IntradayCumulative struct {
	Cum1000      float64 `gorm:"column:cum_1000"`
	Cum1100      float64 `gorm:"column:cum_1100"`
	Cum1130      float64 `gorm:"column:cum_1130"`
	Cum1400      float64 `gorm:"column:cum_1400"`
	Cum1500      float64 `gorm:"column:cum_1500"`
	LatestMinute string  `gorm:"column:latest_minute"`
}

// GetIntradayCumulative sums quant_db.stk_min_kline.amount for a single trade date
// at the 10:00 / 11:00 / 11:30 / 14:00 / 15:00 hour marks (each mark counts data
// before or at that time), returning cumulative turnover in yuan.
func (r *MarketBreadthRepository) GetIntradayCumulative(date string) (*IntradayCumulative, error) {
	start, err := time.ParseInLocation("2006-01-02", date, time.Local)
	if err != nil {
		return nil, err
	}
	end := start.AddDate(0, 0, 1)

	var res IntradayCumulative
	err = r.quantDb.Raw(`
		SELECT
			COALESCE(SUM(CASE WHEN TIME(trade_time) <= '10:00:00' THEN amount ELSE 0 END), 0) AS cum_1000,
			COALESCE(SUM(CASE WHEN TIME(trade_time) <= '11:00:00' THEN amount ELSE 0 END), 0) AS cum_1100,
			COALESCE(SUM(CASE WHEN TIME(trade_time) <= '11:30:00' THEN amount ELSE 0 END), 0) AS cum_1130,
			COALESCE(SUM(CASE WHEN TIME(trade_time) <= '14:00:00' THEN amount ELSE 0 END), 0) AS cum_1400,
			COALESCE(SUM(CASE WHEN TIME(trade_time) <= '15:00:00' THEN amount ELSE 0 END), 0) AS cum_1500,
			COALESCE(DATE_FORMAT(MAX(trade_time), '%H:%i'), '') AS latest_minute
		FROM stk_min_kline
		WHERE trade_time >= ? AND trade_time < ?
	`, start.Format("2006-01-02 00:00:00"), end.Format("2006-01-02 00:00:00")).Scan(&res).Error
	if err != nil {
		return nil, err
	}
	return &res, nil
}

// GetPreviousMinKlineDate returns the previous trading date (YYYY-MM-DD) before the
// given date, derived from quant_db.stk_min_kline.
func (r *MarketBreadthRepository) GetPreviousMinKlineDate(date string) (string, error) {
	start, err := time.ParseInLocation("2006-01-02", date, time.Local)
	if err != nil {
		return "", err
	}
	var prev string
	err = r.quantDb.Raw(`
		SELECT COALESCE(DATE_FORMAT(MAX(trade_time), '%Y-%m-%d'), '')
		FROM stk_min_kline
		WHERE trade_time < ?
	`, start.Format("2006-01-02 00:00:00")).Scan(&prev).Error
	if err != nil {
		return "", err
	}
	return prev, nil
}
