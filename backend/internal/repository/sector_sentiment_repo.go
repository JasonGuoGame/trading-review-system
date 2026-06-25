package repository

import (
	"log"

	"gorm.io/gorm"
)

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

// GetRecentTradeDates returns the last N distinct trade dates in descending order.
func (r *SectorSentimentRepository) GetRecentTradeDates(n int) ([]string, error) {
	var dates []string
	err := r.db.Raw(
		"SELECT DISTINCT trade_date FROM stk_sector_breadths ORDER BY trade_date DESC LIMIT ?", n,
	).Scan(&dates).Error
	if err != nil {
		log.Printf("[sector-sentiment] GetRecentTradeDates error: %v", err)
		return nil, err
	}
	return dates, nil
}

// ============================================================
// 1. 连强信号 — Consistent Strength
//    Sectors with rank_pos <= 10 on 3+ of the last 7 trading days.
// ============================================================

// ConsistentStrengthRow is a raw SQL scan row.
type ConsistentStrengthRow struct {
	SectorName string `gorm:"column:sector_name"`
	StrongDays int    `gorm:"column:strong_days"`
}

// GetConsistentStrength returns sectors that consistently rank top 5.
func (r *SectorSentimentRepository) GetConsistentStrength() ([]ConsistentStrengthRow, error) {
	sql := `
		SELECT sector_name, COUNT(*) AS strong_days
		FROM stk_sector_breadths
		WHERE trade_date IN (
			SELECT DISTINCT trade_date FROM stk_sector_breadths
			ORDER BY trade_date DESC LIMIT 7
		)
		  AND rank_pos <= 10
		  AND sector_type = 'industry'
		GROUP BY sector_name
		HAVING strong_days >= 3
		ORDER BY strong_days DESC
	`
	var rows []ConsistentStrengthRow
	if err := r.db.Raw(sql).Scan(&rows).Error; err != nil {
		log.Printf("[sector-sentiment] GetConsistentStrength error: %v", err)
		return nil, err
	}
	log.Printf("[sector-sentiment] consistent strength: %d sectors", len(rows))
	return rows, nil
}

// GetSectorRecentRanks returns rank_pos for last 5 trading days for a given sector.
// Returns [oldest, ..., newest].
func (r *SectorSentimentRepository) GetSectorRecentRanks(sectorName string) ([]*int, error) {
	type rankRow struct {
		RankPos *int `gorm:"column:rank_pos"`
	}
	var rows []rankRow
	sql := `
		SELECT rank_pos FROM stk_sector_breadths
		WHERE sector_name = ? AND sector_type = 'industry'
		ORDER BY trade_date DESC LIMIT 5
	`
	if err := r.db.Raw(sql, sectorName).Scan(&rows).Error; err != nil {
		return nil, err
	}
	// Reverse so oldest first
	ranks := make([]*int, len(rows))
	for i, row := range rows {
		ranks[len(rows)-1-i] = row.RankPos
	}
	return ranks, nil
}

// ============================================================
// 2. 新面孔信号 — New Faces
//    Today in top 5, yesterday > 30.
// ============================================================

// NewFaceRow is a raw SQL scan row.
type NewFaceRow struct {
	SectorName    string `gorm:"column:sector_name"`
	TodayRank     int    `gorm:"column:today_rank"`
	YesterdayRank int    `gorm:"column:yesterday_rank"`
	RankJump      int    `gorm:"column:rank_jump"`
}

// GetNewFaces returns sectors that jumped from >30 to top 5.
func (r *SectorSentimentRepository) GetNewFaces() ([]NewFaceRow, error) {
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
				ORDER BY trade_date DESC LIMIT 1 OFFSET 1
		   )
		WHERE t.trade_date = (SELECT MAX(trade_date) FROM stk_sector_breadths)
		  AND t.rank_pos <= 5
		  AND y.rank_pos > 30
		  AND t.sector_type = 'industry'
		ORDER BY rank_jump DESC
	`
	var rows []NewFaceRow
	if err := r.db.Raw(sql).Scan(&rows).Error; err != nil {
		log.Printf("[sector-sentiment] GetNewFaces error: %v", err)
		return nil, err
	}
	log.Printf("[sector-sentiment] new faces: %d sectors", len(rows))
	return rows, nil
}

// ============================================================
// 3. 冰点回升信号 — Ice Recovery
//    Today red_rate >= 80, previous 5 days max < 25.
// ============================================================

// IceRecoveryRow is a raw SQL scan row.
type IceRecoveryRow struct {
	SectorName string  `gorm:"column:sector_name"`
	RedRate    float64 `gorm:"column:red_rate"`
	Prev5dMax  float64 `gorm:"column:prev_5d_max"`
}

// GetIceRecovery returns sectors showing ice-break recovery.
func (r *SectorSentimentRepository) GetIceRecovery() ([]IceRecoveryRow, error) {
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
		WHERE trade_date = (SELECT MAX(trade_date) FROM stk_sector_breadths)
		  AND red_rate >= 80
		  AND (prev_5d_max IS NULL OR prev_5d_max < 25)
		ORDER BY red_rate DESC
	`
	var rows []IceRecoveryRow
	if err := r.db.Raw(sql).Scan(&rows).Error; err != nil {
		log.Printf("[sector-sentiment] GetIceRecovery error: %v", err)
		return nil, err
	}
	log.Printf("[sector-sentiment] ice recovery: %d sectors", len(rows))
	return rows, nil
}

