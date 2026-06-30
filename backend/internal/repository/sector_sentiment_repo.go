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

// GetLatestTradeDate returns the most recent trade_date in stk_sector_breadths.
func (r *SectorSentimentRepository) GetLatestTradeDate() (string, error) {
	var date string
	err := r.db.Raw("SELECT MAX(trade_date) FROM stk_sector_breadths").Scan(&date).Error
	if err != nil {
		log.Printf("[sector-sentiment] GetLatestTradeDate error: %v", err)
		return "", err
	}
	log.Printf("[sector-sentiment] latest trade_date: %q", date)
	return date, nil
}

// ============================================================
// 1. 连强信号 — Consistent Strength
//    Sectors with rank_pos <= 15 on 3+ of the last 7 trading days.
//    Sources: stk_sector_breadths + stk_sector_scores (merged).
// ============================================================

type ConsistentStrengthRow struct {
	SectorName string `gorm:"column:sector_name"`
	StrongDays int    `gorm:"column:strong_days"`
	Source     string `gorm:"column:source"`
}

func (r *SectorSentimentRepository) GetConsistentStrength(tradeDate string) ([]ConsistentStrengthRow, error) {
	sql := `
		WITH BreadthDates AS (
			SELECT DISTINCT trade_date FROM stk_sector_breadths
			WHERE trade_date <= ?
			ORDER BY trade_date DESC LIMIT 7
		),
		ScoreDates AS (
			SELECT DISTINCT trade_date FROM stk_sector_scores
			WHERE trade_date <= ?
			ORDER BY trade_date DESC LIMIT 7
		)
		SELECT sector_name, MAX(strong_days) AS strong_days,
			CASE WHEN SUM(src_b) > 0 AND SUM(src_s) > 0 THEN 'both'
			     WHEN SUM(src_b) > 0 THEN 'breadth'
			     ELSE 'score' END AS source
		FROM (
			SELECT sector_name, COUNT(*) AS strong_days, 1 AS src_b, 0 AS src_s
			FROM stk_sector_breadths
			WHERE trade_date IN (SELECT trade_date FROM BreadthDates)
			  AND rank_pos <= 15 AND sector_type = 'industry'
			GROUP BY sector_name
			HAVING strong_days >= 3
			UNION ALL
			SELECT sector_name, COUNT(*) AS strong_days, 0 AS src_b, 1 AS src_s
			FROM stk_sector_scores
			WHERE trade_date IN (SELECT trade_date FROM ScoreDates)
			  AND rank_pos <= 15
			GROUP BY sector_name
			HAVING strong_days >= 3
		) combined
		GROUP BY sector_name
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
//    Today in top 10, yesterday > 30.
// ============================================================

type NewFaceRow struct {
	SectorName    string `gorm:"column:sector_name"`
	TodayRank     int    `gorm:"column:today_rank"`
	YesterdayRank int    `gorm:"column:yesterday_rank"`
	RankJump      int    `gorm:"column:rank_jump"`
}

func (r *SectorSentimentRepository) GetNewFaces(tradeDate string) ([]NewFaceRow, error) {
	sql := `
		SELECT t.sector_name,
		       t.rank_pos AS today_rank,
		       COALESCE(y.rank_pos, 999) AS yesterday_rank,
		       (COALESCE(y.rank_pos, 999) - t.rank_pos) AS rank_jump
		FROM stk_sector_breadths t
		JOIN stk_sector_breadths y
			ON t.sector_name = y.sector_name COLLATE utf8mb4_unicode_ci
		   AND y.trade_date = (
				SELECT DISTINCT trade_date FROM stk_sector_breadths
				WHERE trade_date < ?
				ORDER BY trade_date DESC LIMIT 1
		   )
		WHERE t.trade_date = ?
		  AND t.rank_pos <= 10
		  AND y.rank_pos > 30
		  AND t.sector_type = 'industry'
		ORDER BY rank_jump DESC
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
	SectorName  string  `gorm:"column:sector_name"`
	RedRate     float64 `gorm:"column:red_rate"`
	TotalStocks int     `gorm:"column:total_stocks"`
}

func (r *SectorSentimentRepository) GetConcentration(tradeDate string) ([]ConcentrationRow, error) {
	sql := `
		SELECT sector_name, red_rate, total_stocks
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
	TradeDate string  `gorm:"column:trade_date"`
	RankPos   *int    `gorm:"column:rank_pos"`
	RedRate   float64 `gorm:"column:red_rate"`
}

func (r *SectorSentimentRepository) GetSectorDrift(sectorName string, days int) ([]SectorDriftRow, error) {
	sql := `
		SELECT trade_date, rank_pos, red_rate
		FROM stk_sector_breadths
		WHERE sector_name = ? AND sector_type = 'industry'
		ORDER BY trade_date DESC
		LIMIT ?
	`
	var rows []SectorDriftRow
	if err := r.db.Raw(sql, sectorName, days).Scan(&rows).Error; err != nil {
		log.Printf("[sector-sentiment] GetSectorDrift error: %v", err)
		return nil, err
	}
	log.Printf("[sector-sentiment] sector drift for %q: %d days", sectorName, len(rows))
	return rows, nil
}

// GetSectorNames returns distinct industry sector names (excludes broad indices).
func (r *SectorSentimentRepository) GetSectorNames() ([]string, error) {
	var names []string
	err := r.db.Raw(
		"SELECT DISTINCT sector_name FROM stk_sector_breadths WHERE sector_type = 'industry' AND sector_name NOT IN ('上证指数','深证成指','创业板指','沪深300','中证1000') ORDER BY sector_name",
	).Scan(&names).Error
	if err != nil {
		log.Printf("[sector-sentiment] GetSectorNames error: %v", err)
		return nil, err
	}
	return names, nil
}
