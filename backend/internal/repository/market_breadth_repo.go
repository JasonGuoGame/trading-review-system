package repository

import (
	"time"

	"trading-review-system/backend/internal/models"

	"gorm.io/gorm"
)

type MarketBreadthRepository struct {
	db      *gorm.DB
	quantDb *gorm.DB
}

func NewMarketBreadthRepository(db *gorm.DB, quantDb *gorm.DB) *MarketBreadthRepository {
	return &MarketBreadthRepository{db: db, quantDb: quantDb}
}

func (r *MarketBreadthRepository) GetByDate(date time.Time) (*models.MarketBreadth, error) {
	var breadth models.MarketBreadth
	startOfDay := time.Date(date.Year(), date.Month(), date.Day(), 0, 0, 0, 0, date.Location())
	err := r.db.Where("trade_date = ?", startOfDay).First(&breadth).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &breadth, nil
}

func (r *MarketBreadthRepository) GetAdvancersByDates(dates []string) (map[string]int, error) {
	if len(dates) == 0 {
		return map[string]int{}, nil
	}
	var rows []models.MarketBreadth
	err := r.db.Where("trade_date IN ?", dates).Find(&rows).Error
	if err != nil {
		return nil, err
	}
	result := make(map[string]int, len(rows))
	for _, row := range rows {
		result[row.TradeDate.Format("2006-01-02")] = row.Advancers
	}
	return result, nil
}

func (r *MarketBreadthRepository) Upsert(breadth *models.MarketBreadth) error {
	startOfDay := time.Date(breadth.TradeDate.Year(), breadth.TradeDate.Month(), breadth.TradeDate.Day(), 0, 0, 0, 0, breadth.TradeDate.Location())
	breadth.TradeDate = startOfDay

	var existing models.MarketBreadth
	err := r.db.Where("trade_date = ?", startOfDay).First(&existing).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return r.db.Create(breadth).Error
		}
		return err
	}

	breadth.ID = existing.ID
	breadth.CreatedAt = existing.CreatedAt
	return r.db.Save(breadth).Error
}

// GetTopSectorScores returns the top N sectors by total_score for a given date,
// restricted to the latest intraday snapshot (snapshot_time) of that day.
func (r *MarketBreadthRepository) GetTopSectorScores(tradeDate string, limit int) ([]models.StkSectorScore, error) {
	var scores []models.StkSectorScore
	// 取交易日当天最后一次盘中快照的数据
	err := r.db.Where("trade_date = ? AND snapshot_time = (?)",
		tradeDate,
		r.db.Model(&models.StkSectorScore{}).Select("MAX(snapshot_time)").Where("trade_date = ?", tradeDate),
	).
		Order("total_score DESC").
		Limit(limit).
		Find(&scores).Error
	if err != nil {
		return nil, err
	}
	// 无快照数据（历史数据 snapshot_time 为 NULL）时回退到全天数据
	if len(scores) == 0 {
		err = r.db.Where("trade_date = ?", tradeDate).
			Order("total_score DESC").
			Limit(limit).
			Find(&scores).Error
		if err != nil {
			return nil, err
		}
	}
	return scores, nil
}

// MarketBreadthSnapshot holds date-level market breadth summary.
type MarketBreadthSnapshot struct {
	Advancers int
	UpRatio   float64
}

// GetBreadthSnapshots returns advancers and up_ratio for the given dates.
func (r *MarketBreadthRepository) GetBreadthSnapshots(dates []string) (map[string]MarketBreadthSnapshot, error) {
	if len(dates) == 0 {
		return map[string]MarketBreadthSnapshot{}, nil
	}
	var rows []models.MarketBreadth
	err := r.db.Where("trade_date IN ?", dates).Find(&rows).Error
	if err != nil {
		return nil, err
	}
	result := make(map[string]MarketBreadthSnapshot, len(rows))
	for _, row := range rows {
		result[row.TradeDate.Format("2006-01-02")] = MarketBreadthSnapshot{
			Advancers: row.Advancers,
			UpRatio:   row.UpRatio,
		}
	}
	return result, nil
}

