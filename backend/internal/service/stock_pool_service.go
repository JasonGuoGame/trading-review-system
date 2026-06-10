package service

import (
	"fmt"
	"sort"
	"strings"
	"time"
	"trading-review-system/backend/internal/dto"
	"trading-review-system/backend/internal/models"
	"trading-review-system/backend/internal/repository"
)

type StockPoolService struct {
	repo     *repository.StockPoolRepository
	fundRepo *repository.FundFlowRepository
	klineRepo *repository.KlineRepository
}

func NewStockPoolService(repo *repository.StockPoolRepository, fundRepo *repository.FundFlowRepository, klineRepo *repository.KlineRepository) *StockPoolService {
	return &StockPoolService{
		repo:      repo,
		fundRepo:  fundRepo,
		klineRepo: klineRepo,
	}
}

func (s *StockPoolService) GetStockPool(poolType models.StockPoolType, days int, tradeDate string) ([]dto.StockPoolResponse, error) {
	stocks, err := s.repo.List(poolType, days, tradeDate)
	if err != nil {
		return nil, err
	}

	symbolGroups := make(map[string][]models.StockPool)
	for _, stock := range stocks {
		symbolGroups[stock.Symbol] = append(symbolGroups[stock.Symbol], stock)
	}

	var responses []dto.StockPoolResponse
	for _, group := range symbolGroups {
		latestStock := group[0]
		for _, stock := range group {
			if stock.TradeDate.After(latestStock.TradeDate) {
				latestStock = stock
			}
		}

		// Preserve original Status from database
		if latestStock.Status == "" {
			if len(group) == 1 {
				latestStock.Status = "新入选"
			} else {
				latestStock.Status = "曾经入选"
			}
		}

		responses = append(responses, dto.StockPoolResponse{
			StockPool: latestStock,
		})
	}

	// 保持按分数降序排列
	sort.Slice(responses, func(i, j int) bool {
		return responses[i].Score > responses[j].Score
	})

	return responses, nil
}

func (s *StockPoolService) CreateStock(req dto.CreateStockPoolRequest) error {
	stock := &models.StockPool{
		Symbol:     req.Symbol,
		StockName:  req.StockName,
		PoolType:   req.PoolType,
		SectorName: req.SectorName,
		Status:     req.Status,
		Notes:      req.Notes,
		Score:      80, // Default score
	}

	// Initial scoring could happen here
	s.CalculateScore(stock)

	return s.repo.Create(stock)
}

func (s *StockPoolService) UpdateStatus(symbol string, tradeDateStr, poolTypeStr, oldStatus, newStatus string) error {
	if _, err := time.Parse("2006-01-02", tradeDateStr); err != nil {
		return err
	}
	poolType := models.StockPoolType(poolTypeStr)

	stock, err := s.repo.GetBySymbol(symbol)
	if err != nil {
		return err
	}
	// Create new record with updated status, delete old one
	newStock := *stock
	newStock.Status = newStatus
	if err := s.repo.Create(&newStock); err != nil {
		return err
	}
	return s.repo.Delete(symbol, tradeDateStr, poolType, oldStatus)
}

func (s *StockPoolService) SetWatchFocus(symbol string, tradeDateStr, poolTypeStr, status string, focus int) error {
	poolType := models.StockPoolType(poolTypeStr)
	return s.repo.SetWatchFocus(symbol, tradeDateStr, poolType, status, focus)
}

func (s *StockPoolService) DeleteStock(symbol string, tradeDateStr, poolTypeStr, status string) error {
	poolType := models.StockPoolType(poolTypeStr)
	return s.repo.Delete(symbol, tradeDateStr, poolType, status)
}

func (s *StockPoolService) GetStockDetail(symbol string) (*dto.StockPoolDetailResponse, error) {
	stock, err := s.repo.GetBySymbol(symbol)
	if err != nil {
		return nil, err
	}

	signals, _ := s.repo.GetSignals(symbol)

	return &dto.StockPoolDetailResponse{
		Symbol:     stock.Symbol,
		StockName:  stock.StockName,
		PoolType:   stock.PoolType,
		SectorName: stock.SectorName,
		Score:      stock.Score,
		Status:     stock.Status,
		Notes:      stock.Notes,
		Signals:    signals,
	}, nil
}

