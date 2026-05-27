package repository

import (
	"time"

	"trading-review-system/backend/internal/models"

	"gorm.io/gorm"
)

type StockPoolRepository struct {
	db *gorm.DB
}

func NewStockPoolRepository(db *gorm.DB) *StockPoolRepository {
	return &StockPoolRepository{db: db}
}

func (r *StockPoolRepository) List(poolType models.StockPoolType, days int) ([]models.StockPool, error) {
	var stocks []models.StockPool
	query := r.applyPoolTypeFilter(poolType)
	if days > 0 {
		query = query.Where("trade_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)", days-1)
	}
	err := query.Order("is_watch_focus DESC, score DESC").Find(&stocks).Error
	return stocks, err
}

func (r *StockPoolRepository) GetBySymbol(symbol string) (*models.StockPool, error) {
	var stock models.StockPool
	err := r.db.Where("symbol = ?", symbol).First(&stock).Error
	if err != nil {
		return nil, err
	}
	return &stock, nil
}

func (r *StockPoolRepository) Create(stock *models.StockPool) error {
	if stock.TradeDate.IsZero() {
		stock.TradeDate = time.Now()
	}
	return r.db.Create(stock).Error
}

func (r *StockPoolRepository) Update(stock *models.StockPool) error {
	return r.db.Where("symbol = ? AND trade_date = ? AND pool_type = ? AND status = ?",
		stock.Symbol, stock.TradeDate, stock.PoolType, stock.Status).Updates(stock).Error
}

func (r *StockPoolRepository) SetWatchFocus(symbol string, tradeDate string, poolType models.StockPoolType, status string, focus int) error {
	return r.db.Model(&models.StockPool{}).
		Where("symbol = ? AND trade_date = ? AND pool_type = ? AND status = ?",
			symbol, tradeDate, poolType, status).
		Update("is_watch_focus", focus).Error
}

func (r *StockPoolRepository) Delete(symbol string, tradeDate string, poolType models.StockPoolType, status string) error {
	result := r.db.Where("symbol = ? AND trade_date = ? AND pool_type = ? AND status = ?",
		symbol, tradeDate, poolType, status).Delete(&models.StockPool{})
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

func (r *StockPoolRepository) Search(query string) ([]models.StockPool, error) {
	var stocks []models.StockPool
	err := r.db.Where("symbol = ? OR stock_name LIKE ?", query, "%"+query+"%").
		Order("trade_date DESC").
		Find(&stocks).Error
	return stocks, err
}

func (r *StockPoolRepository) CountByType(poolType models.StockPoolType, days int) (int64, error) {
	query := r.applyPoolTypeFilter(poolType)
	if days > 0 {
		query = query.Where("trade_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)", days-1)
	}
	var count int64
	err := query.Model(&models.StockPool{}).Count(&count).Error
	return count, err
}

func (r *StockPoolRepository) applyPoolTypeFilter(poolType models.StockPoolType) *gorm.DB {
	switch poolType {
	case "macd_boll":
		return r.db.Where("status = ?", "资金共振金叉")
	case "trend_following":
		return r.db.Where("status IN ?", []string{"趋势确立", "共振买点"})
	case "turnover_vol":
		return r.db.Where("status IN ?", []string{"主升接力", "启动突破"})
	case "short":
		return r.db.Where("pool_type = ? AND status = ?", poolType, "短线爆发黑马")
	case "long":
		return r.db.Where("pool_type = ? AND status = ?", poolType, "长线牛")
	case "winner_mode":
		return r.db.Where("status LIKE ?", "赢家模式:%")
	default:
		return r.db.Where("pool_type = ?", poolType)
	}
}

func (r *StockPoolRepository) ListByScoreRange(poolType models.StockPoolType, tradeDate string, scoreMin int, scoreMax int) ([]models.StockPool, error) {
	var stocks []models.StockPool
	query := r.applyPoolTypeFilter(poolType).
		Where("trade_date = ? AND score >= ? AND score <= ?", tradeDate, scoreMin, scoreMax)
	err := query.Order("score DESC").Find(&stocks).Error
	return stocks, err
}

func (r *StockPoolRepository) GetSignals(symbol string) ([]models.StockPoolSignal, error) {
	var signals []models.StockPoolSignal
	err := r.db.Where("symbol = ?", symbol).Order("trade_date DESC").Limit(10).Find(&signals).Error
	return signals, err
}

func (r *StockPoolRepository) SaveSignal(signal *models.StockPoolSignal) error {
	return r.db.Save(signal).Error
}
