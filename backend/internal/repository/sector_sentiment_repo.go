package repository

import (
	"log"
	"sort"
	"sync"

	"gorm.io/gorm"
)

// Broad indices that should be excluded from sector listings.
var broadIndexBlacklist = []string{
	"上证指数", "深证成指", "创业板指", "沪深300", "中证1000",
}

type SectorSentimentRepository struct {
	db     *gorm.DB
	quantDb *gorm.DB
}

func NewSectorSentimentRepository(db *gorm.DB, quantDb *gorm.DB) *SectorSentimentRepository {
	return &SectorSentimentRepository{db: db, quantDb: quantDb}
}

// GetLatestTradeDate returns the most recent trade_date across both
// stk_sector_breadths and stk_sector_scores (consistent strength sources).
func (r *SectorSentimentRepository) GetLatestTradeDate() (string, error) {
	var date string
	err := r.db.Raw(`
		SELECT MAX(trade_date) FROM (
			SELECT trade_date FROM stk_sector_breadths
			UNION
			SELECT trade_date FROM stk_sector_scores
		) AS t
	`).Scan(&date).Error
	if err != nil {
		log.Printf("[sector-sentiment] GetLatestTradeDate error: %v", err)
		return "", err
	}
	// Normalize to YYYY-MM-DD (MySQL may return full timestamp)
	if len(date) > 10 {
		date = date[:10]
	}
	log.Printf("[sector-sentiment] latest trade_date: %q", date)
	return date, nil
}

// GetPreviousTradeDate returns the trade_date just before the given one.
// It checks both stk_sector_breadths and stk_sector_scores, since consistent
// strength data is sourced from both tables.
func (r *SectorSentimentRepository) GetPreviousTradeDate(tradeDate string) (string, error) {
	var date string
	err := r.db.Raw(`
		SELECT MAX(trade_date) FROM (
			SELECT trade_date FROM stk_sector_breadths WHERE trade_date < ?
			UNION
			SELECT trade_date FROM stk_sector_scores WHERE trade_date < ?
		) AS t
	`, tradeDate, tradeDate).Scan(&date).Error
	if err != nil {
		return "", err
	}
	// Normalize to YYYY-MM-DD (MySQL may return full timestamp)
	if len(date) > 10 {
		date = date[:10]
	}
	return date, nil
}

// ============================================================
// 1. 连强信号 — Consistent Strength
//    Sectors with rank_pos <= 15 on 3+ of the last 7 trading days.
//    Sources: stk_sector_breadths + stk_sector_scores (merged).
// ============================================================

type ConsistentStrengthRow struct {
	SectorName    string `gorm:"column:sector_name"`
	StrongDays    int    `gorm:"column:strong_days"`
	Source        string `gorm:"column:source"`
	High20dCount  int    `gorm:"column:high_20d_count"`
	High60dCount  int    `gorm:"column:high_60d_count"`
	High250dCount int    `gorm:"column:high_250d_count"`
}

func (r *SectorSentimentRepository) GetConsistentStrength(tradeDate string) ([]ConsistentStrengthRow, error) {
	// Computes "过去7个交易日里 rank_pos ≤ 15 的天数" directly from rank_pos,
	// taking each day's latest snapshot (snapshot_time). A sector qualifies as
	// 连强 when it ranks top-15 on 3+ of the last 7 trading days. This no longer
	// trusts the pre-computed persistence_7d / is_leader ETL columns, which were
	// inconsistent with the actual rank_pos history.
	sql := `
		SELECT t.sector_name, t.strong_days AS strong_days,
			'sector_score' AS source,
			COALESCE(l.high_20d_count, 0) AS high_20d_count,
			COALESCE(l.high_60d_count, 0) AS high_60d_count,
			COALESCE(l.high_250d_count, 0) AS high_250d_count
		FROM (
			SELECT s.sector_name, COUNT(DISTINCT s.trade_date) AS strong_days
			FROM stk_sector_scores s
			WHERE s.trade_date <= ?
			  AND s.rank_pos <= 15
			  AND s.snapshot_time <=> (SELECT MAX(s2.snapshot_time) FROM stk_sector_scores s2 WHERE s2.trade_date = s.trade_date)
			  AND s.trade_date >= (SELECT MIN(td) FROM (SELECT DISTINCT trade_date AS td FROM stk_sector_scores WHERE trade_date <= ? ORDER BY td DESC LIMIT 7) AS d)
			GROUP BY s.sector_name
			HAVING strong_days >= 3
		) t
		LEFT JOIN (
			SELECT sector_name, high_20d_count, high_60d_count, high_250d_count
			FROM stk_sector_scores
			WHERE trade_date = ?
			  AND snapshot_time <=> (SELECT MAX(snapshot_time) FROM stk_sector_scores WHERE trade_date = ?)
		) l ON l.sector_name = t.sector_name

		UNION ALL

		SELECT t.sector_name, t.strong_days AS strong_days,
			'sector_breadth' AS source,
			COALESCE(l.high_20d_count, 0) AS high_20d_count,
			COALESCE(l.high_60d_count, 0) AS high_60d_count,
			COALESCE(l.high_250d_count, 0) AS high_250d_count
		FROM (
			SELECT b.sector_name, COUNT(DISTINCT b.trade_date) AS strong_days
			FROM stk_sector_breadths b
			WHERE b.sector_type = 'industry'
			  AND b.trade_date <= ?
			  AND b.rank_pos <= 15
			  AND b.snapshot_time <=> (SELECT MAX(b2.snapshot_time) FROM stk_sector_breadths b2 WHERE b2.trade_date = b.trade_date AND b2.sector_type = 'industry')
			  AND b.trade_date >= (SELECT MIN(td) FROM (SELECT DISTINCT trade_date AS td FROM stk_sector_breadths WHERE trade_date <= ? AND sector_type = 'industry' ORDER BY td DESC LIMIT 7) AS d)
			GROUP BY b.sector_name
			HAVING strong_days >= 3
		) t
		LEFT JOIN (
			SELECT sector_name, high_20d_count, high_60d_count, high_250d_count
			FROM stk_sector_breadths
			WHERE trade_date = ?
			  AND sector_type = 'industry'
			  AND snapshot_time <=> (SELECT MAX(snapshot_time) FROM stk_sector_breadths WHERE trade_date = ? AND sector_type = 'industry')
		) l ON l.sector_name = t.sector_name

		ORDER BY strong_days DESC
	`
	var rows []ConsistentStrengthRow
	if err := r.db.Raw(sql, tradeDate, tradeDate, tradeDate, tradeDate, tradeDate, tradeDate, tradeDate, tradeDate).Scan(&rows).Error; err != nil {
		log.Printf("[sector-sentiment] GetConsistentStrength error: %v", err)
		return nil, err
	}
	log.Printf("[sector-sentiment] consistent strength (%s): %d sectors", tradeDate, len(rows))
	return rows, nil
}

