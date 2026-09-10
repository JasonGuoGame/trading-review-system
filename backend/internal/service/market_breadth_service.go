package service

import (
	"time"

	"trading-review-system/backend/internal/dto"
	"trading-review-system/backend/internal/models"
	"trading-review-system/backend/internal/repository"
)

type MarketBreadthService struct {
	repo *repository.MarketBreadthRepository
}

func NewMarketBreadthService(repo *repository.MarketBreadthRepository) *MarketBreadthService {
	return &MarketBreadthService{repo: repo}
}

func (s *MarketBreadthService) GetByDate(date time.Time) (*models.MarketBreadth, error) {
	return s.repo.GetByDate(date)
}

func (s *MarketBreadthService) Upsert(breadth *models.MarketBreadth) error {
	return s.repo.Upsert(breadth)
}

func (s *MarketBreadthService) GetTopSectorScores(tradeDate string, limit int) ([]models.StkSectorScore, error) {
	return s.repo.GetTopSectorScores(tradeDate, limit)
}

// GetIntradayTurnover returns the cumulative intraday turnover comparison (成交额环比)
// at the 10:00 / 11:00 / 11:30 / 14:00 / 14:40 / 15:00 marks against the previous
// trading day, restricted to marks up to the latest available minute.
func (s *MarketBreadthService) GetIntradayTurnover(date string) ([]dto.IntradayTurnoverMark, error) {
	today, err := s.repo.GetIntradayCumulative(date)
	if err != nil {
		return nil, err
	}
	// 所选日期无分钟数据（周末/未来日期等），直接返回空，避免出现虚假的 -100% 环比。
	if today.LatestMinute == "" {
		return []dto.IntradayTurnoverMark{}, nil
	}

	prevDate, err := s.repo.GetPreviousMinKlineDate(date)
	if err != nil || prevDate == "" {
		return []dto.IntradayTurnoverMark{}, nil
	}
	prev, err := s.repo.GetIntradayCumulative(prevDate)
	if err != nil {
		return nil, err
	}

	marks := []struct {
		label string
		time  string
		today float64
		prev  float64
	}{
		{"10:00", "10:00", today.Cum1000, prev.Cum1000},
		{"11:00", "11:00", today.Cum1100, prev.Cum1100},
		{"11:30", "11:30", today.Cum1130, prev.Cum1130},
		{"14:00", "14:00", today.Cum1400, prev.Cum1400},
		{"14:40", "14:40", today.Cum1440, prev.Cum1440},
		{"15:00", "15:00", today.Cum1500, prev.Cum1500},
	}

	latestMinute := today.LatestMinute
	result := make([]dto.IntradayTurnoverMark, 0, len(marks))
	for _, m := range marks {
		// Only include marks whose time is at or before the latest available minute.
		if latestMinute != "" && m.time > latestMinute {
			continue
		}
		change := 0.0
		if m.prev > 0 {
			change = (m.today/m.prev - 1) * 100
		}
		result = append(result, dto.IntradayTurnoverMark{
			Mark:   m.label,
			Today:  m.today / 1e8, // 元 -> 亿
			Prev:   m.prev / 1e8,
			Change: change,
		})
	}
	return result, nil
}
