package router

import (
	"trading-review-system/backend/internal/handler"
	"trading-review-system/backend/internal/middleware"

	"github.com/gin-gonic/gin"
)

func Setup(handlers *handler.Handlers, mw *middleware.Middleware) *gin.Engine {
	r := gin.New()

	// Global middleware
	r.Use(mw.Logger())
	r.Use(mw.Recovery())
	r.Use(mw.CORS())

	// Health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// API routes
	api := r.Group("/api")
	{
		// Trades
		trades := api.Group("/trades")
		{
			trades.GET("", handlers.Trade.List)
			trades.POST("", handlers.Trade.Create)
			trades.GET("/:id", handlers.Trade.GetByID)
			trades.PUT("/:id", handlers.Trade.Update)
			trades.DELETE("/:id", handlers.Trade.Delete)

			// Trade sub-resources
			trades.POST("/:id/orders", handlers.Order.Create)
			trades.PUT("/:id/entry-decision", handlers.Trade.UpsertEntryDecision)
			trades.PUT("/:id/exit-plan", handlers.Trade.UpsertExitPlan)
			trades.PUT("/:id/tags", handlers.Trade.SetTags)
			trades.PUT("/:id/review", handlers.Review.Upsert)
		}

		// Orders (standalone)
		api.PUT("/orders/:id", handlers.Order.Update)
		api.DELETE("/orders/:id", handlers.Order.Delete)

		// Tags
		tags := api.Group("/tags")
		{
			tags.GET("", handlers.Tag.List)
			tags.POST("", handlers.Tag.Create)
		}

		// Dashboard
		dashboard := api.Group("/dashboard")
		{
			dashboard.GET("/summary", handlers.Dashboard.GetSummary)
			dashboard.GET("/equity-curve", handlers.Dashboard.GetEquityCurve)
			dashboard.GET("/win-rate", handlers.Dashboard.GetWinRate)
			dashboard.GET("/recent-trades", handlers.Dashboard.GetRecentTrades)
			dashboard.GET("/prediction-accuracy", handlers.Dashboard.GetPredictionAccuracy)
			dashboard.GET("/prediction-details", handlers.Dashboard.GetPredictionDetails)
		}

		// Analysis
		analysis := api.Group("/analysis")
		{
			analysis.GET("/signals", handlers.Analysis.GetSignalStats)
			analysis.GET("/tags", handlers.Analysis.GetTagStats)
			analysis.GET("/market", handlers.Analysis.GetMarketStats)
			analysis.GET("/execution", handlers.Analysis.GetExecutionStats)
			analysis.GET("/emotion", handlers.Analysis.GetEmotionStats)
			analysis.GET("/mistakes", handlers.Analysis.GetMistakeStats)
		}

		// Daily Reviews
		api.GET("/daily-reviews/:date", handlers.DailyReview.GetByDate)
		api.PUT("/daily-reviews/:date", handlers.DailyReview.Upsert)

		// Market Breadth
		api.GET("/market-breadth/:date", handlers.MarketBreadth.GetByDate)
		api.PUT("/market-breadth/:date", handlers.MarketBreadth.Upsert)
		api.GET("/market-breadth/top-sectors", handlers.MarketBreadth.GetTopSectorScores)

		// Abnormal Capital
		api.GET("/abnormal-capital/sectors", handlers.Abnormal.GetSectors)
		api.GET("/abnormal-capital", handlers.Abnormal.GetAbnormalCapital)

		// Sector Fund Flow
		api.GET("/sector-fund-flow", handlers.FundFlow.GetFundFlow)
		api.GET("/sector-fund-flow/trend", handlers.FundFlow.GetFundFlowTrend)

		// Stock Pool
		stockPool := api.Group("/stock-pool")
		{
			stockPool.GET("", handlers.StockPool.List)
			stockPool.GET("/counts", handlers.StockPool.GetTypeCounts)
			stockPool.POST("", handlers.StockPool.Create)
			stockPool.PUT("/status", handlers.StockPool.UpdateStatus)
			stockPool.PUT("/watch-focus", handlers.StockPool.SetWatchFocus)
			stockPool.PUT("/prediction", handlers.StockPool.UpdatePrediction)
			stockPool.DELETE("", handlers.StockPool.Delete)
			stockPool.GET("/search", handlers.StockPool.Search)
			stockPool.GET("/:symbol/detail", handlers.StockPool.GetDetail)
		}

		// Market Earning Effect
		api.GET("/market-earning-effect", handlers.MarketEarning.GetLatest)

		// Strategy Performance
		api.GET("/strategy-performance", handlers.StrategyPerf.GetDashboard)
		api.GET("/strategy-analysis/trend", handlers.ScoreAnalysis.GetTrend)
		api.GET("/strategy-analysis/market-breadth-buckets", handlers.ScoreAnalysis.GetMarketBreadthBuckets)
		api.GET("/strategy-analysis/stocks", handlers.StockPool.GetStrategyStocks)
	api.GET("/strategy-analysis/advancer-bucket-stocks", handlers.StockPool.GetAdvancerBucketStocks)
		api.GET("/strategy-analysis/status-heatmap", handlers.StockPool.GetStatusHeatmap)
		api.GET("/strategy-analysis/mode-ranking", handlers.StockPool.GetModeRanking)
		api.GET("/strategy-analysis/status-ranking", handlers.StockPool.GetStatusRanking)
		api.GET("/strategy-analysis/status-score-trend", handlers.StockPool.GetStatusScoreTrend)

		// Trade Checklist
		api.GET("/trade-checklist/:date", handlers.TradeChecklist.GetByDate)
		api.PUT("/trade-checklist/:date", handlers.TradeChecklist.Upsert)

		// Market Attack
		marketAttack := api.Group("/market-attack")
		{
			marketAttack.GET("/top", handlers.MarketAttack.GetTopAttacks)
			marketAttack.GET("/sector/:name", handlers.MarketAttack.GetSectorDetail)
			marketAttack.GET("/trend", handlers.MarketAttack.GetSectorTrend)
		marketAttack.GET("/top-volume", handlers.MarketAttack.GetTopVolume)
		marketAttack.GET("/limit-summary", handlers.MarketAttack.GetLimitSummary)
		marketAttack.GET("/limit-stocks", handlers.MarketAttack.GetLimitStocks)
	}

	// RAG AI Analysis
	rag := api.Group("/rag")
	{
		rag.POST("/analyze", handlers.Rag.Analyze)
		rag.GET("/hot-topics", handlers.Rag.GetHotTopics)
		rag.GET("/authors", handlers.Rag.GetAuthors)
		rag.GET("/system-status", handlers.Rag.GetSystemStatus)
	}

	// Chip Monitor
	chipMonitor := api.Group("/chip-monitor")
	{
		chipMonitor.GET("/latest-date", handlers.ChipMonitor.GetLatestDate)
			chipMonitor.GET("/radar", handlers.ChipMonitor.GetRadar)
		chipMonitor.GET("/accumulation", handlers.ChipMonitor.GetAccumulation)
		chipMonitor.GET("/peak-move", handlers.ChipMonitor.GetPeakMove)
		chipMonitor.GET("/divergence", handlers.ChipMonitor.GetDivergence)
		chipMonitor.GET("/distribution", handlers.ChipMonitor.GetDistribution)
			chipMonitor.GET("/search", handlers.ChipMonitor.SearchStock)
	}

	// Sector Sentiment
	sectorSentiment := api.Group("/sector-sentiment")
	{
		sectorSentiment.GET("/latest-date", handlers.SectorSentiment.GetLatestDate)
		sectorSentiment.GET("/consistent-strength", handlers.SectorSentiment.GetConsistentStrength)
		sectorSentiment.GET("/new-faces", handlers.SectorSentiment.GetNewFaces)
		sectorSentiment.GET("/ice-recovery", handlers.SectorSentiment.GetIceRecovery)
		sectorSentiment.GET("/divergence", handlers.SectorSentiment.GetDivergence)
		sectorSentiment.GET("/concentration", handlers.SectorSentiment.GetConcentration)
		sectorSentiment.GET("/full-report", handlers.SectorSentiment.GetFullReport)
		sectorSentiment.GET("/sectors", handlers.SectorSentiment.GetSectors)
		sectorSentiment.GET("/climbing-sectors", handlers.SectorSentiment.GetClimbingSectors)
		sectorSentiment.GET("/sector-drift", handlers.SectorSentiment.GetSectorDrift)
			sectorSentiment.GET("/new-high-stocks", handlers.SectorSentiment.GetNewHighStocks)
	}

	// Research Lab
	researchLab := api.Group("/research-lab")
	{
		researchLab.GET("/saved", handlers.ResearchSql.ListSaved)
		researchLab.POST("/saved", handlers.ResearchSql.CreateSaved)
		researchLab.PUT("/saved/:id", handlers.ResearchSql.UpdateSaved)
		researchLab.DELETE("/saved/:id", handlers.ResearchSql.DeleteSaved)
		researchLab.POST("/execute", handlers.ResearchSql.Execute)
		researchLab.GET("/history", handlers.ResearchSql.ListHistory)
		researchLab.DELETE("/history", handlers.ResearchSql.ClearHistory)
	}
}

return r
}