// GetLeaderCountMap returns how many of the last 30 trading days each sector
// ranked top-15 (rank_pos ≤ 15, latest snapshot per day), keyed by "sectorName|source".
func (r *SectorSentimentRepository) GetLeaderCountMap(tradeDate string) (map[string]int, error) {
	sql := `
		SELECT s.sector_name, 'sector_score' AS source, COUNT(*) AS cnt
		FROM stk_sector_scores s
		WHERE s.trade_date <= ? AND s.rank_pos <= 15
		  AND s.trade_date >= (SELECT MIN(td) FROM (SELECT DISTINCT trade_date AS td
			FROM stk_sector_scores WHERE trade_date <= ? ORDER BY td DESC LIMIT 30) AS d)
		  AND s.snapshot_time <=> (SELECT MAX(s2.snapshot_time) FROM stk_sector_scores s2 WHERE s2.trade_date = s.trade_date)
		GROUP BY s.sector_name
		UNION ALL
		SELECT b.sector_name, 'sector_breadth' AS source, COUNT(*) AS cnt
		FROM stk_sector_breadths b
		WHERE b.trade_date <= ? AND b.rank_pos <= 15 AND b.sector_type = 'industry'
		  AND b.trade_date >= (SELECT MIN(td) FROM (SELECT DISTINCT trade_date AS td
			FROM stk_sector_breadths WHERE trade_date <= ? AND sector_type = 'industry'
			ORDER BY td DESC LIMIT 30) AS d)
		  AND b.snapshot_time <=> (SELECT MAX(b2.snapshot_time) FROM stk_sector_breadths b2 WHERE b2.trade_date = b.trade_date AND b2.sector_type = 'industry')
		GROUP BY b.sector_name
	`
	type row struct {
		SectorName string `gorm:"column:sector_name"`
		Source     string `gorm:"column:source"`
		Cnt        int    `gorm:"column:cnt"`
	}
	var rows []row
	if err := r.db.Raw(sql, tradeDate, tradeDate, tradeDate, tradeDate).Scan(&rows).Error; err != nil {
		return nil, err
	}
	result := make(map[string]int, len(rows))
	for _, r := range rows {
		result[r.SectorName+"|"+r.Source] = r.Cnt
	}
	return result, nil
}

// PrevHighCount holds a sector's high counts on a specific date.
type PrevHighCount struct {
	SectorName    string `gorm:"column:sector_name"`
	Source        string `gorm:"column:source"`
	High20dCount  int    `gorm:"column:high_20d_count"`
	High60dCount  int    `gorm:"column:high_60d_count"`
	High250dCount int    `gorm:"column:high_250d_count"`
}

// GetPrevHighCounts returns high counts for the given sectors on the given date.
func (r *SectorSentimentRepository) GetPrevHighCounts(tradeDate string, sectors []string) ([]PrevHighCount, error) {
	if len(sectors) == 0 {
		return nil, nil
	}
	sql := `
		SELECT s.sector_name, s.high_20d_count, s.high_60d_count, s.high_250d_count,
			'sector_score' AS source
		FROM stk_sector_scores s
		WHERE s.trade_date = ? AND s.sector_name IN ?
		  AND s.snapshot_time <=> (SELECT MAX(s2.snapshot_time) FROM stk_sector_scores s2 WHERE s2.trade_date = s.trade_date)
		UNION ALL
		SELECT b.sector_name, b.high_20d_count, b.high_60d_count, b.high_250d_count,
			'sector_breadth' AS source
		FROM stk_sector_breadths b
		WHERE b.trade_date = ? AND b.sector_name IN ? AND b.sector_type = 'industry'
		  AND b.snapshot_time <=> (SELECT MAX(b2.snapshot_time) FROM stk_sector_breadths b2 WHERE b2.trade_date = b.trade_date AND b2.sector_type = 'industry')
	`
	var rows []PrevHighCount
	if err := r.db.Raw(sql, tradeDate, sectors, tradeDate, sectors).Scan(&rows).Error; err != nil {
		return nil, err
	}
	return rows, nil
}

func (r *SectorSentimentRepository) GetSectorRecentRanksFromScores(sectorName, tradeDate string) ([]*int, error) {
	type rankRow struct {
		RankPos *int `gorm:"column:rank_pos"`
	}
	var rows []rankRow
	sql := `
		SELECT s.rank_pos FROM stk_sector_scores s
		WHERE s.sector_name = ? AND s.trade_date <= ?
		  AND s.snapshot_time <=> (SELECT MAX(s2.snapshot_time) FROM stk_sector_scores s2 WHERE s2.trade_date = s.trade_date)
		ORDER BY s.trade_date DESC LIMIT 5
	`
	if err := r.db.Raw(sql, sectorName, tradeDate).Scan(&rows).Error; err != nil {
		return nil, err
	}
	ranks := make([]*int, len(rows))
	for i, row := range rows {
		ranks[len(rows)-1-i] = row.RankPos
	}
	return ranks, nil
}

func (r *SectorSentimentRepository) GetSectorRecentRanks(sectorName, tradeDate string) ([]*int, error) {
	type rankRow struct {
		RankPos *int `gorm:"column:rank_pos"`
	}
	var rows []rankRow
	sql := `
		SELECT b.rank_pos FROM stk_sector_breadths b
		WHERE b.sector_name = ? AND b.sector_type = 'industry' AND b.trade_date <= ?
		  AND b.snapshot_time <=> (SELECT MAX(b2.snapshot_time) FROM stk_sector_breadths b2 WHERE b2.trade_date = b.trade_date AND b2.sector_type = 'industry')
		ORDER BY b.trade_date DESC LIMIT 5
	`
	if err := r.db.Raw(sql, sectorName, tradeDate).Scan(&rows).Error; err != nil {
		return nil, err
	}
	ranks := make([]*int, len(rows))
	for i, row := range rows {
		ranks[len(rows)-1-i] = row.RankPos
	}
	return ranks, nil
}

// ============================================================
// 2. 新面孔信号 — New Faces
//    Today in top 10, previous 5 days ALL outside top 30.
// ============================================================

type NewFaceRow struct {
	SectorName    string `gorm:"column:sector_name"`
	TodayRank     int    `gorm:"column:today_rank"`
	YesterdayRank int    `gorm:"column:yesterday_rank"`
	RankJump      int    `gorm:"column:rank_jump"`
	Source        string `gorm:"column:source"` // "sector_score" or "sector_breadth"
}

