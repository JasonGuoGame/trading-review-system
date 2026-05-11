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

	// Mock Short term
	shortStocks := []models.StockPool{
		{
			Symbol: "601179", StockName: "中国西电", PoolType: "short", SectorName: "电力",
			Score: 92, Status: "买点", Tags: "{}", Notes: "二次启动，站上MA5", CreatedAt: time.Now(), UpdatedAt: time.Now(),
		},
		{
			Symbol: "002520", StockName: "中大力德", PoolType: "short", SectorName: "机器人",
			Score: 95, Status: "强", Tags: "{}", Notes: "龙头突破，主力持续流入", CreatedAt: time.Now(), UpdatedAt: time.Now(),
		},
		{
			Symbol: "000977", StockName: "浪潮信息", PoolType: "short", SectorName: "AI",
			Score: 83, Status: "观察", Tags: "{}", Notes: "缩量回踩，等待企稳", CreatedAt: time.Now(), UpdatedAt: time.Now(),
		},
	}

	for _, s := range shortStocks {
		db.Create(&s)
	}

	// Mock Long term
	longStocks := []models.StockPool{
		{
			Symbol: "300750", StockName: "宁德时代", PoolType: "long", SectorName: "新能源",
			Score: 88, Status: "持有", Tags: "{}", Notes: "MA多头，基本面坚挺", CreatedAt: time.Now(), UpdatedAt: time.Now(),
		},
		{
			Symbol: "300308", StockName: "中际旭创", PoolType: "long", SectorName: "AI算力",
			Score: 84, Status: "观察", Tags: "{}", Notes: "行业空间大，趋势向上", CreatedAt: time.Now(), UpdatedAt: time.Now(),
		},
	}

	for _, s := range longStocks {
		db.Create(&s)
	}

	log.Println("Mock data inserted successfully")
}
