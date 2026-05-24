package handler

import (
	"net/http"
	"strconv"
	"trading-review-system/backend/internal/dto"
	"trading-review-system/backend/internal/service"

	"github.com/gin-gonic/gin"
)

type StrategyPerformanceHandler struct {
	service *service.StrategyPerformanceService
}

func NewStrategyPerformanceHandler(service *service.StrategyPerformanceService) *StrategyPerformanceHandler {
	return &StrategyPerformanceHandler{service: service}
}

func (h *StrategyPerformanceHandler) GetDashboard(c *gin.Context) {
	days := 10
	if d, err := strconv.Atoi(c.Query("days")); err == nil && d > 0 {
		days = d
	}

	data, err := h.service.GetDashboard(days)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.APIResponse{
		Code:    http.StatusOK,
		Message: "Success",
		Data:    data,
	})
}
