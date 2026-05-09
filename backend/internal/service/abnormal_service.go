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

	// Sector aggregation
	sectorMap := make(map[string]*dto.SectorStat)

	for _, r := range records {
		sumVolRatio += r.VolRatio
		sumSurgeCount += float64(r.SurgeCount)

		if r.VolRatio > 3 && r.SurgeCount > 5 {
			strongCount++
		}

		// Aggregate by sector
		sector := r.SectorName
		if sector == "" {
			sector = "未知"
		}
		stat, ok := sectorMap[sector]
		if !ok {
			stat = &dto.SectorStat{SectorName: sector}
			sectorMap[sector] = stat
		}
		stat.Count++
		stat.AvgVolRatio += r.VolRatio
		if r.VolRatio > 3 && r.SurgeCount > 5 {
			stat.StrongCount++
		}
	}

	// Finalize sector stats: compute averages and collect into slice
	sectorStats := make([]dto.SectorStat, 0, len(sectorMap))
	for _, stat := range sectorMap {
		if stat.Count > 0 {
			stat.AvgVolRatio = stat.AvgVolRatio / float64(stat.Count)
		}
		sectorStats = append(sectorStats, *stat)
	}

	// Sort sector stats by count descending
	for i := 0; i < len(sectorStats); i++ {
		for j := i + 1; j < len(sectorStats); j++ {
			if sectorStats[j].Count > sectorStats[i].Count {
				sectorStats[i], sectorStats[j] = sectorStats[j], sectorStats[i]
			}
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
		SectorStats:   sectorStats,
	}

	return &dto.AbnormalCapitalResponse{
		Data:    records,
		Summary: summary,
	}, nil
}

func (s *AbnormalService) GetSectorList(tradeDate string) ([]string, error) {
	return s.repo.GetSectorList(tradeDate)
}