// GetLatestAdvancers returns the advancers count for the most recent trade_date.
func (r *MarketBreadthRepository) GetLatestAdvancers() (int, error) {
	var advancers int
	err := r.db.Model(&models.MarketBreadth{}).
		Select("advancers").
		Order("trade_date DESC").
		Limit(1).
		Scan(&advancers).Error
	return advancers, err
}

// IntradayCumulative holds cumulative minute-level turnover (amount, in yuan) up to
// each hour mark, plus the latest minute present for the day.
type IntradayCumulative struct {
	Cum1000      float64 `gorm:"column:cum_1000"`
	Cum1100      float64 `gorm:"column:cum_1100"`
	Cum1130      float64 `gorm:"column:cum_1130"`
	Cum1400      float64 `gorm:"column:cum_1400"`
	Cum1440      float64 `gorm:"column:cum_1440"`
	Cum1500      float64 `gorm:"column:cum_1500"`
	LatestMinute string  `gorm:"column:latest_minute"`
}

// GetIntradayCumulative sums quant_db.stk_min_kline.amount for a single trade date
// at the 10:00 / 11:00 / 11:30 / 14:00 / 14:40 / 15:00 marks (each mark counts data
// before or at that time), returning cumulative turnover in yuan.
func (r *MarketBreadthRepository) GetIntradayCumulative(date string) (*IntradayCumulative, error) {
	start, err := time.ParseInLocation("2006-01-02", date, time.Local)
	if err != nil {
		return nil, err
	}
	end := start.AddDate(0, 0, 1)

	var res IntradayCumulative
	err = r.quantDb.Raw(`
		SELECT
			COALESCE(SUM(CASE WHEN TIME(trade_time) <= '10:00:00' THEN amount ELSE 0 END), 0) AS cum_1000,
			COALESCE(SUM(CASE WHEN TIME(trade_time) <= '11:00:00' THEN amount ELSE 0 END), 0) AS cum_1100,
			COALESCE(SUM(CASE WHEN TIME(trade_time) <= '11:30:00' THEN amount ELSE 0 END), 0) AS cum_1130,
			COALESCE(SUM(CASE WHEN TIME(trade_time) <= '14:00:00' THEN amount ELSE 0 END), 0) AS cum_1400,
			COALESCE(SUM(CASE WHEN TIME(trade_time) <= '14:40:00' THEN amount ELSE 0 END), 0) AS cum_1440,
			COALESCE(SUM(CASE WHEN TIME(trade_time) <= '15:00:00' THEN amount ELSE 0 END), 0) AS cum_1500,
			COALESCE(DATE_FORMAT(MAX(trade_time), '%H:%i'), '') AS latest_minute
		FROM stk_min_kline
		WHERE trade_time >= ? AND trade_time < ?
	`, start.Format("2006-01-02 00:00:00"), end.Format("2006-01-02 00:00:00")).Scan(&res).Error
	if err != nil {
		return nil, err
	}
	return &res, nil
}

// GetPreviousMinKlineDate returns the previous trading date (YYYY-MM-DD) before the
// given date, derived from quant_db.stk_min_kline.
func (r *MarketBreadthRepository) GetPreviousMinKlineDate(date string) (string, error) {
	start, err := time.ParseInLocation("2006-01-02", date, time.Local)
	if err != nil {
		return "", err
	}
	var prev string
	err = r.quantDb.Raw(`
		SELECT COALESCE(DATE_FORMAT(MAX(trade_time), '%Y-%m-%d'), '')
		FROM stk_min_kline
		WHERE trade_time < ?
	`, start.Format("2006-01-02 00:00:00")).Scan(&prev).Error
	if err != nil {
		return "", err
	}
	return prev, nil
}

