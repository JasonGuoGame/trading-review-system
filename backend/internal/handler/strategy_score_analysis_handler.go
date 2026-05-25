package handler

import (
	"net/http"
	"strconv"
	"trading-review-system/backend/internal/dto"
	"trading-review-system/backend/internal/service"

	"github.com/gin-gonic/gin"
)

type StrategyScoreAnalysisHandler struct {
	service *service.StrategyScoreAnalysisService
}

func NewStrategyScoreAnalysisHandler(service *service.StrategyScoreAnalysisService) *StrategyScoreAnalysisHandler {
	return &StrategyScoreAnalysisHandler{service: service}
}

func (h *StrategyScoreAnalysisHandler) GetTrend(c *gin.Context) {
	strategy := c.Query("strategy")
	if strategy == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "strategy parameter is required"})
		return
	}

	days := 30
	if d, err := strconv.Atoi(c.Query("days")); err == nil && d > 0 {
		days = d
	}

	data, err := h.service.GetStrategyAnalysis(strategy, days)
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
