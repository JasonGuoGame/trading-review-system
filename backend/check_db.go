package main

import (
	"fmt"
	"log"
	"trading-review-system/backend/internal/config"
	"trading-review-system/backend/internal/database"
)

func main() {
	cfg := config.Load()
	quantDb, err := database.ConnectQuantDB(cfg)
	if err != nil {
		log.Fatal(err)
	}
	type Col struct {
		Field string
		Type  string
	}
	var cols []Col
	quantDb.Raw("DESCRIBE stk_sector_fund_flow").Scan(&cols)
	fmt.Println("Columns in stk_sector_fund_flow:")
	for _, c := range cols {
		fmt.Printf("- %s (%s)\n", c.Field, c.Type)
	}
}
