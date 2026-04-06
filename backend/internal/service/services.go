package service

import "trading-review-system/backend/internal/repository"

type Services struct {
	Trade     *TradeService
	Order     *OrderService
	Tag       *TagService
	Dashboard *DashboardService
	Analysis  *AnalysisService
}

func NewServices(repos *repository.Repositories) *Services {
	return &Services{
		Trade:     NewTradeService(repos),
		Order:     NewOrderService(repos.Order),
		Tag:       NewTagService(repos.Tag),
		Dashboard: NewDashboardService(repos),
		Analysis:  NewAnalysisService(repos),
	}
}
