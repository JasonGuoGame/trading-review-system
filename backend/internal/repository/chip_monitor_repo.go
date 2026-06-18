package repository

import (
	"log"

	"trading-review-system/backend/internal/models"

	"gorm.io/gorm"
)

type ChipMonitorRepository struct {
	db *gorm.DB
}

func NewChipMonitorRepository(db *gorm.DB) *ChipMonitorRepository {
	return &ChipMonitorRepository{db: db}
}

func (r *ChipMonitorRepository) GetLatestTradeDate() (string, error) {
	var date string
	err := r.db.Raw("SELECT MAX(trade_date) FROM quant_db.stk_chip_factor").Scan(&date).Error
	if err != nil {
		log.Printf("[chip-monitor] GetLatestTradeDate error: %v", err)
		return "", err
	}
	log.Printf("[chip-monitor] latest trade_date: %q", date)
	return date, nil
}

// GetRadarData returns the 5 radar dimensions:
//
//	控盘度   = AVG(main_force_control_score)
//	筹码集中 = AVG(100 - chip_width70)
//	获利盘   = AVG(profit_ratio)
//	筹码上移 = AVG(peak_move_pct)
//	资金流   = AVG(capital_score)
func (r *ChipMonitorRepository) GetRadarData(tradeDate string) (map[string]float64, error) {
	type chipAgg struct {
		ControlDegree float64 `gorm:"column:ctrl"`
		ChipConc      float64 `gorm:"column:chip_conc"`
		ProfitRatio   float64 `gorm:"column:profit"`
		ChipMoveUp    float64 `gorm:"column:move_up"`
	}
	var ca chipAgg
	err := r.db.Raw(
		"SELECT COALESCE(AVG(main_force_control_score),0) AS ctrl," +
			" COALESCE(AVG(100 - chip_width70),0) AS chip_conc," +
			" COALESCE(AVG(profit_ratio),0) AS profit," +
			" COALESCE(AVG(peak_move_pct * 100),0) AS move_up" +
			" FROM quant_db.stk_chip_factor" +
			" WHERE trade_date = (SELECT MAX(trade_date) FROM quant_db.stk_chip_factor)",
	).Scan(&ca).Error
	if err != nil {
		log.Printf("[chip-monitor] radar chip error: %v", err)
		return nil, err
	}

	type fundAgg struct {
		CapitalFlow float64 `gorm:"column:cap_flow"`
	}
	var fa fundAgg
	err = r.db.Raw(
		"SELECT COALESCE(AVG(capital_score),0) AS cap_flow" +
			" FROM quant_db.stk_stock_fund_flow" +
			" WHERE trade_date = (SELECT MAX(trade_date) FROM quant_db.stk_chip_factor)",
	).Scan(&fa).Error
	if err != nil {
		log.Printf("[chip-monitor] radar fund error: %v", err)
		return nil, err
	}

	log.Printf("[chip-monitor] radar: ctrl=%.0f cap=%.0f chip=%.0f profit=%.0f move=%.0f",
		ca.ControlDegree, fa.CapitalFlow, ca.ChipConc, ca.ProfitRatio, ca.ChipMoveUp)

	return map[string]float64{
		"control_degree":   ca.ControlDegree,
		"capital_flow":     fa.CapitalFlow,
		"chip_concentrate": ca.ChipConc,
		"profit_ratio":     ca.ProfitRatio,
		"chip_move_up":     ca.ChipMoveUp,
	}, nil
}

// ============================================================
// Common SELECT columns shared by all 4 list queries
// ============================================================
const listSelectColumns = `
	c.symbol,
	COALESCE(f.stock_name, '') AS stock_name,
	c.behavior,
	c.behavior_label,
	c.behavior_strength,
	c.main_force_control_score,
	c.control_level,
	c.chip_score,
	c.profit_ratio,
	c.peak_move_pct,
	c.estimated_main_cost,
	COALESCE(k.close, c.current_price) AS current_price,
	c.chip_width70,
	c.cost_profit_pct,
	f.capital_score,
	f.main_net_ratio,
	f.main_net_inflow,
	f.inflow_3d,
	f.inflow_5d,
	f.inflow_days,
	f.buy_power_ratio,
	f.sell_power_ratio,
	f.volume_power_ratio
`

const listFromJoin = `
	FROM quant_db.stk_chip_factor c
	JOIN quant_db.stk_stock_fund_flow f
		ON c.trade_date = f.trade_date
	   AND c.symbol COLLATE utf8mb4_unicode_ci = f.symbol COLLATE utf8mb4_unicode_ci
	LEFT JOIN quant_db.stk_daily_kline k
		ON c.symbol COLLATE utf8mb4_unicode_ci = k.symbol COLLATE utf8mb4_unicode_ci
	   AND c.trade_date = k.trade_date
	WHERE c.trade_date = (SELECT MAX(trade_date) FROM quant_db.stk_chip_factor)
`

