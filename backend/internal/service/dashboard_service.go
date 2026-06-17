package service

import (
	"math"
	"sort"
	"time"

	"trading-review-system/backend/internal/dto"
	"trading-review-system/backend/internal/models"
	"trading-review-system/backend/internal/repository"
)

type DashboardService struct {
	repos *repository.Repositories
}

func NewDashboardService(repos *repository.Repositories) *DashboardService {
	return &DashboardService{repos: repos}
}

func (s *DashboardService) GetSummary() (*dto.DashboardSummary, error) {
	return s.repos.Trade.GetSummaryStats()
}

func (s *DashboardService) GetEquityCurve() ([]dto.EquityCurvePoint, error) {
	trades, err := s.repos.Trade.GetClosedTrades()
	if err != nil {
		return nil, err
	}

	var points []dto.EquityCurvePoint
	cumPnl := 0.0
	for _, t := range trades {
		cumPnl += t.TotalPnl
		date := ""
		if t.ExitDate != nil {
			date = t.ExitDate.Format("2006-01-02")
		} else if t.EntryDate != nil {
			date = t.EntryDate.Format("2006-01-02")
		}
		points = append(points, dto.EquityCurvePoint{
			Date:          date,
			CumulativePnl: cumPnl,
		})
	}
	return points, nil
}

func (s *DashboardService) GetWinRate() (*dto.WinRateResponse, error) {
	trades, err := s.repos.Trade.GetClosedTrades()
	if err != nil {
		return nil, err
	}

	// Compute rolling win rate
	var trend []dto.WinRatePoint
	wins := 0
	for i, t := range trades {
		if t.TotalPnl > 0 {
			wins++
		}
		rate := float64(wins) / float64(i+1) * 100
		date := ""
		if t.ExitDate != nil {
			date = t.ExitDate.Format("2006-01-02")
		}
		trend = append(trend, dto.WinRatePoint{
			Date:    date,
			WinRate: rate,
		})
	}

	// Score distribution
	distribution, err := s.repos.Trade.GetScoreDistribution()
	if err != nil {
		return nil, err
	}

	// Ensure A/B/C/D order
	sort.Slice(distribution, func(i, j int) bool {
		return distribution[i].Score < distribution[j].Score
	})

	return &dto.WinRateResponse{
		Trend:        trend,
		Distribution: distribution,
	}, nil
}

func (s *DashboardService) GetRecentTrades() (interface{}, error) {
	return s.repos.Trade.GetRecentTrades(5)
}

