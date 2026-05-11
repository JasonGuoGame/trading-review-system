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

	// Safe migration for score overhaul
	var colType string
	db.Raw("SELECT DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'trades' AND COLUMN_NAME = 'execution_score' AND TABLE_SCHEMA = DATABASE()").Scan(&colType)
	if colType == "varchar" || colType == "char" {
		log.Println("Migrating execution_score (string) to grade...")
		err = db.Exec("ALTER TABLE trades CHANGE execution_score grade VARCHAR(2)").Error
		if err != nil {
			log.Printf("Warning: failed to rename execution_score to grade: %v", err)
		}
	}

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
		&models.StockPool{},
		&models.StockPoolSignal{},
	)
	if err != nil {
		log.Printf("Warning: failed to auto migrate: %v", err)
	}

	log.Println("Database connected successfully")
	return db, nil
}

func ConnectQuantDB(cfg *config.Config) (*gorm.DB, error) {
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=Local",
		cfg.QuantDBUser,
		cfg.QuantDBPassword,
		cfg.QuantDBHost,
		cfg.QuantDBPort,
		cfg.QuantDBName,
	)

	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to connect to quant database: %w", err)
	}

	sqlDB, err := db.DB()
	if err != nil {
		return nil, fmt.Errorf("failed to get underlying sql.DB for quant db: %w", err)
	}

	// Connection pool settings
	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetMaxOpenConns(100)
	sqlDB.SetConnMaxLifetime(time.Hour)

	log.Println("Quant Database connected successfully")
	return db, nil
}
