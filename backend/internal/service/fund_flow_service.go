package service

import (
	"sort"
	"strings"
	"time"

	"trading-review-system/backend/internal/dto"
	"trading-review-system/backend/internal/models"
	"trading-review-system/backend/internal/repository"
)

type FundFlowService struct {
	repo      *repository.FundFlowRepository
	blacklist []string
}

func NewFundFlowService(repo *repository.FundFlowRepository, blacklist []string) *FundFlowService {
	return &FundFlowService{
		repo:      repo,
		blacklist: blacklist,
	}
}

func (s *FundFlowService) shouldFilter(name string) bool {
	for _, kw := range s.blacklist {
		if strings.Contains(name, kw) {
			return true
		}
	}
	return false
}

// GetFundFlowData aggregates sector fund flows for the specified mode (1d, 3d, 5d) up to the given date
func (s *FundFlowService) GetFundFlowData(query dto.FundFlowQuery) (*dto.SectorFundFlowResponse, error) {
	endDateStr := query.Date
	if endDateStr == "" {
		latest, err := s.repo.GetLatestTradeDate()
		if err == nil && latest != "" {
			endDateStr = latest[:10] // assuming 2026-05-08 format
		} else {
			endDateStr = time.Now().Format("2006-01-02")
		}
	}

	daysToLookBack := 1
	if query.Mode == "3d" {
		daysToLookBack = 3
	} else if query.Mode == "5d" {
		daysToLookBack = 5
	}

	// Always fetch 5 days for trend calculation to ensure consistency
	fetchDays := 5
	if daysToLookBack > fetchDays {
		fetchDays = daysToLookBack
	}

	records, err := s.repo.GetFlowsByLastNDates(endDateStr, fetchDays)
	if err != nil {
		return nil, err
	}

	// Group by sector
	sectorData := make(map[string][]models.SectorFundFlow)
	for _, r := range records {
		sectorData[r.SectorName] = append(sectorData[r.SectorName], r)
	}

	var allSectors []dto.SectorFlowItem
	var strongSectors []dto.SectorFlowItem
	var weakSectors []dto.SectorFlowItem

	var summary dto.MarketFlowSummary

	for name, flows := range sectorData {
		if s.shouldFilter(name) {
			continue
		}
		// flows are ordered by date DESC from repository
		sort.Slice(flows, func(i, j int) bool {
			return flows[i].TradeDate.After(flows[j].TradeDate)
		})

		if len(flows) == 0 {
			continue
		}

		todayRate := flows[0].InflowRate
		leader := flows[0].TopStock

		// Calculate total inflow based on query.Mode (daysToLookBack)
		totalInflow := 0.0
		for i := 0; i < len(flows) && i < daysToLookBack; i++ {
			totalInflow += flows[i].NetInflowAmount
		}

		// Calculate Trends using 3 and 5 days if available
		var flows3d []models.SectorFundFlow
		if len(flows) >= 3 {
			flows3d = flows[:3]
		} else {
			flows3d = flows
		}
		trend3d := calculateTrend(flows3d)
		trend5d := calculateTrend(flows) // flows has up to fetchDays (5 or more)

		item := dto.SectorFlowItem{
			SectorName:      name,
			TotalNetInflow:  totalInflow,
			TodayInflowRate: todayRate,
			LeaderStock:     leader,
			Trend:           trend3d, // Default trend shows 3d
			Trend3d:         trend3d,
			Trend5d:         trend5d,
		}
		allSectors = append(allSectors, item)

		// Aggregate summary using mode-specific totalInflow (consistent with bucketing)
		if totalInflow > 0 {
			summary.InflowSectorCount++
			summary.TotalNetInflow += totalInflow
		} else if totalInflow < 0 {
			summary.OutflowSectorCount++
			summary.TotalNetOutflow += totalInflow
		}

		// Bucket into Strong or Weak
		if totalInflow > 0 {
			strongSectors = append(strongSectors, item)
		} else if totalInflow < 0 {
			weakSectors = append(weakSectors, item)
		}
	}

	// Sorting helper
	sortFlows := func(items []dto.SectorFlowItem, sortKey string) {
		sort.Slice(items, func(i, j int) bool {
			if sortKey == "rate" {
				return items[i].TodayInflowRate > items[j].TodayInflowRate
			} else if sortKey == "trend" {
				// Count '📈' or '📉'
				c1 := strings.Count(items[i].Trend, "📈") - strings.Count(items[i].Trend, "📉")
				c2 := strings.Count(items[j].Trend, "📈") - strings.Count(items[j].Trend, "📉")
				if c1 != c2 {
					return c1 > c2
				}
				return items[i].TotalNetInflow > items[j].TotalNetInflow
			}
			return items[i].TotalNetInflow > items[j].TotalNetInflow
		})
		for idx := range items {
			items[idx].Rank = idx + 1
		}
	}

	sortFlows(allSectors, query.Sort)
	sortFlows(strongSectors, query.Sort)
	// Weak sectors: most negative at top, but respect sortKey for the ordering metric
	sort.Slice(weakSectors, func(i, j int) bool {
		if query.Sort == "rate" {
			return weakSectors[i].TodayInflowRate < weakSectors[j].TodayInflowRate
		} else if query.Sort == "trend" {
			c1 := strings.Count(weakSectors[i].Trend, "📈") - strings.Count(weakSectors[i].Trend, "📉")
			c2 := strings.Count(weakSectors[j].Trend, "📈") - strings.Count(weakSectors[j].Trend, "📉")
			if c1 != c2 {
				return c1 < c2
			}
			return weakSectors[i].TotalNetInflow < weakSectors[j].TotalNetInflow
		}
		return weakSectors[i].TotalNetInflow < weakSectors[j].TotalNetInflow
	})
	for idx := range weakSectors {
		weakSectors[idx].Rank = idx + 1
	}

	if len(strongSectors) > 0 {
		summary.StrongestMainSector = strongSectors[0].SectorName
	} else if len(allSectors) > 0 {
		summary.StrongestMainSector = allSectors[0].SectorName
	}

	return &dto.SectorFundFlowResponse{
		Summary:       summary,
		StrongSectors: strongSectors,
		WeakSectors:   weakSectors,
		AllSectors:    allSectors,
	}, nil
}

