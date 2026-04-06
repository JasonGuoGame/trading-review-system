package service

import (
	"encoding/json"

	"trading-review-system/backend/internal/dto"
	"trading-review-system/backend/internal/repository"
)

type AnalysisService struct {
	repos *repository.Repositories
}

func NewAnalysisService(repos *repository.Repositories) *AnalysisService {
	return &AnalysisService{repos: repos}
}

func (s *AnalysisService) GetSignalStats() ([]dto.SignalStat, error) {
	rows, err := s.repos.EntryDecision.GetSignalStats()
	if err != nil {
		return nil, err
	}

	// Parse signals JSON and aggregate stats
	signalMap := make(map[string]*dto.SignalStat)

	for _, row := range rows {
		signalsRaw, ok := row["signals"]
		if !ok {
			continue
		}

		var signals []string
		signalBytes, err := json.Marshal(signalsRaw)
		if err != nil {
			continue
		}
		if err := json.Unmarshal(signalBytes, &signals); err != nil {
			continue
		}

		pnl, _ := row["total_pnl"].(float64)

		for _, signal := range signals {
			if _, exists := signalMap[signal]; !exists {
				signalMap[signal] = &dto.SignalStat{Signal: signal}
			}
			stat := signalMap[signal]
			stat.Total++
			stat.AvgPnl += pnl
			if pnl > 0 {
				stat.Wins++
			}
		}
	}

	var stats []dto.SignalStat
	for _, stat := range signalMap {
		if stat.Total > 0 {
			stat.WinRate = float64(stat.Wins) / float64(stat.Total) * 100
			stat.AvgPnl = stat.AvgPnl / float64(stat.Total)
		}
		stats = append(stats, *stat)
	}

	return stats, nil
}

func (s *AnalysisService) GetTagStats() ([]dto.TagStat, error) {
	return s.repos.Tag.GetTagStats()
}

func (s *AnalysisService) GetMarketStats() ([]dto.MarketStat, error) {
	return s.repos.Trade.GetMarketStats()
}

func (s *AnalysisService) GetExecutionStats() ([]dto.ExecutionStat, error) {
	return s.repos.Trade.GetExecutionStats()
}
