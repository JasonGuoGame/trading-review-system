package service

import (
	"strings"
	"time"

	"trading-review-system/backend/internal/dto"
	"trading-review-system/backend/internal/models"
	"trading-review-system/backend/internal/repository"
)

type MarketBreadthService struct {
	repo *repository.MarketBreadthRepository
}

func NewMarketBreadthService(repo *repository.MarketBreadthRepository) *MarketBreadthService {
	return &MarketBreadthService{repo: repo}
}

func (s *MarketBreadthService) GetByDate(date time.Time) (*models.MarketBreadth, error) {
	return s.repo.GetByDate(date)
}

func (s *MarketBreadthService) Upsert(breadth *models.MarketBreadth) error {
	return s.repo.Upsert(breadth)
}

func (s *MarketBreadthService) GetTopSectorScores(tradeDate string, limit int) ([]models.StkSectorScore, error) {
	return s.repo.GetTopSectorScores(tradeDate, limit)
}

// GetIntradayTurnover returns the cumulative intraday turnover comparison (成交额环比)
// at the 10:00 / 11:00 / 11:30 / 14:00 / 14:40 / 15:00 marks against the previous
// trading day, restricted to marks up to the latest available minute.
func (s *MarketBreadthService) GetIntradayTurnover(date string) ([]dto.IntradayTurnoverMark, error) {
	today, err := s.repo.GetIntradayCumulative(date)
	if err != nil {
		return nil, err
	}
	// 所选日期无分钟数据（周末/未来日期等），直接返回空，避免出现虚假的 -100% 环比。
	if today.LatestMinute == "" {
		return []dto.IntradayTurnoverMark{}, nil
	}

	prevDate, err := s.repo.GetPreviousMinKlineDate(date)
	if err != nil || prevDate == "" {
		return []dto.IntradayTurnoverMark{}, nil
	}
	prev, err := s.repo.GetIntradayCumulative(prevDate)
	if err != nil {
		return nil, err
	}

	marks := []struct {
		label string
		time  string
		today float64
		prev  float64
	}{
		{"10:00", "10:00", today.Cum1000, prev.Cum1000},
		{"11:00", "11:00", today.Cum1100, prev.Cum1100},
		{"11:30", "11:30", today.Cum1130, prev.Cum1130},
		{"14:00", "14:00", today.Cum1400, prev.Cum1400},
		{"14:40", "14:40", today.Cum1440, prev.Cum1440},
		{"15:00", "15:00", today.Cum1500, prev.Cum1500},
	}

	latestMinute := today.LatestMinute
	result := make([]dto.IntradayTurnoverMark, 0, len(marks))
	for _, m := range marks {
		// Only include marks whose time is at or before the latest available minute.
		if latestMinute != "" && m.time > latestMinute {
			continue
		}
		change := 0.0
		if m.prev > 0 {
			change = (m.today/m.prev - 1) * 100
		}
		result = append(result, dto.IntradayTurnoverMark{
			Mark:   m.label,
			Today:  m.today / 1e8, // 元 -> 亿
			Prev:   m.prev / 1e8,
			Change: change,
		})
	}
	return result, nil
}

// GetSnapshotTimes returns every distinct intraday snapshot time for a trade date.
func (s *MarketBreadthService) GetSnapshotTimes(tradeDate string) ([]string, error) {
	return s.repo.GetSnapshotTimes(tradeDate)
}

// GetTopRisingSectors returns the fastest-rising sectors (by rank_change in the
// given snapshot, or the latest one when snapshotTime is empty) together with the
// capital-abnormal stocks belonging to each.
func (s *MarketBreadthService) GetTopRisingSectors(tradeDate string, limit int, snapshotTime string) (*dto.RisingSectorsWithSnapshot, error) {
	resolvedSnapshot, sectors, err := s.repo.GetTopRisingSectors(tradeDate, limit, snapshotTime)
	if err != nil {
		return nil, err
	}
	if len(sectors) == 0 {
		return &dto.RisingSectorsWithSnapshot{SnapshotTime: resolvedSnapshot, Sectors: []dto.RisingSectorWithStocks{}}, nil
	}

	result := make([]dto.RisingSectorWithStocks, 0, len(sectors))
	coreSet := make(map[string]bool, len(sectors))
	for _, sec := range sectors {
		coreSet[sec.SectorName] = true
		result = append(result, dto.RisingSectorWithStocks{
			SectorName: sec.SectorName,
			RankPos:    sec.RankPos,
			RankChange: sec.RankChange,
			TotalScore: sec.TotalScore,
			Stocks:     []dto.RisingSectorStock{},
		})
	}

	// Map full sector classification names (quant_db.sectors) to their core name,
	// keeping only the ones that correspond to a top rising sector.
	allNames, err := s.repo.GetAllSectorNames()
	if err != nil {
		return nil, err
	}
	fullNameToCore := make(map[string]string)
	fullNames := make([]string, 0)
	for _, name := range allNames {
		if core := coreSectorName(name); coreSet[core] {
			fullNameToCore[name] = core
			fullNames = append(fullNames, name)
		}
	}
	if len(fullNames) == 0 {
		return &dto.RisingSectorsWithSnapshot{SnapshotTime: resolvedSnapshot, Sectors: result}, nil
	}

	// Precise membership via stock_sector_relation, intersected with capital-abnormal.
	rows, err := s.repo.GetAbnormalStocksBySectorRelation(tradeDate, fullNames)
	if err != nil {
		return nil, err
	}

	idx := make(map[string]int, len(result))
	for i, r := range result {
		idx[r.SectorName] = i
	}
	// A stock may appear in several classification systems that map to the same core
	// sector (e.g. GN钠离子电池 and 概念-钠离子电池), so dedupe by symbol per sector.
	seen := make(map[string]bool)
	for _, row := range rows {
		core := fullNameToCore[row.RelSector]
		i, ok := idx[core]
		if !ok {
			continue
		}
		key := core + "|" + row.Symbol
		if seen[key] {
			continue
		}
		seen[key] = true
		result[i].Stocks = append(result[i].Stocks, dto.RisingSectorStock{
			Symbol:      row.Symbol,
			Name:        row.Name,
			VolRatio:    row.VolRatio,
			SurgeCount:  row.SurgeCount,
			MaxSurgeRet: row.MaxSurgeRet,
		})
	}
	return &dto.RisingSectorsWithSnapshot{SnapshotTime: resolvedSnapshot, Sectors: result}, nil
}

// coreSectorName strips a sector classification prefix (申万 SW2/SW3、同花顺 THY2/THY3、
// 概念 GN/TGN/TDGN、行业-/概念-) and a trailing 加权 suffix, returning the plain
// sector name used by stk_sector_scores.sector_name.
func coreSectorName(name string) string {
	for _, p := range []string{"TDGN", "TGN", "GN", "SW2", "SW3", "THY2", "THY3", "行业-", "概念-"} {
		if strings.HasPrefix(name, p) {
			name = strings.TrimPrefix(name, p)
			break
		}
	}
	return strings.TrimSuffix(name, "加权")
}
