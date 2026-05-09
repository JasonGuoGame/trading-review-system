package handler

import "trading-review-system/backend/internal/service"

type Handlers struct {
	Trade     *TradeHandler
	Order     *OrderHandler
	Tag       *TagHandler
	Review    *ReviewHandler
	Dashboard     *DashboardHandler
	Analysis      *AnalysisHandler
	DailyReview   *DailyReviewHandler
	MarketBreadth *MarketBreadthHandler
	Abnormal      *AbnormalHandler
	FundFlow      *FundFlowHandler
}

func NewHandlers(services *service.Services) *Handlers {
	return &Handlers{
		Trade:         NewTradeHandler(services.Trade),
		Order:         NewOrderHandler(services.Order),
		Tag:           NewTagHandler(services.Tag),
		Review:        NewReviewHandler(services.Trade),
		Dashboard:     NewDashboardHandler(services.Dashboard),
		Analysis:      NewAnalysisHandler(services.Analysis),
		DailyReview:   NewDailyReviewHandler(services.DailyReview),
		MarketBreadth: NewMarketBreadthHandler(services.MarketBreadth),
		Abnormal:      NewAbnormalHandler(services.Abnormal),
		FundFlow:      NewFundFlowHandler(services.FundFlow),
	}
}
