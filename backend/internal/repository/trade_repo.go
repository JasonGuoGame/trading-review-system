package repository

import (
	"trading-review-system/backend/internal/dto"
	"trading-review-system/backend/internal/models"

	"gorm.io/gorm"
)

type TradeRepository struct {
	db *gorm.DB
}

func NewTradeRepository(db *gorm.DB) *TradeRepository {
	return &TradeRepository{db: db}
}

func (r *TradeRepository) Create(trade *models.Trade) error {
	return r.db.Create(trade).Error
}

func (r *TradeRepository) FindByID(id uint) (*models.Trade, error) {
	var trade models.Trade
	err := r.db.First(&trade, id).Error
	if err != nil {
		return nil, err
	}
	return &trade, nil
}

func (r *TradeRepository) FindByIDWithAssociations(id uint) (*models.Trade, error) {
	var trade models.Trade
	err := r.db.
		Preload("Orders", func(db *gorm.DB) *gorm.DB {
			return db.Order("order_date ASC")
		}).
		Preload("EntryDecision").
		Preload("ExitPlan").
		Preload("Tags").
		Preload("Review").
		First(&trade, id).Error
	if err != nil {
		return nil, err
	}
	return &trade, nil
}

func (r *TradeRepository) FindWithFilters(query dto.TradeListQuery) ([]models.Trade, int64, error) {
	var trades []models.Trade
	var total int64

	db := r.db.Model(&models.Trade{})

	// Apply filters
	if query.Symbol != "" {
		db = db.Where("symbol LIKE ?", "%"+query.Symbol+"%")
	}
	if query.StartDate != "" {
		db = db.Where("entry_date >= ?", query.StartDate)
	}
	if query.EndDate != "" {
		db = db.Where("entry_date <= ?", query.EndDate)
	}
	if query.Pnl == "win" {
		db = db.Where("total_pnl > 0")
	} else if query.Pnl == "loss" {
		db = db.Where("total_pnl < 0")
	}
	if query.Strategy != "" {
		db = db.Where("strategy = ?", query.Strategy)
	}
	if query.Score != "" {
		db = db.Where("grade = ?", query.Score)
	}
	if query.Status != "" {
		db = db.Where("status = ?", query.Status)
	}
	if query.Tag != "" {
		db = db.Joins("JOIN trade_tags ON trade_tags.trade_id = trades.id").
			Joins("JOIN tags ON tags.id = trade_tags.tag_id").
			Where("tags.name = ?", query.Tag)
	}

	// Count total
	db.Count(&total)

	// Pagination
	offset := (query.Page - 1) * query.Size
	err := db.Preload("Tags").
		Order("created_at DESC").
		Offset(offset).
		Limit(query.Size).
		Find(&trades).Error

	return trades, total, err
}

func (r *TradeRepository) Update(trade *models.Trade) error {
	return r.db.Save(trade).Error
}

func (r *TradeRepository) Delete(id uint) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		// Delete associations
		tx.Where("trade_id = ?", id).Delete(&models.Order{})
		tx.Where("trade_id = ?", id).Delete(&models.EntryDecision{})
		tx.Where("trade_id = ?", id).Delete(&models.ExitPlan{})
		tx.Where("trade_id = ?", id).Delete(&models.Review{})
		tx.Where("trade_id = ?", id).Delete(&models.TradeTag{})
		// Delete trade
		return tx.Delete(&models.Trade{}, id).Error
	})
}

func (r *TradeRepository) GetRecentTrades(limit int) ([]models.Trade, error) {
	var trades []models.Trade
	err := r.db.Preload("Tags").
		Order("created_at DESC").
		Limit(limit).
		Find(&trades).Error
	return trades, err
}

func (r *TradeRepository) GetClosedTrades() ([]models.Trade, error) {
	var trades []models.Trade
	err := r.db.Where("status = ?", "closed").
		Order("exit_date ASC").
		Find(&trades).Error
	return trades, err
}

func (r *TradeRepository) GetSummaryStats() (*dto.DashboardSummary, error) {
	var summary dto.DashboardSummary

	// Total count
	r.db.Model(&models.Trade{}).Where("status = ?", "closed").Count(&summary.TradeCount)

	// Win count
	r.db.Model(&models.Trade{}).Where("status = ? AND total_pnl > 0", "closed").Count(&summary.WinCount)

	// Loss count
	r.db.Model(&models.Trade{}).Where("status = ? AND total_pnl <= 0", "closed").Count(&summary.LossCount)

	// Total PnL
	r.db.Model(&models.Trade{}).Where("status = ?", "closed").
		Select("COALESCE(SUM(total_pnl), 0)").Scan(&summary.TotalPnl)

	// Max drawdown
	r.db.Model(&models.Trade{}).Where("status = ?", "closed").
		Select("COALESCE(MAX(max_drawdown), 0)").Scan(&summary.MaxDrawdown)

	// Win rate
	if summary.TradeCount > 0 {
		summary.WinRate = float64(summary.WinCount) / float64(summary.TradeCount) * 100
	}

	return &summary, nil
}

func (r *TradeRepository) GetScoreDistribution() ([]dto.ScoreDistribution, error) {
	var distribution []dto.ScoreDistribution
	err := r.db.Model(&models.Trade{}).
		Where("status = ? AND grade != ''", "closed").
		Select("grade as score, COUNT(*) as count").
		Group("grade").
		Order("score ASC").
		Scan(&distribution).Error
	return distribution, err
}

func (r *TradeRepository) GetMarketStats() ([]dto.MarketStat, error) {
	var stats []dto.MarketStat
	err := r.db.Model(&models.Trade{}).
		Where("status = ? AND market_condition != ''", "closed").
		Select(`
			market_condition as ` + "`condition`" + `,
			COUNT(*) as total,
			SUM(CASE WHEN total_pnl > 0 THEN 1 ELSE 0 END) as wins,
			ROUND(SUM(CASE WHEN total_pnl > 0 THEN 1 ELSE 0 END) / COUNT(*) * 100, 2) as win_rate,
			ROUND(SUM(total_pnl), 2) as total_pnl
		`).
		Group("market_condition").
		Scan(&stats).Error
	return stats, err
}

func (r *TradeRepository) GetExecutionStats() ([]dto.ExecutionStat, error) {
	var stats []dto.ExecutionStat
	err := r.db.Model(&models.Trade{}).
		Where("status = ? AND grade != ''", "closed").
		Select(`
			grade as score,
			COUNT(*) as total,
			SUM(CASE WHEN total_pnl > 0 THEN 1 ELSE 0 END) as wins,
			ROUND(SUM(CASE WHEN total_pnl > 0 THEN 1 ELSE 0 END) / COUNT(*) * 100, 2) as win_rate,
			ROUND(AVG(total_pnl), 2) as avg_pnl,
			ROUND(SUM(total_pnl), 2) as total_pnl
		`).
		Group("grade").
		Order("score ASC").
		Scan(&stats).Error
	return stats, err
}

func (r *TradeRepository) ReplaceTagsForTrade(tradeID uint, tagIDs []uint) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		// Remove existing
		if err := tx.Where("trade_id = ?", tradeID).Delete(&models.TradeTag{}).Error; err != nil {
			return err
		}
		// Add new
		for _, tagID := range tagIDs {
			tt := models.TradeTag{TradeID: tradeID, TagID: tagID}
			if err := tx.Create(&tt).Error; err != nil {
				return err
			}
		}
		return nil
	})
}
