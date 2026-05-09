package scheduler

import (
	"fmt"
	"log"
	"time"

	"trading-review-system/backend/internal/models"

	"gorm.io/gorm"
)

// MarketBreadthJob calculates market breadth from quant_db.stk_daily_kline
// and writes results to trading_review.market_breadths.
type MarketBreadthJob struct {
	quantDb *gorm.DB // reads from quant_db
	mainDb  *gorm.DB // writes to trading_review
	stop    chan struct{}
}

// NewMarketBreadthJob creates a new market breadth scheduled job.
func NewMarketBreadthJob(mainDb, quantDb *gorm.DB) *MarketBreadthJob {
	return &MarketBreadthJob{
		quantDb: quantDb,
		mainDb:  mainDb,
		stop:    make(chan struct{}),
	}
}

// Start begins the scheduler in a goroutine.
// It runs the calculation every 20 minutes between 09:30 and 15:00 (Asia/Shanghai).
func (j *MarketBreadthJob) Start() {
	go j.run()
	log.Println("[MarketBreadthJob] Scheduler started")
}

// Stop gracefully shuts down the scheduler.
func (j *MarketBreadthJob) Stop() {
	close(j.stop)
	log.Println("[MarketBreadthJob] Scheduler stopped")
}

func (j *MarketBreadthJob) run() {
	loc, _ := time.LoadLocation("Asia/Shanghai")

	// Ticker every 1 minute to check if we should run
	ticker := time.NewTicker(1 * time.Minute)
	defer ticker.Stop()

	var lastRunMinute int = -1

	for {
		select {
		case <-j.stop:
			return
		case now := <-ticker.C:
			now = now.In(loc)

			// Only run on weekdays (Mon-Fri)
			if now.Weekday() == time.Saturday || now.Weekday() == time.Sunday {
				continue
			}

			hour, minute := now.Hour(), now.Minute()
			totalMinutes := hour*60 + minute

			// Trading window: 09:30 (570) to 15:00 (900)
			startMinutes := 9*60 + 30 // 09:30
			endMinutes := 15 * 60     // 15:00

			if totalMinutes < startMinutes || totalMinutes > endMinutes {
				continue
			}

			// Run every 20 minutes: at 09:30, 09:50, 10:10, 10:30, ...
			minutesSinceStart := totalMinutes - startMinutes
			if minutesSinceStart%20 != 0 {
				continue
			}

			// Avoid running twice in the same minute
			if totalMinutes == lastRunMinute {
				continue
			}
			lastRunMinute = totalMinutes

			log.Printf("[MarketBreadthJob] Running calculation at %s", now.Format("15:04:05"))
			if err := j.calculate(); err != nil {
				log.Printf("[MarketBreadthJob] Error: %v", err)
			} else {
				log.Printf("[MarketBreadthJob] Calculation completed successfully")
			}
		}
	}
}

// calculate queries stk_daily_kline for the latest two trading days,
// computes breadth metrics, and upserts into market_breadths.
// This mirrors the Python logic: get latest 2 dates from DB, not calendar date.
func (j *MarketBreadthJob) calculate() error {
	// Step 1: Get the two most recent trading dates from stk_daily_kline
	var dates []string
	err := j.quantDb.Raw(
		"SELECT DISTINCT trade_date FROM stk_daily_kline ORDER BY trade_date DESC LIMIT 2",
	).Scan(&dates).Error
	if err != nil {
		return fmt.Errorf("failed to query trading dates: %v", err)
	}
	if len(dates) < 2 {
		return fmt.Errorf("not enough trading dates in stk_daily_kline (need at least 2, got %d)", len(dates))
	}

	today := dates[0]
	yesterday := dates[1]
	log.Printf("[MarketBreadthJob] Comparing: %s (yesterday) vs %s (today)", yesterday, today)

	// Step 2: SQL to compute all metrics in one query
	// Join today's kline with yesterday's kline on symbol,
	// calculate pct_change = (today.close - yesterday.close) / yesterday.close * 100
	// Then aggregate counts.
	//
	// NOTE: `close` is a MySQL reserved word and MUST be backtick-quoted!
	// Limit up/down threshold: >= 9.8% / <= -9.8% (matching the Python script)
	type BreadthResult struct {
		TotalStocks int
		Advancers   int
		Decliners   int
		Flat        int
		LimitUp     int
		LimitDown   int
	}

	var result BreadthResult
	query := `
		SELECT
			COUNT(*) AS total_stocks,
			SUM(CASE WHEN pct > 0 THEN 1 ELSE 0 END) AS advancers,
			SUM(CASE WHEN pct < 0 THEN 1 ELSE 0 END) AS decliners,
			SUM(CASE WHEN pct = 0 THEN 1 ELSE 0 END) AS flat,
			SUM(CASE WHEN pct >= 9.8 THEN 1 ELSE 0 END) AS limit_up,
			SUM(CASE WHEN pct <= -9.8 THEN 1 ELSE 0 END) AS limit_down
		FROM (
			SELECT
				t.symbol,
				ROUND((t.` + "`close`" + ` - y.` + "`close`" + `) / y.` + "`close`" + ` * 100, 2) AS pct
			FROM stk_daily_kline t
			JOIN stk_daily_kline y ON t.symbol = y.symbol AND y.trade_date = ?
			WHERE t.trade_date = ?
			AND y.` + "`close`" + ` > 0
		) sub
	`

	err = j.quantDb.Raw(query, yesterday, today).Scan(&result).Error
	if err != nil {
		return fmt.Errorf("failed to calculate breadth: %v", err)
	}

	log.Printf("[MarketBreadthJob] Date=%s | Total=%d Up=%d Down=%d Flat=%d LimitUp=%d LimitDown=%d",
		today, result.TotalStocks, result.Advancers, result.Decliners, result.Flat, result.LimitUp, result.LimitDown)

	// Step 3: Parse today as time.Time for the model
	tradeDate, _ := time.Parse("2006-01-02", today)

	breadth := &models.MarketBreadth{
		TradeDate:   tradeDate,
		TotalStocks: result.TotalStocks,
		Advancers:   result.Advancers,
		Decliners:   result.Decliners,
		Flat:        result.Flat,
		LimitUp:     result.LimitUp,
		LimitDown:   result.LimitDown,
	}

	// Step 4: Upsert into trading_review.market_breadths
	var existing models.MarketBreadth
	err = j.mainDb.Where("trade_date = ?", tradeDate).First(&existing).Error
	if err == gorm.ErrRecordNotFound {
		return j.mainDb.Create(breadth).Error
	}
	if err != nil {
		return err
	}

	// Update existing record
	return j.mainDb.Model(&existing).Updates(map[string]interface{}{
		"total_stocks": result.TotalStocks,
		"advancers":    result.Advancers,
		"decliners":    result.Decliners,
		"flat":         result.Flat,
		"limit_up":     result.LimitUp,
		"limit_down":   result.LimitDown,
	}).Error
}

// RunNow triggers an immediate calculation (useful for testing or manual trigger).
func (j *MarketBreadthJob) RunNow() error {
	return j.calculate()
}
