package handler

import (
	"log"
	"net/http"
	"strconv"

	"trading-review-system/backend/internal/dto"
	"trading-review-system/backend/internal/models"
	"trading-review-system/backend/internal/service"

	"github.com/gin-gonic/gin"
)

type ResearchSqlHandler struct {
	service *service.ResearchSqlService
}

func NewResearchSqlHandler(s *service.ResearchSqlService) *ResearchSqlHandler {
	return &ResearchSqlHandler{service: s}
}

// GET /api/research-lab/saved
func (h *ResearchSqlHandler) ListSaved(c *gin.Context) {
	list, err := h.service.ListSaved()
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.APIResponse{Code: 500, Message: err.Error()})
		return
	}
	if list == nil {
		list = []models.ResearchSql{}
	}
	c.JSON(http.StatusOK, dto.APIResponse{Code: 200, Message: "OK", Data: list})
}

// POST /api/research-lab/saved
func (h *ResearchSqlHandler) CreateSaved(c *gin.Context) {
	var body struct {
		Name         string `json:"name"`
		Category     string `json:"category"`
		StrategyType string `json:"strategy_type"`
		Description  string `json:"description"`
		SqlText      string `json:"sql_text"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, dto.APIResponse{Code: 400, Message: "参数错误"})
		return
	}
	if body.Name == "" || body.SqlText == "" {
		c.JSON(http.StatusBadRequest, dto.APIResponse{Code: 400, Message: "名称和SQL不能为空"})
		return
	}
	rec, err := h.service.CreateSaved(body.Name, body.Category, body.StrategyType, body.Description, body.SqlText)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.APIResponse{Code: 500, Message: err.Error()})
		return
	}
	c.JSON(http.StatusOK, dto.APIResponse{Code: 200, Message: "OK", Data: rec})
}

// PUT /api/research-lab/saved/:id
func (h *ResearchSqlHandler) UpdateSaved(c *gin.Context) {
	id, _ := strconv.ParseInt(c.Param("id"), 10, 64)
	var body struct {
		Name         string `json:"name"`
		Category     string `json:"category"`
		StrategyType string `json:"strategy_type"`
		Description  string `json:"description"`
		SqlText      string `json:"sql_text"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, dto.APIResponse{Code: 400, Message: "参数错误"})
		return
	}
	if err := h.service.UpdateSaved(id, body.Name, body.Category, body.StrategyType, body.Description, body.SqlText); err != nil {
		c.JSON(http.StatusInternalServerError, dto.APIResponse{Code: 500, Message: err.Error()})
		return
	}
	c.JSON(http.StatusOK, dto.APIResponse{Code: 200, Message: "OK"})
}

// DELETE /api/research-lab/saved/:id
func (h *ResearchSqlHandler) DeleteSaved(c *gin.Context) {
	id, _ := strconv.ParseInt(c.Param("id"), 10, 64)
	if err := h.service.DeleteSaved(id); err != nil {
		c.JSON(http.StatusInternalServerError, dto.APIResponse{Code: 500, Message: err.Error()})
		return
	}
	c.JSON(http.StatusOK, dto.APIResponse{Code: 200, Message: "OK"})
}

// POST /api/research-lab/execute
func (h *ResearchSqlHandler) Execute(c *gin.Context) {
	var body struct {
		SqlText   string `json:"sql_text"`
		SavedID   *int64 `json:"saved_id"`
		SavedName string `json:"saved_name"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, dto.APIResponse{Code: 400, Message: "参数错误"})
		return
	}

	result, err := h.service.Execute(body.SqlText, body.SavedID, body.SavedName)
	if err != nil {
		log.Printf("[research-sql] execute error: %v", err)
		c.JSON(http.StatusInternalServerError, dto.APIResponse{Code: 500, Message: err.Error()})
		return
	}
	c.JSON(http.StatusOK, dto.APIResponse{Code: 200, Message: "OK", Data: result})
}

// GET /api/research-lab/history
func (h *ResearchSqlHandler) ListHistory(c *gin.Context) {
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	list, err := h.service.ListHistory(limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.APIResponse{Code: 500, Message: err.Error()})
		return
	}
	if list == nil {
		list = []models.ResearchSqlHistory{}
	}
	c.JSON(http.StatusOK, dto.APIResponse{Code: 200, Message: "OK", Data: list})
}

// DELETE /api/research-lab/history
func (h *ResearchSqlHandler) ClearHistory(c *gin.Context) {
	days, _ := strconv.Atoi(c.DefaultQuery("days", "30"))
	if err := h.service.ClearHistory(days); err != nil {
		c.JSON(http.StatusInternalServerError, dto.APIResponse{Code: 500, Message: err.Error()})
		return
	}
	c.JSON(http.StatusOK, dto.APIResponse{Code: 200, Message: "OK"})
}
