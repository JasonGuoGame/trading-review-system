package repository

import (
	"trading-review-system/backend/internal/models"

	"gorm.io/gorm"
)

type ReviewRepository struct {
	db *gorm.DB
}

func NewReviewRepository(db *gorm.DB) *ReviewRepository {
	return &ReviewRepository{db: db}
}

func (r *ReviewRepository) Upsert(review *models.Review) error {
	var existing models.Review
	err := r.db.Where("trade_id = ?", review.TradeID).First(&existing).Error
	if err == gorm.ErrRecordNotFound {
		return r.db.Create(review).Error
	}
	if err != nil {
		return err
	}
	existing.DidRight = review.DidRight
	existing.Mistakes = review.Mistakes
	existing.Improvements = review.Improvements
	existing.Replay = review.Replay
	return r.db.Save(&existing).Error
}

func (r *ReviewRepository) FindByTradeID(tradeID uint) (*models.Review, error) {
	var review models.Review
	err := r.db.Where("trade_id = ?", tradeID).First(&review).Error
	if err != nil {
		return nil, err
	}
	return &review, nil
}
