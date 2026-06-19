package service

import (
	"fmt"
	"log"
	"strings"
	"time"

	"trading-review-system/backend/internal/models"
	"trading-review-system/backend/internal/repository"
)

type ResearchSqlService struct {
	repo *repository.ResearchSqlRepository
}

func NewResearchSqlService(repo *repository.ResearchSqlRepository) *ResearchSqlService {
	return &ResearchSqlService{repo: repo}
}

// ============================================================
// Saved SQLs
// ============================================================

func (s *ResearchSqlService) ListSaved() ([]models.ResearchSql, error) {
	return s.repo.ListSaved()
}

func (s *ResearchSqlService) CreateSaved(name, category, strategyType, description, sqlText string) (*models.ResearchSql, error) {
	rec := &models.ResearchSql{
		Name:         name,
		Category:     category,
		StrategyType: strategyType,
		Description:  description,
		SqlText:      sqlText,
	}
	if err := s.repo.CreateSaved(rec); err != nil {
		return nil, err
	}
	return rec, nil
}

func (s *ResearchSqlService) UpdateSaved(id int64, name, category, strategyType, description, sqlText string) error {
	rec, err := s.repo.GetSaved(id)
	if err != nil {
		return err
	}
	rec.Name = name
	rec.Category = category
	rec.StrategyType = strategyType
	rec.Description = description
	rec.SqlText = sqlText
	return s.repo.UpdateSaved(rec)
}

func (s *ResearchSqlService) DeleteSaved(id int64) error {
	return s.repo.DeleteSaved(id)
}

// ============================================================
// Execute SQL
// ============================================================

var allowedVerbs = map[string]bool{
	"SELECT": true, "EXPLAIN": true, "DESCRIBE": true, "DESC": true,
	"SHOW": true, "WITH": true,
}

func (s *ResearchSqlService) Execute(sqlText string, savedID *int64, savedName string) (*models.SqlExecuteResponse, error) {
	trimmed := strings.TrimSpace(sqlText)
	if trimmed == "" {
		return nil, fmt.Errorf("SQL不能为空")
	}

	// Safety: only allow read operations
	upper := strings.ToUpper(trimmed)
	verb := strings.Fields(upper)[0]
	if !allowedVerbs[verb] {
		return nil, fmt.Errorf("只允许 SELECT/EXPLAIN/DESCRIBE/SHOW/WITH 查询，不允许: %s", verb)
	}

	// Detect which database to use
	dbName := "quant"
	if strings.Contains(strings.ToUpper(trimmed), "FROM RESEARCH_SQL") ||
		strings.Contains(strings.ToUpper(trimmed), "FROM TRADES") ||
		strings.Contains(strings.ToUpper(trimmed), "FROM STOCK_POOL") ||
		strings.Contains(strings.ToUpper(trimmed), "FROM TAGS") ||
		strings.Contains(strings.ToUpper(trimmed), "FROM TRADE_") {
		dbName = "main"
	}

	start := time.Now()
	cols, rows, err := s.repo.Execute(dbName, trimmed)
	elapsed := int(time.Since(start).Milliseconds())

	// Save history
	history := &models.ResearchSqlHistory{
		SqlID:   savedID,
		SqlName: savedName,
		SqlText: trimmed,
	}
	if err != nil {
		history.ExecuteStatus = "ERROR"
		history.ErrorMessage = err.Error()
		s.repo.SaveHistory(history)
		// Also log the full error
		log.Printf("[research-sql] execute error (elapsed=%dms): %v", elapsed, err)
		return nil, fmt.Errorf("SQL执行失败: %w", err)
	}

	history.ExecuteStatus = "SUCCESS"
	history.ExecuteMs = elapsed
	history.ResultCount = len(rows)
	if err := s.repo.SaveHistory(history); err != nil {
		log.Printf("[research-sql] save history error: %v", err)
	}

	log.Printf("[research-sql] executed in %dms, %d rows returned", elapsed, len(rows))

	return &models.SqlExecuteResponse{
		Columns:   cols,
		Rows:      rows,
		RowCount:  len(rows),
		ExecuteMs: elapsed,
		HistoryID: history.ID,
	}, nil
}

// ============================================================
// History
// ============================================================

func (s *ResearchSqlService) ListHistory(limit int) ([]models.ResearchSqlHistory, error) {
	return s.repo.ListHistory(limit)
}

func (s *ResearchSqlService) ClearHistory(days int) error {
	return s.repo.ClearHistory(days)
}
