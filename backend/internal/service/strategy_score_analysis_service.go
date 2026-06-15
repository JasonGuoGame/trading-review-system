package service

import (
	"fmt"
	"math"
	"sort"
	"time"
	"trading-review-system/backend/internal/dto"
	"trading-review-system/backend/internal/repository"
)

type StrategyScoreAnalysisService struct {
	repo      *repository.StrategyScoreAnalysisRepository
	stockRepo *repository.StockPoolRepository
	klineRepo *repository.KlineRepository
}

func NewStrategyScoreAnalysisService(repo *repository.StrategyScoreAnalysisRepository, stockRepo *repository.StockPoolRepository, klineRepo *repository.KlineRepository) *StrategyScoreAnalysisService {
	return &StrategyScoreAnalysisService{repo: repo, stockRepo: stockRepo, klineRepo: klineRepo}
}

// Map full strategy names (from strategy_performance_history) to short names (in strategy_score_analysis)
func mapToScoreAnalysisName(fullName string) string {
	mapping := map[string]string{
		"1. 短线黑马股":       "1. 短线黑马",
		"2. 价值长线股":       "5. 价值长线",
		"3. 0轴金叉资金共振":    "3. 0轴金叉共振",
		"4. MACD+BOLL趋势": "4. MACD+BOLL",
		"5. 换手率+量比动能":    "2. 换手率量比",
		"6. 模式赢家跟随":      "6. 赢家跟随",
		"7. 主力资金入场":      "主力入场",
		"8. 分歧反包策略":      "分歧反包",
		"9. 竞价异动策略":      "竞价异动",
	}
	if mapped, ok := mapping[fullName]; ok {
		return mapped
	}
	return fullName
}

