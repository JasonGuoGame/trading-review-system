package service

import (
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

func (s *StockPoolService) GetStockPool(poolType models.StockPoolType) ([]dto.StockPoolResponse, error) {
	stocks, err := s.repo.List(poolType)
	if err != nil {
		return nil, err
	}

	responses := make([]dto.StockPoolResponse, len(stocks))
	for i, stock := range stocks {
		responses[i] = dto.StockPoolResponse{
			StockPool: stock,
		}
	}
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

func (s *StockPoolService) UpdateStatus(id uint, status string) error {
	stock, err := s.repo.GetByID(id)
	if err != nil {
		return err
	}
	stock.Status = status
	return s.repo.Update(stock)
}

func (s *StockPoolService) DeleteStock(id uint) error {
	return s.repo.Delete(id)
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

func (s *StockPoolService) CalculateScore(stock *models.StockPool) {
	// TODO: Implement actual scoring logic based on signals and market data
	// Short-term: Fund inflow (30), Abnormal (20), Main theme (20), Technical (20), Sentiment (10)
	// Long-term: Sector space (30), Trend (30), Institutional fund (20), Valuation (10), Performance (10)
	
	// For now, keep it as it is or use a base score
	if stock.Score == 0 {
		stock.Score = 80
	}
}
