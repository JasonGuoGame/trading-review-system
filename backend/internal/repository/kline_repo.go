package repository

import (
	"time"
	"trading-review-system/backend/internal/models"

	"gorm.io/gorm"
)

type KlineRepository struct {
	db *gorm.DB
}

func NewKlineRepository(db *gorm.DB) *KlineRepository {
	return &KlineRepository{db: db}
}

// GetNextTwoKlines returns, for each symbol, the kline on or just after targetDate,
// and the very next kline after that. Used to compute T日和T+1日 prices.
func (r *KlineRepository) GetNextTwoKlines(symbols []string, targetDate time.Time) (map[string][]models.StkDailyKline, error) {
	if len(symbols) == 0 {
		return map[string][]models.StkDailyKline{}, nil
	}

	dateStr := targetDate.Format("2006-01-02")
	var rows []models.StkDailyKline
	err := r.db.
		Where("symbol IN ? AND trade_date >= ?", symbols, dateStr).
		Order("symbol ASC, trade_date ASC").
		Find(&rows).Error
	if err != nil {
		return nil, err
	}

	result := make(map[string][]models.StkDailyKline)
	for _, row := range rows {
		result[row.Symbol] = append(result[row.Symbol], row)
	}
	return result, nil
}
