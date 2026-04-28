package dto

import "trading-review-system/backend/internal/models"

type AbnormalCapitalQuery struct {
	TradeDate     string  `form:"trade_date"`
	MinVolRatio   float64 `form:"min_vol_ratio,default=0"`
	MinSurgeCount int     `form:"min_surge_count,default=0"`
	MinSurgeRet   float64 `form:"min_surge_ret,default=0"`
	Sort          string  `form:"sort,default=vol_ratio"` // vol_ratio, surge_count, max_surge_ret, score
}

type AbnormalCapitalSummary struct {
	TotalStocks int     `json:"total_stocks"`
	StrongStocks int    `json:"strong_stocks"`
	AvgVolRatio float64 `json:"avg_vol_ratio"`
	AvgSurgeCount float64 `json:"avg_surge_count"`
}

type AbnormalCapitalResponse struct {
	Data    []models.StkCapitalAbnormal `json:"data"`
	Summary AbnormalCapitalSummary      `json:"summary"`
}
