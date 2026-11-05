package repository

import (
	"gorm.io/gorm"

	"trading-review-system/backend/internal/models"
)

// EtfRepository reads ETF metadata and daily klines from quant_db. Both tables
// are external and read-only; nothing here migrates them.
type EtfRepository struct {
	quantDb *gorm.DB
}

func NewEtfRepository(quantDb *gorm.DB) *EtfRepository {
	return &EtfRepository{quantDb: quantDb}
}

// EtfKlineRow is one daily bar of an ETF. Nullable columns are coalesced to a
// zero value in SQL so plain Go types scan cleanly.
type EtfKlineRow struct {
	Symbol    string  `gorm:"column:symbol"`
	TradeDate string  `gorm:"column:trade_date"`
	Open      float64 `gorm:"column:open"`
	High      float64 `gorm:"column:high"`
	Low       float64 `gorm:"column:low"`
	Close     float64 `gorm:"column:close"`
	Volume    int64   `gorm:"column:volume"`
	Amount    float64 `gorm:"column:amount"`
}

const etfKlineSelect = `symbol, trade_date, open, high, low, close, volume, amount`

// GetLatestTradeDate returns the most recent trade_date in stk_etf_daily_kline.
func (r *EtfRepository) GetLatestTradeDate() (string, error) {
	var date string
	err := r.quantDb.Raw(`SELECT MAX(trade_date) FROM stk_etf_daily_kline`).Scan(&date).Error
	if err != nil {
		return "", err
	}
	return normalizeDate(date), nil
}

// GetRecentTradeDates returns the last n distinct trade dates on or before
// endDate, in ascending order (oldest first).
func (r *EtfRepository) GetRecentTradeDates(endDate string, n int) ([]string, error) {
	var dates []string
	err := r.quantDb.Raw(`
		SELECT trade_date FROM (
			SELECT DISTINCT trade_date FROM stk_etf_daily_kline
			WHERE trade_date <= ? ORDER BY trade_date DESC LIMIT ?
		) t ORDER BY trade_date ASC
	`, endDate, n).Scan(&dates).Error
	if err != nil {
		return nil, err
	}
	for i := range dates {
		dates[i] = normalizeDate(dates[i])
	}
	return dates, nil
}

// GetAllEtfInfo returns every row of stk_etf_info (nullable metadata coalesced).
func (r *EtfRepository) GetAllEtfInfo() ([]models.EtfInfo, error) {
	var rows []models.EtfInfo
	err := r.quantDb.Raw(`
		SELECT symbol, name,
			COALESCE(etf_type, '')      AS etf_type,
			COALESCE(etf_sub_type, '')  AS etf_sub_type,
			COALESCE(industry_name, '') AS industry_name,
			COALESCE(exchange, '')      AS exchange
		FROM stk_etf_info
		ORDER BY symbol
	`).Scan(&rows).Error
	if err != nil {
		return nil, err
	}
	return rows, nil
}

// GetKlineWindow returns symbol → ascending kline rows for the given dates.
func (r *EtfRepository) GetKlineWindow(dates []string) (map[string][]EtfKlineRow, error) {
	out := make(map[string][]EtfKlineRow)
	if len(dates) == 0 {
		return out, nil
	}
	var rows []EtfKlineRow
	err := r.quantDb.Raw(`
		SELECT `+etfKlineSelect+`
		FROM stk_etf_daily_kline
		WHERE trade_date IN ? AND close IS NOT NULL
		ORDER BY symbol ASC, trade_date ASC
	`, dates).Scan(&rows).Error
	if err != nil {
		return nil, err
	}
	for _, rw := range rows {
		rw.TradeDate = normalizeDate(rw.TradeDate)
		out[rw.Symbol] = append(out[rw.Symbol], rw)
	}
	return out, nil
}

// GetSymbolKline returns the last `days` ascending kline rows for one symbol.
func (r *EtfRepository) GetSymbolKline(symbol string, days int) ([]EtfKlineRow, error) {
	var rows []EtfKlineRow
	err := r.quantDb.Raw(`
		SELECT * FROM (
			SELECT `+etfKlineSelect+`
			FROM stk_etf_daily_kline
			WHERE symbol = ? AND close IS NOT NULL
			ORDER BY trade_date DESC LIMIT ?
		) t ORDER BY trade_date ASC
	`, symbol, days).Scan(&rows).Error
	if err != nil {
		return nil, err
	}
	for i := range rows {
		rows[i].TradeDate = normalizeDate(rows[i].TradeDate)
	}
	return rows, nil
}

// GetMeta returns the distinct filter values for the ranking/overview filters.
func (r *EtfRepository) GetMeta() (etfTypes, etfSubTypes, industryNames []string, err error) {
	if err = r.quantDb.Raw(
		`SELECT DISTINCT etf_type FROM stk_etf_info WHERE etf_type IS NOT NULL AND etf_type <> '' ORDER BY etf_type`,
	).Scan(&etfTypes).Error; err != nil {
		return nil, nil, nil, err
	}
	if err = r.quantDb.Raw(
		`SELECT DISTINCT etf_sub_type FROM stk_etf_info WHERE etf_sub_type IS NOT NULL AND etf_sub_type <> '' ORDER BY etf_sub_type`,
	).Scan(&etfSubTypes).Error; err != nil {
		return nil, nil, nil, err
	}
	if err = r.quantDb.Raw(
		`SELECT DISTINCT industry_name FROM stk_etf_info WHERE industry_name IS NOT NULL AND industry_name <> '' ORDER BY industry_name`,
	).Scan(&industryNames).Error; err != nil {
		return nil, nil, nil, err
	}
	return etfTypes, etfSubTypes, industryNames, nil
}
