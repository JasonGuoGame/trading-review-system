package repository

import (
	"log"
	"time"

	"trading-review-system/backend/internal/models"

	"gorm.io/gorm"
)

type ResearchSqlRepository struct {
	db     *gorm.DB
	quantDb *gorm.DB
}

func NewResearchSqlRepository(db, quantDb *gorm.DB) *ResearchSqlRepository {
	return &ResearchSqlRepository{db: db, quantDb: quantDb}
}

// ============================================================
// Saved SQLs (uses main db)
// ============================================================

func (r *ResearchSqlRepository) ListSaved() ([]models.ResearchSql, error) {
	var list []models.ResearchSql
	err := r.db.Order("category, strategy_type, name").Find(&list).Error
	return list, err
}

func (r *ResearchSqlRepository) GetSaved(id int64) (*models.ResearchSql, error) {
	var s models.ResearchSql
	err := r.db.First(&s, id).Error
	if err != nil {
		return nil, err
	}
	return &s, nil
}

func (r *ResearchSqlRepository) CreateSaved(s *models.ResearchSql) error {
	now := time.Now()
	s.CreatedAt = now
	s.UpdatedAt = now
	return r.db.Create(s).Error
}

func (r *ResearchSqlRepository) UpdateSaved(s *models.ResearchSql) error {
	s.UpdatedAt = time.Now()
	return r.db.Save(s).Error
}

func (r *ResearchSqlRepository) DeleteSaved(id int64) error {
	return r.db.Delete(&models.ResearchSql{}, id).Error
}

// ============================================================
// Execute raw SQL (quant db by default, fallback to main)
// ============================================================

func (r *ResearchSqlRepository) Execute(dbName string, sqlText string) ([]string, [][]any, error) {
	target := r.quantDb
	if dbName == "main" {
		target = r.db
	}

	rows, err := target.Raw(sqlText).Rows()
	if err != nil {
		return nil, nil, err
	}
	defer rows.Close()

	cols, err := rows.Columns()
	if err != nil {
		return nil, nil, err
	}

	var result [][]any
	for rows.Next() {
		scanArgs := make([]any, len(cols))
		scanPtrs := make([]any, len(cols))
		for i := range scanArgs {
			scanPtrs[i] = &scanArgs[i]
		}
		if err := rows.Scan(scanPtrs...); err != nil {
			return nil, nil, err
		}
		// Convert []byte → string for JSON-friendly output
		row := make([]any, len(cols))
		for i, v := range scanArgs {
			if b, ok := v.([]byte); ok {
				row[i] = string(b)
			} else {
				row[i] = v
			}
		}
		result = append(result, row)
	}

	return cols, result, nil
}

// ============================================================
// History (main db)
// ============================================================

func (r *ResearchSqlRepository) SaveHistory(h *models.ResearchSqlHistory) error {
	h.ExecuteTime = time.Now()
	return r.db.Create(h).Error
}

func (r *ResearchSqlRepository) ListHistory(limit int) ([]models.ResearchSqlHistory, error) {
	var list []models.ResearchSqlHistory
	if limit <= 0 {
		limit = 20
	}
	err := r.db.Order("execute_time DESC").Limit(limit).Find(&list).Error
	return list, err
}

func (r *ResearchSqlRepository) ClearHistory(days int) error {
	if days <= 0 {
		days = 30
	}
	cutoff := time.Now().AddDate(0, 0, -days)
	log.Printf("[research-sql] clearing history older than %s", cutoff.Format("2006-01-02"))
	return r.db.Where("execute_time < ?", cutoff).Delete(&models.ResearchSqlHistory{}).Error
}
