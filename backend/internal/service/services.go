package service

import (
	"trading-review-system/backend/internal/config"
	"trading-review-system/backend/internal/repository"
)

type Services struct {
	Trade     *TradeService
	Order     *OrderService
	Tag       *TagService
	Dashboard     *DashboardService
	Analysis      *AnalysisService
	DailyReview   *DailyReviewService
	MarketBreadth *MarketBreadthService
	Abnormal      *AbnormalService
	FundFlow      *FundFlowService
	StockPool     *StockPoolService
}

func NewServices(repos *repository.Repositories, cfg *config.Config) *Services {
	return &Services{
		Trade:         NewTradeService(repos),
		Order:         NewOrderService(repos),
		Tag:           NewTagService(repos.Tag),
		Dashboard:     NewDashboardService(repos),
		Analysis:      NewAnalysisService(repos),
		DailyReview:   NewDailyReviewService(repos.DailyReview),
		MarketBreadth: NewMarketBreadthService(repos.MarketBreadth),
		Abnormal:      NewAbnormalService(repos.Abnormal),
		FundFlow:      NewFundFlowService(repos.FundFlow, cfg.SectorBlacklist),
		StockPool:     NewStockPoolService(repos.StockPool, repos.FundFlow),
	}
}
