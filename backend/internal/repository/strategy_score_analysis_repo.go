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
		"1. 短线黑马股":     "1. 短线黑马",
		"2. 价值长线股":     "5. 价值长线",
		"3. 0轴金叉资金共振": "3. 0轴金叉共振",
		"4. MACD+BOLL趋势":  "4. MACD+BOLL",
		"5. 换手率+量比动能": "2. 换手率量比",
		"6. 模式赢家跟随":   "6. 赢家跟随",
	}
	if mapped, ok := mapping[fullName]; ok {
		return mapped
	}
	return fullName
}

func (r *StrategyScoreAnalysisRepository) GetByStrategy(strategyName string, days int) ([]models.StrategyScoreAnalysis, error) {
	mappedName := mapToScoreAnalysisName(strategyName)
	var records []models.StrategyScoreAnalysis
	err := r.db.Where("strategy_name = ?", mappedName).
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
