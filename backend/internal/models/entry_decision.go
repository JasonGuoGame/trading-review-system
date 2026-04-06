package models

import (
	"database/sql/driver"
	"encoding/json"
	"fmt"
	"time"
)

// JSON type for MySQL - stores JSON data as text
type JSON json.RawMessage

func (j JSON) Value() (driver.Value, error) {
	if len(j) == 0 {
		return "null", nil
	}
	return string(j), nil
}

func (j *JSON) Scan(value interface{}) error {
	if value == nil {
		*j = JSON("null")
		return nil
	}
	switch v := value.(type) {
	case []byte:
		*j = JSON(v)
	case string:
		*j = JSON(v)
	default:
		return fmt.Errorf("cannot scan type %T into JSON", value)
	}
	return nil
}

func (j JSON) MarshalJSON() ([]byte, error) {
	if len(j) == 0 {
		return []byte("null"), nil
	}
	// Verify if the raw bytes are actually valid JSON
	if !json.Valid(j) {
		// If it's not valid JSON (e.g. legacy plain text), encode it as a JSON string to prevent unmarshal crashes
		return json.Marshal(string(j))
	}
	return []byte(j), nil
}

func (j *JSON) UnmarshalJSON(data []byte) error {
	if j == nil {
		return fmt.Errorf("JSON: UnmarshalJSON on nil pointer")
	}
	*j = append((*j)[0:0], data...)
	return nil
}

type EntryDecision struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	TradeID   uint      `gorm:"uniqueIndex;not null" json:"trade_id"`
	Strategy  string    `gorm:"size:50" json:"strategy"`
	SetupType string    `gorm:"size:50" json:"setup_type"`
	Signals   JSON      `gorm:"type:json" json:"signals"`
	Indicators JSON     `gorm:"type:json" json:"indicators"`
	Reason    string    `gorm:"type:text" json:"reason"`
	CreatedAt time.Time `json:"created_at"`
}
