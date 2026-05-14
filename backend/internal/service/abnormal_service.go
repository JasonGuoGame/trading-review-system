package service

import (
	"sort"
	"strings"
	"trading-review-system/backend/internal/dto"
	"trading-review-system/backend/internal/models"
	"trading-review-system/backend/internal/repository"
)

type AbnormalService struct {
	repo      *repository.AbnormalRepository
	blacklist []string
}

func NewAbnormalService(repo *repository.AbnormalRepository, blacklist []string) *AbnormalService {
	return &AbnormalService{
		repo:      repo,
		blacklist: blacklist,
	}
}

func (s *AbnormalService) shouldFilter(name string) bool {
	for _, kw := range s.blacklist {
		if strings.Contains(name, kw) {
			return true
		}
	}
	return false
}

func (s *AbnormalService) GetAbnormalCapital(query dto.AbnormalCapitalQuery) (*dto.AbnormalCapitalResponse, error) {
	records, err := s.repo.GetAbnormalCapital(query)
	if err != nil {
		return nil, err
	}

	// 1. Group by symbol for multi-day modes
	var finalRecords []models.StkCapitalAbnormal
	if query.Days > 1 {
		recordMap := make(map[string]*models.StkCapitalAbnormal)
		for _, r := range records {
			if existing, ok := recordMap[r.Symbol]; ok {
				if r.VolRatio > existing.VolRatio {
					existing.VolRatio = r.VolRatio
				}
				existing.SurgeCount += r.SurgeCount
				if r.MaxSurgeRet > existing.MaxSurgeRet {
					existing.MaxSurgeRet = r.MaxSurgeRet
				}
				if r.TradeDate.After(existing.TradeDate) {
					existing.TradeDate = r.TradeDate
					existing.SurgeTimes = r.SurgeTimes
				}
			} else {
				copy := r
				recordMap[r.Symbol] = &copy
			}
		}
		for _, r := range recordMap {
			finalRecords = append(finalRecords, *r)
		}
	} else {
		finalRecords = records
	}

	var sumVolRatio, sumSurgeCount float64
	strongCount := 0
	sectorMap := make(map[string]*dto.SectorStat)

	for i := range finalRecords {
		// Calculate comprehensive score: vol_ratio * 0.5 + surge_count * 0.3 + max_surge_ret * 0.2
		finalRecords[i].Score = finalRecords[i].VolRatio*0.5 + float64(finalRecords[i].SurgeCount)*0.3 + finalRecords[i].MaxSurgeRet*0.2

		r := &finalRecords[i]
		sumVolRatio += r.VolRatio
		sumSurgeCount += float64(r.SurgeCount)

		if r.VolRatio > 3 && r.SurgeCount > 5 {
			strongCount++
		}

		// Aggregate by sector
		sectorStr := r.SectorName
		if sectorStr == "" {
			sectorStr = "未知"
		}
		
		sectors := strings.Split(sectorStr, " / ")
		for _, sector := range sectors {
			sector = strings.TrimSpace(sector)
			if sector == "" || s.shouldFilter(sector) {
				continue
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
	}

	// Finalize sector stats
	sectorStats := make([]dto.SectorStat, 0, len(sectorMap))
	for _, stat := range sectorMap {
		if stat.Count > 0 {
			stat.AvgVolRatio = stat.AvgVolRatio / float64(stat.Count)
		}
		sectorStats = append(sectorStats, *stat)
	}

	// Sort sector stats by count descending
	sort.Slice(sectorStats, func(i, j int) bool {
		return sectorStats[i].Count > sectorStats[j].Count
	})

	avgVol := 0.0
	avgSurge := 0.0
	if len(finalRecords) > 0 {
		avgVol = sumVolRatio / float64(len(finalRecords))
		avgSurge = sumSurgeCount / float64(len(finalRecords))
	}

	summary := dto.AbnormalCapitalSummary{
		TotalStocks:   len(finalRecords),
		StrongStocks:  strongCount,
		AvgVolRatio:   avgVol,
		AvgSurgeCount: avgSurge,
		SectorStats:   sectorStats,
	}

	// Explicitly sort in Go
	sort.Slice(finalRecords, func(i, j int) bool {
		switch query.Sort {
		case "vol_ratio":
			return finalRecords[i].VolRatio > finalRecords[j].VolRatio
		case "surge_count":
			return finalRecords[i].SurgeCount > finalRecords[j].SurgeCount
		case "max_surge_ret":
			return finalRecords[i].MaxSurgeRet > finalRecords[j].MaxSurgeRet
		case "symbol":
			return finalRecords[i].Symbol < finalRecords[j].Symbol
		default:
			return finalRecords[i].Score > finalRecords[j].Score
		}
	})

	return &dto.AbnormalCapitalResponse{
		Data:    finalRecords,
		Summary: summary,
	}, nil
}

func (s *AbnormalService) GetSectorList(tradeDate string) ([]string, error) {
	rawSectors, err := s.repo.GetSectorList(tradeDate)
	if err != nil {
		return nil, err
	}

	sectorSet := make(map[string]bool)
	for _, raw := range rawSectors {
		parts := strings.Split(raw, " / ")
		for _, p := range parts {
			p = strings.TrimSpace(p)
			if p != "" && !s.shouldFilter(p) {
				sectorSet[p] = true
			}
		}
	}

	sectors := make([]string, 0, len(sectorSet))
	for s := range sectorSet {
		sectors = append(sectors, s)
	}
	
	// Sort sectors for consistency
	for i := 0; i < len(sectors); i++ {
		for j := i + 1; j < len(sectors); j++ {
			if sectors[i] > sectors[j] {
				sectors[i], sectors[j] = sectors[j], sectors[i]
			}
		}
	}

	return sectors, nil
}
