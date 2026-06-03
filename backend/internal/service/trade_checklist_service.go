package service

import (
	"time"

	"trading-review-system/backend/internal/models"
	"trading-review-system/backend/internal/repository"
)

type TradeChecklistService struct {
	repo *repository.TradeChecklistRepository
}

func NewTradeChecklistService(repo *repository.TradeChecklistRepository) *TradeChecklistService {
	return &TradeChecklistService{repo: repo}
}

func (s *TradeChecklistService) GetByDate(date time.Time) (*models.TradeChecklist, error) {
	return s.repo.GetByDate(date)
}

func (s *TradeChecklistService) Upsert(c *models.TradeChecklist) error {
	return s.repo.Upsert(c)
}
