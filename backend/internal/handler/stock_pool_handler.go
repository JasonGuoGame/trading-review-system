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

	stocks, err := h.service.GetStockPool(models.StockPoolType(poolType), days)
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

	results, err := h.service.SearchStockPools(query)
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
