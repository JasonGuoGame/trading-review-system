package service

import (
	"fmt"
	"log"
	"sort"
	"strings"
	"time"
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
	"6. 模式赢家跟随",
	"7. 主力资金入场",
	"8. 分歧反包策略",
	"9. 竞价异动策略",
	"四维共振",
	"GPT资金共振",
}

var strategyIcons = map[string]string{
	"1. 短线黑马股":       "⚡",
	"2. 价值长线股":       "🌊",
	"3. 0轴金叉资金共振":    "🔥",
	"4. MACD+BOLL趋势": "🧘",
	"5. 换手率+量比动能":    "🚀",
	"6. 模式赢家跟随":      "🏆",
	"7. 主力资金入场":      "🎯",
	"8. 分歧反包策略":      "🔄",
	"9. 竞价异动策略":      "🔔",
	"四维共振":           "📡",
	"GPT资金共振":         "🤖",
}

type StrategyPerformanceService struct {
	repo             *repository.StrategyPerformanceRepository
	scoreRepo        *repository.StrategyScoreAnalysisRepository
	stockRepo        *repository.StockPoolRepository
	klineRepo        *repository.KlineRepository
	marketBreadthRepo *repository.MarketBreadthRepository
}

func NewStrategyPerformanceService(repo *repository.StrategyPerformanceRepository, scoreRepo *repository.StrategyScoreAnalysisRepository, stockRepo *repository.StockPoolRepository, klineRepo *repository.KlineRepository, mbRepo *repository.MarketBreadthRepository) *StrategyPerformanceService {
	return &StrategyPerformanceService{repo: repo, scoreRepo: scoreRepo, stockRepo: stockRepo, klineRepo: klineRepo, marketBreadthRepo: mbRepo}
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

	// Fallback: fill missing/recent data from strategy_score_analysis
	historyMaxDate := make(map[string]time.Time)
	for _, h := range history {
		if t, ok := historyMaxDate[h.StrategyName]; !ok || h.TradeDate.After(t) {
			historyMaxDate[h.StrategyName] = h.TradeDate
		}
	}

	for _, name := range strategyNames {
		maxD, ok := historyMaxDate[name]
		maxDStr := maxD.Format("2006-01-02")
		aggregated, err := s.repo.AggregateFromScoreAnalysis(name)
		if err != nil || len(aggregated) == 0 {
			continue
		}
		if !ok {
			// New strategy with no history
			latestAgg := aggregated[len(aggregated)-1]
			latestAgg.WinRate = latestAgg.WinRate / 100.0
			latestMap[name] = latestAgg
			history = append(history, aggregated...)
		} else {
			// Merge dates newer than existing history
			for _, agg := range aggregated {
				if agg.TradeDate.Format("2006-01-02") > maxDStr {
					history = append(history, agg)
				}
			}
			lastAgg := aggregated[len(aggregated)-1]
			if lastAgg.TradeDate.Format("2006-01-02") > maxDStr {
				lastAgg.WinRate = lastAgg.WinRate / 100.0
				latestMap[name] = lastAgg
			}
		}
	}

	// Override latest win rates with live kline data for strategies with stock pools
	if s.stockRepo != nil && s.klineRepo != nil {
		for name, poolType := range poolTypeMap {
			liveWR, liveAR, liveCount := s.computeLiveStats(poolType)
			if liveCount > 0 {
				if rec, ok := latestMap[name]; ok {
					rec.WinRate = liveWR
					rec.AvgReturn = liveAR
					rec.SignalCount = liveCount
					latestMap[name] = rec
				} else {
					latestMap[name] = models.StrategyPerformanceHistory{
						WinRate:     liveWR,
						AvgReturn:   liveAR,
						SignalCount: liveCount,
					}
				}
			}
		}
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
		return strategies[i].WinRate > strategies[j].WinRate
	})

	var result []dto.StrategyLatest
	for i, st := range strategies {
		bestRange := ""
		if s.scoreRepo != nil {
			if bestBin, err := s.scoreRepo.GetBestBin(st.Name); err == nil && bestBin != nil {
				bestRange = fmt.Sprintf("%d-%d", bestBin.ScoreRangeStart, bestBin.ScoreRangeEnd)
			}
		}
		result = append(result, dto.StrategyLatest{
			Name:           st.Name,
			WinRate:        st.WinRate,
			AvgReturn:      st.AvgReturn,
			SignalCount:    st.SignalCount,
			BestReturn:     st.BestReturn,
			WorstReturn:    st.WorstReturn,
			Trend:          st.Trend,
			Rank:           i + 1,
			BestScoreRange: bestRange,
		})
	}

	commentary := generateCommentary(strategies)
	// Recommendation uses fixed 30-day window for statistical significance
	recDays := 30
	recommendation := s.buildAdvancerRecommendation(trendData, recDays)

	return &dto.StrategyPerformanceResponse{
		Strategies:     result,
		TrendData:      trendData,
		Commentary:     commentary,
		Recommendation: recommendation,
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

var poolTypeMap = map[string]string{
	"1. 短线黑马股":       "short",
	"2. 价值长线股":       "long",
	"3. 0轴金叉资金共振":    "macd_boll",
	"4. MACD+BOLL趋势": "trend_following",
	"5. 换手率+量比动能":    "turnover_vol",
	"6. 模式赢家跟随":      "winner_mode",
	"7. 主力资金入场":      "mf_entry",
	"8. 分歧反包策略":      "divergence_reversal",
	"9. 竞价异动策略":      "auction_surge",
	"四维共振":           "four_dim",
	"GPT资金共振":         "gpt_fund",
}

// computeLiveStats calculates live win rate + avg return for the most recent
// stock pool entries of the given pool type using kline data.
func (s *StrategyPerformanceService) computeLiveStats(poolType string) (winRate, avgReturn float64, signalCount int) {
	stocks, err := s.stockRepo.List(models.StockPoolType(poolType), 30, "")
	if err != nil || len(stocks) == 0 {
		log.Printf("[liveStats] poolType=%s: no stocks (err=%v, len=%d)", poolType, err, len(stocks))
		return 0, 0, 0
	}

	// Find the most recent trade_date among these stocks
	var latestDate time.Time
	for _, st := range stocks {
		if st.TradeDate.After(latestDate) {
			latestDate = st.TradeDate
		}
	}
	if latestDate.IsZero() {
		return 0, 0, 0
	}

	// Filter to only the latest date
	var latestStocks []models.StockPool
	for _, st := range stocks {
		if st.TradeDate.Format("2006-01-02") == latestDate.Format("2006-01-02") {
			latestStocks = append(latestStocks, st)
		}
	}
	if len(latestStocks) == 0 {
		return 0, 0, 0
	}

	// Get kline data
	symbols := make([]string, len(latestStocks))
	for i, st := range latestStocks {
		symbols[i] = st.Symbol
	}
	klines, err := s.klineRepo.GetNextTwoKlines(symbols, latestDate)
	if err != nil {
		log.Printf("[liveStats] poolType=%s: kline query error: %v", poolType, err)
		return 0, 0, 0
	}

	var wins int
	var totalReturn float64
	var total int
	for _, st := range latestStocks {
		rows := klines[st.Symbol]
		if len(rows) < 2 {
			log.Printf("[liveStats] poolType=%s symbol=%s: only %d klines (need 2), skipping", poolType, st.Symbol, len(rows))
			continue
		}
		total++
		returnPct := (rows[1].Close - rows[0].Close) / rows[0].Close * 100
		totalReturn += returnPct
		isWin := rows[1].Close > rows[0].Close
		if isWin {
			wins++
		}
		log.Printf("[liveStats] poolType=%s symbol=%s: entry=%.2f exit=%.2f return=%.2f%% win=%v",
			poolType, st.Symbol, rows[0].Close, rows[1].Close, returnPct, isWin)
	}
	if total == 0 {
		return 0, 0, 0
	}
	winRate = float64(wins) / float64(total)
	avgReturn = totalReturn / float64(total)
	log.Printf("[liveStats] poolType=%s FINAL: wins=%d total=%d winRate=%.4f(%.0f%%) avgReturn=%.2f%%",
		poolType, wins, total, winRate, winRate*100, avgReturn)
	return winRate, avgReturn, total
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

// findAdvancerBucket returns the bucket label and boundaries for a given advancers count.
func findAdvancerBucket(advancers int) (label string, advMin, advMax int) {
	for _, b := range advancerBuckets {
		if b.Max == 0 {
			if advancers >= b.Min {
				return b.Label, b.Min, b.Max
			}
		} else {
			if advancers >= b.Min && advancers <= b.Max {
				return b.Label, b.Min, b.Max
			}
		}
	}
	return "未知", 0, 0
}

// buildAdvancerRecommendation builds the market-breadth-based strategy recommendation.
func (s *StrategyPerformanceService) buildAdvancerRecommendation(trendData []dto.StrategyTrendPoint, days int) *dto.AdvancerRecommendation {
	if s.scoreRepo == nil {
		return nil
	}

	// Get today's advancers directly from market_breadths table
	var advancers int
	if s.marketBreadthRepo != nil {
		advancers, _ = s.marketBreadthRepo.GetLatestAdvancers()
	}
	// Fallback to trend data if market_breadths query fails
	if advancers <= 0 && len(trendData) > 0 {
		advancers = trendData[len(trendData)-1].MarketUpCount
	}
	if advancers <= 0 {
		return nil
	}

	bucketLabel, advMin, advMax := findAdvancerBucket(advancers)
	log.Printf("[recommend] today advancers=%d -> bucket=%s (min=%d max=%d)", advancers, bucketLabel, advMin, advMax)

	rows, err := s.scoreRepo.GetStrategiesByAdvancerRange(advMin, advMax, days)
	if err != nil || len(rows) == 0 {
		log.Printf("[recommend] GetStrategiesByAdvancerRange error: %v, rows=%d", err, len(rows))
		return nil
	}

	// Map short names back to full names
	shortToFull := map[string]string{}
	for _, name := range strategyNames {
		mapped := mapToScoreAnalysisName(name)
		shortToFull[mapped] = name
	}

	var ranked []dto.AdvancerRankedStrategy
	var topStrategy string
	var topWR, topAR float64
	var topTrades int

	for i, row := range rows {
		fullName := shortToFull[row.StrategyName]
		if fullName == "" {
			fullName = row.StrategyName
		}
		ranked = append(ranked, dto.AdvancerRankedStrategy{
			Name:        fullName,
			WinRate:     row.WinRate / 100.0,
			AvgReturn:   row.AvgReturn,
			TotalTrades: row.TotalTrades,
		})
		if i == 0 {
			topStrategy = fullName
			topWR = row.WinRate / 100.0
			topAR = row.AvgReturn
			topTrades = row.TotalTrades
		}
	}

	return &dto.AdvancerRecommendation{
		Advancers:      advancers,
		BucketLabel:    bucketLabel,
		TopStrategy:    topStrategy,
		TopWinRate:     topWR,
		TopAvgReturn:   topAR,
		TopTotalTrades: topTrades,
		AllRanked:      ranked,
	}
}
