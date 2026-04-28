package repository

import (
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

	if query.TradeDate != "" {
		q = q.Where("trade_date = ?", query.TradeDate)
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
	default:
		q = q.Order("vol_ratio DESC")
	}

	err := q.Find(&records).Error
	return records, err
}
