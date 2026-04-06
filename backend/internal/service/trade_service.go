package service

import (
	"fmt"
	"time"

	"trading-review-system/backend/internal/dto"
	"trading-review-system/backend/internal/models"
	"trading-review-system/backend/internal/repository"
)

type TradeService struct {
	repos *repository.Repositories
}

func NewTradeService(repos *repository.Repositories) *TradeService {
	return &TradeService{repos: repos}
}

func (s *TradeService) CreateTrade(req dto.CreateTradeRequest) (*models.Trade, error) {
	trade := &models.Trade{
		Symbol:          req.Symbol,
		Strategy:        req.Strategy,
		SetupType:       req.SetupType,
		Status:          "open",
		Direction:       req.Direction,
		MarketCondition: req.MarketCondition,
	}

	if req.Direction == "" {
		trade.Direction = "long"
	}

	if req.EntryDate != "" {
		t, err := time.Parse("2006-01-02", req.EntryDate)
		if err != nil {
			return nil, fmt.Errorf("invalid entry_date format: %w", err)
		}
		trade.EntryDate = &t
	}

	if err := s.repos.Trade.Create(trade); err != nil {
		return nil, err
	}

	// Create entry decision if provided
	if req.EntryDecision != nil {
		ed := &models.EntryDecision{
			TradeID:    trade.ID,
			Strategy:   req.EntryDecision.Strategy,
			SetupType:  req.EntryDecision.SetupType,
			Signals:    req.EntryDecision.Signals,
			Indicators: req.EntryDecision.Indicators,
			Reason:     req.EntryDecision.Reason,
		}
		if err := s.repos.EntryDecision.Upsert(ed); err != nil {
			return nil, err
		}
	}

	// Create exit plan if provided
	if req.ExitPlan != nil {
		ep := &models.ExitPlan{
			TradeID:    trade.ID,
			StopLoss:   req.ExitPlan.StopLoss,
			TakeProfit: req.ExitPlan.TakeProfit,
			BatchPlan:  req.ExitPlan.BatchPlan,
		}
		if err := s.repos.ExitPlan.Upsert(ep); err != nil {
			return nil, err
		}
	}

	return trade, nil
}

func (s *TradeService) GetTradeDetail(id uint) (*dto.TradeDetailResponse, error) {
	trade, err := s.repos.Trade.FindByIDWithAssociations(id)
	if err != nil {
		return nil, err
	}
	fmt.Printf("=======当前想取的trade是:%v", trade)
	resp := &dto.TradeDetailResponse{
		Trade:         *trade,
		Orders:        trade.Orders,
		EntryDecision: trade.EntryDecision,
		ExitPlan:      trade.ExitPlan,
		Tags:          trade.Tags,
		Review:        trade.Review,
	}

	// Clean up nested data from trade object
	resp.Trade.Orders = nil
	resp.Trade.EntryDecision = nil
	resp.Trade.ExitPlan = nil
	resp.Trade.Tags = nil
	resp.Trade.Review = nil
	fmt.Printf("=======当前想取的trade resp是:%v", resp)
	return resp, nil
}

func (s *TradeService) ListTrades(query dto.TradeListQuery) (*dto.PaginatedResponse, error) {
	if query.Page < 1 {
		query.Page = 1
	}
	if query.Size < 1 || query.Size > 100 {
		query.Size = 20
	}

	trades, total, err := s.repos.Trade.FindWithFilters(query)
	if err != nil {
		return nil, err
	}

	totalPages := int(total) / query.Size
	if int(total)%query.Size > 0 {
		totalPages++
	}

	return &dto.PaginatedResponse{
		Data:       trades,
		Total:      total,
		Page:       query.Page,
		Size:       query.Size,
		TotalPages: totalPages,
	}, nil
}

func (s *TradeService) UpdateTrade(id uint, req dto.UpdateTradeRequest) (*models.Trade, error) {
	trade, err := s.repos.Trade.FindByID(id)
	if err != nil {
		return nil, err
	}

	if req.Symbol != nil {
		trade.Symbol = *req.Symbol
	}
	if req.Strategy != nil {
		trade.Strategy = *req.Strategy
	}
	if req.SetupType != nil {
		trade.SetupType = *req.SetupType
	}
	if req.Status != nil {
		trade.Status = *req.Status
	}
	if req.Direction != nil {
		trade.Direction = *req.Direction
	}
	if req.EntryDate != nil {
		t, err := time.Parse("2006-01-02", *req.EntryDate)
		if err == nil {
			trade.EntryDate = &t
		}
	}
	if req.ExitDate != nil {
		t, err := time.Parse("2006-01-02", *req.ExitDate)
		if err == nil {
			trade.ExitDate = &t
		}
	}
	if req.TotalPnl != nil {
		trade.TotalPnl = *req.TotalPnl
	}
	if req.TotalPnlPct != nil {
		trade.TotalPnlPct = *req.TotalPnlPct
	}
	if req.MaxDrawdown != nil {
		trade.MaxDrawdown = *req.MaxDrawdown
	}
	if req.HoldingDays != nil {
		trade.HoldingDays = *req.HoldingDays
	}
	if req.ExecutionScore != nil {
		trade.ExecutionScore = *req.ExecutionScore
	}
	if req.MarketCondition != nil {
		trade.MarketCondition = *req.MarketCondition
	}

	if err := s.repos.Trade.Update(trade); err != nil {
		return nil, err
	}

	return trade, nil
}

func (s *TradeService) DeleteTrade(id uint) error {
	return s.repos.Trade.Delete(id)
}

func (s *TradeService) UpsertEntryDecision(tradeID uint, req dto.CreateEntryDecisionRequest) error {
	ed := &models.EntryDecision{
		TradeID:    tradeID,
		Strategy:   req.Strategy,
		SetupType:  req.SetupType,
		Signals:    req.Signals,
		Indicators: req.Indicators,
		Reason:     req.Reason,
	}
	return s.repos.EntryDecision.Upsert(ed)
}

func (s *TradeService) UpsertExitPlan(tradeID uint, req dto.CreateExitPlanRequest) error {
	ep := &models.ExitPlan{
		TradeID:    tradeID,
		StopLoss:   req.StopLoss,
		TakeProfit: req.TakeProfit,
		BatchPlan:  req.BatchPlan,
	}
	return s.repos.ExitPlan.Upsert(ep)
}

func (s *TradeService) UpsertReview(tradeID uint, req dto.UpsertReviewRequest) error {
	review := &models.Review{
		TradeID:      tradeID,
		DidRight:     req.DidRight,
		Mistakes:     req.Mistakes,
		Improvements: req.Improvements,
		Replay:       req.Replay,
	}
	return s.repos.Review.Upsert(review)
}

func (s *TradeService) SetTradeTags(tradeID uint, tagIDs []uint) error {
	return s.repos.Trade.ReplaceTagsForTrade(tradeID, tagIDs)
}
