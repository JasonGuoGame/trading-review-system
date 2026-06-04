package main

import (
	"log"
	"time"
	"trading-review-system/backend/internal/config"
	"trading-review-system/backend/internal/database"
	"trading-review-system/backend/internal/models"
)

func main() {
	cfg := config.Load()

	db, err := database.Connect(cfg)
	if err != nil {
		log.Fatal(err)
	}

	tradeDate, err := time.Parse("2006-01-02", "2026-06-03")
	if err != nil {
		log.Fatal(err)
	}

	stocks := []models.StockPool{
		{
			Symbol:       "600783.SH",
			TradeDate:    tradeDate,
			StockName:    "鲁信创投",
			PoolType:     "short",
			SectorName:   "代糖概念 / 军民融合",
			Score:        89,
			Status:       "分歧反包",
			Tags:         `{"status": "Divergence_Confirm", "yest_vol": 1.6724, "repair_depth": "100.0%"}`,
			Notes:        "放量分歧修复100.0%",
			IsWatchFocus: 1,
			CreatedAt:    time.Now(),
			UpdatedAt:    time.Now(),
		},
		{
			Symbol:       "300868.SZ",
			TradeDate:    tradeDate,
			StockName:    "杰美特",
			PoolType:     "short",
			SectorName:   "智能穿戴 / 电商概念",
			Score:        79,
			Status:       "分歧反包",
			Tags:         `{"status": "Divergence_Confirm", "yest_vol": 1.915, "repair_depth": "100.0%"}`,
			Notes:        "放量分歧修复100.0%",
			IsWatchFocus: 1,
			CreatedAt:    time.Now(),
			UpdatedAt:    time.Now(),
		},
		{
			Symbol:       "002611.SZ",
			TradeDate:    tradeDate,
			StockName:    "东方精工",
			PoolType:     "short",
			SectorName:   "AI智能体 / 人工智能",
			Score:        71,
			Status:       "分歧反包",
			Tags:         `{"status": "Divergence_Confirm", "yest_vol": 1.7618, "repair_depth": "100.0%"}`,
			Notes:        "放量分歧修复100.0%",
			IsWatchFocus: 1,
			CreatedAt:    time.Now(),
			UpdatedAt:    time.Now(),
		},
	}

	for _, s := range stocks {
		// Try to delete existing one first to avoid duplicate primary key errors
		db.Where("symbol = ? AND trade_date = ? AND pool_type = ? AND status = ?", s.Symbol, s.TradeDate.Format("2006-01-02"), s.PoolType, s.Status).Delete(&models.StockPool{})
		if err := db.Create(&s).Error; err != nil {
			log.Printf("Failed to insert %s: %v", s.Symbol, err)
		} else {
			log.Printf("Successfully inserted %s (%s)", s.StockName, s.Symbol)
		}
	}

	log.Println("Mock divergence data insert completed.")
}
