package service

import (
	"trading-review-system/backend/internal/dto"
	"trading-review-system/backend/internal/repository"
)

type MarketEarningService struct {
	repo *repository.MarketEarningRepository
}

func NewMarketEarningService(repo *repository.MarketEarningRepository) *MarketEarningService {
	return &MarketEarningService{repo: repo}
}

func (s *MarketEarningService) GetLatest() (*dto.MarketEarningEffectResponse, error) {
	record, err := s.repo.GetLatest()
	if err != nil {
		return nil, err
	}

	return &dto.MarketEarningEffectResponse{
		TradeDate:  record.TradeDate.Format("2006-01-02"),
		MarketStyle: record.MarketStyle,
		Radar: []dto.RadarEntry{
			{Name: "连板接力", Key: "limit_up", Score: record.LimitUpScore},
			{Name: "趋势主升", Key: "trend", Score: record.TrendScore},
			{Name: "主线共振", Key: "theme", Score: record.ThemeScore},
			{Name: "超跌低吸", Key: "low_suck", Score: record.LowSuckScore},
			{Name: "容量趋势", Key: "capacity", Score: record.CapacityScore},
			{Name: "退潮风险", Key: "loss", Score: record.LossScore},
		},
	}, nil
}
