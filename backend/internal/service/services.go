package service

import "trading-review-system/backend/internal/repository"

type Services struct {
	Trade     *TradeService
	Order     *OrderService
	Tag       *TagService
	Dashboard     *DashboardService
	Analysis      *AnalysisService
	DailyReview   *DailyReviewService
	MarketBreadth *MarketBreadthService
}

func NewServices(repos *repository.Repositories) *Services {
	return &Services{
		Trade:         NewTradeService(repos),
		Order:         NewOrderService(repos),
		Tag:           NewTagService(repos.Tag),
		Dashboard:     NewDashboardService(repos),
		Analysis:      NewAnalysisService(repos),
		DailyReview:   NewDailyReviewService(repos.DailyReview),
		MarketBreadth: NewMarketBreadthService(repos.MarketBreadth),
	}
}
