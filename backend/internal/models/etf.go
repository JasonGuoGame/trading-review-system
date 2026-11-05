package models

// EtfInfo is a read-only view of one row of quant_db.stk_etf_info. Only the
// columns the cockpit consumes are mapped; nullable metadata is coalesced to an
// empty string by the repository query, so plain string fields are safe to scan.
type EtfInfo struct {
	Symbol       string `gorm:"size:20;column:symbol" json:"symbol"`
	Name         string `gorm:"size:100;column:name" json:"name"`
	EtfType      string `gorm:"size:30;column:etf_type" json:"etf_type"`
	EtfSubType   string `gorm:"size:50;column:etf_sub_type" json:"etf_sub_type"`
	IndustryName string `gorm:"size:100;column:industry_name" json:"industry_name"`
	Exchange     string `gorm:"size:10;column:exchange" json:"exchange"`
}

func (EtfInfo) TableName() string { return "stk_etf_info" }

// EtfDailyKline mirrors quant_db.stk_etf_daily_kline. The repository reads this
// table via Raw().Scan into EtfKlineRow (see etf_repo.go) with NULLs coalesced,
// so this struct is a schema reference rather than a scan target.
type EtfDailyKline struct {
	Symbol    string  `gorm:"primaryKey;size:20;column:symbol" json:"symbol"`
	TradeDate string  `gorm:"primaryKey;type:date;column:trade_date" json:"trade_date"`
	Open      float64 `gorm:"type:decimal(12,4);column:open" json:"open"`
	High      float64 `gorm:"type:decimal(12,4);column:high" json:"high"`
	Low       float64 `gorm:"type:decimal(12,4);column:low" json:"low"`
	Close     float64 `gorm:"type:decimal(12,4);column:close" json:"close"`
	Volume    int64   `gorm:"type:bigint;column:volume" json:"volume"`
	Amount    float64 `gorm:"type:decimal(20,2);column:amount" json:"amount"`
}

func (EtfDailyKline) TableName() string { return "stk_etf_daily_kline" }
