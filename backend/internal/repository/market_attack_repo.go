package repository

import (
	"trading-review-system/backend/internal/models"

	"gorm.io/gorm"
)

type MarketAttackRepository struct {
	db *gorm.DB // This will be quantDb
}

func NewMarketAttackRepository(db *gorm.DB) *MarketAttackRepository {
	return &MarketAttackRepository{db: db}
}

func (r *MarketAttackRepository) GetLatestTradeDate() (string, error) {
	var latest string
	err := r.db.Model(&models.StkMarketAttackLog{}).Select("MAX(trade_date)").Scan(&latest).Error
	return latest, err
}

func (r *MarketAttackRepository) GetAttackLogs(date string) ([]models.StkMarketAttackLog, error) {
	var logs []models.StkMarketAttackLog
	err := r.db.Where("trade_date = ?", date).Find(&logs).Error
	return logs, err
}

func (r *MarketAttackRepository) GetSectorStocks(date, sectorName string) ([]models.StkMarketAttackLog, error) {
	var logs []models.StkMarketAttackLog
	err := r.db.Where("trade_date = ? AND sector_name = ?", date, sectorName).Find(&logs).Error
	return logs, err
}

// TopVolumeRow is a raw scan row for the top-volume query.
type TopVolumeRow struct {
	Symbol       string  `gorm:"column:symbol"`
	StockName    string  `gorm:"column:stock_name"`
	Close        float64 `gorm:"column:close"`
	Volume       int64   `gorm:"column:volume"`
	Amount       float64 `gorm:"column:amount"`
	TurnoverRate float64 `gorm:"column:turnover_rate"`
	PctChange    float64 `gorm:"column:pct_change"`
}

// SectorRelationRow is a row from stock_sector_relation.
type SectorRelationRow struct {
	Symbol     string `gorm:"column:symbol"`
	SectorName string `gorm:"column:sector_name"`
}

// GetTopVolumeStocks returns the top N stocks by trading amount for a given date.
func (r *MarketAttackRepository) GetTopVolumeStocks(tradeDate string, limit int) ([]TopVolumeRow, error) {
	sql := `
		SELECT
			k.symbol,
			COALESCE(f.stock_name, k.symbol) AS stock_name,
			k.close,
			k.volume,
			k.amount,
			COALESCE(k.turnover_rate, 0) AS turnover_rate,
			COALESCE(((k.close - prev.close) / NULLIF(prev.close, 0)) * 100, 0) AS pct_change
		FROM quant_db.stk_daily_kline k
		LEFT JOIN quant_db.stk_stock_fund_flow f
			ON k.symbol COLLATE utf8mb4_unicode_ci = f.symbol COLLATE utf8mb4_unicode_ci
		   AND k.trade_date = f.trade_date
		LEFT JOIN quant_db.stk_daily_kline prev
			ON k.symbol COLLATE utf8mb4_unicode_ci = prev.symbol COLLATE utf8mb4_unicode_ci
		   AND prev.trade_date = (
				SELECT DISTINCT trade_date FROM quant_db.stk_daily_kline
				WHERE trade_date < k.trade_date
				ORDER BY trade_date DESC LIMIT 1
		   )
		WHERE k.trade_date = ?
		  AND k.symbol NOT IN ('000001.SH','399001.SZ','399006.SZ','000300.SH','000852.SH')
		ORDER BY k.amount DESC
		LIMIT ?
	`
	var rows []TopVolumeRow
	if err := r.db.Raw(sql, tradeDate, limit).Scan(&rows).Error; err != nil {
		return nil, err
	}
	return rows, nil
}

// GetTopVolumeAppearances returns how many times each symbol appeared in the
// top 50 by amount over the last 30 trading days (including the given date).
func (r *MarketAttackRepository) GetTopVolumeAppearances(tradeDate string) (map[string]int, error) {
	sql := `
		WITH last30 AS (
			SELECT DISTINCT trade_date FROM quant_db.stk_daily_kline
			WHERE trade_date <= ?
			ORDER BY trade_date DESC
			LIMIT 30
		),
		daily_ranked AS (
			SELECT symbol, trade_date,
				ROW_NUMBER() OVER (PARTITION BY trade_date ORDER BY amount DESC) AS rn
			FROM quant_db.stk_daily_kline
			WHERE trade_date IN (SELECT trade_date FROM last30)
			  AND symbol NOT IN ('000001.SH','399001.SZ','399006.SZ','000300.SH','000852.SH')
		)
		SELECT symbol, COUNT(*) AS cnt
		FROM daily_ranked
		WHERE rn <= 50
		GROUP BY symbol
	`
	type countRow struct {
		Symbol string `gorm:"column:symbol"`
		Cnt    int    `gorm:"column:cnt"`
	}
	var rows []countRow
	if err := r.db.Raw(sql, tradeDate).Scan(&rows).Error; err != nil {
		return nil, err
	}
	result := make(map[string]int, len(rows))
	for _, row := range rows {
		result[row.Symbol] = row.Cnt
	}
	return result, nil
}

// GetSectorRelations returns all sector relations for the given symbols from quant_db.stock_sector_relation.
func (r *MarketAttackRepository) GetSectorRelations(symbols []string) ([]SectorRelationRow, error) {
	if len(symbols) == 0 {
		return nil, nil
	}
	var rows []SectorRelationRow
	err := r.db.Raw(
		"SELECT symbol, sector_name FROM quant_db.stock_sector_relation WHERE symbol IN ?", symbols,
	).Scan(&rows).Error
	if err != nil {
		return nil, err
	}
	return rows, nil
}

func (r *MarketAttackRepository) GetHistoricalSectorStats(sectorName string, limit int) ([]models.StkMarketAttackLog, error) {
	var logs []models.StkMarketAttackLog
	// We need unique trade_date + sector_name records.
	// Since the table has symbol, we use a subquery or grouping to get the sector stats per day.
	err := r.db.Table("stk_market_attack_log").
		Select("trade_date, sector_name, MAX(sector_new_count) as sector_new_count, MAX(sector_new_amount) as sector_new_amount").
		Where("sector_name = ?", sectorName).
		Group("trade_date, sector_name").
		Order("trade_date DESC").
		Limit(limit).
		Scan(&logs).Error
	return logs, err
}
