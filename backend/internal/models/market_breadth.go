package models

import "time"

type MarketBreadth struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	TradeDate   time.Time `gorm:"type:date;uniqueIndex;not null" json:"trade_date"`
	TotalStocks int       `json:"total_stocks"`
	Advancers   int       `json:"advancers"`
	Decliners   int       `json:"decliners"`
	Flat        int       `json:"flat"`
	UpRatio     float64   `gorm:"column:up_ratio;type:decimal(6,2);default:0.00" json:"up_ratio"`
	DownRatio   float64   `gorm:"column:down_ratio;type:decimal(6,2);default:0.00" json:"down_ratio"`
	LimitUp     int       `json:"limit_up"`
	LimitDown   int       `json:"limit_down"`
	BrokenLimit int       `gorm:"column:broken_limit;default:0" json:"broken_limit"`
	BrokenRate  float64   `gorm:"column:broken_rate;type:decimal(6,2);default:0.00" json:"broken_rate"`
	YesterdayLimitUp    int     `gorm:"column:yesterday_limit_up;default:0" json:"yesterday_limit_up"`
	LimitUpPremium      float64 `gorm:"column:limit_up_premium;type:decimal(6,2);default:0.00" json:"limit_up_premium"`
	FirstBoardPremium   float64 `gorm:"column:first_board_premium;type:decimal(6,2);default:0.00" json:"first_board_premium"`
	SecondBoardPremium  float64 `gorm:"column:second_board_premium;type:decimal(6,2);default:0.00" json:"second_board_premium"`
	ThirdBoardPremium   float64 `gorm:"column:third_board_premium;type:decimal(6,2);default:0.00" json:"third_board_premium"`
	HighestBoard        int     `gorm:"column:highest_board;default:0" json:"highest_board"`
	Board2Count         int     `gorm:"column:board2_count;default:0" json:"board2_count"`
	Board3Count         int     `gorm:"column:board3_count;default:0" json:"board3_count"`
	Board4Count         int     `gorm:"column:board4_count;default:0" json:"board4_count"`
	Board5Count         int     `gorm:"column:board5_count;default:0" json:"board5_count"`
	TotalTurnover       float64 `gorm:"column:total_turnover;type:decimal(18,2);default:0.00" json:"total_turnover"`
	TurnoverChange      float64 `gorm:"column:turnover_change;type:decimal(6,2);default:0.00" json:"turnover_change"`
	StrongestSector     string  `gorm:"column:strongest_sector;size:64" json:"strongest_sector"`
	StrongestSectorScore float64 `gorm:"column:strongest_sector_score;type:decimal(6,2);default:0.00" json:"strongest_sector_score"`
	MarketScore         int     `gorm:"column:market_score;default:0" json:"market_score"`
	EmotionStage        string  `gorm:"column:emotion_stage;size:20;default:未知" json:"emotion_stage"`
	TradingLevel        int     `gorm:"column:trading_level;default:0" json:"trading_level"`
	TradingAdvice       string  `gorm:"column:trading_advice;size:100" json:"trading_advice"`
	CreatedAt           time.Time `json:"created_at"`
}
