package repository

import (
	"trading-review-system/backend/internal/models"

	"gorm.io/gorm"
)

type EntryDecisionRepository struct {
	db *gorm.DB
}

func NewEntryDecisionRepository(db *gorm.DB) *EntryDecisionRepository {
	return &EntryDecisionRepository{db: db}
}

func (r *EntryDecisionRepository) Upsert(ed *models.EntryDecision) error {
	var existing models.EntryDecision
	err := r.db.Where("trade_id = ?", ed.TradeID).First(&existing).Error
	if err == gorm.ErrRecordNotFound {
		return r.db.Create(ed).Error
	}
	if err != nil {
		return err
	}
	return r.db.Model(&existing).Updates(map[string]interface{}{
		"strategy":   ed.Strategy,
		"setup_type": ed.SetupType,
		"signals":    ed.Signals,
		"indicators": ed.Indicators,
		"reason":     ed.Reason,
	}).Error
}

func (r *EntryDecisionRepository) FindByTradeID(tradeID uint) (*models.EntryDecision, error) {
	var ed models.EntryDecision
	err := r.db.Where("trade_id = ?", tradeID).First(&ed).Error
	if err != nil {
		return nil, err
	}
	return &ed, nil
}

// GetSignalStats returns win rate statistics per signal
func (r *EntryDecisionRepository) GetSignalStats() ([]map[string]interface{}, error) {
	var results []map[string]interface{}
	// We need to extract signals from JSON - this is done in the service layer
	// Here we just return all entry decisions with their trade results
	type edWithPnl struct {
		Signals models.JSON `json:"signals"`
		TotalPnl float64    `json:"total_pnl"`
	}
	var rows []edWithPnl
	err := r.db.Model(&models.EntryDecision{}).
		Joins("JOIN trades ON trades.id = entry_decisions.trade_id AND trades.status = 'closed'").
		Select("entry_decisions.signals, trades.total_pnl").
		Scan(&rows).Error
	if err != nil {
		return nil, err
	}

	// Convert to generic map for service layer processing
	for _, row := range rows {
		results = append(results, map[string]interface{}{
			"signals":   row.Signals,
			"total_pnl": row.TotalPnl,
		})
	}
	return results, nil
}
