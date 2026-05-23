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
			stockPool.POST("", handlers.StockPool.Create)
			stockPool.PUT("/status", handlers.StockPool.UpdateStatus)
			stockPool.DELETE("", handlers.StockPool.Delete)
			stockPool.GET("/search", handlers.StockPool.Search)
			stockPool.GET("/:symbol/detail", handlers.StockPool.GetDetail)
		}

		// Market Earning Effect
		api.GET("/market-earning-effect", handlers.MarketEarning.GetLatest)

		// Market Attack
		marketAttack := api.Group("/market-attack")
		{
			marketAttack.GET("/top", handlers.MarketAttack.GetTopAttacks)
			marketAttack.GET("/sector/:name", handlers.MarketAttack.GetSectorDetail)
			marketAttack.GET("/trend", handlers.MarketAttack.GetSectorTrend)
		}
	}

	return r
}
