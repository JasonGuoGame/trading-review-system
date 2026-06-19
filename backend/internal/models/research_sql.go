package models

import "time"

// ResearchSql maps to trading_review.research_sql
type ResearchSql struct {
	ID           int64     `gorm:"primaryKey;autoIncrement" json:"id"`
	Name         string    `gorm:"size:100;not null" json:"name"`
	Category     string    `gorm:"size:50;not null" json:"category"`
	StrategyType string    `gorm:"column:strategy_type;size:50" json:"strategy_type"`
	Description  string    `gorm:"size:500" json:"description"`
	SqlText      string    `gorm:"column:sql_text;type:longtext" json:"sql_text"`
	Favorite     bool      `gorm:"default:false" json:"favorite"`
	CreatedAt    time.Time `gorm:"column:created_at" json:"created_at"`
	UpdatedAt    time.Time `gorm:"column:updated_at" json:"updated_at"`
}

func (ResearchSql) TableName() string {
	return "research_sql"
}

// ResearchSqlHistory maps to trading_review.research_sql_history
type ResearchSqlHistory struct {
	ID            int64     `gorm:"primaryKey;autoIncrement" json:"id"`
	SqlID         *int64    `gorm:"column:sql_id" json:"sql_id"`
	SqlName       string    `gorm:"column:sql_name;size:100" json:"sql_name"`
	SqlText       string    `gorm:"column:sql_text;type:longtext;not null" json:"sql_text"`
	ExecuteTime   time.Time `gorm:"column:execute_time;not null" json:"execute_time"`
	ExecuteMs     int       `gorm:"column:execute_ms;default:0" json:"execute_ms"`
	ResultCount   int       `gorm:"column:result_count;default:0" json:"result_count"`
	ExecuteStatus string    `gorm:"column:execute_status;size:20;default:SUCCESS" json:"execute_status"`
	ErrorMessage  string    `gorm:"column:error_message;type:text" json:"error_message"`
	CreatedBy     string    `gorm:"column:created_by;size:50;default:admin" json:"created_by"`
}

func (ResearchSqlHistory) TableName() string {
	return "research_sql_history"
}

// SqlExecuteResponse is the dynamic result returned after executing a SQL.
type SqlExecuteResponse struct {
	Columns    []string   `json:"columns"`
	Rows       [][]any    `json:"rows"`
	RowCount   int        `json:"row_count"`
	ExecuteMs  int        `json:"execute_ms"`
	HistoryID  int64      `json:"history_id"`
}