func (s *StockPoolService) SearchStockPools(query string, days int) ([]dto.StockPoolSearchResult, error) {
	stocks, err := s.repo.Search(query, days)
	if err != nil {
		return nil, err
	}

	// Group by symbol+pool_type+status, keep latest per group
	type key struct {
		symbol string
		pool   models.StockPoolType
		status string
	}
	latest := make(map[key]models.StockPool)
	symbolMeta := make(map[string]struct {
		name   string
		sector string
	})

	for _, st := range stocks {
		k := key{symbol: st.Symbol, pool: st.PoolType, status: st.Status}
		if existing, ok := latest[k]; !ok || st.TradeDate.After(existing.TradeDate) {
			latest[k] = st
		}
		if _, ok := symbolMeta[st.Symbol]; !ok {
			symbolMeta[st.Symbol] = struct {
				name   string
				sector string
			}{name: st.StockName, sector: st.SectorName}
		}
	}

	// Group by symbol
	symbolGroups := make(map[string][]dto.StockPoolEntry)
	for k, st := range latest {
		symbolGroups[k.symbol] = append(symbolGroups[k.symbol], dto.StockPoolEntry{
			PoolType:  k.pool,
			Status:    st.Status,
			Score:     st.Score,
			TradeDate: st.TradeDate.Format("2006-01-02"),
		})
	}

	var results []dto.StockPoolSearchResult
	for symbol, pools := range symbolGroups {
		meta := symbolMeta[symbol]
		results = append(results, dto.StockPoolSearchResult{
			Symbol:     symbol,
			StockName:  meta.name,
			SectorName: meta.sector,
			Pools:      pools,
		})
	}

	return results, nil
}

var poolTypeKeys = []models.StockPoolType{"short", "long", "macd_boll", "trend_following", "turnover_vol", "winner_mode", "mf_entry", "divergence_reversal"}

func (s *StockPoolService) GetTypeCounts() (map[string]int64, error) {
	counts := make(map[string]int64)
	for _, pt := range poolTypeKeys {
		count, err := s.repo.CountByType(pt, 1)
		if err != nil {
			return nil, err
		}
		counts[string(pt)] = count
	}
	return counts, nil
}

var strategyToPoolType = map[string]models.StockPoolType{
	"1. 短线黑马股":     "short",
	"2. 价值长线股":     "long",
	"3. 0轴金叉资金共振": "macd_boll",
	"4. MACD+BOLL趋势":  "trend_following",
	"5. 换手率+量比动能": "turnover_vol",
	"6. 模式赢家跟随":   "winner_mode",
	"7. 主力资金入场":   "mf_entry",
	"8. 分歧反包策略":   "divergence_reversal",
}

func (s *StockPoolService) GetStrategyStocks(strategyName string, tradeDate string, scoreMin int, scoreMax int, status string) (*dto.StrategyStocksResponse, error) {
	poolType, ok := strategyToPoolType[strategyName]
	if !ok {
		poolType = models.StockPoolType(strategyName)
	}

	stocks, err := s.repo.ListByScoreRange(poolType, tradeDate, scoreMin, scoreMax)
	if err != nil {
		return nil, err
	}

	if len(stocks) == 0 {
		return &dto.StrategyStocksResponse{
			StrategyName: strategyName,
			TradeDate:    tradeDate,
			BinKey:       "",
			Stocks:       []dto.StrategyStockDetail{},
		}, nil
	}

	targetDate, err := time.Parse("2006-01-02", tradeDate)
	if err != nil {
		return nil, err
	}

	symbols := make([]string, len(stocks))
	for i, st := range stocks {
		symbols[i] = st.Symbol
	}

	klines, err := s.klineRepo.GetNextTwoKlines(symbols, targetDate)
	if err != nil {
		return nil, err
	}

	var details []dto.StrategyStockDetail
	for _, st := range stocks {
		if status != "" && st.Status != status {
			continue
		}
		rows := klines[st.Symbol]
		if len(rows) < 2 {
			continue
		}
		todayKline := rows[0]
		nextKline := rows[1]

		details = append(details, dto.StrategyStockDetail{
			Symbol:     st.Symbol,
			StockName:  st.StockName,
			SectorName: st.SectorName,
			Score:      st.Score,
			Status:     st.Status,
			Notes:      st.Notes,
			CloseToday: todayKline.Close,
			OpenNext:   nextKline.Open,
			CloseNext:  nextKline.Close,
			IsWin:      nextKline.Close > todayKline.Close,
		})
	}

	binKey := fmt.Sprintf("%d-%d", scoreMin, scoreMax)

	return &dto.StrategyStocksResponse{
		StrategyName: strategyName,
		TradeDate:    tradeDate,
		BinKey:       binKey,
		Stocks:       details,
	}, nil
}

