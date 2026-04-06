package database

import (
	"fmt"
	"log"
	"time"

	"trading-review-system/backend/internal/config"
	"trading-review-system/backend/internal/models"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func Connect(cfg *config.Config) (*gorm.DB, error) {
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=Local",
		cfg.DBUser,
		cfg.DBPassword,
		cfg.DBHost,
		cfg.DBPort,
		cfg.DBName,
	)

	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	sqlDB, err := db.DB()
	if err != nil {
		return nil, fmt.Errorf("failed to get underlying sql.DB: %w", err)
	}

	// Connection pool settings
	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetMaxOpenConns(100)
	sqlDB.SetConnMaxLifetime(time.Hour)

	// Auto Migrate
	err = db.AutoMigrate(
		&models.Trade{},
		&models.Order{},
		&models.EntryDecision{},
		&models.ExitPlan{},
		&models.Tag{},
		&models.TradeTag{},
		&models.Review{},
		&models.DailyReview{},
		&models.MarketBreadth{},
	)
	if err != nil {
		log.Printf("Warning: failed to auto migrate: %v", err)
	}

	log.Println("Database connected successfully")
	return db, nil
}
