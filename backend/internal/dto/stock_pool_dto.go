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
}

type UpdateStockPoolStatusRequest struct {
	Status string `json:"status" binding:"required"`
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
	Notes      string               `json:"notes"`
	Signals    []models.StockPoolSignal `json:"signals"`
	FundFlow   interface{}          `json:"fund_flow"` // Can be detailed fund flow data
}
