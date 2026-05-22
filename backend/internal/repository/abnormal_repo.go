package repository

import (
	"time"
	"trading-review-system/backend/internal/dto"
	"trading-review-system/backend/internal/models"

	"gorm.io/gorm"
)

type AbnormalRepository struct {
	db *gorm.DB
}

func NewAbnormalRepository(db *gorm.DB) *AbnormalRepository {
	return &AbnormalRepository{db: db}
}

func (r *AbnormalRepository) GetAbnormalCapital(query dto.AbnormalCapitalQuery) ([]models.StkCapitalAbnormal, error) {
	var records []models.StkCapitalAbnormal

	q := r.db.Model(&models.StkCapitalAbnormal{})

	targetDate := query.TradeDate
	if targetDate == "" {
		var latest time.Time
		r.db.Model(&models.StkCapitalAbnormal{}).Select("MAX(trade_date)").Scan(&latest)
		if !latest.IsZero() {
			targetDate = latest.Format("2006-01-02")
		}
	}

	if targetDate != "" {
		days := query.Days
		if days <= 0 {
			days = 1
		}
		
		if days > 1 {
			var dates []time.Time
			r.db.Model(&models.StkCapitalAbnormal{}).
				Where("trade_date <= ?", targetDate).
				Distinct("trade_date").
				Order("trade_date DESC").
				Limit(days).
				Pluck("trade_date", &dates)
			
			if len(dates) > 0 {
				q = q.Where("trade_date IN ?", dates)
			} else {
				q = q.Where("trade_date = ?", targetDate)
			}
		} else {
			q = q.Where("trade_date = ?", targetDate)
		}
	}
	if query.MinVolRatio > 0 {
		q = q.Where("vol_ratio >= ?", query.MinVolRatio)
	}
	if query.MinSurgeCount > 0 {
		q = q.Where("surge_count >= ?", query.MinSurgeCount)
	}
	if query.MinSurgeRet > 0 {
		q = q.Where("max_surge_ret >= ?", query.MinSurgeRet)
	}
	if query.SectorName != "" {
		q = q.Where("sector_name LIKE ?", "%"+query.SectorName+"%")
	}
	if query.Keyword != "" {
		q = q.Where("symbol = ? OR name LIKE ?", query.Keyword, "%"+query.Keyword+"%")
	}

	q = q.Select("*, (vol_ratio * 0.5 + surge_count * 0.3 + max_surge_ret * 0.2) as score")

	switch query.Sort {
	case "vol_ratio":
		q = q.Order("vol_ratio DESC")
	case "surge_count":
		q = q.Order("surge_count DESC")
	case "max_surge_ret":
		q = q.Order("max_surge_ret DESC")
	case "score":
		q = q.Order("score DESC")
	case "symbol":
		q = q.Order("symbol ASC")
	default:
		q = q.Order("score DESC")
	}

	err := q.Find(&records).Error
	return records, err
}

// GetSectorList returns distinct sector names for a given trade date.
// If tradeDate is empty, uses the most recent date.
func (r *AbnormalRepository) GetSectorList(tradeDate string) ([]string, error) {
	var sectors []string

	q := r.db.Model(&models.StkCapitalAbnormal{})

	if tradeDate != "" {
		q = q.Where("trade_date = ?", tradeDate)
	} else {
		var latest time.Time
		r.db.Model(&models.StkCapitalAbnormal{}).Select("MAX(trade_date)").Scan(&latest)
		if !latest.IsZero() {
			latestDate := latest.Format("2006-01-02")
			q = q.Where("trade_date = ?", latestDate)
		}
	}

	err := q.Where("sector_name IS NOT NULL AND sector_name != ''").
		Distinct("sector_name").
		Order("sector_name").
		Pluck("sector_name", &sectors).Error

	return sectors, err
}
