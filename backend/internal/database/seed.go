package database

import (
	"log"

	"trading-review-system/backend/internal/models"

	"gorm.io/gorm"
)

func Seed(db *gorm.DB) error {
	var count int64
	db.Model(&models.Tag{}).Where("is_system = ?", true).Count(&count)
	if count > 0 {
		return nil // Already seeded
	}

	log.Println("Seeding system tags...")

	tags := []models.Tag{
		// 策略标签
		{Name: "趋势", Category: "strategy", IsSystem: true},
		{Name: "趋势加仓", Category: "strategy", IsSystem: true},
		{Name: "主升", Category: "strategy", IsSystem: true},
		{Name: "波段", Category: "strategy", IsSystem: true},
		{Name: "突破", Category: "strategy", IsSystem: true},
		{Name: "放量突破", Category: "strategy", IsSystem: true},
		{Name: "平台突破", Category: "strategy", IsSystem: true},
		{Name: "新高突破", Category: "strategy", IsSystem: true},
		{Name: "回调", Category: "strategy", IsSystem: true},
		{Name: "均线回踩", Category: "strategy", IsSystem: true},
		{Name: "分歧低吸", Category: "strategy", IsSystem: true},
		{Name: "打板", Category: "strategy", IsSystem: true},
		{Name: "首板", Category: "strategy", IsSystem: true},
		{Name: "连板", Category: "strategy", IsSystem: true},
		{Name: "龙头", Category: "strategy", IsSystem: true},
		{Name: "跟风", Category: "strategy", IsSystem: true},

		// 行业/主线标签
		{Name: "AI", Category: "industry", IsSystem: true},
		{Name: "机器人", Category: "industry", IsSystem: true},
		{Name: "电力", Category: "industry", IsSystem: true},
		{Name: "新能源", Category: "industry", IsSystem: true},
		{Name: "芯片", Category: "industry", IsSystem: true},
		{Name: "军工", Category: "industry", IsSystem: true},
		{Name: "消费", Category: "industry", IsSystem: true},

		// 错误标签
		{Name: "追高", Category: "mistake", IsSystem: true},
		{Name: "没止损", Category: "mistake", IsSystem: true},
		{Name: "止损犹豫", Category: "mistake", IsSystem: true},
		{Name: "情绪交易", Category: "mistake", IsSystem: true},
		{Name: "FOMO", Category: "mistake", IsSystem: true},
		{Name: "随手单", Category: "mistake", IsSystem: true},
		{Name: "过度交易", Category: "mistake", IsSystem: true},
		{Name: "逆势交易", Category: "mistake", IsSystem: true},

		// 情绪标签
		{Name: "焦虑", Category: "emotion", IsSystem: true},
		{Name: "冲动", Category: "emotion", IsSystem: true},
		{Name: "冷静", Category: "emotion", IsSystem: true},
		{Name: "犹豫", Category: "emotion", IsSystem: true},
		{Name: "贪婪", Category: "emotion", IsSystem: true},
		{Name: "恐惧", Category: "emotion", IsSystem: true},

		// 市场环境标签
		{Name: "强势市场", Category: "market", IsSystem: true},
		{Name: "弱势市场", Category: "market", IsSystem: true},
		{Name: "震荡", Category: "market", IsSystem: true},
		{Name: "情绪冰点", Category: "market", IsSystem: true},
		{Name: "情绪修复", Category: "market", IsSystem: true},
		{Name: "主升期", Category: "market", IsSystem: true},
		{Name: "退潮期", Category: "market", IsSystem: true},

		// 结果标签
		{Name: "盈利", Category: "result", IsSystem: true},
		{Name: "亏损", Category: "result", IsSystem: true},
		{Name: "大赚", Category: "result", IsSystem: true},
		{Name: "大亏", Category: "result", IsSystem: true},
	}

	for _, tag := range tags {
		if err := db.Where("name = ?", tag.Name).FirstOrCreate(&tag).Error; err != nil {
			log.Printf("Failed to seed tag %s: %v", tag.Name, err)
		}
	}

	log.Println("Seeding system tags completed.")
	return nil
}
