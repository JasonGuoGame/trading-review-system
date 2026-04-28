package service

import (
	"trading-review-system/backend/internal/dto"
	"trading-review-system/backend/internal/repository"
)

type AbnormalService struct {
	repo *repository.AbnormalRepository
}

func NewAbnormalService(repo *repository.AbnormalRepository) *AbnormalService {
	return &AbnormalService{repo: repo}
}

func (s *AbnormalService) GetAbnormalCapital(query dto.AbnormalCapitalQuery) (*dto.AbnormalCapitalResponse, error) {
	records, err := s.repo.GetAbnormalCapital(query)
	if err != nil {
		return nil, err
	}

	var sumVolRatio, sumSurgeCount float64
	strongCount := 0

	for _, r := range records {
		sumVolRatio += r.VolRatio
		sumSurgeCount += float64(r.SurgeCount)

		if r.VolRatio > 3 && r.SurgeCount > 5 {
			strongCount++
		}
	}

	avgVol := 0.0
	avgSurge := 0.0
	if len(records) > 0 {
		avgVol = sumVolRatio / float64(len(records))
		avgSurge = sumSurgeCount / float64(len(records))
	}

	summary := dto.AbnormalCapitalSummary{
		TotalStocks:   len(records),
		StrongStocks:  strongCount,
		AvgVolRatio:   avgVol,
		AvgSurgeCount: avgSurge,
	}

	return &dto.AbnormalCapitalResponse{
		Data:    records,
		Summary: summary,
	}, nil
}