func (r *SectorSentimentRepository) GetNewFaces(tradeDate string) ([]NewFaceRow, error) {
	// Query both stk_sector_scores and stk_sector_breadths, union results
	sql := `
		WITH ScoreDates AS (
			SELECT DISTINCT trade_date FROM stk_sector_scores
			WHERE trade_date <= ?
			ORDER BY trade_date DESC LIMIT 6
		),
		ScoreLatest AS (SELECT MAX(trade_date) AS d_today FROM ScoreDates),
		ScoreHistory AS (
			SELECT trade_date FROM ScoreDates WHERE trade_date < (SELECT d_today FROM ScoreLatest)
		),
		ScoreToday AS (
			SELECT sector_name, rank_pos AS today_rank
			FROM stk_sector_scores
			WHERE trade_date = (SELECT d_today FROM ScoreLatest) AND rank_pos <= 10
			  AND snapshot_time <=> (SELECT MAX(snapshot_time) FROM stk_sector_scores WHERE trade_date = (SELECT d_today FROM ScoreLatest))
		),
		ScorePast AS (
			SELECT sector_name, MIN(rank_pos) AS min_past_rank
			FROM stk_sector_scores
			WHERE trade_date IN (SELECT trade_date FROM ScoreHistory)
			GROUP BY sector_name
		),
		ScoreResult AS (
			SELECT s.sector_name, s.today_rank,
			       CAST(COALESCE(p.min_past_rank, 999) AS SIGNED) AS yesterday_rank,
			       CAST(COALESCE(p.min_past_rank, 999) - s.today_rank AS SIGNED) AS rank_jump,
			       'sector_score' AS source
			FROM ScoreToday s
			JOIN ScorePast p ON s.sector_name = p.sector_name
			WHERE p.min_past_rank > 30
		),
		BreadthDates AS (
			SELECT DISTINCT trade_date FROM stk_sector_breadths
			WHERE trade_date <= ?
			ORDER BY trade_date DESC LIMIT 6
		),
		BreadthLatest AS (SELECT MAX(trade_date) AS d_today FROM BreadthDates),
		BreadthHistory AS (
			SELECT trade_date FROM BreadthDates WHERE trade_date < (SELECT d_today FROM BreadthLatest)
		),
		BreadthToday AS (
			SELECT sector_name, rank_pos AS today_rank
			FROM stk_sector_breadths
			WHERE trade_date = (SELECT d_today FROM BreadthLatest)
			  AND rank_pos <= 10 AND sector_type = 'industry'
			  AND snapshot_time <=> (SELECT MAX(snapshot_time) FROM stk_sector_breadths WHERE trade_date = (SELECT d_today FROM BreadthLatest))
		),
		BreadthPast AS (
			SELECT sector_name, MIN(rank_pos) AS min_past_rank
			FROM stk_sector_breadths
			WHERE trade_date IN (SELECT trade_date FROM BreadthHistory)
			  AND sector_type = 'industry'
			GROUP BY sector_name
		),
		BreadthResult AS (
			SELECT b.sector_name, b.today_rank,
			       CAST(COALESCE(p.min_past_rank, 999) AS SIGNED) AS yesterday_rank,
			       CAST(COALESCE(p.min_past_rank, 999) - b.today_rank AS SIGNED) AS rank_jump,
			       'sector_breadth' AS source
			FROM BreadthToday b
			JOIN BreadthPast p ON b.sector_name = p.sector_name
			WHERE p.min_past_rank > 30
		)
		SELECT * FROM ScoreResult
		UNION ALL
		SELECT * FROM BreadthResult
		ORDER BY today_rank ASC
	`
	var rows []NewFaceRow
	if err := r.db.Raw(sql, tradeDate, tradeDate).Scan(&rows).Error; err != nil {
		log.Printf("[sector-sentiment] GetNewFaces error: %v", err)
		return nil, err
	}
	log.Printf("[sector-sentiment] new faces (%s): %d sectors", tradeDate, len(rows))
	return rows, nil
}

// ============================================================
// 3. 冰点回升信号 — Ice Recovery
//    Today red_rate >= 80, previous 5 days max < 25.
// ============================================================

type IceRecoveryRow struct {
	SectorName string  `gorm:"column:sector_name"`
	RedRate    float64 `gorm:"column:red_rate"`
	Prev5dMax  float64 `gorm:"column:prev_5d_max"`
}

func (r *SectorSentimentRepository) GetIceRecovery(tradeDate string) ([]IceRecoveryRow, error) {
	// Optimization (mirrors the divergence / climbing-sectors fixes):
	//   1. The window MAX(...) OVER (ROWS BETWEEN 5 PRECEDING AND 1 PRECEDING)
	//      was computed over the ENTIRE history of every sector, only to read a
	//      single trade_date. The input is now bounded to the last 20 trading
	//      days (the 5 preceding days plus generous margin for data gaps).
	//   2. The per-row correlated subquery for the latest snapshot is replaced by
	//      a precomputed Latest CTE (GROUP BY trade_date) + JOIN.
	sql := `
		WITH RecentDates AS (
			SELECT trade_date FROM (
				SELECT DISTINCT trade_date FROM stk_sector_breadths
				WHERE trade_date <= ? AND sector_type = 'industry'
				ORDER BY trade_date DESC LIMIT 20
			) t
		),
		Latest AS (
			SELECT trade_date, MAX(snapshot_time) AS max_snapshot
			FROM stk_sector_breadths
			WHERE sector_type = 'industry'
			  AND trade_date IN (SELECT trade_date FROM RecentDates)
			GROUP BY trade_date
		),
		SectorHistory AS (
			SELECT b.sector_name, b.trade_date, b.red_rate,
				MAX(b.red_rate) OVER(
					PARTITION BY b.sector_name ORDER BY b.trade_date
					ROWS BETWEEN 5 PRECEDING AND 1 PRECEDING
				) AS prev_5d_max
			FROM stk_sector_breadths b
			JOIN Latest l ON b.trade_date = l.trade_date AND b.snapshot_time <=> l.max_snapshot
			WHERE b.sector_type = 'industry'
		)
		SELECT sector_name, red_rate, prev_5d_max
		FROM SectorHistory
		WHERE trade_date = ?
		  AND red_rate >= 80
		  AND (prev_5d_max IS NULL OR prev_5d_max < 25)
		ORDER BY red_rate DESC
	`
	var rows []IceRecoveryRow
	if err := r.db.Raw(sql, tradeDate, tradeDate).Scan(&rows).Error; err != nil {
		log.Printf("[sector-sentiment] GetIceRecovery error: %v", err)
		return nil, err
	}
	log.Printf("[sector-sentiment] ice recovery (%s): %d sectors", tradeDate, len(rows))
	return rows, nil
}

// GetIceRecoveryPrev5dRates returns, for each named sector, its last 5 trading
// days' red_rate before tradeDate (oldest first). Replaces the previous N+1
// pattern (one GetSectorPrev5dRates call per ice-recovery row) with a single
// batch query.
func (r *SectorSentimentRepository) GetIceRecoveryPrev5dRates(sectorNames []string, tradeDate string) (map[string][]float64, error) {
	result := make(map[string][]float64, len(sectorNames))
	if len(sectorNames) == 0 {
		return result, nil
	}
	sql := `
		WITH RecentDates AS (
			SELECT trade_date FROM (
				SELECT DISTINCT trade_date FROM stk_sector_breadths
				WHERE trade_date < ? AND sector_type = 'industry'
				ORDER BY trade_date DESC LIMIT 20
			) t
		),
		Latest AS (
			SELECT trade_date, MAX(snapshot_time) AS max_snapshot
			FROM stk_sector_breadths
			WHERE sector_type = 'industry'
			  AND trade_date IN (SELECT trade_date FROM RecentDates)
			GROUP BY trade_date
		),
		Ranked AS (
			SELECT b.sector_name, b.red_rate,
				ROW_NUMBER() OVER (PARTITION BY b.sector_name ORDER BY b.trade_date DESC) AS rn
			FROM stk_sector_breadths b
			JOIN Latest l ON b.trade_date = l.trade_date AND b.snapshot_time <=> l.max_snapshot
			WHERE b.sector_type = 'industry'
			  AND b.sector_name IN ?
		)
		SELECT sector_name, red_rate
		FROM Ranked
		WHERE rn <= 5
		ORDER BY sector_name, rn DESC
	`
	type rateRow struct {
		SectorName string  `gorm:"column:sector_name"`
		RedRate    float64 `gorm:"column:red_rate"`
	}
	var rows []rateRow
	if err := r.db.Raw(sql, tradeDate, sectorNames).Scan(&rows).Error; err != nil {
		return nil, err
	}
	// rn DESC emits oldest-first within each sector, so a plain append preserves
	// the "oldest first" ordering the DTO expects.
	for _, row := range rows {
		result[row.SectorName] = append(result[row.SectorName], row.RedRate)
	}
	return result, nil
}

