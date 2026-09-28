package repository

import "gorm.io/gorm"

// MarketTemperatureRepository reads sector memberships and RSI factors from
// quant_db to build the market-temperature view.
type MarketTemperatureRepository struct {
	quantDb *gorm.DB
}

func NewMarketTemperatureRepository(quantDb *gorm.DB) *MarketTemperatureRepository {
	return &MarketTemperatureRepository{quantDb: quantDb}
}

// normalizeDate trims a MySQL DATE/TIMESTAMP result to "YYYY-MM-DD".
func normalizeDate(s string) string {
	if len(s) > 10 {
		return s[:10]
	}
	return s
}

// GetLatestTradeDate returns the most recent trade_date in stk_sector_fund_flow.
func (r *MarketTemperatureRepository) GetLatestTradeDate() (string, error) {
	var date string
	err := r.quantDb.Raw(`SELECT MAX(trade_date) FROM stk_sector_fund_flow`).Scan(&date).Error
	if err != nil {
		return "", err
	}
	return normalizeDate(date), nil
}

// GetPreviousTradeDate returns the most recent trade_date in stk_factors strictly
// before the given date (the prior day that actually has RSI data).
func (r *MarketTemperatureRepository) GetPreviousTradeDate(tradeDate string) (string, error) {
	var date string
	err := r.quantDb.Raw(`
		SELECT MAX(trade_date) FROM stk_factors WHERE trade_date < ?
	`, tradeDate).Scan(&date).Error
	if err != nil {
		return "", err
	}
	return normalizeDate(date), nil
}

// GetFundFlowSectors returns every distinct sector_name in stk_sector_fund_flow
// for the given trade date (ascending).
func (r *MarketTemperatureRepository) GetFundFlowSectors(tradeDate string) ([]string, error) {
	var names []string
	err := r.quantDb.Raw(`
		SELECT DISTINCT sector_name
		FROM stk_sector_fund_flow
		WHERE trade_date = ?
		ORDER BY sector_name
	`, tradeDate).Scan(&names).Error
	if err != nil {
		return nil, err
	}
	return names, nil
}

// RelationRow is one stock_sector_relation membership row.
type RelationRow struct {
	Symbol     string `gorm:"column:symbol"`
	SectorName string `gorm:"column:sector_name"`
}

// GetStockSectorRelations returns every stock→sector membership (fuzzy matching
// to fund-flow sector names is done in the service via coreSectorName).
func (r *MarketTemperatureRepository) GetStockSectorRelations() ([]RelationRow, error) {
	var rows []RelationRow
	err := r.quantDb.Raw(`SELECT symbol, sector_name FROM stock_sector_relation`).Scan(&rows).Error
	if err != nil {
		return nil, err
	}
	return rows, nil
}

// GetRSIByDate returns symbol → f_rsi_14 for a trade date (NULLs skipped).
func (r *MarketTemperatureRepository) GetRSIByDate(tradeDate string) (map[string]float64, error) {
	type row struct {
		Symbol string  `gorm:"column:symbol"`
		RSI    float64 `gorm:"column:f_rsi_14"`
	}
	var rows []row
	err := r.quantDb.Raw(`
		SELECT symbol, f_rsi_14
		FROM stk_factors
		WHERE trade_date = ? AND f_rsi_14 IS NOT NULL
	`, tradeDate).Scan(&rows).Error
	if err != nil {
		return nil, err
	}
	m := make(map[string]float64, len(rows))
	for _, r := range rows {
		m[r.Symbol] = r.RSI
	}
	return m, nil
}

// GetRecentTradeDates returns the last N distinct trade dates from stk_factors,
// in ascending order (oldest first).
func (r *MarketTemperatureRepository) GetRecentTradeDates(n int) ([]string, error) {
	var dates []string
	err := r.quantDb.Raw(`
		SELECT trade_date FROM (
			SELECT DISTINCT trade_date FROM stk_factors ORDER BY trade_date DESC LIMIT ?
		) t ORDER BY trade_date ASC
	`, n).Scan(&dates).Error
	if err != nil {
		return nil, err
	}
	for i := range dates {
		dates[i] = normalizeDate(dates[i])
	}
	return dates, nil
}

