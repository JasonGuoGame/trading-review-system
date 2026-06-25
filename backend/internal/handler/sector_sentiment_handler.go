package handler

import (
	"log"
	"net/http"

	"trading-review-system/backend/internal/dto"
	"trading-review-system/backend/internal/service"

	"github.com/gin-gonic/gin"
)

type SectorSentimentHandler struct {
	service *service.SectorSentimentService
}

func NewSectorSentimentHandler(service *service.SectorSentimentService) *SectorSentimentHandler {
	return &SectorSentimentHandler{service: service}
}

// GetLatestDate returns the most recent trade_date.
func (h *SectorSentimentHandler) GetLatestDate(c *gin.Context) {
	date, err := h.service.GetLatestTradeDate()
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.APIResponse{Code: 500, Message: err.Error()})
		return
	}
	c.JSON(http.StatusOK, dto.APIResponse{Code: 200, Message: "OK", Data: date})
}

// GetConsistentStrength returns 连强信号 data.
func (h *SectorSentimentHandler) GetConsistentStrength(c *gin.Context) {
	data, err := h.service.GetConsistentStrength()
	if err != nil {
		log.Printf("[sector-sentiment] GetConsistentStrength error: %v", err)
		c.JSON(http.StatusInternalServerError, dto.APIResponse{Code: 500, Message: err.Error()})
		return
	}
	c.JSON(http.StatusOK, dto.APIResponse{Code: 200, Message: "OK", Data: data})
}

// GetNewFaces returns 新面孔信号 data.
func (h *SectorSentimentHandler) GetNewFaces(c *gin.Context) {
	data, err := h.service.GetNewFaces()
	if err != nil {
		log.Printf("[sector-sentiment] GetNewFaces error: %v", err)
		c.JSON(http.StatusInternalServerError, dto.APIResponse{Code: 500, Message: err.Error()})
		return
	}
	c.JSON(http.StatusOK, dto.APIResponse{Code: 200, Message: "OK", Data: data})
}

// GetIceRecovery returns 冰点回升信号 data.
func (h *SectorSentimentHandler) GetIceRecovery(c *gin.Context) {
	data, err := h.service.GetIceRecovery()
	if err != nil {
		log.Printf("[sector-sentiment] GetIceRecovery error: %v", err)
		c.JSON(http.StatusInternalServerError, dto.APIResponse{Code: 500, Message: err.Error()})
		return
	}
	c.JSON(http.StatusOK, dto.APIResponse{Code: 200, Message: "OK", Data: data})
}

// GetDivergence returns 背离信号 data.
func (h *SectorSentimentHandler) GetDivergence(c *gin.Context) {
	data, err := h.service.GetDivergence()
	if err != nil {
		log.Printf("[sector-sentiment] GetDivergence error: %v", err)
		c.JSON(http.StatusInternalServerError, dto.APIResponse{Code: 500, Message: err.Error()})
		return
	}
	c.JSON(http.StatusOK, dto.APIResponse{Code: 200, Message: "OK", Data: data})
}

// GetConcentration returns 资金抱团度 data.
func (h *SectorSentimentHandler) GetConcentration(c *gin.Context) {
	data, err := h.service.GetConcentration()
	if err != nil {
		log.Printf("[sector-sentiment] GetConcentration error: %v", err)
		c.JSON(http.StatusInternalServerError, dto.APIResponse{Code: 500, Message: err.Error()})
		return
	}
	c.JSON(http.StatusOK, dto.APIResponse{Code: 200, Message: "OK", Data: data})
}

// GetFullReport returns all sector sentiment signals combined.
func (h *SectorSentimentHandler) GetFullReport(c *gin.Context) {
	data, err := h.service.GetFullReport()
	if err != nil {
		log.Printf("[sector-sentiment] GetFullReport error: %v", err)
		c.JSON(http.StatusInternalServerError, dto.APIResponse{Code: 500, Message: err.Error()})
		return
	}
	c.JSON(http.StatusOK, dto.APIResponse{Code: 200, Message: "OK", Data: data})
}