func (s *DashboardService) GetPredictionAccuracy() (*dto.PredictionAccuracyResponse, error) {
	stocks, err := s.repos.StockPool.ListWithPredictions()
	if err != nil {
		return nil, err
	}

	if len(stocks) == 0 {
		return &dto.PredictionAccuracyResponse{
			ByType: []dto.PredictionTypeAccuracy{},
			Trend:  []dto.PredictionAccuracyPoint{},
		}, nil
	}

	type predRecord struct {
		symbol    string
		tradeDate time.Time
		flag      int8
	}
	var records []predRecord
	for _, st := range stocks {
		records = append(records, predRecord{
			symbol:    st.Symbol,
			tradeDate: st.TradeDate,
			flag:      st.PredictionFlag,
		})
	}

	byType := map[int8]struct{ total, correct int64 }{}
	dailyStats := map[string]struct{ total, correct int64 }{}
	var totalCorrect int64
	var totalCount int64

	for _, rec := range records {
		klines, err := s.repos.Kline.GetNextTwoKlines([]string{rec.symbol}, rec.tradeDate)
		if err != nil || len(klines[rec.symbol]) < 2 {
			continue
		}

		rows := klines[rec.symbol]
		todayClose := rows[0].Close
		nextClose := rows[1].Close
		pctChange := (nextClose - todayClose) / todayClose

		// Normalize flag: positive (>0, not 99) → 1 (看涨), negative → -1 (看跌), 0 → 0 (震荡)
		normFlag := rec.flag
		if rec.flag > 0 && rec.flag != 99 {
			normFlag = 1
		} else if rec.flag < 0 {
			normFlag = -1
		}

		var isCorrect bool
		switch {
		case rec.flag > 0 && rec.flag != 99:
			isCorrect = nextClose > todayClose
		case rec.flag < 0:
			isCorrect = nextClose < todayClose
		case rec.flag == 0:
			isCorrect = math.Abs(pctChange) <= 0.01
		default:
			continue
		}

		dateStr := rec.tradeDate.Format("2006-01-02")

		bt := byType[normFlag]
		bt.total++
		if isCorrect {
			bt.correct++
			totalCorrect++
		}
		byType[normFlag] = bt

		ds := dailyStats[dateStr]
		ds.total++
		if isCorrect {
			ds.correct++
		}
		dailyStats[dateStr] = ds

		totalCount++
	}

	predictionLabels := map[int8]string{1: "看涨", -1: "看跌", 0: "震荡"}
	predictionOrder := []int8{1, -1, 0}
	var typeAccuracies []dto.PredictionTypeAccuracy
	for _, flag := range predictionOrder {
		bt := byType[flag]
		if bt.total == 0 {
			typeAccuracies = append(typeAccuracies, dto.PredictionTypeAccuracy{
				PredictionFlag: flag,
				Label:          predictionLabels[flag],
				Total:          0,
				Correct:        0,
				Accuracy:       0,
			})
			continue
		}
		typeAccuracies = append(typeAccuracies, dto.PredictionTypeAccuracy{
			PredictionFlag: flag,
			Label:          predictionLabels[flag],
			Total:          bt.total,
			Correct:        bt.correct,
			Accuracy:       float64(bt.correct) / float64(bt.total) * 100,
		})
	}

	var dates []string
	for d := range dailyStats {
		dates = append(dates, d)
	}
	sort.Strings(dates)

	var trend []dto.PredictionAccuracyPoint
	for _, d := range dates {
		ds := dailyStats[d]
		trend = append(trend, dto.PredictionAccuracyPoint{
			Date:     d,
			Accuracy: float64(ds.correct) / float64(ds.total) * 100,
			Total:    ds.total,
		})
	}

	overallAccuracy := 0.0
	if totalCount > 0 {
		overallAccuracy = float64(totalCorrect) / float64(totalCount) * 100
	}

	return &dto.PredictionAccuracyResponse{
		TotalPredictions:   totalCount,
		CorrectPredictions: totalCorrect,
		OverallAccuracy:    overallAccuracy,
		ByType:             typeAccuracies,
		Trend:              trend,
	}, nil
}

func (s *DashboardService) GetPredictionDetails() ([]dto.PredictionDetail, error) {
	stocks, err := s.repos.StockPool.ListWithPredictions()
	if err != nil {
		return nil, err
	}

	if len(stocks) == 0 {
		return []dto.PredictionDetail{}, nil
	}

	type predRecord struct {
		stock    models.StockPool
		flag     int8
	}
	var records []predRecord
	for _, st := range stocks {
		records = append(records, predRecord{stock: st, flag: st.PredictionFlag})
	}

	predictionLabels := map[int8]string{1: "看涨", -1: "看跌", 0: "震荡"}
	var details []dto.PredictionDetail

	for _, rec := range records {
		klines, err := s.repos.Kline.GetNextTwoKlines([]string{rec.stock.Symbol}, rec.stock.TradeDate)
		if err != nil || len(klines[rec.stock.Symbol]) < 2 {
			continue
		}

		rows := klines[rec.stock.Symbol]
		todayClose := rows[0].Close
		nextClose := rows[1].Close
		pctChange := (nextClose - todayClose) / todayClose * 100

		label := predictionLabels[rec.flag]
		if label == "" {
			if rec.flag > 0 && rec.flag != 99 {
				label = "看涨"
			} else if rec.flag < 0 {
				label = "看跌"
			} else if rec.flag == 0 {
				label = "震荡"
			}
		}

		var isCorrect bool
		switch {
		case rec.flag > 0 && rec.flag != 99:
			isCorrect = nextClose > todayClose
		case rec.flag < 0:
			isCorrect = nextClose < todayClose
		case rec.flag == 0:
			isCorrect = math.Abs(pctChange/100) <= 0.01
		default:
			continue
		}

		details = append(details, dto.PredictionDetail{
			Symbol:           rec.stock.Symbol,
			StockName:        rec.stock.StockName,
			SectorName:       rec.stock.SectorName,
			TradeDate:        rec.stock.TradeDate.Format("2006-01-02"),
			PredictionFlag:   rec.flag,
			PredictionLabel:  label,
			PredictionDetail: rec.stock.PredictionDetail,
			Viewpoint:        rec.stock.Viewpoint,
			CloseToday:       todayClose,
			CloseNext:        nextClose,
			PctChange:        pctChange,
			IsCorrect:        isCorrect,
		})
	}

	return details, nil
}