// GetRSIValuesForDates returns, for each given date, every stock's f_rsi_14 value
// (NULLs skipped). Used to compute per-day market average/median for the trend.
func (r *MarketTemperatureRepository) GetRSIValuesForDates(dates []string) (map[string][]float64, error) {
	if len(dates) == 0 {
		return map[string][]float64{}, nil
	}
	type row struct {
		TradeDate string  `gorm:"column:trade_date"`
		RSI       float64 `gorm:"column:f_rsi_14"`
	}
	var rows []row
	err := r.quantDb.Raw(`
		SELECT trade_date, f_rsi_14
		FROM stk_factors
		WHERE trade_date IN ? AND f_rsi_14 IS NOT NULL
	`, dates).Scan(&rows).Error
	if err != nil {
		return nil, err
	}
	out := make(map[string][]float64)
	for _, r := range rows {
		d := normalizeDate(r.TradeDate)
		out[d] = append(out[d], r.RSI)
	}
	return out, nil
}

// GetRecentTradeDatesUpTo returns the last N distinct trade dates from stk_factors
// on or before the given date, in ascending order (oldest first).
func (r *MarketTemperatureRepository) GetRecentTradeDatesUpTo(tradeDate string, n int) ([]string, error) {
	var dates []string
	err := r.quantDb.Raw(`
		SELECT trade_date FROM (
			SELECT DISTINCT trade_date FROM stk_factors
			WHERE trade_date <= ?
			ORDER BY trade_date DESC LIMIT ?
		) t ORDER BY trade_date ASC
	`, tradeDate, n).Scan(&dates).Error
	if err != nil {
		return nil, err
	}
	for i := range dates {
		dates[i] = normalizeDate(dates[i])
	}
	return dates, nil
}

// GetSectorRSISeries returns date → symbol → f_rsi_14 for a set of dates. It
// returns every stock (not just one sector's members) so the service can filter
// by member symbols in Go — sidestepping any symbol-collation mismatch between
// stock_sector_relation and stk_factors.
func (r *MarketTemperatureRepository) GetSectorRSISeries(dates []string) (map[string]map[string]float64, error) {
	out := make(map[string]map[string]float64)
	if len(dates) == 0 {
		return out, nil
	}
	type row struct {
		TradeDate string  `gorm:"column:trade_date"`
		Symbol    string  `gorm:"column:symbol"`
		RSI       float64 `gorm:"column:f_rsi_14"`
	}
	var rows []row
	err := r.quantDb.Raw(`
		SELECT trade_date, symbol, f_rsi_14
		FROM stk_factors
		WHERE trade_date IN ? AND f_rsi_14 IS NOT NULL
	`, dates).Scan(&rows).Error
	if err != nil {
		return nil, err
	}
	for _, r := range rows {
		d := normalizeDate(r.TradeDate)
		m, ok := out[d]
		if !ok {
			m = make(map[string]float64)
			out[d] = m
		}
		m[r.Symbol] = r.RSI
	}
	return out, nil
}

// GetStockNames returns symbol → stock_name for a small set of symbols (any
// symbol missing a name in stk_stock_fund_flow is simply absent from the map).
func (r *MarketTemperatureRepository) GetStockNames(symbols []string) (map[string]string, error) {
	out := make(map[string]string, len(symbols))
	if len(symbols) == 0 {
		return out, nil
	}
	type row struct {
		Symbol string `gorm:"column:symbol"`
		Name   string `gorm:"column:stock_name"`
	}
	var rows []row
	err := r.quantDb.Raw(`
		SELECT symbol, MAX(stock_name) AS stock_name
		FROM stk_stock_fund_flow
		WHERE symbol IN ?
		GROUP BY symbol
	`, symbols).Scan(&rows).Error
	if err != nil {
		return nil, err
	}
	for _, r := range rows {
		out[r.Symbol] = r.Name
	}
	return out, nil
}
