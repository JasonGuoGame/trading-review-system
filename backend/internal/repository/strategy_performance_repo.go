package repository

import (
	"time"
	"trading-review-system/backend/internal/models"

	"gorm.io/gorm"
)

type StrategyPerformanceRepository struct {
	db     *gorm.DB
	quantDb *gorm.DB
}

func NewStrategyPerformanceRepository(db *gorm.DB, quantDb *gorm.DB) *StrategyPerformanceRepository {
	return &StrategyPerformanceRepository{db: db, quantDb: quantDb}
}

func (r *StrategyPerformanceRepository) GetHistory(strategyNames []string, days int) ([]models.StrategyPerformanceHistory, error) {
	var records []models.StrategyPerformanceHistory
	query := r.db.Where("strategy_name IN ?", strategyNames)
	if days > 0 {
		// Restrict to the most recent `days` distinct trading dates.
		// Wrapped in a derived table because MySQL doesn't allow LIMIT inside IN-subquery.
		sub := r.db.Raw("SELECT trade_date FROM (SELECT DISTINCT trade_date FROM strategy_performance_history ORDER BY trade_date DESC LIMIT ?) AS recent_dates", days)
		query = query.Where("trade_date IN (?)", sub)
	}
	err := query.Order("trade_date ASC").Find(&records).Error
	return records, err
}

func (r *StrategyPerformanceRepository) AggregateFromScoreAnalysis(strategyName string) ([]models.StrategyPerformanceHistory, error) {
	mappedName := mapToScoreAnalysisName(strategyName)
	// Compute daily aggregate stats from strategy_score_analysis
	type aggRow struct {
		TradeDate    time.Time
		SignalCount  int
		WinRate      float64
		AvgReturn    float64
		BestReturn   float64
		WorstReturn  float64
	}
	var rows []aggRow
	err := r.quantDb.Table("strategy_score_analysis").
		Select(`trade_date,
			SUM(total_trades) as signal_count,
			SUM(win_rate * total_trades) / SUM(total_trades) as win_rate,
			SUM(avg_return * total_trades) / SUM(total_trades) as avg_return,
			MAX(max_return) as best_return,
			MIN(max_drawdown) as worst_return`).
		Where("strategy_name = ?", mappedName).
		Group("trade_date").
		Order("trade_date ASC").
		Find(&rows).Error
	if err != nil {
		return nil, err
	}

	var results []models.StrategyPerformanceHistory
	for _, row := range rows {
		results = append(results, models.StrategyPerformanceHistory{
			TradeDate:    row.TradeDate,
			StrategyName: strategyName,
			SignalCount:  row.SignalCount,
			WinRate:      row.WinRate,
			AvgReturn:    row.AvgReturn,
			BestReturn:   row.BestReturn,
			WorstReturn:  row.WorstReturn,
		})
	}
	return results, nil
}

func (r *StrategyPerformanceRepository) GetLatest(strategyNames []string) ([]models.StrategyPerformanceHistory, error) {
	subQuery := r.db.Model(&models.StrategyPerformanceHistory{}).
		Select("MAX(trade_date)").
		Where("strategy_name IN ?", strategyNames).
		Group("strategy_name")

	var records []models.StrategyPerformanceHistory
	err := r.db.Where("strategy_name IN ? AND trade_date IN (?)", strategyNames, subQuery).
		Find(&records).Error
	return records, err
}
