package service

import (
	"fmt"
	"log"
	"math"

	"trading-review-system/backend/internal/dto"
	"trading-review-system/backend/internal/models"
	"trading-review-system/backend/internal/repository"
)

type ChipMonitorService struct {
	repo *repository.ChipMonitorRepository
}

func NewChipMonitorService(repo *repository.ChipMonitorRepository) *ChipMonitorService {
	return &ChipMonitorService{repo: repo}
}

// GetLatestTradeDate returns the most recent trade_date in stk_chip_factor.
func (s *ChipMonitorService) GetLatestTradeDate() (string, error) {
	return s.repo.GetLatestTradeDate()
}

func (s *ChipMonitorService) GetRadar(tradeDate string) (*dto.ChipRadarResponse, error) {
	data, err := s.repo.GetRadarData(tradeDate)
	if err != nil {
		log.Printf("[chip-monitor] GetRadarData error: %v", err)
		return nil, fmt.Errorf("雷达数据查询失败: %w", err)
	}

	return &dto.ChipRadarResponse{
		ControlDegree:   clampInt(data["control_degree"]),
		CapitalFlow:     clampInt(data["capital_flow"]),
		ChipConcentrate: clampInt(data["chip_concentrate"]),
		ProfitRatio:     clampInt(data["profit_ratio"]),
		ChipMoveUp:      clampInt(data["chip_move_up"]),
	}, nil
}

func (s *ChipMonitorService) GetAccumulation(tradeDate string) (*dto.ChipTabResponse, error) {
	rows, err := s.repo.GetAccumulationList(tradeDate)
	if err != nil {
		return nil, err
	}
	items := buildItems(rows)
	return &dto.ChipTabResponse{Stocks: items, Total: len(items)}, nil
}

func (s *ChipMonitorService) GetPeakMove(tradeDate string) (*dto.ChipTabResponse, error) {
	rows, err := s.repo.GetPeakMoveList(tradeDate)
	if err != nil {
		return nil, err
	}
	items := buildItems(rows)
	return &dto.ChipTabResponse{Stocks: items, Total: len(items)}, nil
}

func (s *ChipMonitorService) GetDivergence(tradeDate string) (*dto.ChipTabResponse, error) {
	rows, err := s.repo.GetDivergenceList(tradeDate)
	if err != nil {
		return nil, err
	}
	items := buildItems(rows)
	return &dto.ChipTabResponse{Stocks: items, Total: len(items)}, nil
}

func (s *ChipMonitorService) GetDistribution(tradeDate string) (*dto.ChipTabResponse, error) {
	rows, err := s.repo.GetDistributionList(tradeDate)
	if err != nil {
		return nil, err
	}
	items := buildItems(rows)
	return &dto.ChipTabResponse{Stocks: items, Total: len(items)}, nil
}

func (s *ChipMonitorService) SearchStock(tradeDate, query string) (*dto.ChipSearchResponse, error) {
	row, tabs, err := s.repo.SearchStock(tradeDate, query)
	if err != nil {
		return nil, fmt.Errorf("搜索失败: %w", err)
	}
	if row == nil {
		return nil, nil
	}

	items := buildItems([]models.AccumulationRow{*row})
	if len(items) == 0 {
		return nil, nil
	}

	return &dto.ChipSearchResponse{
		Stock:     items[0],
		MatchTabs: tabs,
	}, nil
}

// ============================================================
// helpers
// ============================================================

func buildItems(rows []models.AccumulationRow) []dto.ChipStockItem {
	items := make([]dto.ChipStockItem, len(rows))
	for i, r := range rows {
		score := calcResonance(r)
		items[i] = dto.ChipStockItem{
			Symbol:            r.Symbol,
			StockName:         r.StockName,
			BehaviorLabel:     r.BehaviorLabel,
			ControlDegree:     r.MainForceControlScore,
			ControlLevel:      r.ControlLevel,
			ChipScore:         r.ChipScore,
			CapitalScore:      r.CapitalScore,
			MainNetRatio:      r.MainNetRatio,
			MainNetInflow:     roundTo2(r.MainNetInflow / 1e4),
			Inflow3d:          roundTo2(r.Inflow3d / 1e4),
			Inflow5d:          roundTo2(r.Inflow5d / 1e4),
			InflowDays:        r.InflowDays,
			BuyPowerRatio:     r.BuyPowerRatio,
			SellPowerRatio:    r.SellPowerRatio,
			VolumePowerRatio:  r.VolumePowerRatio,
			ProfitRatio:       r.ProfitRatio,
			BehaviorStrength:  r.BehaviorStrength,
			PeakMovePct:       roundTo2(r.PeakMovePct * 100),
			EstimatedMainCost: r.EstimatedMainCost,
			CurrentPrice:      r.CurrentPrice,
			ChipWidth70:       r.ChipWidth70,
			CostProfitPct:     r.CostProfitPct,
			ChipResonanceScore: score,
			ResonanceRating:   calcRating(score),
		}
	}
	return items
}

func calcResonance(r models.AccumulationRow) int {
	score := float64(r.MainForceControlScore)*0.25 +
		float64(r.CapitalScore)*0.25 +
		float64(r.ChipScore)*0.20 +
		r.BehaviorStrength*0.15 +
		r.ProfitRatio*0.15
	return clampInt(score)
}

func roundTo2(v float64) float64 {
	return float64(int(v*100+0.5)) / 100
}

func calcRating(score int) string {
	if score >= 90 {
		return "★★★★★"
	} else if score >= 80 {
		return "★★★★"
	} else if score >= 70 {
		return "★★★"
	} else if score >= 60 {
		return "★★"
	}
	return "★"
}

func clampInt(v float64) int {
	if v < 0 {
		return 0
	}
	if v > 100 {
		return 100
	}
	return int(math.Round(v))
}