// ============================================================
// 主力吸筹榜
// ============================================================
func (r *ChipMonitorRepository) GetAccumulationList(tradeDate string) ([]models.AccumulationRow, error) {
	sql := "SELECT " + listSelectColumns + listFromJoin +
		"  AND c.behavior = 1" +
		"  AND c.main_force_control_score >= 70" +
		"  AND f.capital_score >= 60" +
		"  AND f.main_net_ratio > 0" +
		" ORDER BY c.behavior_strength DESC, f.capital_score DESC" +
		" LIMIT 100"

	return r.queryList("accumulation", sql)
}

// ============================================================
// 筹码上移榜  peak_move_pct > 2, main_net_ratio > 0, ORDER BY peak_move_pct DESC
// ============================================================
func (r *ChipMonitorRepository) GetPeakMoveList(tradeDate string) ([]models.AccumulationRow, error) {
	sql := "SELECT " + listSelectColumns + listFromJoin +
		"  AND c.peak_move_pct > 0" +
		"  AND f.main_net_ratio > 0" +
		" ORDER BY c.peak_move_pct DESC" +
		" LIMIT 100"

	return r.queryList("peak-move", sql)
}

// ============================================================
// 筹码发散榜  chip_width70 > 0.25, ORDER BY chip_width70 DESC
// ============================================================
func (r *ChipMonitorRepository) GetDivergenceList(tradeDate string) ([]models.AccumulationRow, error) {
	sql := "SELECT " + listSelectColumns + listFromJoin +
		"  AND c.chip_width70 > 0.25" +
		" ORDER BY c.chip_width70 DESC" +
		" LIMIT 100"

	return r.queryList("divergence", sql)
}

// ============================================================
// 疑似出货榜  behavior=4, cost_profit_pct > 20, main_net_ratio < 0
// ============================================================
func (r *ChipMonitorRepository) GetDistributionList(tradeDate string) ([]models.AccumulationRow, error) {
	sql := "SELECT " + listSelectColumns + listFromJoin +
		"  AND c.behavior = 4" +
		"  AND c.cost_profit_pct > 20" +
		"  AND f.main_net_ratio < 0" +
		" ORDER BY c.behavior_strength DESC" +
		" LIMIT 100"

	return r.queryList("distribution", sql)
}

// ============================================================
// SearchStock 根据 symbol 或股票名称搜索，返回该股在哪个榜单中出现
// ============================================================
func (r *ChipMonitorRepository) SearchStock(query string) (*models.AccumulationRow, []string, error) {
	sql := "SELECT " + listSelectColumns + listFromJoin +
		"  AND (c.symbol = ? OR f.stock_name LIKE ?)" +
		" LIMIT 1"

	var row models.AccumulationRow
	likeQ := "%" + query + "%"
	if err := r.db.Raw(sql, query, likeQ).Scan(&row).Error; err != nil {
		log.Printf("[chip-monitor] search query error: %v", err)
		return nil, nil, err
	}

	// GORM Raw().Scan() returns nil error with zero-value struct when no rows found.
	// We detect that by checking Symbol == "".
	if row.Symbol == "" {
		log.Printf("[chip-monitor] search: no match for %q", query)
		return nil, nil, nil
	}

	// Determine which tabs this stock matches
	var tabs []string
	if row.Behavior == 1 && row.MainForceControlScore >= 70 && row.CapitalScore >= 60 && row.MainNetRatio > 0 {
		tabs = append(tabs, "accumulation")
	}
	if row.PeakMovePct > 0 && row.MainNetRatio > 0 {
		tabs = append(tabs, "peak_move")
	}
	if row.ChipWidth70 > 0.25 {
		tabs = append(tabs, "divergence")
	}
	if row.Behavior == 4 && row.CostProfitPct > 20 && row.MainNetRatio < 0 {
		tabs = append(tabs, "distribution")
	}

	log.Printf("[chip-monitor] search: %q matched tabs=%v", query, tabs)
	return &row, tabs, nil
}

// ============================================================
// queryList runs a list query and returns mapped rows.
// ============================================================
func (r *ChipMonitorRepository) queryList(label, sql string) ([]models.AccumulationRow, error) {
	var rows []models.AccumulationRow

	var chipDate string
	if err := r.db.Raw("SELECT MAX(trade_date) FROM quant_db.stk_chip_factor").Scan(&chipDate).Error; err != nil {
		log.Printf("[chip-monitor] %s date error: %v", label, err)
		return nil, err
	}
	log.Printf("[chip-monitor] %s SQL for trade_date=%q", label, chipDate)

	if err := r.db.Raw(sql).Scan(&rows).Error; err != nil {
		log.Printf("[chip-monitor] %s query error: %v", label, err)
		return nil, err
	}
	log.Printf("[chip-monitor] %s: %d rows returned for %s", label, len(rows), chipDate)
	return rows, nil
}
