package service

import (
	"time"

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
