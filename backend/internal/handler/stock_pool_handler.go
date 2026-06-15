package handler

import (
	"net/http"
	"strconv"
	"trading-review-system/backend/internal/dto"
	"trading-review-system/backend/internal/models"
	"trading-review-system/backend/internal/service"

	"github.com/gin-gonic/gin"
)

type StockPoolHandler struct {
	service *service.StockPoolService
}

func NewStockPoolHandler(service *service.StockPoolService) *StockPoolHandler {
	return &StockPoolHandler{service: service}
}

func (h *StockPoolHandler) List(c *gin.Context) {
	poolType := c.Query("type")
	if poolType == "" {
		poolType = "short"
	}

	days := 0
	if daysStr := c.Query("days"); daysStr != "" {
		if d, err := strconv.Atoi(daysStr); err == nil && d > 0 {
			days = d
		}
	}

	tradeDate := c.Query("trade_date")

	stocks, err := h.service.GetStockPool(models.StockPoolType(poolType), days, tradeDate)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.APIResponse{
		Code:    http.StatusOK,
		Message: "Success",
		Data:    stocks,
	})
}

func (h *StockPoolHandler) Create(c *gin.Context) {
	var req dto.CreateStockPoolRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.service.CreateStock(req); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "created"})
}

func (h *StockPoolHandler) UpdateStatus(c *gin.Context) {
	symbol := c.Query("symbol")
	tradeDate := c.Query("trade_date")
	poolType := c.Query("pool_type")
	oldStatus := c.Query("old_status")

	var req dto.UpdateStockPoolStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.service.UpdateStatus(symbol, tradeDate, poolType, oldStatus, req.Status); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "updated"})
}

func (h *StockPoolHandler) GetDetail(c *gin.Context) {
	symbol := c.Param("symbol")

	detail, err := h.service.GetStockDetail(symbol)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.APIResponse{
		Code:    http.StatusOK,
		Message: "Success",
		Data:    detail,
	})
}

func (h *StockPoolHandler) Search(c *gin.Context) {
	query := c.Query("q")
	if query == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "query parameter 'q' is required"})
		return
	}

	days := 0
	if daysStr := c.Query("days"); daysStr != "" {
		if d, err := strconv.Atoi(daysStr); err == nil && d > 0 {
			days = d
		}
	}

	results, err := h.service.SearchStockPools(query, days)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.APIResponse{
		Code:    http.StatusOK,
		Message: "Success",
		Data:    results,
	})
}

func (h *StockPoolHandler) GetTypeCounts(c *gin.Context) {
	counts, err := h.service.GetTypeCounts()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, dto.APIResponse{
		Code:    http.StatusOK,
		Message: "Success",
		Data:    counts,
	})
}

func (h *StockPoolHandler) SetWatchFocus(c *gin.Context) {
	symbol := c.Query("symbol")
	tradeDate := c.Query("trade_date")
	poolType := c.Query("pool_type")
	status := c.Query("status")

	// Normalize trade_date to "2006-01-02" format in case frontend sends ISO 8601
	if len(tradeDate) > 10 {
		tradeDate = tradeDate[:10]
	}

	var req struct {
		Focus int `json:"focus"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.service.SetWatchFocus(symbol, tradeDate, poolType, status, req.Focus); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "updated"})
}

func (h *StockPoolHandler) GetStrategyStocks(c *gin.Context) {
	strategy := c.Query("strategy")
	tradeDate := c.Query("trade_date")
	scoreMinStr := c.Query("score_min")
	scoreMaxStr := c.Query("score_max")
	status := c.Query("status")

	if strategy == "" || tradeDate == "" || scoreMinStr == "" || scoreMaxStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "strategy, trade_date, score_min, score_max are required"})
		return
	}

	scoreMin, err := strconv.Atoi(scoreMinStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid score_min"})
		return
	}
	scoreMax, err := strconv.Atoi(scoreMaxStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid score_max"})
		return
	}

	result, err := h.service.GetStrategyStocks(strategy, tradeDate, scoreMin, scoreMax, status)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.APIResponse{
		Code:    http.StatusOK,
		Message: "Success",
		Data:    result,
	})
}

func (h *StockPoolHandler) GetModeRanking(c *gin.Context) {
	days := 30
	if daysStr := c.Query("days"); daysStr != "" {
		if d, err := strconv.Atoi(daysStr); err == nil && d > 0 {
			days = d
		}
	}

	result, err := h.service.GetModeRanking(days)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.APIResponse{
		Code:    http.StatusOK,
		Message: "Success",
		Data:    result,
	})
}

func (h *StockPoolHandler) GetStatusRanking(c *gin.Context) {
	days := 30
	if daysStr := c.Query("days"); daysStr != "" {
		if d, err := strconv.Atoi(daysStr); err == nil && d > 0 {
			days = d
		}
	}
	strategy := c.Query("strategy")
	if strategy == "" {
		strategy = "turnover_vol"
	}

	result, err := h.service.GetStatusRanking(strategy, days)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.APIResponse{
		Code:    http.StatusOK,
		Message: "Success",
		Data:    result,
	})
}

func (h *StockPoolHandler) GetStatusHeatmap(c *gin.Context) {
	days := 30
	if daysStr := c.Query("days"); daysStr != "" {
		if d, err := strconv.Atoi(daysStr); err == nil && d > 0 {
			days = d
		}
	}

	result, err := h.service.GetStatusHeatmap(days)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.APIResponse{
		Code:    http.StatusOK,
		Message: "Success",
		Data:    result,
	})
}

func (h *StockPoolHandler) GetStatusScoreTrend(c *gin.Context) {
	strategy := c.Query("strategy")
	status := c.Query("status")
	scoreMinStr := c.Query("score_min")
	scoreMaxStr := c.Query("score_max")
	daysStr := c.Query("days")

	if strategy == "" || status == "" || scoreMinStr == "" || scoreMaxStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "strategy, status, score_min, score_max are required"})
		return
	}

	scoreMin, err := strconv.Atoi(scoreMinStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid score_min"})
		return
	}
	scoreMax, err := strconv.Atoi(scoreMaxStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid score_max"})
		return
	}
	days := 30
	if daysStr != "" {
		if d, err := strconv.Atoi(daysStr); err == nil && d > 0 {
			days = d
		}
	}

	result, err := h.service.GetStatusScoreTrend(strategy, status, scoreMin, scoreMax, days)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.APIResponse{
		Code:    http.StatusOK,
		Message: "Success",
		Data:    result,
	})
}

func (h *StockPoolHandler) UpdatePrediction(c *gin.Context) {
	symbol := c.Query("symbol")
	tradeDate := c.Query("trade_date")
	poolType := c.Query("pool_type")
	status := c.Query("status")

	if len(tradeDate) > 10 {
		tradeDate = tradeDate[:10]
	}

	var req dto.UpdatePredictionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.service.UpdatePrediction(symbol, tradeDate, poolType, status, req.PredictionFlag, req.PredictionDetail, req.Viewpoint); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "updated"})
}

func (h *StockPoolHandler) Delete(c *gin.Context) {
	symbol := c.Query("symbol")
	tradeDate := c.Query("trade_date")
	poolType := c.Query("pool_type")
	status := c.Query("status")

	if err := h.service.DeleteStock(symbol, tradeDate, poolType, status); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "deleted"})
}
