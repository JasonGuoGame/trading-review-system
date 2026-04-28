package config

import "os"

type Config struct {
	DBHost     string
	DBPort     string
	DBUser     string
	DBPassword string
	DBName     string
	
	QuantDBHost     string
	QuantDBPort     string
	QuantDBUser     string
	QuantDBPassword string
	QuantDBName     string

	ServerPort string
	GinMode    string
}

func Load() *Config {
	return &Config{
		DBHost:     getEnv("DB_HOST", "localhost"),
		DBPort:     getEnv("DB_PORT", "3306"),
		DBUser:     getEnv("DB_USER", "trader"),
		DBPassword: getEnv("DB_PASSWORD", "trading_secret_2026"),
		DBName:     getEnv("DB_NAME", "trading_review"),

		QuantDBHost:     getEnv("QUANT_DB_HOST", "localhost"),
		QuantDBPort:     getEnv("QUANT_DB_PORT", "3306"),
		QuantDBUser:     getEnv("QUANT_DB_USER", "root"),
		QuantDBPassword: getEnv("QUANT_DB_PASSWORD", "root_secret_2026"),
		QuantDBName:     getEnv("QUANT_DB_NAME", "quant_db"),

		ServerPort: getEnv("SERVER_PORT", "8080"),
		GinMode:    getEnv("GIN_MODE", "debug"),
	}
}

func getEnv(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return fallback
}