// ============================================================
// 4. 背离信号 — Divergence (Market Heat / Sentiment Scale)
//    Last 20 days of broad vs industry red_rate trends.
// ============================================================

type DivergenceRow struct {
	TradeDate       string  `gorm:"column:trade_date"`
	BroadAvgRate    float64 `gorm:"column:broad_avg_rate"`
	IndustryAvgRate float64 `gorm:"column:industry_avg_rate"`
	HotSectorsCount int     `gorm:"column:hot_sectors_count"`
	TotalSectors    int     `gorm:"column:total_sectors"`
}

func (r *SectorSentimentRepository) GetDivergenceTrend(tradeDate string) ([]DivergenceRow, error) {
	// The previous version filtered the latest snapshot with a correlated
	// subquery per breadth row:
	//   b.snapshot_time <=> (SELECT MAX(b2.snapshot_time) ... WHERE b2.trade_date = b.trade_date)
	// which ran a dependent subquery once per row. Precompute each day's latest
	// industry snapshot once (Latest CTE) and JOIN it, so the table is scanned
	// once instead of once per outer row.
	sql := `
		WITH RecentDates AS (
			SELECT DISTINCT trade_date FROM stk_sector_breadths
			WHERE trade_date <= ?
			ORDER BY trade_date DESC LIMIT 20
		),
		Latest AS (
			SELECT trade_date, MAX(snapshot_time) AS max_snapshot
			FROM stk_sector_breadths
			WHERE sector_type = 'industry'
			  AND trade_date IN (SELECT trade_date FROM RecentDates)
			GROUP BY trade_date
		)
		SELECT
			b.trade_date,
			COALESCE(AVG(CASE WHEN b.sector_type='broad' AND b.sector_name NOT IN ('上证指数','深证成指','创业板指','沪深300','中证1000') THEN b.red_rate END), 0) AS broad_avg_rate,
			COALESCE(AVG(CASE WHEN b.sector_type='industry' THEN b.red_rate END), 0) AS industry_avg_rate,
			COUNT(CASE WHEN b.sector_type='industry' AND b.red_rate >= 80 THEN 1 END) AS hot_sectors_count,
			COUNT(CASE WHEN b.sector_type='industry' THEN 1 END) AS total_sectors
		FROM stk_sector_breadths b
		JOIN Latest l ON b.trade_date = l.trade_date AND b.snapshot_time <=> l.max_snapshot
		GROUP BY b.trade_date
		ORDER BY b.trade_date ASC
	`
	var rows []DivergenceRow
	if err := r.db.Raw(sql, tradeDate).Scan(&rows).Error; err != nil {
		log.Printf("[sector-sentiment] GetDivergenceTrend error: %v", err)
		return nil, err
	}
	log.Printf("[sector-sentiment] divergence trend (%s): %d days", tradeDate, len(rows))
	return rows, nil
}

func (r *SectorSentimentRepository) GetIndustryMedianRate(tradeDate string) (float64, error) {
	// Previously computed the median with a LIMIT/OFFSET trick that ran six
	// correlated MAX(snapshot_time)/COUNT subqueries. Fetch the latest snapshot's
	// industry red_rates (ordered) and compute the median in Go instead.
	sql := `
		SELECT b.red_rate
		FROM stk_sector_breadths b
		JOIN (
			SELECT MAX(snapshot_time) AS max_snapshot
			FROM stk_sector_breadths
			WHERE trade_date = ? AND sector_type = 'industry'
		) l ON b.snapshot_time <=> l.max_snapshot
		WHERE b.trade_date = ? AND b.sector_type = 'industry' AND b.red_rate IS NOT NULL
		ORDER BY b.red_rate
	`
	var rates []float64
	if err := r.db.Raw(sql, tradeDate, tradeDate).Scan(&rates).Error; err != nil {
		log.Printf("[sector-sentiment] GetIndustryMedianRate error: %v", err)
		return 0, err
	}
	return medianFloat64(rates), nil
}

// medianFloat64 returns the median of an already-sorted, non-empty slice.
func medianFloat64(sorted []float64) float64 {
	n := len(sorted)
	if n == 0 {
		return 0
	}
	if n%2 == 1 {
		return sorted[n/2]
	}
	return (sorted[n/2-1] + sorted[n/2]) / 2
}

// ============================================================
// 5. 资金抱团度 — Capital Concentration
//    Large sectors (>=20 stocks) with red_rate >= 85.
// ============================================================

type ConcentrationRow struct {
	SectorName    string  `gorm:"column:sector_name"`
	RedRate       float64 `gorm:"column:red_rate"`
	TotalStocks   int     `gorm:"column:total_stocks"`
	High20dCount  int     `gorm:"column:high_20d_count"`
	High60dCount  int     `gorm:"column:high_60d_count"`
	High250dCount int     `gorm:"column:high_250d_count"`
}

func (r *SectorSentimentRepository) GetConcentration(tradeDate string) ([]ConcentrationRow, error) {
	sql := `
		SELECT b.sector_name, b.red_rate, b.total_stocks,
			b.high_20d_count, b.high_60d_count, b.high_250d_count
		FROM stk_sector_breadths b
		WHERE b.trade_date = ?
		  AND b.sector_type = 'industry'
		  AND b.total_stocks >= 20
		  AND b.red_rate >= 85
		  AND b.snapshot_time <=> (SELECT MAX(b2.snapshot_time) FROM stk_sector_breadths b2 WHERE b2.trade_date = b.trade_date AND b2.sector_type = 'industry')
		ORDER BY b.red_rate DESC
	`
	var rows []ConcentrationRow
	if err := r.db.Raw(sql, tradeDate).Scan(&rows).Error; err != nil {
		log.Printf("[sector-sentiment] GetConcentration error: %v", err)
		return nil, err
	}
	log.Printf("[sector-sentiment] concentration (%s): %d sectors", tradeDate, len(rows))
	return rows, nil
}

// ============================================================
// 6. Sector Drift — rank history for a single sector
// ============================================================