// TopRisingSectorRow is one sector from stk_sector_scores ordered by rank_change.
type TopRisingSectorRow struct {
	SectorName string  `gorm:"column:sector_name"`
	RankPos    int     `gorm:"column:rank_pos"`
	RankChange int     `gorm:"column:rank_change"`
	TotalScore float64 `gorm:"column:total_score"`
	StartRank  int     `gorm:"column:start_rank"`
	EndRank    int     `gorm:"column:end_rank"`
}

// GetSnapshotTimes returns every distinct intraday snapshot time (formatted
// "YYYY-MM-DD HH:MM:SS") for a trade date, in ascending order.
func (r *MarketBreadthRepository) GetSnapshotTimes(tradeDate string) ([]string, error) {
	var times []string
	err := r.db.Raw(`
		SELECT DATE_FORMAT(snapshot_time, '%Y-%m-%d %H:%i:%s') AS t
		FROM stk_sector_scores
		WHERE trade_date = ? AND snapshot_time IS NOT NULL
		GROUP BY t
		ORDER BY t ASC
	`, tradeDate).Scan(&times).Error
	if err != nil {
		return nil, err
	}
	return times, nil
}

// GetTopRisingSectors returns the sectors with the largest positive rank change
// (排名上升最快) in a given intraday snapshot of the trade date. merge == 1 reads a
// single snapshot's rank_change; merge >= 2 computes the net rank change between
// the snapshot (merge-1) positions before snapshotTime and snapshotTime itself
// (rank_pos(start) - rank_pos(end)). When snapshotTime is empty, the latest
// snapshot of the day is used (and for EOD-only historical data with no snapshots
// at all, the whole day is used). It returns the end snapshot time (empty for
// EOD-only historical data), the start snapshot time (empty unless merge >= 2),
// and the rows.
func (r *MarketBreadthRepository) GetTopRisingSectors(tradeDate string, limit int, snapshotTime string, merge int) (string, string, []TopRisingSectorRow, error) {
	if merge < 1 {
		merge = 1
	}
	if merge > 4 {
		merge = 4
	}

	// Resolve the end snapshot time when not explicitly provided.
	if snapshotTime == "" {
		if err := r.db.Raw(`
			SELECT COALESCE(DATE_FORMAT(MAX(snapshot_time), '%Y-%m-%d %H:%i:%s'), '')
			FROM stk_sector_scores
			WHERE trade_date = ?
		`, tradeDate).Scan(&snapshotTime).Error; err != nil {
			return "", "", nil, err
		}
	}

	// Single-snapshot mode: read rank_change directly.
	if merge == 1 {
		query := `
			SELECT sector_name,
				COALESCE(rank_pos, 0)      AS rank_pos,
				COALESCE(rank_change, 0)   AS rank_change,
				COALESCE(total_score, 0)   AS total_score
			FROM stk_sector_scores
			WHERE trade_date = ?
			  AND rank_change > 0`
		args := []interface{}{tradeDate}

		if snapshotTime != "" {
			query += ` AND DATE_FORMAT(snapshot_time, '%Y-%m-%d %H:%i:%s') = ?`
			args = append(args, snapshotTime)
		}
		query += ` ORDER BY rank_change DESC, rank_pos ASC LIMIT ?`
		args = append(args, limit)

		var rows []TopRisingSectorRow
		if err := r.db.Raw(query, args...).Scan(&rows).Error; err != nil {
			return "", "", nil, err
		}
		return snapshotTime, "", rows, nil
	}

	// Merged mode: locate the start snapshot (merge-1) positions before the end.
	if snapshotTime == "" {
		// No snapshots at all (EOD-only historical data): nothing to merge.
		return "", "", nil, nil
	}
	times, err := r.GetSnapshotTimes(tradeDate)
	if err != nil {
		return "", "", nil, err
	}
	endIdx := -1
	for i, t := range times {
		if t == snapshotTime {
			endIdx = i
			break
		}
	}
	if endIdx < 0 {
		// Provided snapshotTime not among the day's snapshots (shouldn't normally happen).
		return "", "", nil, nil
	}
	startIdx := endIdx - (merge - 1)
	if startIdx < 0 {
		startIdx = 0
	}
	startTime := times[startIdx]

	query := `
		SELECT t.sector_name,
			COALESCE(s.rank_pos, 0)                                 AS start_rank,
			COALESCE(t.rank_pos, 0)                                 AS end_rank,
			COALESCE(t.rank_pos, 0)                                 AS rank_pos,
			COALESCE(s.rank_pos, 0) - COALESCE(t.rank_pos, 0)       AS rank_change,
			COALESCE(t.total_score, 0)                              AS total_score
		FROM stk_sector_scores t
		JOIN stk_sector_scores s
		  ON s.trade_date = t.trade_date
		 AND s.sector_name = t.sector_name
		 AND DATE_FORMAT(s.snapshot_time, '%Y-%m-%d %H:%i:%s') = ?
		WHERE t.trade_date = ?
		  AND DATE_FORMAT(t.snapshot_time, '%Y-%m-%d %H:%i:%s') = ?
		  AND COALESCE(s.rank_pos, 0) - COALESCE(t.rank_pos, 0) > 0
		ORDER BY rank_change DESC, t.rank_pos ASC
		LIMIT ?`
	var rows []TopRisingSectorRow
	if err := r.db.Raw(query, startTime, tradeDate, snapshotTime, limit).Scan(&rows).Error; err != nil {
		return "", "", nil, err
	}
	return snapshotTime, startTime, rows, nil
}

