package service

import (
	"sort"
	"time"
	"trading-review-system/backend/internal/dto"
	"trading-review-system/backend/internal/models"
	"trading-review-system/backend/internal/repository"
)

type StockPoolService struct {
	repo      *repository.StockPoolRepository
	fundRepo  *repository.FundFlowRepository
}

func NewStockPoolService(repo *repository.StockPoolRepository, fundRepo *repository.FundFlowRepository) *StockPoolService {
	return &StockPoolService{
		repo:     repo,
		fundRepo: fundRepo,
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

func (s *StockPoolService) CalculateScore(stock *models.StockPool) {
	// TODO: Implement actual scoring logic based on signals and market data
	// Short-term: Fund inflow (30), Abnormal (20), Main theme (20), Technical (20), Sentiment (10)
	// Long-term: Sector space (30), Trend (30), Institutional fund (20), Valuation (10), Performance (10)

	// For now, keep it as it is or use a base score
	if stock.Score == 0 {
		stock.Score = 80
	}
}
