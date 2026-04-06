package service

import (
	"trading-review-system/backend/internal/models"
	"trading-review-system/backend/internal/repository"
)

type TagService struct {
	repo *repository.TagRepository
}

func NewTagService(repo *repository.TagRepository) *TagService {
	return &TagService{repo: repo}
}

func (s *TagService) CreateTag(name, category string) (*models.Tag, error) {
	tag := &models.Tag{
		Name:     name,
		Category: category,
	}
	if err := s.repo.Create(tag); err != nil {
		return nil, err
	}
	return tag, nil
}

func (s *TagService) GetAllTags() ([]models.Tag, error) {
	return s.repo.FindAll()
}

func (s *TagService) DeleteTag(id uint) error {
	return s.repo.Delete(id)
}