func (s *StrategyScoreAnalysisService) GetStrategyAnalysis(strategyName string, days int) (*dto.StrategyScoreAnalysisResponse, error) {
	if days <= 0 {
		days = 30
	}

	mappedName := mapToScoreAnalysisName(strategyName)

	records, err := s.repo.GetByStrategy(mappedName, days)
	if err != nil {
		return nil, err
	}

	// Collect unique dates and bins
	dateSet := make(map[string]bool)
	binSet := make(map[string]bool)
	binKey := func(start, end int) string {
		return fmt.Sprintf("%d-%d", start, end)
	}

	// Build per-bin aggregation
	type binAgg struct {
		winRates   []float64
		avgReturns []float64
		maxReturns []float64
		drawdowns  []float64
		trades     int
	}
	binAggs := make(map[string]*binAgg)

	var heatmap []dto.StrategyScoreHeatmapCell
	binTrendsRaw := make(map[string][]dto.ScoreTrendPoint)

	for _, rec := range records {
		ds := rec.TradeDate.Format("2006-01-02")
		bk := binKey(rec.ScoreRangeStart, rec.ScoreRangeEnd)
		dateSet[ds] = true
		binSet[bk] = true

		heatmap = append(heatmap, dto.StrategyScoreHeatmapCell{
			TradeDate:   ds,
			BinKey:      bk,
			WinRate:     rec.WinRate,
			AvgReturn:   rec.AvgReturn,
			TotalTrades: rec.TotalTrades,
		})

		binTrendsRaw[bk] = append(binTrendsRaw[bk], dto.ScoreTrendPoint{
			TradeDate:   ds,
			WinRate:     rec.WinRate,
			AvgReturn:   rec.AvgReturn,
			MaxReturn:   rec.MaxReturn,
			MaxDrawdown: rec.MaxDrawdown,
		})

		if binAggs[bk] == nil {
			binAggs[bk] = &binAgg{}
		}
		ba := binAggs[bk]
		ba.winRates = append(ba.winRates, rec.WinRate)
		ba.avgReturns = append(ba.avgReturns, rec.AvgReturn)
		ba.maxReturns = append(ba.maxReturns, rec.MaxReturn)
		ba.drawdowns = append(ba.drawdowns, rec.MaxDrawdown)
		ba.trades += rec.TotalTrades
	}

	// Compute live win rates from stock_pool + kline where available
	poolType, hasPoolType := strategyToPoolType[strategyName]
	if hasPoolType && s.stockRepo != nil && s.klineRepo != nil {
		for i := range heatmap {
			cell := &heatmap[i]
			if cell.TotalTrades > 0 {
				targetDate, err := time.Parse("2006-01-02", cell.TradeDate)
				if err != nil {
					continue
				}
				// Extract score range
				var si, ei int
				fmt.Sscanf(cell.BinKey, "%d-%d", &si, &ei)
				if si == 0 && ei == 0 {
					continue
				}
				stocks, err := s.stockRepo.ListByScoreRange(poolType, cell.TradeDate, si, ei)
				if err != nil || len(stocks) == 0 {
					cell.WinRate = 0
					cell.TotalTrades = 0
					continue
				}
				symbols := make([]string, len(stocks))
				for j, st := range stocks {
					symbols[j] = st.Symbol
				}
				klines, err := s.klineRepo.GetNextTwoKlines(symbols, targetDate)
				if err != nil {
					continue
				}
				var wins, total int
				for _, st := range stocks {
					rows := klines[st.Symbol]
					if len(rows) < 2 {
						continue
					}
					total++
					if rows[1].Close > rows[0].Close {
						wins++
					}
				}
				if total > 0 {
					cell.WinRate = float64(wins) / float64(total) * 100
					cell.TotalTrades = total
				} else {
					// Pre-computed data is stale; no live stocks found
					cell.WinRate = 0
					cell.TotalTrades = 0
				}
			}
		}
	}

	// Build sorted dates and bins
	var dates []string
	for d := range dateSet {
		dates = append(dates, d)
	}
	sort.Strings(dates)

	var binsKeys []string
	for b := range binSet {
		binsKeys = append(binsKeys, b)
	}
	sort.Slice(binsKeys, func(i, j int) bool {
		var si, sj, ei, ej int
		fmt.Sscanf(binsKeys[i], "%d-%d", &si, &ei)
		fmt.Sscanf(binsKeys[j], "%d-%d", &sj, &ej)
		return si > sj // Higher score ranges first
	})

	// Build bin summaries with stability
	var bins []dto.ScoreBinSummary
	var bestBin *dto.ScoreBinSummary
	bestScore := -1.0

	for _, bk := range binsKeys {
		ba := binAggs[bk]
		if ba == nil {
			continue
		}
		var si, ei int
		fmt.Sscanf(bk, "%d-%d", &si, &ei)
		avgWR := avg(ba.winRates)
		avgAR := avg(ba.avgReturns)
		avgMR := avg(ba.maxReturns)
		avgDD := avg(ba.drawdowns)
		stability := calcScoreStability(ba.winRates, avgWR, avgAR)

		summary := dto.ScoreBinSummary{
			RangeLabel:  fmt.Sprintf("%d-%d分", si, ei),
			RangeStart:  si,
			RangeEnd:    ei,
			AvgWinRate:  avgWR,
			AvgReturn:   avgAR,
			TotalTrades: ba.trades,
			Stability:   stability,
			MaxReturn:   avgMR,
			MaxDrawdown: avgDD,
		}
		bins = append(bins, summary)

		score := avgWR*0.6 + stability*0.4
		if score > bestScore {
			bestScore = score
			copy := summary
			bestBin = &copy
		}
	}

	// Sort bin trends by date
	binTrends := make(map[string][]dto.ScoreTrendPoint)
	for bk, pts := range binTrendsRaw {
		sort.Slice(pts, func(i, j int) bool {
			return pts[i].TradeDate < pts[j].TradeDate
		})
		binTrends[bk] = pts
	}

	return &dto.StrategyScoreAnalysisResponse{
		StrategyName: strategyName,
		BestBin:      bestBin,
		Bins:         bins,
		Heatmap:      heatmap,
		BinTrends:    binTrends,
		Dates:        dates,
		BinLabels:    binsKeys,
	}, nil
}

func calcScoreStability(winRates []float64, avgWR, avgAR float64) float64 {
	if len(winRates) < 2 {
		return 0.5
	}
	var variance float64
	for _, v := range winRates {
		variance += (v - avgWR) * (v - avgWR)
	}
	variance /= float64(len(winRates))
	stdDev := math.Sqrt(variance)
	if avgAR <= 0 {
		return avgWR / (1 + stdDev)
	}
	return (avgAR * avgWR) / (1 + stdDev)
}
