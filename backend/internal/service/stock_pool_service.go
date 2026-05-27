package service

import (
	"fmt"
	"sort"
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

func (s *StockPoolService) GetStockPool(poolType models.StockPoolType, days int) ([]dto.StockPoolResponse, error) {
	stocks, err := s.repo.List(poolType, days)
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

func (s *StockPoolService) SearchStockPools(query string) ([]dto.StockPoolSearchResult, error) {
	stocks, err := s.repo.Search(query)
	if err != nil {
		return nil, err
	}

	// Group by symbol, then collect unique pool_type entries (latest per pool_type)
	type key struct {
		symbol string
		pool   models.StockPoolType
	}
	latest := make(map[key]models.StockPool)
	symbolMeta := make(map[string]struct {
		name   string
		sector string
	})

	for _, st := range stocks {
		k := key{symbol: st.Symbol, pool: st.PoolType}
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

var poolTypeKeys = []models.StockPoolType{"short", "long", "macd_boll", "trend_following", "turnover_vol", "winner_mode"}

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
}

func (s *StockPoolService) GetStrategyStocks(strategyName string, tradeDate string, scoreMin int, scoreMax int) (*dto.StrategyStocksResponse, error) {
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

func (s *StockPoolService) CalculateScore(stock *models.StockPool) {
	// TODO: Implement actual scoring logic based on signals and market data
	// Short-term: Fund inflow (30), Abnormal (20), Main theme (20), Technical (20), Sentiment (10)
	// Long-term: Sector space (30), Trend (30), Institutional fund (20), Valuation (10), Performance (10)

	// For now, keep it as it is or use a base score
	if stock.Score == 0 {
		stock.Score = 80
	}
}
