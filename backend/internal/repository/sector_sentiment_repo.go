package repository

import (
	"log"

	"gorm.io/gorm"
)

// Broad indices that should be excluded from sector listings.
var broadIndexBlacklist = []string{
	"上证指数", "深证成指", "创业板指", "沪深300", "中证1000",
}

type SectorSentimentRepository struct {
	db *gorm.DB
}

func NewSectorSentimentRepository(db *gorm.DB) *SectorSentimentRepository {
	return &SectorSentimentRepository{db: db}
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
	// Uses pre-computed persistence_7d and is_leader columns (populated by ETL)
	sql := `
		SELECT sector_name, persistence_7d AS strong_days,
			'sector_score' AS source,
			high_20d_count, high_60d_count, high_250d_count
		FROM stk_sector_scores
		WHERE trade_date = ? AND is_leader = 1
		UNION ALL
		SELECT sector_name, persistence_7d AS strong_days,
			'sector_breadth' AS source,
			0 AS high_20d_count, 0 AS high_60d_count, 0 AS high_250d_count
		FROM stk_sector_breadths
		WHERE trade_date = ? AND is_leader = 1 AND sector_type = 'industry'
		ORDER BY strong_days DESC
	`
	var rows []ConsistentStrengthRow
	if err := r.db.Raw(sql, tradeDate, tradeDate).Scan(&rows).Error; err != nil {
		log.Printf("[sector-sentiment] GetConsistentStrength error: %v", err)
		return nil, err
	}
	log.Printf("[sector-sentiment] consistent strength (%s): %d sectors", tradeDate, len(rows))
	return rows, nil
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
		SELECT sector_name, high_20d_count, high_60d_count, high_250d_count,
			'sector_score' AS source
		FROM stk_sector_scores
		WHERE trade_date = ? AND sector_name IN ?
		UNION ALL
		SELECT sector_name, high_20d_count, high_60d_count, high_250d_count,
			'sector_breadth' AS source
		FROM stk_sector_breadths
		WHERE trade_date = ? AND sector_name IN ? AND sector_type = 'industry'
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
		SELECT rank_pos FROM stk_sector_scores
		WHERE sector_name = ? AND trade_date <= ?
		ORDER BY trade_date DESC LIMIT 5
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
		SELECT rank_pos FROM stk_sector_breadths
		WHERE sector_name = ? AND sector_type = 'industry' AND trade_date <= ?
		ORDER BY trade_date DESC LIMIT 5
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
	sql := `
		WITH SectorHistory AS (
			SELECT sector_name, trade_date, red_rate,
				MAX(red_rate) OVER(
					PARTITION BY sector_name ORDER BY trade_date
					ROWS BETWEEN 5 PRECEDING AND 1 PRECEDING
				) AS prev_5d_max
			FROM stk_sector_breadths
			WHERE sector_type = 'industry'
		)
		SELECT sector_name, red_rate, prev_5d_max
		FROM SectorHistory
		WHERE trade_date = ?
		  AND red_rate >= 80
		  AND (prev_5d_max IS NULL OR prev_5d_max < 25)
		ORDER BY red_rate DESC
	`
	var rows []IceRecoveryRow
	if err := r.db.Raw(sql, tradeDate).Scan(&rows).Error; err != nil {
		log.Printf("[sector-sentiment] GetIceRecovery error: %v", err)
		return nil, err
	}
	log.Printf("[sector-sentiment] ice recovery (%s): %d sectors", tradeDate, len(rows))
	return rows, nil
}

