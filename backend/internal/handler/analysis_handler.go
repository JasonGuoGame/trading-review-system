package handler

import (
	"net/http"

	"trading-review-system/backend/internal/dto"
	"trading-review-system/backend/internal/service"

	"github.com/gin-gonic/gin"
)

type AnalysisHandler struct {
	service *service.AnalysisService
}

func NewAnalysisHandler(service *service.AnalysisService) *AnalysisHandler {
	return &AnalysisHandler{service: service}
}

// GET /api/analysis/signals
func (h *AnalysisHandler) GetSignalStats(c *gin.Context) {
	data, err := h.service.GetSignalStats()
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.APIResponse{Code: 500, Message: "Failed to get signal stats"})
		return
	}
	c.JSON(http.StatusOK, dto.APIResponse{Code: 200, Message: "OK", Data: data})
}

// GET /api/analysis/tags
func (h *AnalysisHandler) GetTagStats(c *gin.Context) {
	data, err := h.service.GetTagStats()
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.APIResponse{Code: 500, Message: "Failed to get tag stats"})
		return
	}
	c.JSON(http.StatusOK, dto.APIResponse{Code: 200, Message: "OK", Data: data})
}

// GET /api/analysis/market
func (h *AnalysisHandler) GetMarketStats(c *gin.Context) {
	data, err := h.service.GetMarketStats()
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.APIResponse{Code: 500, Message: "Failed to get market stats"})
		return
	}
	c.JSON(http.StatusOK, dto.APIResponse{Code: 200, Message: "OK", Data: data})
}

// GET /api/analysis/execution
func (h *AnalysisHandler) GetExecutionStats(c *gin.Context) {
	data, err := h.service.GetExecutionStats()
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.APIResponse{Code: 500, Message: "Failed to get execution stats"})
		return
	}
	c.JSON(http.StatusOK, dto.APIResponse{Code: 200, Message: "OK", Data: data})
}

// GET /api/analysis/emotion
func (h *AnalysisHandler) GetEmotionStats(c *gin.Context) {
	data, err := h.service.GetEmotionStats()
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.APIResponse{Code: 500, Message: "Failed to get emotion stats"})
		return
	}
	c.JSON(http.StatusOK, dto.APIResponse{Code: 200, Message: "OK", Data: data})
}

// GET /api/analysis/mistakes
func (h *AnalysisHandler) GetMistakeStats(c *gin.Context) {
	data, err := h.service.GetMistakeStats()
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.APIResponse{Code: 500, Message: "Failed to get mistake stats"})
		return
	}
	c.JSON(http.StatusOK, dto.APIResponse{Code: 200, Message: "OK", Data: data})
}
