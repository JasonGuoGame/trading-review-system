package service

import (
	"gorm.io/gorm"

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
	MarketAttack  *MarketAttackService
	MarketEarning *MarketEarningService
	StrategyPerf  *StrategyPerformanceService
	ScoreAnalysis  *StrategyScoreAnalysisService
	TradeChecklist *TradeChecklistService
	ChipMonitor     *ChipMonitorService
	ResearchSql     *ResearchSqlService
	SectorSentiment *SectorSentimentService
	Rag             *RagService
}

func NewServices(repos *repository.Repositories, cfg *config.Config, db *gorm.DB) *Services {
	return &Services{
		Trade:         NewTradeService(repos),
		Order:         NewOrderService(repos),
		Tag:           NewTagService(repos.Tag),
		Dashboard:     NewDashboardService(repos),
		Analysis:      NewAnalysisService(repos),
		DailyReview:   NewDailyReviewService(repos.DailyReview),
		MarketBreadth: NewMarketBreadthService(repos.MarketBreadth),
		Abnormal:      NewAbnormalService(repos.Abnormal, cfg.SectorBlacklist),
		FundFlow:      NewFundFlowService(repos.FundFlow, cfg.SectorBlacklist),
		StockPool:     NewStockPoolService(repos.StockPool, repos.FundFlow, repos.Kline),
		MarketAttack:  NewMarketAttackService(repos.MarketAttack, cfg.SectorBlacklist),
		MarketEarning: NewMarketEarningService(repos.MarketEarning),
		StrategyPerf:  NewStrategyPerformanceService(repos.StrategyPerf, repos.ScoreAnalysis, repos.StockPool, repos.Kline, repos.MarketBreadth),
		ScoreAnalysis:  NewStrategyScoreAnalysisService(repos.ScoreAnalysis, repos.StockPool, repos.Kline, repos.MarketBreadth),
		TradeChecklist: NewTradeChecklistService(repos.TradeChecklist),
		ChipMonitor:     NewChipMonitorService(repos.ChipMonitor, repos.Kline),
		ResearchSql:     NewResearchSqlService(repos.ResearchSql),
		SectorSentiment: NewSectorSentimentService(repos.SectorSentiment),
		Rag:             NewRagService(cfg, db),
	}
}
