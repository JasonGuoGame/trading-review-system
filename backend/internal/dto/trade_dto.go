package dto

import "trading-review-system/backend/internal/models"

// --- Request DTOs ---

type CreateTradeRequest struct {
	Symbol          string  `json:"symbol" binding:"required"`
	Strategy        string  `json:"strategy"`
	SetupType       string  `json:"setup_type"`
	Direction       string  `json:"direction"`
	EntryDate       string  `json:"entry_date"`
	MarketCondition string  `json:"market_condition"`
	// Nested creation
	EntryDecision *CreateEntryDecisionRequest `json:"entry_decision,omitempty"`
	ExitPlan      *CreateExitPlanRequest      `json:"exit_plan,omitempty"`
}

type UpdateTradeRequest struct {
	Symbol          *string  `json:"symbol"`
	Strategy        *string  `json:"strategy"`
	SetupType       *string  `json:"setup_type"`
	Status          *string  `json:"status"`
	Direction       *string  `json:"direction"`
	EntryDate       *string  `json:"entry_date"`
	ExitDate        *string  `json:"exit_date"`
	TotalPnl        *float64 `json:"total_pnl"`
	TotalPnlPct     *float64 `json:"total_pnl_pct"`
	MaxDrawdown     *float64 `json:"max_drawdown"`
	HoldingDays     *int     `json:"holding_days"`
	ExecutionScore  *string  `json:"execution_score"`
	MarketCondition *string  `json:"market_condition"`
}

type TradeListQuery struct {
	Page      int    `form:"page,default=1"`
	Size      int    `form:"size,default=20"`
	Symbol    string `form:"symbol"`
	StartDate string `form:"start_date"`
	EndDate   string `form:"end_date"`
	Pnl       string `form:"pnl"` // win / loss / all
	Strategy  string `form:"strategy"`
	Score     string `form:"score"` // A/B/C/D
	Tag       string `form:"tag"`
	Status    string `form:"status"` // open / closed
}

type CreateOrderRequest struct {
	OrderType   string  `json:"order_type" binding:"required"`
	Price       float64 `json:"price" binding:"required"`
	Quantity    float64 `json:"quantity"`
	PositionPct float64 `json:"position_pct"`
	OrderDate   string  `json:"order_date"`
	Reason      string  `json:"reason"`
}

type UpdateOrderRequest struct {
	OrderType   *string  `json:"order_type"`
	Price       *float64 `json:"price"`
	Quantity    *float64 `json:"quantity"`
	PositionPct *float64 `json:"position_pct"`
	OrderDate   *string  `json:"order_date"`
	Reason      *string  `json:"reason"`
}

type CreateEntryDecisionRequest struct {
	Strategy   string          `json:"strategy"`
	SetupType  string          `json:"setup_type"`
	Signals    models.JSON     `json:"signals"`
	Indicators models.JSON     `json:"indicators"`
	Reason     string          `json:"reason"`
}

type CreateExitPlanRequest struct {
	StopLoss   float64     `json:"stop_loss"`
	TakeProfit float64     `json:"take_profit"`
	BatchPlan  models.JSON `json:"batch_plan"`
}

type UpsertReviewRequest struct {
	DidRight     string `json:"did_right"`
	Mistakes     string `json:"mistakes"`
	Improvements string `json:"improvements"`
	Replay       string `json:"replay"`
}

type CreateTagRequest struct {
	Name     string `json:"name" binding:"required"`
	Category string `json:"category"`
}

type SetTradeTagsRequest struct {
	TagIDs []uint `json:"tag_ids"`
}

// --- Response DTOs ---

type TradeDetailResponse struct {
	Trade         models.Trade          `json:"trade"`
	Orders        []models.Order        `json:"orders"`
	EntryDecision *models.EntryDecision `json:"entry_decision"`
	ExitPlan      *models.ExitPlan      `json:"exit_plan"`
	Tags          []models.Tag          `json:"tags"`
	Review        *models.Review        `json:"review"`
}

type PaginatedResponse struct {
	Data       interface{} `json:"data"`
	Total      int64       `json:"total"`
	Page       int         `json:"page"`
	Size       int         `json:"size"`
	TotalPages int         `json:"total_pages"`
}

type APIResponse struct {
	Code    int         `json:"code"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}
