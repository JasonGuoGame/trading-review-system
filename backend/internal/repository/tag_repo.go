package repository

import (
	"trading-review-system/backend/internal/dto"
	"trading-review-system/backend/internal/models"

	"gorm.io/gorm"
)

type TagRepository struct {
	db *gorm.DB
}

func NewTagRepository(db *gorm.DB) *TagRepository {
	return &TagRepository{db: db}
}

func (r *TagRepository) Create(tag *models.Tag) error {
	return r.db.Create(tag).Error
}

func (r *TagRepository) FindAll() ([]models.Tag, error) {
	var tags []models.Tag
	err := r.db.Order("category ASC, name ASC").Find(&tags).Error
	return tags, err
}

func (r *TagRepository) FindByID(id uint) (*models.Tag, error) {
	var tag models.Tag
	err := r.db.First(&tag, id).Error
	if err != nil {
		return nil, err
	}
	return &tag, nil
}

func (r *TagRepository) Delete(id uint) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		tx.Where("tag_id = ?", id).Delete(&models.TradeTag{})
		return tx.Delete(&models.Tag{}, id).Error
	})
}

func (r *TagRepository) GetTagStats() ([]dto.TagStat, error) {
	var stats []dto.TagStat
	err := r.db.Model(&models.Tag{}).
		Joins("JOIN trade_tags ON trade_tags.tag_id = tags.id").
		Joins("JOIN trades ON trades.id = trade_tags.trade_id AND trades.status = 'closed'").
		Select(`
			tags.name as tag_name,
			tags.category,
			COUNT(*) as count,
			ROUND(SUM(trades.total_pnl), 2) as total_pnl,
			ROUND(AVG(trades.total_pnl), 2) as avg_pnl
		`).
		Group("tags.id, tags.name, tags.category").
		Order("count DESC").
		Scan(&stats).Error
	return stats, err
}