func (s *StockPoolService) GetStatusHeatmap(days int) (*dto.StatusHeatmapResponse, error) {
	if days <= 0 {
		days = 30
	}

	stocks, err := s.repo.List("turnover_vol", days, "")
	if err != nil {
		return nil, err
	}

	if len(stocks) == 0 {
		return &dto.StatusHeatmapResponse{
			StrategyName: "turnover_vol",
			Dates:        []string{},
			Statuses:     []string{"启动突破", "主升接力"},
			Heatmap:      []dto.StatusHeatmapCell{},
		}, nil
	}

	// Collect symbols and dates
	symbolDateMap := make(map[string]string) // symbol → trade_date
	symbols := make([]string, 0, len(stocks))
	seen := make(map[string]bool)
	for _, st := range stocks {
		key := st.Symbol + "|" + st.TradeDate.Format("2006-01-02")
		if seen[key] {
			continue
		}
		seen[key] = true
		symbolDateMap[st.Symbol] = st.TradeDate.Format("2006-01-02")
		symbols = append(symbols, st.Symbol)
	}

	// Get klines for each stock on its trade date
	type result struct {
		symbol string
		isWin  bool
		err    error
	}

	// Group stocks by trade_date and status
	type key struct {
		date   string
		status string
	}
	stats := make(map[key]struct {
		total int
		wins  int
	})

	// Process each stock
	for _, st := range stocks {
		if st.Status != "启动突破" && st.Status != "主升接力" {
			continue
		}
		ds := st.TradeDate.Format("2006-01-02")
		targetDate, err := time.Parse("2006-01-02", ds)
		if err != nil {
			continue
		}

		klines, err := s.klineRepo.GetNextTwoKlines([]string{st.Symbol}, targetDate)
		if err != nil || len(klines[st.Symbol]) < 2 {
			continue
		}

		rows := klines[st.Symbol]
		isWin := rows[1].Close > rows[0].Close

		k := key{date: ds, status: st.Status}
		entry := stats[k]
		entry.total++
		if isWin {
			entry.wins++
		}
		stats[k] = entry
	}

	// Collect unique dates and statuses
	dateSet := make(map[string]bool)
	statusSet := make(map[string]bool)
	for k := range stats {
		dateSet[k.date] = true
		statusSet[k.status] = true
	}

	var dates []string
	for d := range dateSet {
		dates = append(dates, d)
	}
	sort.Strings(dates)

	statuses := []string{"启动突破", "主升接力"} // fixed order

	var cells []dto.StatusHeatmapCell
	for _, d := range dates {
		for _, s := range statuses {
			k := key{date: d, status: s}
			if entry, ok := stats[k]; ok {
				wr := 0.0
				if entry.total > 0 {
					wr = float64(entry.wins) / float64(entry.total) * 100
				}
				cells = append(cells, dto.StatusHeatmapCell{
					TradeDate:   d,
					Status:      s,
					WinRate:     wr,
					TotalTrades: entry.total,
				})
			} else {
				cells = append(cells, dto.StatusHeatmapCell{
					TradeDate:   d,
					Status:      s,
					WinRate:     0,
					TotalTrades: 0,
				})
			}
		}
	}

	return &dto.StatusHeatmapResponse{
		StrategyName: "turnover_vol",
		Dates:        dates,
		Statuses:     statuses,
		Heatmap:      cells,
	}, nil
}

func (s *StockPoolService) GetStatusRanking(rawStrategy string, days int) (*dto.ModeRankingResponse, error) {
	if days <= 0 {
		days = 30
	}

	poolType := models.StockPoolType(rawStrategy)
	stocks, err := s.repo.List(poolType, days, "")
	if err != nil {
		return nil, err
	}

	type statusStat struct {
		total    int
		wins     int
		buckets  map[int]struct{ total, wins int }
	}
	statusMap := make(map[string]*statusStat)

	for _, st := range stocks {
		status := st.Status
		// Strip "赢家模式:" prefix if present
		status = strings.TrimPrefix(status, "赢家模式:")
		status = strings.TrimPrefix(status, "赢家模式：")
		if status == "" {
			continue
		}

		ds := st.TradeDate.Format("2006-01-02")
		targetDate, err := time.Parse("2006-01-02", ds)
		if err != nil {
			continue
		}

		klines, err := s.klineRepo.GetNextTwoKlines([]string{st.Symbol}, targetDate)
		if err != nil || len(klines[st.Symbol]) < 2 {
			continue
		}

		rows := klines[st.Symbol]
		isWin := rows[1].Close > rows[0].Close

		ss, ok := statusMap[status]
		if !ok {
			ss = &statusStat{buckets: make(map[int]struct{ total, wins int })}
			statusMap[status] = ss
		}
		ss.total++
		if isWin {
			ss.wins++
		}

		// Bucket by 10-point score range
		bucket := int(st.Score/10) * 10
		b := ss.buckets[bucket]
		b.total++
		if isWin {
			b.wins++
		}
		ss.buckets[bucket] = b
	}

	var items []dto.ModeRankingItem
	for status, ss := range statusMap {
		overallWR := 0.0
		if ss.total > 0 {
			overallWR = float64(ss.wins) / float64(ss.total) * 100
		}

		// Find best score bucket for this status
		bestBucket := 0
		bestBucketWR := 0.0
		bestBucketTotal := 0
		for bucket, b := range ss.buckets {
			if b.total < 2 { // require at least 2 trades in bucket
				continue
			}
			wr := float64(b.wins) / float64(b.total) * 100
			if wr > bestBucketWR || (wr == bestBucketWR && b.total > bestBucketTotal) {
				bestBucketWR = wr
				bestBucket = bucket
				bestBucketTotal = b.total
			}
		}

		bestRange := "-"
		if bestBucketTotal > 0 {
			bestRange = fmt.Sprintf("%d-%d", bestBucket, bestBucket+10)
		}

		items = append(items, dto.ModeRankingItem{
			Status:           status,
			TotalTrades:      ss.total,
			WinRate:          overallWR,
			BestScoreRange:   bestRange,
			BestScoreWinRate: bestBucketWR,
			BestScoreTrades:  bestBucketTotal,
		})
	}

	// Sort by total_trades desc
	sort.Slice(items, func(i, j int) bool {
		return items[i].TotalTrades > items[j].TotalTrades
	})

	return &dto.ModeRankingResponse{
		StrategyName: rawStrategy,
		Items:        items,
	}, nil
}

