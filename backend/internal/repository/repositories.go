package repository

import "gorm.io/gorm"

type Repositories struct {
	Trade         *TradeRepository
	Order         *OrderRepository
	Tag           *TagRepository
	Review        *ReviewRepository
	EntryDecision *EntryDecisionRepository
	ExitPlan      *ExitPlanRepository
}

func NewRepositories(db *gorm.DB) *Repositories {
	return &Repositories{
		Trade:         NewTradeRepository(db),
		Order:         NewOrderRepository(db),
		Tag:           NewTagRepository(db),
		Review:        NewReviewRepository(db),
		EntryDecision: NewEntryDecisionRepository(db),
		ExitPlan:      NewExitPlanRepository(db),
	}
}