type SectorDriftRow struct {
	TradeDate    string  `gorm:"column:trade_date"`
	RankPos      *int    `gorm:"column:rank_pos"`
	RedRate      float64 `gorm:"column:red_rate"`
	ScoreRankPos *int    `gorm:"column:score_rank_pos"`
}

func (r *SectorSentimentRepository) GetSectorDrift(sectorName string, days int) ([]SectorDriftRow, error) {
	// Collect all dates from both tables, then LEFT JOIN each table's data
	// so we get breadth rank + red_rate + scores rank on every date.
	// Each table now keeps intraday snapshots, so for every trade_date we take
	// the LAST snapshot_time (NULL-safe <=> fallback for historical days).
	sql := `
		WITH dates AS (
			SELECT DISTINCT trade_date FROM stk_sector_breadths
			WHERE sector_name = ? AND sector_type = 'industry'
			UNION
			SELECT DISTINCT trade_date FROM stk_sector_scores
			WHERE sector_name = ?
		),
		breadth_data AS (
			SELECT b.trade_date, b.rank_pos, b.red_rate
			FROM stk_sector_breadths b
			WHERE b.sector_name = ? AND b.sector_type = 'industry'
			  AND b.snapshot_time <=> (
				SELECT MAX(b2.snapshot_time) FROM stk_sector_breadths b2
				WHERE b2.trade_date = b.trade_date AND b2.sector_type = 'industry'
			  )
		),
		score_data AS (
			SELECT s.trade_date, s.rank_pos
			FROM stk_sector_scores s
			WHERE s.sector_name = ?
			  AND s.snapshot_time <=> (
				SELECT MAX(s2.snapshot_time) FROM stk_sector_scores s2
				WHERE s2.trade_date = s.trade_date
			  )
		)
		SELECT d.trade_date,
			b.rank_pos AS rank_pos,
			COALESCE(b.red_rate, 0) AS red_rate,
			s.rank_pos AS score_rank_pos
		FROM dates d
		LEFT JOIN breadth_data b ON d.trade_date = b.trade_date
		LEFT JOIN score_data s ON d.trade_date = s.trade_date
		ORDER BY d.trade_date DESC
		LIMIT ?
	`
	var rows []SectorDriftRow
	if err := r.db.Raw(sql, sectorName, sectorName, sectorName, sectorName, days).Scan(&rows).Error; err != nil {
		log.Printf("[sector-sentiment] GetSectorDrift error: %v", err)
		return nil, err
	}
	log.Printf("[sector-sentiment] sector drift for %q: %d days (breadth + scores)", sectorName, len(rows))
	return rows, nil
}

// ============================================================
// 6. 暗线挖掘 — Hidden Trend Discovery (Climbing Sectors)
// ============================================================

type ClimbingSectorRow struct {
	SectorName    string  `gorm:"column:sector_name"`
	RankT2        int     `gorm:"column:rank_t2"`
	RankT1        int     `gorm:"column:rank_t1"`
	RankT0        int     `gorm:"column:rank_t0"`
	RankJump      int     `gorm:"column:rank_jump"`
	MoneyT0       float64 `gorm:"column:money_t0"`
	Source        string  `gorm:"column:source"`
	High20dCount  int     `gorm:"column:high_20d_count"`
	High60dCount  int     `gorm:"column:high_60d_count"`
	High250dCount int     `gorm:"column:high_250d_count"`
}

func (r *SectorSentimentRepository) GetClimbingSectors(tradeDate string) ([]ClimbingSectorRow, error) {
	// The two data sources (scores / breadths) are independent, so they are
	// fetched in parallel. Each was previously one arm of a single UNION ALL;
	// the result ordering is restored by a stable sort on rank_jump DESC.
	var (
		scoreRows   []ClimbingSectorRow
		breadthRows []ClimbingSectorRow
		scoreErr    error
		breadthErr  error
		wg          sync.WaitGroup
	)
	wg.Add(2)
	go func() {
		defer wg.Done()
		scoreRows, scoreErr = r.getClimbingScoreRows(tradeDate)
	}()
	go func() {
		defer wg.Done()
		breadthRows, breadthErr = r.getClimbingBreadthRows(tradeDate)
	}()
	wg.Wait()
	if scoreErr != nil {
		return nil, scoreErr
	}
	if breadthErr != nil {
		return nil, breadthErr
	}
	rows := append(scoreRows, breadthRows...)
	sort.SliceStable(rows, func(i, j int) bool { return rows[i].RankJump > rows[j].RankJump })
	return rows, nil
}

// getClimbingScoreRows implements the "暗线挖掘" logic for stk_sector_scores.
//
// Two cost drivers fixed vs. the previous version:
//  1. The window function ranked over the ENTIRE history of the table
//     (`WHERE trade_date <= ?` with no lower bound). Only the last 3 trading
//     days per sector are needed, so the input is bounded to the last 20
//     trading days (generous margin for data gaps).
//  2. Each day's "latest snapshot" was found with a correlated subquery
//     (`snapshot_time <=> (SELECT MAX(...) WHERE trade_date = ?)`). That is
//     replaced by a precomputed Latest CTE (GROUP BY trade_date) + JOIN.
func (r *SectorSentimentRepository) getClimbingScoreRows(tradeDate string) ([]ClimbingSectorRow, error) {
	sql := `
		WITH ScoreMaxDate AS (
			SELECT MAX(trade_date) AS max_dt FROM stk_sector_scores WHERE trade_date <= ?
		),
		ScoreRecent AS (
			SELECT trade_date FROM (
				SELECT DISTINCT trade_date FROM stk_sector_scores
				WHERE trade_date <= ? ORDER BY trade_date DESC LIMIT 20
			) t
		),
		ScoreLatest AS (
			SELECT trade_date, MAX(snapshot_time) AS max_snapshot
			FROM stk_sector_scores
			WHERE trade_date IN (SELECT trade_date FROM ScoreRecent)
			GROUP BY trade_date
		),
		ScoreDailyRank AS (
			SELECT s.sector_name, s.trade_date, s.rank_pos, s.money_score,
				s.high_20d_count, s.high_60d_count, s.high_250d_count,
				DENSE_RANK() OVER (PARTITION BY s.sector_name ORDER BY s.trade_date DESC) AS day_idx
			FROM stk_sector_scores s
			JOIN ScoreLatest l ON s.trade_date = l.trade_date AND s.snapshot_time <=> l.max_snapshot
		),
		ScoreTrend AS (
			SELECT sector_name,
				MAX(CASE WHEN day_idx = 1 THEN rank_pos END) AS rank_t0,
				MAX(CASE WHEN day_idx = 2 THEN rank_pos END) AS rank_t1,
				MAX(CASE WHEN day_idx = 3 THEN rank_pos END) AS rank_t2,
				MAX(CASE WHEN day_idx = 1 THEN money_score END) AS money_t0,
				MAX(CASE WHEN day_idx = 1 THEN trade_date END) AS latest_date,
				MAX(CASE WHEN day_idx = 1 THEN high_20d_count END) AS high_20d_count,
				MAX(CASE WHEN day_idx = 1 THEN high_60d_count END) AS high_60d_count,
				MAX(CASE WHEN day_idx = 1 THEN high_250d_count END) AS high_250d_count
			FROM ScoreDailyRank
			WHERE day_idx <= 3
			GROUP BY sector_name
		)
		SELECT s.sector_name, s.rank_t2, s.rank_t1, s.rank_t0,
			(s.rank_t2 - s.rank_t0) AS rank_jump, s.money_t0,
			'sector_score' AS source,
			s.high_20d_count, s.high_60d_count, s.high_250d_count
		FROM ScoreTrend s, ScoreMaxDate m
		WHERE s.rank_t0 BETWEEN 11 AND 30
		  AND s.rank_t1 < s.rank_t2
		  AND s.rank_t0 < s.rank_t1
		  AND s.latest_date = m.max_dt
		ORDER BY rank_jump DESC
	`
	var rows []ClimbingSectorRow
	if err := r.db.Raw(sql, tradeDate, tradeDate).Scan(&rows).Error; err != nil {
		return nil, err
	}
	return rows, nil
}

