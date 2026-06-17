package dto

// --- Dashboard DTOs ---

type DashboardSummary struct {
	TotalPnl    float64 `json:"total_pnl"`
	WinRate     float64 `json:"win_rate"`
	MaxDrawdown float64 `json:"max_drawdown"`
	TradeCount  int64   `json:"trade_count"`
	WinCount    int64   `json:"win_count"`
	LossCount   int64   `json:"loss_count"`
}

type EquityCurvePoint struct {
	Date       string  `json:"date"`
	CumulativePnl float64 `json:"cumulative_pnl"`
}

type WinRatePoint struct {
	Date    string  `json:"date"`
	WinRate float64 `json:"win_rate"`
}

type ScoreDistribution struct {
	Score string `json:"score"`
	Count int64  `json:"count"`
}

type WinRateResponse struct {
	Trend        []WinRatePoint      `json:"trend"`
	Distribution []ScoreDistribution `json:"distribution"`
}

type PredictionTypeAccuracy struct {
	PredictionFlag int8    `json:"prediction_flag"`
	Label          string  `json:"label"`
	Total          int64   `json:"total"`
	Correct        int64   `json:"correct"`
	Accuracy       float64 `json:"accuracy"`
}

type PredictionAccuracyPoint struct {
	Date     string  `json:"date"`
	Accuracy float64 `json:"accuracy"`
	Total    int64   `json:"total"`
}

type PredictionAccuracyResponse struct {
	TotalPredictions   int64                     `json:"total_predictions"`
	CorrectPredictions int64                     `json:"correct_predictions"`
	OverallAccuracy    float64                   `json:"overall_accuracy"`
	ByType             []PredictionTypeAccuracy  `json:"by_type"`
	Trend              []PredictionAccuracyPoint `json:"trend"`
}

type PredictionDetail struct {
	Symbol           string  `json:"symbol"`
	StockName        string  `json:"stock_name"`
	SectorName       string  `json:"sector_name"`
	TradeDate        string  `json:"trade_date"`
	PredictionFlag   int8    `json:"prediction_flag"`
	PredictionLabel  string  `json:"prediction_label"`
	PredictionDetail string  `json:"prediction_detail"`
	Viewpoint        string  `json:"viewpoint"`
	CloseToday       float64 `json:"close_today"`
	CloseNext        float64 `json:"close_next"`
	PctChange        float64 `json:"pct_change"`
	IsCorrect        bool    `json:"is_correct"`
}
