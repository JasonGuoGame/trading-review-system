package service

import (
	"fmt"
	"sort"
	"strings"
	"trading-review-system/backend/internal/dto"
	"trading-review-system/backend/internal/models"
	"trading-review-system/backend/internal/repository"
)

var strategyNames = []string{
	"1. 短线黑马股",
	"2. 价值长线股",
	"3. 0轴金叉资金共振",
	"4. MACD+BOLL趋势",
	"5. 换手率+量比动能",
	"6. 赚钱效应",
}

var strategyIcons = map[string]string{
	"1. 短线黑马股":     "⚡",
	"2. 价值长线股":     "🌊",
	"3. 0轴金叉资金共振": "🔥",
	"4. MACD+BOLL趋势":  "🧘",
	"5. 换手率+量比动能": "🚀",
	"6. 赚钱效应":       "🏆",
}

type StrategyPerformanceService struct {
	repo *repository.StrategyPerformanceRepository
}

func NewStrategyPerformanceService(repo *repository.StrategyPerformanceRepository) *StrategyPerformanceService {
	return &StrategyPerformanceService{repo: repo}
}

func (s *StrategyPerformanceService) GetDashboard(days int) (*dto.StrategyPerformanceResponse, error) {
	if days <= 0 {
		days = 10
	}

	history, err := s.repo.GetHistory(strategyNames, days)
	if err != nil {
		return nil, err
	}

	latest, err := s.repo.GetLatest(strategyNames)
	if err != nil {
		return nil, err
	}

	// Build latest map, normalize win_rate from DB percentage (100=100%) to 0-1 decimal
	latestMap := make(map[string]models.StrategyPerformanceHistory)
	for _, rec := range latest {
		rec.WinRate = rec.WinRate / 100.0 // Normalize: 100.0 → 1.0
		latestMap[rec.StrategyName] = rec
	}

	// Build trend data grouped by date, capture market-wide data once per date
	dateMap := make(map[string]map[string]float64)
	dateMarket := make(map[string]struct {
		upCount int
		pctChg  float64
	})
	for _, rec := range history {
		ds := rec.TradeDate.Format("2006-01-02")
		if dateMap[ds] == nil {
			dateMap[ds] = make(map[string]float64)
		}
		dateMap[ds][rec.StrategyName] = rec.WinRate / 100.0 // Normalize for trend
		// Market data is per-date (same for all strategies); capture once
		if _, ok := dateMarket[ds]; !ok {
			dateMarket[ds] = struct {
				upCount int
				pctChg  float64
			}{upCount: rec.MarketUpCount, pctChg: rec.MarketPctChg}
		}
	}

	var trendData []dto.StrategyTrendPoint
	var dates []string
	for d := range dateMap {
		dates = append(dates, d)
	}
	sort.Strings(dates)
	for _, d := range dates {
		market := dateMarket[d]
		trendData = append(trendData, dto.StrategyTrendPoint{
			TradeDate:     d,
			Values:        dateMap[d],
			MarketUpCount: market.upCount,
			MarketPctChg:  market.pctChg,
		})
	}

	// Build strategies with trend detection and ranking
	var strategies []strategyScore
	for _, name := range strategyNames {
		s := strategyScore{Name: name}
		if rec, ok := latestMap[name]; ok {
			s.WinRate = rec.WinRate
			s.AvgReturn = rec.AvgReturn
			s.SignalCount = rec.SignalCount
			s.BestReturn = rec.BestReturn
			s.WorstReturn = rec.WorstReturn
		}
		s.Trend = detectTrend(name, trendData)
		s.Stability = calcStability(name, trendData)
		// Composite: win_rate(0-1)*40 + avg_return_pct_normalized*30 + stability*30
		s.Score = s.WinRate*40 + normalizeReturn(s.AvgReturn)*30 + s.Stability*30
		strategies = append(strategies, s)
	}

	sort.Slice(strategies, func(i, j int) bool {
		return strategies[i].Score > strategies[j].Score
	})

	var result []dto.StrategyLatest
	for i, s := range strategies {
		result = append(result, dto.StrategyLatest{
			Name:        s.Name,
			WinRate:     s.WinRate,
			AvgReturn:   s.AvgReturn,
			SignalCount: s.SignalCount,
			BestReturn:  s.BestReturn,
			WorstReturn: s.WorstReturn,
			Trend:       s.Trend,
			Rank:        i + 1,
		})
	}

	commentary := generateCommentary(strategies)

	return &dto.StrategyPerformanceResponse{
		Strategies: result,
		TrendData:  trendData,
		Commentary: commentary,
	}, nil
}