// getClimbingBreadthRows implements the same logic for stk_sector_breadths.
func (r *SectorSentimentRepository) getClimbingBreadthRows(tradeDate string) ([]ClimbingSectorRow, error) {
	sql := `
		WITH BreadthMaxDate AS (
			SELECT MAX(trade_date) AS max_dt FROM stk_sector_breadths WHERE trade_date <= ? AND sector_type = 'industry'
		),
		BreadthRecent AS (
			SELECT trade_date FROM (
				SELECT DISTINCT trade_date FROM stk_sector_breadths
				WHERE trade_date <= ? AND sector_type = 'industry'
				ORDER BY trade_date DESC LIMIT 20
			) t
		),
		BreadthLatest AS (
			SELECT trade_date, MAX(snapshot_time) AS max_snapshot
			FROM stk_sector_breadths
			WHERE sector_type = 'industry'
			  AND trade_date IN (SELECT trade_date FROM BreadthRecent)
			GROUP BY trade_date
		),
		BreadthDailyRank AS (
			SELECT b.sector_name, b.trade_date, b.rank_pos,
				b.high_20d_count, b.high_60d_count, b.high_250d_count,
				DENSE_RANK() OVER (PARTITION BY b.sector_name ORDER BY b.trade_date DESC) AS day_idx
			FROM stk_sector_breadths b
			JOIN BreadthLatest l ON b.trade_date = l.trade_date AND b.snapshot_time <=> l.max_snapshot
			WHERE b.sector_type = 'industry'
		),
		BreadthTrend AS (
			SELECT sector_name,
				MAX(CASE WHEN day_idx = 1 THEN rank_pos END) AS rank_t0,
				MAX(CASE WHEN day_idx = 2 THEN rank_pos END) AS rank_t1,
				MAX(CASE WHEN day_idx = 3 THEN rank_pos END) AS rank_t2,
				MAX(CASE WHEN day_idx = 1 THEN trade_date END) AS latest_date,
				MAX(CASE WHEN day_idx = 1 THEN high_20d_count END) AS high_20d_count,
				MAX(CASE WHEN day_idx = 1 THEN high_60d_count END) AS high_60d_count,
				MAX(CASE WHEN day_idx = 1 THEN high_250d_count END) AS high_250d_count
			FROM BreadthDailyRank
			WHERE day_idx <= 3
			GROUP BY sector_name
		)
		SELECT b.sector_name, b.rank_t2, b.rank_t1, b.rank_t0,
			(b.rank_t2 - b.rank_t0) AS rank_jump, 0 AS money_t0,
			'sector_breadth' AS source,
			b.high_20d_count, b.high_60d_count, b.high_250d_count
		FROM BreadthTrend b, BreadthMaxDate m
		WHERE b.rank_t0 BETWEEN 11 AND 30
		  AND b.rank_t1 < b.rank_t2
		  AND b.rank_t0 < b.rank_t1
		  AND b.latest_date = m.max_dt
		ORDER BY rank_jump DESC
	`
	var rows []ClimbingSectorRow
	if err := r.db.Raw(sql, tradeDate, tradeDate).Scan(&rows).Error; err != nil {
		return nil, err
	}
	return rows, nil
}

// GetTopSectorScores returns top 10 sectors by rank from stk_sector_scores,
// restricted to the latest intraday snapshot (snapshot_time) of the day.
func (r *SectorSentimentRepository) GetTopSectorScores(tradeDate string) ([]TopSectorItem, error) {
	sql := `SELECT sector_name, rank_pos, total_score AS score
		FROM stk_sector_scores WHERE trade_date = ?
		  AND snapshot_time <=> (SELECT MAX(snapshot_time) FROM stk_sector_scores WHERE trade_date = ?)
		ORDER BY rank_pos ASC LIMIT 10`
	var rows []TopSectorItem
	if err := r.db.Raw(sql, tradeDate, tradeDate).Scan(&rows).Error; err != nil {
		return nil, err
	}
	return rows, nil
}

// GetTopSectorBreadths returns top 10 sectors by rank from stk_sector_breadths,
// restricted to the latest intraday snapshot (snapshot_time) of the day.
func (r *SectorSentimentRepository) GetTopSectorBreadths(tradeDate string) ([]TopSectorItem, error) {
	sql := `SELECT sector_name, rank_pos, red_rate AS score
		FROM stk_sector_breadths WHERE trade_date = ? AND sector_type = 'industry'
		  AND snapshot_time <=> (SELECT MAX(snapshot_time) FROM stk_sector_breadths WHERE trade_date = ?)
		ORDER BY rank_pos ASC LIMIT 10`
	var rows []TopSectorItem
	if err := r.db.Raw(sql, tradeDate, tradeDate).Scan(&rows).Error; err != nil {
		return nil, err
	}
	return rows, nil
}

// TopSectorItem is a simple sector-rank row.
type TopSectorItem struct {
	SectorName string  `gorm:"column:sector_name"`
	RankPos    int     `gorm:"column:rank_pos"`
	Score      float64 `gorm:"column:score"`
}