// GetAllSectorNames returns every sector classification name in quant_db.sectors.
func (r *MarketBreadthRepository) GetAllSectorNames() ([]string, error) {
	var names []string
	err := r.quantDb.Table("sectors").Order("name").Pluck("name", &names).Error
	if err != nil {
		return nil, err
	}
	return names, nil
}

// SectorRelationStockRow is a capital-abnormal stock matched to a sector through
// quant_db.stock_sector_relation (precise membership), rather than the loose
// sector_name string stored in stk_capital_abnormal.
type SectorRelationStockRow struct {
	Symbol      string  `gorm:"column:symbol"`
	Name        string  `gorm:"column:name"`
	VolRatio    float64 `gorm:"column:vol_ratio"`
	SurgeCount  int     `gorm:"column:surge_count"`
	MaxSurgeRet float64 `gorm:"column:max_surge_ret"`
	SurgeTimes  string  `gorm:"column:surge_times"`
	RelSector   string  `gorm:"column:rel_sector_name"`
}

// GetAbnormalStocksBySectorRelation returns capital-abnormal stocks for a trade
// date whose stock_sector_relation.sector_name is one of the given full names.
func (r *MarketBreadthRepository) GetAbnormalStocksBySectorRelation(tradeDate string, sectorFullNames []string) ([]SectorRelationStockRow, error) {
	var rows []SectorRelationStockRow
	err := r.quantDb.Raw(`
		SELECT ca.symbol,
			COALESCE(ca.name, '')          AS name,
			COALESCE(ca.vol_ratio, 0)      AS vol_ratio,
			COALESCE(ca.surge_count, 0)    AS surge_count,
			COALESCE(ca.max_surge_ret, 0)  AS max_surge_ret,
			COALESCE(ca.surge_times, '')   AS surge_times,
			rel.sector_name                AS rel_sector_name
		FROM stk_capital_abnormal ca
		JOIN stock_sector_relation rel ON rel.symbol = ca.symbol
		WHERE ca.trade_date = ?
		  AND rel.sector_name IN ?
	`, tradeDate, sectorFullNames).Scan(&rows).Error
	if err != nil {
		return nil, err
	}
	return rows, nil
}
