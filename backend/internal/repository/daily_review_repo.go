package repository

import (
	"encoding/json"
	"time"

	"trading-review-system/backend/internal/dto"
	"trading-review-system/backend/internal/models"

	"gorm.io/gorm"
)

type DailyReviewRepository struct {
	db *gorm.DB
}

func NewDailyReviewRepository(db *gorm.DB) *DailyReviewRepository {
	return &DailyReviewRepository{db: db}
}

func (r *DailyReviewRepository) GetByDate(date time.Time) (*models.DailyReview, error) {
	var review models.DailyReview
	// format date to YYYY-MM-DD for accurate date match if needed, but since type is DATE, exact time match at 00:00 is fine
	startOfDay := time.Date(date.Year(), date.Month(), date.Day(), 0, 0, 0, 0, date.Location())
	err := r.db.Where("date = ?", startOfDay).First(&review).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil // Not found is not an error here, just return nil
		}
		return nil, err
	}
	return &review, nil
}

func (r *DailyReviewRepository) Upsert(review *models.DailyReview) error {
	startOfDay := time.Date(review.Date.Year(), review.Date.Month(), review.Date.Day(), 0, 0, 0, 0, review.Date.Location())
	review.Date = startOfDay

	var existing models.DailyReview
	err := r.db.Where("date = ?", startOfDay).First(&existing).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return r.db.Create(review).Error
		}
		return err
	}

	review.ID = existing.ID
	return r.db.Save(review).Error
}

func (r *DailyReviewRepository) GetEmotionStats() ([]dto.EmotionStat, error) {
	var stats []dto.EmotionStat
	// fetch recent 30 days
	err := r.db.Model(&models.DailyReview{}).
		Select("DATE_FORMAT(date, '%Y-%m-%d') as date, emotion_score, total_profit").
		Order("date ASC").
		Limit(30).
		Scan(&stats).Error
	return stats, err
}

func (r *DailyReviewRepository) GetMistakeStats() ([]dto.MistakeStat, error) {
	// Since mistakes is a JSON array of strings in our model, we fetch all non-null,
	// parse them, and aggregate. Or we can do it in Go.
	var reviews []models.DailyReview
	err := r.db.Model(&models.DailyReview{}).Where("mistakes IS NOT NULL").Find(&reviews).Error
	if err != nil {
		return nil, err
	}

	mistakeStats := make(map[string]int)
	for _, review := range reviews {
		var mistakes []string
		if len(review.Mistakes) > 0 {
			// json.Unmarshal
			_ = json.Unmarshal(review.Mistakes, &mistakes)
		}
		for _, idx := range mistakes {
			mistakeStats[idx]++
		}
	}

	var stats []dto.MistakeStat
	for m, c := range mistakeStats {
		stats = append(stats, dto.MistakeStat{Mistake: m, Count: c})
	}
	// Note: We'll put the "import" at the top of file instead.
	return stats, nil
}

// Ensure interface compliance if we defined one
