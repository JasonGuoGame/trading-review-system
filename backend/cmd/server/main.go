package main

import (
	"log"

	"trading-review-system/backend/internal/config"
	"trading-review-system/backend/internal/database"
	"trading-review-system/backend/internal/handler"
	"trading-review-system/backend/internal/middleware"
	"trading-review-system/backend/internal/repository"
	"trading-review-system/backend/internal/router"
	"trading-review-system/backend/internal/service"
)

func main() {
	// Load config
	cfg := config.Load()

	// Connect database
	db, err := database.Connect(cfg)
	if err != nil {
		log.Fatalf("Failed to connect database: %v", err)
	}

	// Run migrations
	if err := database.Migrate(db); err != nil {
		log.Fatalf("Failed to migrate database: %v", err)
	}

	// Initialize layers
	repos := repository.NewRepositories(db)
	services := service.NewServices(repos)
	handlers := handler.NewHandlers(services)
	mw := middleware.NewMiddleware()

	// Setup router
	r := router.Setup(handlers, mw)

	// Start server
	port := cfg.ServerPort
	if port == "" {
		port = "8080"
	}
	log.Printf("Server starting on port %s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
