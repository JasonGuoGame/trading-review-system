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

	// 30日流入天数占比（用于表格列）
	inflowStats, err := s.repo.GetInflowDayStats(endDateStr, 30)
	if err != nil {
		inflowStats = map[string]repository.InflowDayStat{}
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

	// 今日全市场净流入：所选日期当日所有板块净流入之和（红盘板块流入 + 绿盘板块流出）
	var marketNetInflow, marketInflow, marketOutflow float64
	for _, r := range records {
		if r.TradeDate.Format("2006-01-02") != endDateStr {
			continue
		}
		if s.shouldFilter(r.SectorName) {
			continue
		}
		marketNetInflow += r.NetInflowAmount
		if r.NetInflowAmount > 0 {
			marketInflow += r.NetInflowAmount
		} else {
			marketOutflow += r.NetInflowAmount
		}
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

		// Only include sectors whose most recent data is within the lookback window
		selectedDate, _ := time.Parse("2006-01-02", endDateStr)
		if !selectedDate.IsZero() {
			if daysToLookBack == 1 {
				// 1d: exact date match required
				if flows[0].TradeDate.Format("2006-01-02") != endDateStr {
					continue
				}
			} else {
				// 3d/5d: most recent data must be within lookback + 3 day buffer
				cutoff := selectedDate.AddDate(0, 0, -(daysToLookBack + 3))
				if flows[0].TradeDate.Before(cutoff) {
					continue
				}
			}
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

		var ratio30d float64
		var inflowDays30d, totalDays30d int
		if st, ok := inflowStats[name]; ok {
			inflowDays30d = st.InflowDays
			totalDays30d = st.TotalDays
			if totalDays30d > 0 {
				ratio30d = float64(inflowDays30d) / float64(totalDays30d) * 100
			}
		}

		item := dto.SectorFlowItem{
			SectorName:      name,
			TotalNetInflow:  totalInflow,
			TodayInflowRate: todayRate,
			LeaderStock:     leader,
			Trend:           trend3d, // Default trend shows 3d
			Trend3d:         trend3d,
			Trend5d:         trend5d,
			InflowRatio30d:  ratio30d,
			InflowDays30d:   inflowDays30d,
			TotalDays30d:    totalDays30d,
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

	summary.MarketNetInflow = marketNetInflow
	summary.MarketInflow = marketInflow
	summary.MarketOutflow = marketOutflow

	return &dto.SectorFundFlowResponse{
		Summary:       summary,
		StrongSectors: strongSectors,
		WeakSectors:   weakSectors,
		AllSectors:    allSectors,
	}, nil
}

// GetSectorTrendDetail gets up to `days` days of history for a specific sector,
// returning the raw daily series (oldest first) plus a drift summary.
func (s *FundFlowService) GetSectorTrendDetail(sectorName, endDate string, days int) (*dto.SectorTrendResponse, error) {
	if days <= 0 {
		days = 30
	}

	records, err := s.repo.GetSectorTrend(sectorName, endDate, days)
	if err != nil {
		return nil, err
	}

	var details []dto.SectorTrendDetail
	var cumulative float64
	inflowDays := 0
	for _, r := range records {
		details = append(details, dto.SectorTrendDetail{
			TradeDate:     r.TradeDate.Format("2006-01-02"),
			NetInflow:     r.NetInflowAmount,
			NetInflowRate: r.InflowRate,
			CapitalScore:  r.AvgCapitalScore,
			AttackScore:   r.AvgAttackScore,
		})
		if r.NetInflowAmount > 0 {
			inflowDays++
		}
		cumulative += r.NetInflowAmount
	}
	// records is DESC (newest first). Reverse for UI so the series is oldest-first.
	for i, j := 0, len(details)-1; i < j; i, j = i+1, j-1 {
		details[i], details[j] = details[j], details[i]
	}

	trendSymbol := calculateTrend(records)
	leader := ""
	latestRate := 0.0
	if len(records) > 0 {
		leader = records[0].TopStock
		latestRate = records[0].InflowRate
	}

	// Suggestion: weight the accumulated drift over the recent trend symbol.
	suggestion := "👀 资金震荡，观望为主"
	switch {
	case cumulative > 0 && strings.Contains(trendSymbol, "📈"):
		suggestion = "🔥 资金持续净流入，主线关注"
	case cumulative > 0:
		suggestion = "📈 累计净流入为正，保持跟踪"
	case cumulative < 0 && strings.Contains(trendSymbol, "📉"):
		suggestion = "❌ 资金持续撤退，规避"
	case cumulative < 0:
		suggestion = "📉 累计净流出，谨慎"
	}

	return &dto.SectorTrendResponse{
		SectorName:       sectorName,
		TrendDays:        details,
		TrendSymbol:      trendSymbol,
		LeaderStock:      leader,
		Suggestion:       suggestion,
		CumulativeInflow: cumulative,
		InflowDays:       inflowDays,
		TotalDays:        len(details),
		LatestInflowRate: latestRate,
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
