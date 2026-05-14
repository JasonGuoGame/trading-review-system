package repository

import (
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
	query := r.db.Where("pool_type = ?", poolType)
	if days > 0 {
		query = query.Where("trade_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)", days-1)
	}
	err := query.Order("score DESC").Find(&stocks).Error
	return stocks, err
}

func (r *StockPoolRepository) GetByID(id uint) (*models.StockPool, error) {
	var stock models.StockPool
	err := r.db.First(&stock, id).Error
	return &stock, err
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
	return r.db.Create(stock).Error
}

func (r *StockPoolRepository) Update(stock *models.StockPool) error {
	return r.db.Save(stock).Error
}

func (r *StockPoolRepository) Delete(id uint) error {
	return r.db.Delete(&models.StockPool{}, id).Error
}

func (r *StockPoolRepository) GetSignals(symbol string) ([]models.StockPoolSignal, error) {
	var signals []models.StockPoolSignal
	err := r.db.Where("symbol = ?", symbol).Order("trade_date DESC").Limit(10).Find(&signals).Error
	return signals, err
}

func (r *StockPoolRepository) SaveSignal(signal *models.StockPoolSignal) error {
	return r.db.Save(signal).Error
}