type strategyScore struct {
	Name        string
	WinRate     float64
	AvgReturn   float64
	SignalCount int
	BestReturn  float64
	WorstReturn float64
	Trend       string
	Stability   float64
	Score       float64
}

func detectTrend(name string, trendData []dto.StrategyTrendPoint) string {
	var values []float64
	for _, p := range trendData {
		if v, ok := p.Values[name]; ok {
			values = append(values, v)
		}
	}
	if len(values) < 3 {
		return "flat"
	}
	mid := len(values) / 2
	firstHalf := avg(values[:mid])
	secondHalf := avg(values[mid:])
	diff := (secondHalf - firstHalf) / (firstHalf + 0.001)
	if diff > 0.05 {
		return "up"
	} else if diff < -0.05 {
		return "down"
	}
	return "flat"
}

func calcStability(name string, trendData []dto.StrategyTrendPoint) float64 {
	var values []float64
	for _, p := range trendData {
		if v, ok := p.Values[name]; ok {
			values = append(values, v)
		}
	}
	if len(values) < 2 {
		return 0.5
	}
	mean := avg(values)
	var variance float64
	for _, v := range values {
		variance += (v - mean) * (v - mean)
	}
	variance /= float64(len(values))
	cv := 0.0
	if mean > 0.001 {
		cv = variance / mean
	}
	stability := 1.0 - cv
	if stability < 0 {
		stability = 0
	}
	if stability > 1 {
		stability = 1
	}
	return stability
}

func avg(vals []float64) float64 {
	if len(vals) == 0 {
		return 0
	}
	var sum float64
	for _, v := range vals {
		sum += v
	}
	return sum / float64(len(vals))
}

func normalizeReturn(r float64) float64 {
	// r is already a percentage (e.g. 2.28 = +2.28%)
	// Map to 0-100 scale: +5% → 100, 0% → 50, -5% → 0
	normalized := (r + 5) * 10
	if normalized < 0 {
		normalized = 0
	}
	if normalized > 100 {
		normalized = 100
	}
	return normalized
}

func generateCommentary(strategies []strategyScore) string {
	if len(strategies) == 0 {
		return "暂无策略表现数据。"
	}

	var parts []string
	top := strategies[0]
	if top.WinRate == 0 && top.AvgReturn == 0 {
		return fmt.Sprintf("暂无足够数据。仅【%s】有记录，继续积累交易数据以开启策略赛马。", top.Name)
	}

	parts = append(parts, fmt.Sprintf("🏆 当前战力第1：【%s】综合评分%.0f，胜率%.0f%%，平均收益%+.1f%%",
		top.Name, top.Score, top.WinRate*100, top.AvgReturn))

	if top.Trend == "up" && top.WinRate > 0.5 {
		parts = append(parts, fmt.Sprintf("📈 %s胜率持续攀升且处于高位（>50%%），建议优先执行该模式选股脚本。", top.Name))
	} else if top.Trend == "down" {
		parts = append(parts, fmt.Sprintf("⚠️ %s虽排名第一但胜率正在下滑，需警惕风格切换风险。", top.Name))
	}

	for _, s := range strategies {
		if s.Trend == "up" && s.Stability > 0.7 && s.Name != top.Name {
			parts = append(parts, fmt.Sprintf("💡 发现黑马：【%s】胜率趋势稳定上升（稳定性%.0f%%），值得重点观察。", s.Name, s.Stability*100))
			break
		}
	}

	for _, s := range strategies {
		if s.Trend == "down" && s.WinRate < 0.4 {
			parts = append(parts, fmt.Sprintf("🔻 风险提示：【%s】胜率%.0f%%且持续走低，建议暂停该模式交易。", s.Name, s.WinRate*100))
			break
		}
	}

	if len(strategies) >= 2 {
		second := strategies[1]
		if top.Score-second.Score < 5 {
			parts = append(parts, fmt.Sprintf("⚔️ %s与%s战力接近（相差%.0f分），可双线作战。", top.Name, second.Name, top.Score-second.Score))
		}
	}

	return strings.Join(parts, " ")
}
