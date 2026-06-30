package repository

import (
	"trading-review-system/backend/internal/models"

	"gorm.io/gorm"
)

type StrategyScoreAnalysisRepository struct {
	db *gorm.DB
}

func NewStrategyScoreAnalysisRepository(db *gorm.DB) *StrategyScoreAnalysisRepository {
	return &StrategyScoreAnalysisRepository{db: db}
}

// Map full strategy names (from strategy_performance_history) to short names (in strategy_score_analysis)
func mapToScoreAnalysisName(fullName string) string {
	mapping := map[string]string{
		"1. 短线黑马股":       "1. 短线黑马",
		"2. 价值长线股":       "5. 价值长线",
		"3. 0轴金叉资金共振":    "3. 0轴金叉共振",
		"4. MACD+BOLL趋势": "4. MACD+BOLL",
		"5. 换手率+量比动能":    "2. 换手率量比",
		"6. 模式赢家跟随":      "6. 赢家跟随",
		"7. 主力资金入场":      "主力入场",
		"8. 分歧反包策略":      "分歧反包",
		"9. 竞价异动策略":      "竞价异动",
		"四维共振":           "四维共振",
		"GPT资金共振":         "GPT资金共振",
	}
	if mapped, ok := mapping[fullName]; ok {
		return mapped
	}
	return fullName
}

func (r *StrategyScoreAnalysisRepository) GetByStrategy(strategyName string, days int) ([]models.StrategyScoreAnalysis, error) {
	mappedName := mapToScoreAnalysisName(strategyName)
	if days <= 0 {
		days = 30
	}

	var records []models.StrategyScoreAnalysis
	err := r.db.Where("strategy_name = ?", mappedName).
		Where("trade_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)", days).
		Order("trade_date ASC, score_range_start ASC").
		Find(&records).Error
	if err != nil {
		return nil, err
	}
	// Fallback: if no records found with mapped name, try matching by number prefix
	if len(records) == 0 {
		prefix := ""
		if len(strategyName) >= 2 && strategyName[1] == '.' {
			prefix = strategyName[:2] // e.g. "1."
		}
		if prefix != "" {
			err = r.db.Where("strategy_name LIKE ?", prefix+"%").
				Where("trade_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)", days).
				Order("trade_date ASC, score_range_start ASC").
				Find(&records).Error
		}
	}
	return records, err
}

func (r *StrategyScoreAnalysisRepository) GetBestBin(strategyName string) (*models.StrategyScoreAnalysis, error) {
	mappedName := mapToScoreAnalysisName(strategyName)
	record, err := r.getBestBinByName(mappedName)
	if err != nil {
		return nil, err
	}
	// Fallback: if no record found with mapped name, try matching by number prefix
	if record == nil {
		prefix := ""
		if len(strategyName) >= 2 && strategyName[1] == '.' {
			prefix = strategyName[:2]
		}
		if prefix != "" {
			var fallbackName []string
			r.db.Model(&models.StrategyScoreAnalysis{}).
				Select("strategy_name").
				Where("strategy_name LIKE ?", prefix+"%").
				Limit(1).
				Pluck("strategy_name", &fallbackName)
			if len(fallbackName) > 0 && fallbackName[0] != "" {
				record, err = r.getBestBinByName(fallbackName[0])
			}
		}
	}
	return record, err
}

// DateBreadthRow is a single day's aggregated strategy data joined with market breadth.
type DateBreadthRow struct {
	TradeDate   string  `gorm:"column:trade_date"`
	TotalTrades int     `gorm:"column:total_trades"`
	WinRate     float64 `gorm:"column:win_rate"`
	AvgReturn   float64 `gorm:"column:avg_return"`
	Advancers   int     `gorm:"column:advancers"`
}

// GetDateBreadthData returns per-date aggregated strategy stats joined with market_breadths.
func (r *StrategyScoreAnalysisRepository) GetDateBreadthData(strategyName string, days int) ([]DateBreadthRow, error) {
	mappedName := mapToScoreAnalysisName(strategyName)
	var rows []DateBreadthRow
	sql := `
		SELECT
			ssa.trade_date,
			SUM(ssa.total_trades) AS total_trades,
			COALESCE(SUM(ssa.win_rate * ssa.total_trades) / NULLIF(SUM(ssa.total_trades), 0), 0) AS win_rate,
			COALESCE(SUM(ssa.avg_return * ssa.total_trades) / NULLIF(SUM(ssa.total_trades), 0), 0) AS avg_return,
			COALESCE(mb.advancers, 0) AS advancers
		FROM strategy_score_analysis ssa
		LEFT JOIN market_breadths mb ON ssa.trade_date = mb.trade_date
		WHERE ssa.strategy_name = ?
		GROUP BY ssa.trade_date
		ORDER BY ssa.trade_date DESC
		LIMIT ?
	`
	err := r.db.Raw(sql, mappedName, days).Scan(&rows).Error
	if err != nil {
		return nil, err
	}
	if len(rows) == 0 {
		// Fallback by prefix
		prefix := ""
		if len(strategyName) >= 2 && strategyName[1] == '.' {
			prefix = strategyName[:2]
		}
		if prefix != "" {
			err = r.db.Raw(sql, prefix+"%", days).Scan(&rows).Error
		}
	}
	return rows, err
}

func (r *StrategyScoreAnalysisRepository) getBestBinByName(name string) (*models.StrategyScoreAnalysis, error) {
	var latestDate struct {
		TradeDate string `gorm:"column:trade_date"`
	}
	err := r.db.Model(&models.StrategyScoreAnalysis{}).
		Select("trade_date").
		Where("strategy_name = ?", name).
		Order("trade_date DESC").
		Limit(1).
		Scan(&latestDate).Error
	if err != nil {
		return nil, err
	}
	if latestDate.TradeDate == "" {
		return nil, nil
	}

	var record models.StrategyScoreAnalysis
	err = r.db.Where("strategy_name = ? AND trade_date = ?", name, latestDate.TradeDate).
		Order("win_rate DESC").
		Limit(1).
		First(&record).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &record, nil
}