// GetTopStocksBySectors returns the highest-volume stock per sector for the given date.
func (r *SectorSentimentRepository) GetTopStocksBySectors(tradeDate string, sectorNames []string) (map[string]string, error) {
	if len(sectorNames) == 0 {
		return map[string]string{}, nil
	}
	sql := `
		WITH ranked AS (
			SELECT r.sector_name AS raw_name, COALESCE(f.stock_name, k.symbol) AS stock_name,
				ROW_NUMBER() OVER (PARTITION BY r.sector_name ORDER BY k.volume DESC) AS rn
			FROM quant_db.stk_daily_kline k
			JOIN quant_db.stock_sector_relation r ON k.symbol COLLATE utf8mb4_unicode_ci = r.symbol COLLATE utf8mb4_unicode_ci
			LEFT JOIN quant_db.stk_stock_fund_flow f ON k.symbol COLLATE utf8mb4_unicode_ci = f.symbol COLLATE utf8mb4_unicode_ci AND k.trade_date = f.trade_date
			WHERE k.trade_date = ?
			  AND (r.sector_name IN ? OR REPLACE(REPLACE(r.sector_name, '概念-', ''), '行业-', '') IN ?)
		)
		SELECT REPLACE(REPLACE(raw_name, '概念-', ''), '行业-', '') AS sector_name, stock_name FROM ranked WHERE rn = 1
	`
	type row struct {
		SectorName string `gorm:"column:sector_name"`
		StockName  string `gorm:"column:stock_name"`
	}
	var rows []row
	if err := r.quantDb.Raw(sql, tradeDate, sectorNames, sectorNames).Scan(&rows).Error; err != nil {
		log.Printf("[sector-sentiment] GetTopStocksBySectors error: %v", err)
		return nil, err
	}
	log.Printf("[sector-sentiment] GetTopStocksBySectors: date=%s sectors=%d results=%d", tradeDate, len(sectorNames), len(rows))
	result := make(map[string]string, len(rows))
	for _, r := range rows {
		result[r.SectorName] = r.StockName
	}
	return result, nil
}

// GetSectorNames returns distinct sector names from both stk_sector_breadths
// and stk_sector_scores (excludes broad indices).
func (r *SectorSentimentRepository) GetSectorNames() ([]string, error) {
	var names []string
	err := r.db.Raw(`
		SELECT sector_name FROM (
			SELECT DISTINCT sector_name FROM stk_sector_breadths
			WHERE sector_type = 'industry'
			  AND sector_name NOT IN ('上证指数','深证成指','创业板指','沪深300','中证1000')
			UNION
			SELECT DISTINCT sector_name FROM stk_sector_scores
			WHERE sector_name NOT IN ('上证指数','深证成指','创业板指','沪深300','中证1000')
		) AS t
		ORDER BY sector_name
	`).Scan(&names).Error
	if err != nil {
		log.Printf("[sector-sentiment] GetSectorNames error: %v", err)
		return nil, err
	}
	return names, nil
}

// NewHighStockRow is a raw row from stk_new_high_detail.
type NewHighStockRow struct {
	Symbol    string  `gorm:"column:symbol"`
	StockName string  `gorm:"column:stock_name"`
	High20d   bool    `gorm:"column:high_20d"`
	High60d   bool    `gorm:"column:high_60d"`
	High250d  bool    `gorm:"column:high_250d"`
	Close     float64 `gorm:"column:close"`
}

// GetNewHighStocks returns new-high stocks for a sector on a given date.
func (r *SectorSentimentRepository) GetNewHighStocks(sectorName, tradeDate string) ([]NewHighStockRow, error) {
	sql := `
		SELECT symbol, COALESCE(stock_name, symbol) AS stock_name,
			high_20d, high_60d, high_250d, COALESCE(close, 0) AS close
		FROM stk_new_high_detail
		WHERE sector_name = ? AND trade_date = ?
		ORDER BY high_250d DESC, high_60d DESC, high_20d DESC, symbol
	`
	var rows []NewHighStockRow
	if err := r.db.Raw(sql, sectorName, tradeDate).Scan(&rows).Error; err != nil {
		return nil, err
	}
	return rows, nil
}

// ============================================================
// 7. 盘中排名上升 — Top Rising Sectors (morning → afternoon)
// ============================================================

// RisingSectorRow is a sector that rose in rank from morning to afternoon,
// computed as SUM(rank_change) > 0 across the day's intraday snapshots.
type RisingSectorRow struct {
	SectorName    string `gorm:"column:sector_name"`
	Source        string `gorm:"column:source"` // "sector_score" or "sector_breadth"
	Rise          int    `gorm:"column:rise"`
	MorningRank   *int   `gorm:"column:morning_rank"`
	AfternoonRank *int   `gorm:"column:afternoon_rank"`
}

// GetTopRisingSectors returns two per-source lists of the sectors with the
// largest positive intraday rank rise (morning → afternoon). The first list
// comes from stk_sector_scores, the second from stk_sector_breadths. Both
// tables now keep one row per intraday snapshot, so the rise is SUM(rank_change)
// — the telescoping net change from the first (morning) snapshot to the last
// (afternoon) snapshot — and the morning/afternoon ranks are the rank_pos at
// those first/last snapshots.
func (r *SectorSentimentRepository) GetTopRisingSectors(tradeDate string, limit int) (scores []RisingSectorRow, breadths []RisingSectorRow, err error) {
	scoresSQL := `
		SELECT s.sector_name,
			'sector_score' AS source,
			COALESCE(SUM(s.rank_change), 0) AS rise,
			MAX(CASE WHEN s.snapshot_time = f.first_ts THEN s.rank_pos END) AS morning_rank,
			MAX(CASE WHEN s.snapshot_time = f.last_ts THEN s.rank_pos END) AS afternoon_rank
		FROM stk_sector_scores s
		JOIN (
			SELECT sector_name,
				MIN(snapshot_time) AS first_ts,
				MAX(snapshot_time) AS last_ts
			FROM stk_sector_scores
			WHERE trade_date = ?
			GROUP BY sector_name
		) f ON f.sector_name = s.sector_name
		WHERE s.trade_date = ?
		GROUP BY s.sector_name
		HAVING rise > 0
		ORDER BY rise DESC, afternoon_rank ASC
		LIMIT ?
	`
	if err := r.db.Raw(scoresSQL, tradeDate, tradeDate, limit).Scan(&scores).Error; err != nil {
		log.Printf("[sector-sentiment] GetTopRisingSectors scores error: %v", err)
		return nil, nil, err
	}

	breadthsSQL := `
		SELECT b.sector_name,
			'sector_breadth' AS source,
			COALESCE(SUM(b.rank_change), 0) AS rise,
			MAX(CASE WHEN b.snapshot_time = f.first_ts THEN b.rank_pos END) AS morning_rank,
			MAX(CASE WHEN b.snapshot_time = f.last_ts THEN b.rank_pos END) AS afternoon_rank
		FROM stk_sector_breadths b
		JOIN (
			SELECT sector_name,
				MIN(snapshot_time) AS first_ts,
				MAX(snapshot_time) AS last_ts
			FROM stk_sector_breadths
			WHERE trade_date = ? AND sector_type = 'industry'
			GROUP BY sector_name
		) f ON f.sector_name = b.sector_name
		WHERE b.trade_date = ? AND b.sector_type = 'industry'
		GROUP BY b.sector_name
		HAVING rise > 0
		ORDER BY rise DESC, afternoon_rank ASC
		LIMIT ?
	`
	if err := r.db.Raw(breadthsSQL, tradeDate, tradeDate, limit).Scan(&breadths).Error; err != nil {
		log.Printf("[sector-sentiment] GetTopRisingSectors breadths error: %v", err)
		return nil, nil, err
	}

	log.Printf("[sector-sentiment] top rising sectors (%s): %d scores, %d breadths", tradeDate, len(scores), len(breadths))
	return scores, breadths, nil
}

