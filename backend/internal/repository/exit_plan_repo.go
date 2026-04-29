package repository

import (
	"trading-review-system/backend/internal/models"

	"gorm.io/gorm"
)

type ExitPlanRepository struct {
	db *gorm.DB
}

func NewExitPlanRepository(db *gorm.DB) *ExitPlanRepository {
	return &ExitPlanRepository{db: db}
}

func (r *ExitPlanRepository) Upsert(ep *models.ExitPlan) error {
	var existing models.ExitPlan
	err := r.db.Where("trade_id = ?", ep.TradeID).First(&existing).Error
	if err == gorm.ErrRecordNotFound {
		return r.db.Create(ep).Error
	}
	if err != nil {
		return err
	}
	return r.db.Model(&existing).Updates(map[string]interface{}{
		"stop_loss":   ep.StopLoss,
		"take_profit": ep.TakeProfit,
		"batch_plan":  ep.BatchPlan,
	}).Error
}

func (r *ExitPlanRepository) FindByTradeID(tradeID uint) (*models.ExitPlan, error) {
	var ep models.ExitPlan
	err := r.db.Where("trade_id = ?", tradeID).First(&ep).Error
	if err != nil {
		return nil, err
	}
	return &ep, nil
}