func (r *SectorSentimentRepository) GetSectorPrev5dRates(sectorName, tradeDate string) ([]float64, error) {
	type rateRow struct {
		RedRate float64 `gorm:"column:red_rate"`
	}
	var rows []rateRow
	sql := `
		SELECT red_rate FROM stk_sector_breadths
		WHERE sector_name = ? AND sector_type = 'industry'
		  AND trade_date < ?
		ORDER BY trade_date DESC LIMIT 5
	`
	if err := r.db.Raw(sql, sectorName, tradeDate).Scan(&rows).Error; err != nil {
		return nil, err
	}
	rates := make([]float64, len(rows))
	for i, row := range rows {
		rates[len(rows)-1-i] = row.RedRate
	}
	return rates, nil
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
	sql := `
		WITH RecentDates AS (
			SELECT DISTINCT trade_date FROM stk_sector_breadths
			WHERE trade_date <= ?
			ORDER BY trade_date DESC LIMIT 20
		)
		SELECT
			trade_date,
			COALESCE(AVG(CASE WHEN sector_type='broad' AND sector_name NOT IN ('上证指数','深证成指','创业板指','沪深300','中证1000') THEN red_rate END), 0) AS broad_avg_rate,
			COALESCE(AVG(CASE WHEN sector_type='industry' THEN red_rate END), 0) AS industry_avg_rate,
			COUNT(CASE WHEN sector_type='industry' AND red_rate >= 80 THEN 1 END) AS hot_sectors_count,
			COUNT(CASE WHEN sector_type='industry' THEN 1 END) AS total_sectors
		FROM stk_sector_breadths
		WHERE trade_date IN (SELECT trade_date FROM RecentDates)
		GROUP BY trade_date
		ORDER BY trade_date ASC
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
	sql := `
		SELECT AVG(red_rate) FROM (
			SELECT red_rate FROM stk_sector_breadths
			WHERE trade_date = ? AND sector_type = 'industry'
			ORDER BY red_rate
			LIMIT 2 - (SELECT COUNT(*) FROM stk_sector_breadths
			           WHERE trade_date = ? AND sector_type = 'industry') % 2
			OFFSET (SELECT (COUNT(*) - 1) / 2 FROM stk_sector_breadths
			        WHERE trade_date = ? AND sector_type = 'industry')
		) AS sub
	`
	var med float64
	if err := r.db.Raw(sql, tradeDate, tradeDate, tradeDate).Scan(&med).Error; err != nil {
		log.Printf("[sector-sentiment] median query failed, falling back to avg: %v", err)
		err2 := r.db.Raw(
			"SELECT COALESCE(AVG(red_rate), 0) FROM stk_sector_breadths WHERE trade_date = ? AND sector_type = 'industry'",
			tradeDate,
		).Scan(&med).Error
		if err2 != nil {
			return 0, err2
		}
	}
	return med, nil
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
		SELECT sector_name, red_rate, total_stocks,
			high_20d_count, high_60d_count, high_250d_count
		FROM stk_sector_breadths
		WHERE trade_date = ?
		  AND sector_type = 'industry'
		  AND total_stocks >= 20
		  AND red_rate >= 85
		ORDER BY red_rate DESC
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
	sql := `
		WITH dates AS (
			SELECT DISTINCT trade_date FROM stk_sector_breadths
			WHERE sector_name = ? AND sector_type = 'industry'
			UNION
			SELECT DISTINCT trade_date FROM stk_sector_scores
			WHERE sector_name = ?
		),
		breadth_data AS (
			SELECT trade_date, rank_pos, red_rate
			FROM stk_sector_breadths
			WHERE sector_name = ? AND sector_type = 'industry'
		),
		score_data AS (
			SELECT trade_date, rank_pos
			FROM stk_sector_scores
			WHERE sector_name = ?
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
	sql := `
		WITH ScoreMaxDate AS (
			SELECT MAX(trade_date) AS max_dt FROM stk_sector_scores WHERE trade_date <= ?
		),
		ScoreDailyRank AS (
			SELECT sector_name, trade_date, rank_pos, money_score,
				high_20d_count, high_60d_count, high_250d_count,
				DENSE_RANK() OVER (PARTITION BY sector_name ORDER BY trade_date DESC) AS day_idx
			FROM stk_sector_scores
			WHERE trade_date <= ?
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
		),
		ScoreResult AS (
			SELECT s.sector_name, s.rank_t2, s.rank_t1, s.rank_t0,
				(s.rank_t2 - s.rank_t0) AS rank_jump, s.money_t0,
				'sector_score' AS source,
				s.high_20d_count, s.high_60d_count, s.high_250d_count
			FROM ScoreTrend s, ScoreMaxDate m
			WHERE s.rank_t0 BETWEEN 11 AND 25
			  AND s.rank_t1 < s.rank_t2
			  AND s.rank_t0 < s.rank_t1
			  AND s.latest_date = m.max_dt
		),
		BreadthMaxDate AS (
			SELECT MAX(trade_date) AS max_dt FROM stk_sector_breadths WHERE trade_date <= ? AND sector_type = 'industry'
		),
		BreadthDailyRank AS (
			SELECT sector_name, trade_date, rank_pos,
				high_20d_count, high_60d_count, high_250d_count,
				DENSE_RANK() OVER (PARTITION BY sector_name ORDER BY trade_date DESC) AS day_idx
			FROM stk_sector_breadths
			WHERE trade_date <= ? AND sector_type = 'industry'
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
		),
		BreadthResult AS (
			SELECT b.sector_name, b.rank_t2, b.rank_t1, b.rank_t0,
				(b.rank_t2 - b.rank_t0) AS rank_jump, 0 AS money_t0,
				'sector_breadth' AS source,
				b.high_20d_count, b.high_60d_count, b.high_250d_count
			FROM BreadthTrend b, BreadthMaxDate m
			WHERE b.rank_t0 BETWEEN 11 AND 25
			  AND b.rank_t1 < b.rank_t2
			  AND b.rank_t0 < b.rank_t1
			  AND b.latest_date = m.max_dt
		)
		SELECT * FROM ScoreResult
		UNION ALL
		SELECT * FROM BreadthResult
		ORDER BY rank_jump DESC
	`
	var rows []ClimbingSectorRow
	if err := r.db.Raw(sql, tradeDate, tradeDate, tradeDate, tradeDate).Scan(&rows).Error; err != nil {
		return nil, err
	}
	return rows, nil
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