// GetSectorPrev5dRates returns the red_rate for the 5 trading days before the latest date.
func (r *SectorSentimentRepository) GetSectorPrev5dRates(sectorName string) ([]float64, error) {
	type rateRow struct {
		RedRate float64 `gorm:"column:red_rate"`
	}
	var rows []rateRow
	sql := `
		SELECT red_rate FROM stk_sector_breadths
		WHERE sector_name = ? AND sector_type = 'industry'
		  AND trade_date < (SELECT MAX(trade_date) FROM stk_sector_breadths)
		ORDER BY trade_date DESC LIMIT 5
	`
	if err := r.db.Raw(sql, sectorName).Scan(&rows).Error; err != nil {
		return nil, err
	}
	// Reverse so oldest first
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

// DivergenceRow is a raw SQL scan row.
type DivergenceRow struct {
	TradeDate       string  `gorm:"column:trade_date"`
	BroadAvgRate    float64 `gorm:"column:broad_avg_rate"`
	IndustryAvgRate float64 `gorm:"column:industry_avg_rate"`
	HotSectorsCount int     `gorm:"column:hot_sectors_count"`
	TotalSectors    int     `gorm:"column:total_sectors"`
}

// GetDivergenceTrend returns the last 20 days of market heat data.
func (r *SectorSentimentRepository) GetDivergenceTrend() ([]DivergenceRow, error) {
	sql := `
		SELECT
			trade_date,
			COALESCE(AVG(CASE WHEN sector_type='broad' THEN red_rate END), 0) AS broad_avg_rate,
			COALESCE(AVG(CASE WHEN sector_type='industry' THEN red_rate END), 0) AS industry_avg_rate,
			COUNT(CASE WHEN sector_type='industry' AND red_rate >= 80 THEN 1 END) AS hot_sectors_count,
			COUNT(CASE WHEN sector_type='industry' THEN 1 END) AS total_sectors
		FROM stk_sector_breadths
		WHERE trade_date IN (
			SELECT DISTINCT trade_date FROM stk_sector_breadths
			ORDER BY trade_date DESC LIMIT 20
		)
		GROUP BY trade_date
		ORDER BY trade_date ASC
	`
	var rows []DivergenceRow
	if err := r.db.Raw(sql).Scan(&rows).Error; err != nil {
		log.Printf("[sector-sentiment] GetDivergenceTrend error: %v", err)
		return nil, err
	}
	log.Printf("[sector-sentiment] divergence trend: %d days", len(rows))
	return rows, nil
}

// GetIndustryMedianRate returns the approximate median red_rate for industry sectors on the latest date.
func (r *SectorSentimentRepository) GetIndustryMedianRate() (float64, error) {
	sql := `
		SELECT AVG(red_rate) FROM (
			SELECT red_rate FROM stk_sector_breadths
			WHERE trade_date = (SELECT MAX(trade_date) FROM stk_sector_breadths)
			  AND sector_type = 'industry'
			ORDER BY red_rate
			LIMIT 2 - (SELECT COUNT(*) FROM stk_sector_breadths
			           WHERE trade_date = (SELECT MAX(trade_date) FROM stk_sector_breadths)
			             AND sector_type = 'industry') % 2
			OFFSET (SELECT (COUNT(*) - 1) / 2 FROM stk_sector_breadths
			        WHERE trade_date = (SELECT MAX(trade_date) FROM stk_sector_breadths)
			          AND sector_type = 'industry')
		) AS sub
	`
	var med float64
	if err := r.db.Raw(sql).Scan(&med).Error; err != nil {
		// If the median query fails, fall back to AVG
		log.Printf("[sector-sentiment] median query failed, falling back to avg: %v", err)
		err2 := r.db.Raw(
			"SELECT COALESCE(AVG(red_rate), 0) FROM stk_sector_breadths WHERE trade_date = (SELECT MAX(trade_date) FROM stk_sector_breadths) AND sector_type = 'industry'",
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

// ConcentrationRow is a raw SQL scan row.
type ConcentrationRow struct {
	SectorName  string  `gorm:"column:sector_name"`
	RedRate     float64 `gorm:"column:red_rate"`
	TotalStocks int     `gorm:"column:total_stocks"`
}

// GetConcentration returns large-capital concentration sectors.
func (r *SectorSentimentRepository) GetConcentration() ([]ConcentrationRow, error) {
	sql := `
		SELECT sector_name, red_rate, total_stocks
		FROM stk_sector_breadths
		WHERE trade_date = (SELECT MAX(trade_date) FROM stk_sector_breadths)
		  AND total_stocks >= 20
		  AND red_rate >= 85
		ORDER BY red_rate DESC
	`
	var rows []ConcentrationRow
	if err := r.db.Raw(sql).Scan(&rows).Error; err != nil {
		log.Printf("[sector-sentiment] GetConcentration error: %v", err)
		return nil, err
	}
	log.Printf("[sector-sentiment] concentration: %d sectors", len(rows))
	return rows, nil
}