// FallingSectorRow is a sector that fell in rank from morning to afternoon,
// computed as -SUM(rank_change) > 0 (net decline) across the day's snapshots.
type FallingSectorRow struct {
	SectorName    string `gorm:"column:sector_name"`
	Source        string `gorm:"column:source"` // "sector_score" or "sector_breadth"
	Fall          int    `gorm:"column:fall"`   // 下降位次（正数）
	MorningRank   *int   `gorm:"column:morning_rank"`
	AfternoonRank *int   `gorm:"column:afternoon_rank"`
}

// GetTopFallingSectors returns two per-source lists of the sectors with the
// largest negative intraday rank change (morning → afternoon). Mirrors
// GetTopRisingSectors but selects net declines (fall = -SUM(rank_change) > 0).
func (r *SectorSentimentRepository) GetTopFallingSectors(tradeDate string, limit int) (scores []FallingSectorRow, breadths []FallingSectorRow, err error) {
	scoresSQL := `
		SELECT s.sector_name,
			'sector_score' AS source,
			COALESCE(-SUM(s.rank_change), 0) AS fall,
			MAX(CASE WHEN s.snapshot_time = f.first_ts THEN s.rank_pos END) AS morning_rank,
			MAX(CASE WHEN s.snapshot_time = f.last_ts THEN s.rank_pos END) AS afternoon_rank
		FROM stk_sector_scores s
		JOIN (
			SELECT sector_name,
				MIN(snapshot_time) AS first_ts,
				MAX(snapshot_time) AS last_ts
			FROM stk_sector_scores
			WHERE trade_date = ?
			GROUP BY sector_name
		) f ON f.sector_name = s.sector_name
		WHERE s.trade_date = ?
		GROUP BY s.sector_name
		HAVING fall > 0
		ORDER BY fall DESC, afternoon_rank DESC
		LIMIT ?
	`
	if err := r.db.Raw(scoresSQL, tradeDate, tradeDate, limit).Scan(&scores).Error; err != nil {
		log.Printf("[sector-sentiment] GetTopFallingSectors scores error: %v", err)
		return nil, nil, err
	}

	breadthsSQL := `
		SELECT b.sector_name,
			'sector_breadth' AS source,
			COALESCE(-SUM(b.rank_change), 0) AS fall,
			MAX(CASE WHEN b.snapshot_time = f.first_ts THEN b.rank_pos END) AS morning_rank,
			MAX(CASE WHEN b.snapshot_time = f.last_ts THEN b.rank_pos END) AS afternoon_rank
		FROM stk_sector_breadths b
		JOIN (
			SELECT sector_name,
				MIN(snapshot_time) AS first_ts,
				MAX(snapshot_time) AS last_ts
			FROM stk_sector_breadths
			WHERE trade_date = ? AND sector_type = 'industry'
			GROUP BY sector_name
		) f ON f.sector_name = b.sector_name
		WHERE b.trade_date = ? AND b.sector_type = 'industry'
		GROUP BY b.sector_name
		HAVING fall > 0
		ORDER BY fall DESC, afternoon_rank DESC
		LIMIT ?
	`
	if err := r.db.Raw(breadthsSQL, tradeDate, tradeDate, limit).Scan(&breadths).Error; err != nil {
		log.Printf("[sector-sentiment] GetTopFallingSectors breadths error: %v", err)
		return nil, nil, err
	}

	log.Printf("[sector-sentiment] top falling sectors (%s): %d scores, %d breadths", tradeDate, len(scores), len(breadths))
	return scores, breadths, nil
}

// IntradayDriftRow is one intraday snapshot of a sector's score rank.
type IntradayDriftRow struct {
	SnapshotTime string `gorm:"column:snapshot_time"`
	RankPos      *int   `gorm:"column:rank_pos"`
	RankChange   int    `gorm:"column:rank_change"`
}

// GetSectorIntradayDrift returns the intraday rank drift of a sector across
// the day's snapshots (morning → afternoon), for the drift chart. The source
// selects which table to read: "sector_score" (default) reads stk_sector_scores,
// "sector_breadth" reads stk_sector_breadths.
func (r *SectorSentimentRepository) GetSectorIntradayDrift(sectorName, tradeDate, source string) ([]IntradayDriftRow, error) {
	table := "stk_sector_scores"
	if source == "sector_breadth" {
		table = "stk_sector_breadths"
	}
	// Table name is a fixed whitelist (not user input), so string interpolation is safe.
	sql := `
		SELECT DATE_FORMAT(snapshot_time, '%H:%i') AS snapshot_time, rank_pos, rank_change
		FROM ` + table + `
		WHERE sector_name = ? AND trade_date = ? AND snapshot_time IS NOT NULL
		ORDER BY snapshot_time ASC
	`
	var rows []IntradayDriftRow
	if err := r.db.Raw(sql, sectorName, tradeDate).Scan(&rows).Error; err != nil {
		log.Printf("[sector-sentiment] GetSectorIntradayDrift error: %v", err)
		return nil, err
	}
	return rows, nil
}

// GetAllSectorFullNames returns every sector classification name in quant_db.sectors
// (prefixed names such as "SW2风电设备" / "概念-钠离子电池" / "TDGN...").
func (r *SectorSentimentRepository) GetAllSectorFullNames() ([]string, error) {
	var names []string
	err := r.quantDb.Table("sectors").Order("name").Pluck("name", &names).Error
	if err != nil {
		return nil, err
	}
	return names, nil
}

// AbnormalStockRow is a capital-abnormal stock matched to a sector through
// quant_db.stock_sector_relation (precise membership), rather than the loose
// sector_name string stored in stk_capital_abnormal.
type AbnormalStockRow struct {
	Symbol      string  `gorm:"column:symbol"`
	Name        string  `gorm:"column:name"`
	VolRatio    float64 `gorm:"column:vol_ratio"`
	SurgeCount  int     `gorm:"column:surge_count"`
	MaxSurgeRet float64 `gorm:"column:max_surge_ret"`
	SurgeTimes  string  `gorm:"column:surge_times"`
}

// GetAbnormalStocksByFullNames returns capital-abnormal stocks for a trade date
// whose stock_sector_relation.sector_name is one of the given full names.
func (r *SectorSentimentRepository) GetAbnormalStocksByFullNames(tradeDate string, fullNames []string) ([]AbnormalStockRow, error) {
	if len(fullNames) == 0 {
		return []AbnormalStockRow{}, nil
	}
	var rows []AbnormalStockRow
	err := r.quantDb.Raw(`
		SELECT ca.symbol,
			COALESCE(ca.name, '')         AS name,
			COALESCE(ca.vol_ratio, 0)     AS vol_ratio,
			COALESCE(ca.surge_count, 0)   AS surge_count,
			COALESCE(ca.max_surge_ret, 0) AS max_surge_ret,
			COALESCE(ca.surge_times, '')  AS surge_times
		FROM stk_capital_abnormal ca
		JOIN stock_sector_relation rel ON rel.symbol = ca.symbol
		WHERE ca.trade_date = ?
		  AND rel.sector_name IN ?
	`, tradeDate, fullNames).Scan(&rows).Error
	if err != nil {
		return nil, err
	}
	return rows, nil
}
