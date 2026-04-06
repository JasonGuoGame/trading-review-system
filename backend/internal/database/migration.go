package database

import (
	"log"

	"trading-review-system/backend/internal/models"

	"gorm.io/gorm"
)

func Migrate(db *gorm.DB) error {
	log.Println("Running database migrations...")

	err := db.AutoMigrate(
		&models.Trade{},
		&models.Order{},
		&models.EntryDecision{},
		&models.ExitPlan{},
		&models.Tag{},
		&models.TradeTag{},
		&models.Review{},
	)
	if err != nil {
		return err
	}

	log.Println("Database migrations completed")
	return nil
}