func (s *StockPoolService) GetModeRanking(days int) (*dto.ModeRankingResponse, error) {
	return s.GetStatusRanking("winner_mode", days)
}

func (s *StockPoolService) GetStatusScoreTrend(rawStrategy string, status string, scoreMin int, scoreMax int, days int) (*dto.StatusScoreTrendResponse, error) {
	if days <= 0 {
		days = 30
	}
	poolType := models.StockPoolType(rawStrategy)
	// Use List (which doesn't require exact trade_date) and filter by score range
	stocks, err := s.repo.List(poolType, days, "")
	if err != nil {
		return nil, err
	}

	// Filter by score range in code (top bin: score >= scoreMin, no upper bound)
	var filtered []models.StockPool
	for _, st := range stocks {
		if st.Score >= int64(scoreMin) && (scoreMax >= 100 || st.Score <= int64(scoreMax)) {
			filtered = append(filtered, st)
		}
	}
	stocks = filtered

	// Filter by status and group by date
	type dayStat struct{ total, wins int }
	dayMap := make(map[string]*dayStat)
	var dates []string
	dateSet := make(map[string]bool)

	for _, st := range stocks {
		if st.Status != status {
			continue
		}
		ds := st.TradeDate.Format("2006-01-02")
		if !dateSet[ds] {
			dates = append(dates, ds)
			dateSet[ds] = true
		}

		targetDate, err := time.Parse("2006-01-02", ds)
		if err != nil {
			continue
		}
		klines, err := s.klineRepo.GetNextTwoKlines([]string{st.Symbol}, targetDate)
		if err != nil || len(klines[st.Symbol]) < 2 {
			continue
		}
		isWin := klines[st.Symbol][1].Close > klines[st.Symbol][0].Close

		stat := dayMap[ds]
		if stat == nil {
			stat = &dayStat{}
			dayMap[ds] = stat
		}
		stat.total++
		if isWin {
			stat.wins++
		}
	}

	sort.Strings(dates)
	var trend []dto.StatusScoreTrendPoint
	for _, d := range dates {
		stat := dayMap[d]
		if stat == nil || stat.total == 0 {
			continue
		}
		wr := float64(stat.wins) / float64(stat.total) * 100
		trend = append(trend, dto.StatusScoreTrendPoint{
			TradeDate: d,
			WinRate:   wr,
			Total:     stat.total,
		})
	}

	scoreRange := fmt.Sprintf("%d-%d", scoreMin, scoreMax)
	return &dto.StatusScoreTrendResponse{
		StrategyName: rawStrategy,
		Status:       status,
		ScoreRange:   scoreRange,
		Trend:        trend,
	}, nil
}

func (s *StockPoolService) CalculateScore(stock *models.StockPool) {
	// TODO: Implement actual scoring logic based on signals and market data
	// Short-term: Fund inflow (30), Abnormal (20), Main theme (20), Technical (20), Sentiment (10)
	// Long-term: Sector space (30), Trend (30), Institutional fund (20), Valuation (10), Performance (10)

	// For now, keep it as it is or use a base score
	if stock.Score == 0 {
		stock.Score = 80
	}
}