// GetSectorTrendDetail gets 5 days of history for a specific sector
func (s *FundFlowService) GetSectorTrendDetail(sectorName, endDate string) (*dto.SectorTrendResponse, error) {
	records, err := s.repo.GetSectorTrend(sectorName, endDate, 5)
	if err != nil {
		return nil, err
	}

	var details []dto.SectorTrendDetail
	for _, r := range records {
		details = append(details, dto.SectorTrendDetail{
			TradeDate:     r.TradeDate.Format("2006-01-02"),
			NetInflow:     r.NetInflowAmount,
			NetInflowRate: r.InflowRate,
		})
	}
	// records is DESC. Let's reverse for UI (oldest first)
	for i, j := 0, len(details)-1; i < j; i, j = i+1, j-1 {
		details[i], details[j] = details[j], details[i]
	}

	trendSymbol := calculateTrend(records)
	suggestion := "观望为主"
	if strings.Contains(trendSymbol, "📈") {
		suggestion = "🔥 主线关注"
	} else if strings.Contains(trendSymbol, "📉") {
		suggestion = "❌ 规避，资金撤退"
	}

	leader := ""
	if len(records) > 0 {
		leader = records[0].TopStock
	}

	return &dto.SectorTrendResponse{
		SectorName:  sectorName,
		TrendDays:   details,
		TrendSymbol: trendSymbol,
		LeaderStock: leader,
		Suggestion:  suggestion,
	}, nil
}

func calculateTrend(flows []models.SectorFundFlow) string {
	if len(flows) < 2 {
		return "-"
	}

	// flows is ordered DESC by date (0 is newest, 1 is older, etc.)
	upCount := 0
	downCount := 0

	for i := 0; i < len(flows)-1; i++ {
		today := flows[i].InflowRate
		yesterday := flows[i+1].InflowRate

		if today > yesterday {
			upCount++
		} else if today < yesterday {
			downCount++
		}
	}

	if upCount == len(flows)-1 && upCount > 0 {
		return strings.Repeat("📈", upCount+1) // e.g. 3 days up = 📈📈📈
	}
	if downCount == len(flows)-1 && downCount > 0 {
		return strings.Repeat("📉", downCount+1)
	}

	// Mixed
	if flows[0].NetInflowAmount > 0 {
		return "📈"
	}
	return "📉"
}
