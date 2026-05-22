package dto

import "trading-review-system/backend/internal/models"

type AbnormalCapitalQuery struct {
	TradeDate     string  `form:"trade_date"`
	Days          int     `form:"days,default=1"`
	MinVolRatio   float64 `form:"min_vol_ratio,default=0"`
	MinSurgeCount int     `form:"min_surge_count,default=0"`
	MinSurgeRet   float64 `form:"min_surge_ret,default=0"`
	SectorName    string  `form:"sector_name"`
	Sort          string  `form:"sort,default=score"` // vol_ratio, surge_count, max_surge_ret, score
	Keyword       string  `form:"keyword"`             // search by symbol or name
}

type SectorStat struct {
	SectorName  string  `json:"sector_name"`
	Count       int     `json:"count"`
	AvgVolRatio float64 `json:"avg_vol_ratio"`
	StrongCount int     `json:"strong_count"`
}

type AbnormalCapitalSummary struct {
	TotalStocks   int          `json:"total_stocks"`
	StrongStocks  int          `json:"strong_stocks"`
	AvgVolRatio   float64      `json:"avg_vol_ratio"`
	AvgSurgeCount float64      `json:"avg_surge_count"`
	SectorStats   []SectorStat `json:"sector_stats"`
}

type AbnormalCapitalResponse struct {
	Data    []models.StkCapitalAbnormal `json:"data"`
	Summary AbnormalCapitalSummary      `json:"summary"`
}
