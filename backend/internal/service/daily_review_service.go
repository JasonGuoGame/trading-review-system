package service

import (
	"time"

	"trading-review-system/backend/internal/models"
	"trading-review-system/backend/internal/repository"
)

type DailyReviewService struct {
	repo *repository.DailyReviewRepository
}

func NewDailyReviewService(repo *repository.DailyReviewRepository) *DailyReviewService {
	return &DailyReviewService{repo: repo}
}

func (s *DailyReviewService) GetByDate(date time.Time) (*models.DailyReview, error) {
	return s.repo.GetByDate(date)
}

func (s *DailyReviewService) Upsert(review *models.DailyReview) error {
	return s.repo.Upsert(review)
}
