package handler

import (
	"net/http"

	"trading-review-system/backend/internal/dto"
	"trading-review-system/backend/internal/service"

	"github.com/gin-gonic/gin"
)

type DashboardHandler struct {
	service *service.DashboardService
}

func NewDashboardHandler(service *service.DashboardService) *DashboardHandler {
	return &DashboardHandler{service: service}
}

// GET /api/dashboard/summary
func (h *DashboardHandler) GetSummary(c *gin.Context) {
	summary, err := h.service.GetSummary()
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.APIResponse{Code: 500, Message: "Failed to get summary"})
		return
	}
	c.JSON(http.StatusOK, dto.APIResponse{Code: 200, Message: "OK", Data: summary})
}

// GET /api/dashboard/equity-curve
func (h *DashboardHandler) GetEquityCurve(c *gin.Context) {
	data, err := h.service.GetEquityCurve()
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.APIResponse{Code: 500, Message: "Failed to get equity curve"})
		return
	}
	c.JSON(http.StatusOK, dto.APIResponse{Code: 200, Message: "OK", Data: data})
}

// GET /api/dashboard/win-rate
func (h *DashboardHandler) GetWinRate(c *gin.Context) {
	data, err := h.service.GetWinRate()
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.APIResponse{Code: 500, Message: "Failed to get win rate"})
		return
	}
	c.JSON(http.StatusOK, dto.APIResponse{Code: 200, Message: "OK", Data: data})
}

// GET /api/dashboard/prediction-accuracy
func (h *DashboardHandler) GetPredictionAccuracy(c *gin.Context) {
	data, err := h.service.GetPredictionAccuracy()
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.APIResponse{Code: 500, Message: "Failed to get prediction accuracy"})
		return
	}
	c.JSON(http.StatusOK, dto.APIResponse{Code: 200, Message: "OK", Data: data})
}

// GET /api/dashboard/prediction-details
func (h *DashboardHandler) GetPredictionDetails(c *gin.Context) {
	data, err := h.service.GetPredictionDetails()
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.APIResponse{Code: 500, Message: "Failed to get prediction details"})
		return
	}
	c.JSON(http.StatusOK, dto.APIResponse{Code: 200, Message: "OK", Data: data})
}

// GET /api/dashboard/recent-trades
func (h *DashboardHandler) GetRecentTrades(c *gin.Context) {
	data, err := h.service.GetRecentTrades()
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.APIResponse{Code: 500, Message: "Failed to get recent trades"})
		return
	}
	c.JSON(http.StatusOK, dto.APIResponse{Code: 200, Message: "OK", Data: data})
}
