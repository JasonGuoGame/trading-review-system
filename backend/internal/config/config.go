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

	SectorBlacklist []string
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

		SectorBlacklist: []string{
			// "融资融券", "沪股通", "深股通", "MSCI", "标准普尔", "富时罗素",
			// "央国企改革", "中证", "上证", "昨日", "小盘", "大盘",
			// "权重", "两融", "证金", "汇金", "基金重仓", "预盈预增",
			// "标普", "深证", "创业板", "科创板", "活跃", "高振幅",
			// "昨日涨停", "转债", "破净", "机构重仓", "股权转让", "中盘股", "深成500",
			// "最近多板", "东方财富", "年报预增", "电子", "HS300", "百元股", "中盘成长", "近期新高",
			// "创业成份", "百日新高", "PPP模式",
		},
	}
}

func getEnv(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return fallback
}
