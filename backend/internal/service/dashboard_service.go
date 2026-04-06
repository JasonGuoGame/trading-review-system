package service

import (
	"sort"

	"trading-review-system/backend/internal/dto"
	"trading-review-system/backend/internal/repository"
)

type DashboardService struct {
	repos *repository.Repositories
}

func NewDashboardService(repos *repository.Repositories) *DashboardService {
	return &DashboardService{repos: repos}
}

func (s *DashboardService) GetSummary() (*dto.DashboardSummary, error) {
	return s.repos.Trade.GetSummaryStats()
}

func (s *DashboardService) GetEquityCurve() ([]dto.EquityCurvePoint, error) {
	trades, err := s.repos.Trade.GetClosedTrades()
	if err != nil {
		return nil, err
	}

	var points []dto.EquityCurvePoint
	cumPnl := 0.0
	for _, t := range trades {
		cumPnl += t.TotalPnl
		date := ""
		if t.ExitDate != nil {
			date = t.ExitDate.Format("2006-01-02")
		} else if t.EntryDate != nil {
			date = t.EntryDate.Format("2006-01-02")
		}
		points = append(points, dto.EquityCurvePoint{
			Date:          date,
			CumulativePnl: cumPnl,
		})
	}
	return points, nil
}

func (s *DashboardService) GetWinRate() (*dto.WinRateResponse, error) {
	trades, err := s.repos.Trade.GetClosedTrades()
	if err != nil {
		return nil, err
	}

	// Compute rolling win rate
	var trend []dto.WinRatePoint
	wins := 0
	for i, t := range trades {
		if t.TotalPnl > 0 {
			wins++
		}
		rate := float64(wins) / float64(i+1) * 100
		date := ""
		if t.ExitDate != nil {
			date = t.ExitDate.Format("2006-01-02")
		}
		trend = append(trend, dto.WinRatePoint{
			Date:    date,
			WinRate: rate,
		})
	}

	// Score distribution
	distribution, err := s.repos.Trade.GetScoreDistribution()
	if err != nil {
		return nil, err
	}

	// Ensure A/B/C/D order
	sort.Slice(distribution, func(i, j int) bool {
		return distribution[i].Score < distribution[j].Score
	})

	return &dto.WinRateResponse{
		Trend:        trend,
		Distribution: distribution,
	}, nil
}

func (s *DashboardService) GetRecentTrades() (interface{}, error) {
	return s.repos.Trade.GetRecentTrades(5)
}
