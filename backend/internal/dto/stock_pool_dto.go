package dto

import "trading-review-system/backend/internal/models"

type StockPoolResponse struct {
	models.StockPool
	Signals []models.StockPoolSignal `json:"signals,omitempty"`
}

type CreateStockPoolRequest struct {
	Symbol     string               `json:"symbol" binding:"required"`
	StockName  string               `json:"stock_name" binding:"required"`
	PoolType   models.StockPoolType `json:"pool_type" binding:"required"`
	SectorName string               `json:"sector_name"`
	Status     string               `json:"status"`
	Notes      string               `json:"notes"`
	Tags       string               `json:"tags"`
}

type UpdateStockPoolStatusRequest struct {
	Status string `json:"status" binding:"required"`
}

type UpdatePredictionRequest struct {
	PredictionFlag   int8   `json:"prediction_flag"`
	PredictionDetail string `json:"prediction_detail"`
	Viewpoint        string `json:"viewpoint"`
}

type StockPoolSearchResult struct {
	Symbol      string               `json:"symbol"`
	StockName   string               `json:"stock_name"`
	SectorName  string               `json:"sector_name"`
	Pools       []StockPoolEntry     `json:"pools"`
}

type StockPoolEntry struct {
	PoolType  models.StockPoolType `json:"pool_type"`
	Status    string               `json:"status"`
	Score     int64                `json:"score"`
	TradeDate string               `json:"trade_date"`
}

type StockPoolDetailResponse struct {
	Symbol     string               `json:"symbol"`
	StockName  string               `json:"stock_name"`
	PoolType   models.StockPoolType `json:"pool_type"`
	SectorName string               `json:"sector_name"`
	Score      int64                `json:"score"`
	Status     string               `json:"status"`
	Notes            string                  `json:"notes"`
	PredictionFlag   int8                    `json:"prediction_flag"`
	PredictionDetail string                  `json:"prediction_detail"`
	Viewpoint        string                  `json:"viewpoint"`
	Signals          []models.StockPoolSignal `json:"signals"`
	FundFlow   interface{}          `json:"fund_flow"` // Can be detailed fund flow data
}

// AdvancerBucketStock is a stock_pool entry enriched with kline performance data.
type AdvancerBucketStock struct {
	Symbol     string  `json:"symbol"`
	StockName  string  `json:"stock_name"`
	TradeDate  string  `json:"trade_date"`
	Score      int64   `json:"score"`
	Status     string  `json:"status"`
	EntryClose float64 `json:"entry_close"`
	ExitClose  float64 `json:"exit_close"`
	ReturnPct  float64 `json:"return_pct"`
	IsWin      bool    `json:"is_win"`
	HasKline   bool    `json:"has_kline"` // false if kline data not available yet
}
