package handler

import (
	"log"
	"net/http"
	"strconv"

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

// getTradeDate extracts trade_date from query string; falls back to latest.
// Normalizes to YYYY-MM-DD since MySQL driver may return full timestamps.
func (h *SectorSentimentHandler) getTradeDate(c *gin.Context) string {
	d := c.Query("trade_date")
	if d == "" {
		latest, _ := h.service.GetLatestTradeDate()
		d = latest
	}
	// Normalize to YYYY-MM-DD
	if len(d) > 10 {
		d = d[:10]
	}
	return d
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
	tradeDate := h.getTradeDate(c)
	data, err := h.service.GetConsistentStrength(tradeDate)
	if err != nil {
		log.Printf("[sector-sentiment] GetConsistentStrength error: %v", err)
		c.JSON(http.StatusInternalServerError, dto.APIResponse{Code: 500, Message: err.Error()})
		return
	}
	c.JSON(http.StatusOK, dto.APIResponse{Code: 200, Message: "OK", Data: data})
}

// GetNewFaces returns 新面孔信号 data.
func (h *SectorSentimentHandler) GetNewFaces(c *gin.Context) {
	tradeDate := h.getTradeDate(c)
	data, err := h.service.GetNewFaces(tradeDate)
	if err != nil {
		log.Printf("[sector-sentiment] GetNewFaces error: %v", err)
		c.JSON(http.StatusInternalServerError, dto.APIResponse{Code: 500, Message: err.Error()})
		return
	}
	c.JSON(http.StatusOK, dto.APIResponse{Code: 200, Message: "OK", Data: data})
}

// GetIceRecovery returns 冰点回升信号 data.
func (h *SectorSentimentHandler) GetIceRecovery(c *gin.Context) {
	tradeDate := h.getTradeDate(c)
	data, err := h.service.GetIceRecovery(tradeDate)
	if err != nil {
		log.Printf("[sector-sentiment] GetIceRecovery error: %v", err)
		c.JSON(http.StatusInternalServerError, dto.APIResponse{Code: 500, Message: err.Error()})
		return
	}
	c.JSON(http.StatusOK, dto.APIResponse{Code: 200, Message: "OK", Data: data})
}

// GetDivergence returns 背离信号 data.
func (h *SectorSentimentHandler) GetDivergence(c *gin.Context) {
	tradeDate := h.getTradeDate(c)
	data, err := h.service.GetDivergence(tradeDate)
	if err != nil {
		log.Printf("[sector-sentiment] GetDivergence error: %v", err)
		c.JSON(http.StatusInternalServerError, dto.APIResponse{Code: 500, Message: err.Error()})
		return
	}
	c.JSON(http.StatusOK, dto.APIResponse{Code: 200, Message: "OK", Data: data})
}

// GetConcentration returns 资金抱团度 data.
func (h *SectorSentimentHandler) GetConcentration(c *gin.Context) {
	tradeDate := h.getTradeDate(c)
	data, err := h.service.GetConcentration(tradeDate)
	if err != nil {
		log.Printf("[sector-sentiment] GetConcentration error: %v", err)
		c.JSON(http.StatusInternalServerError, dto.APIResponse{Code: 500, Message: err.Error()})
		return
	}
	c.JSON(http.StatusOK, dto.APIResponse{Code: 200, Message: "OK", Data: data})
}

// GetFullReport returns all sector sentiment signals combined.
func (h *SectorSentimentHandler) GetFullReport(c *gin.Context) {
	tradeDate := h.getTradeDate(c)
	data, err := h.service.GetFullReport(tradeDate)
	if err != nil {
		log.Printf("[sector-sentiment] GetFullReport error: %v", err)
		c.JSON(http.StatusInternalServerError, dto.APIResponse{Code: 500, Message: err.Error()})
		return
	}
	c.JSON(http.StatusOK, dto.APIResponse{Code: 200, Message: "OK", Data: data})
}

// GetSectorDrift returns rank drift data for a given sector.
func (h *SectorSentimentHandler) GetSectorDrift(c *gin.Context) {
	sectorName := c.Query("sector_name")
	if sectorName == "" {
		c.JSON(http.StatusBadRequest, dto.APIResponse{Code: 400, Message: "sector_name is required"})
		return
	}
	days := 30
	if d, err := strconv.Atoi(c.Query("days")); err == nil && d > 0 {
		days = d
	}
	data, err := h.service.GetSectorDrift(sectorName, days)
	if err != nil {
		log.Printf("[sector-sentiment] GetSectorDrift error: %v", err)
		c.JSON(http.StatusInternalServerError, dto.APIResponse{Code: 500, Message: err.Error()})
		return
	}
	c.JSON(http.StatusOK, dto.APIResponse{Code: 200, Message: "OK", Data: data})
}

// GetSectors returns distinct sector names for autocomplete.
func (h *SectorSentimentHandler) GetSectors(c *gin.Context) {
	data, err := h.service.GetSectorNames()
	if err != nil {
		log.Printf("[sector-sentiment] GetSectors error: %v", err)
		c.JSON(http.StatusInternalServerError, dto.APIResponse{Code: 500, Message: err.Error()})
		return
	}
	c.JSON(http.StatusOK, dto.APIResponse{Code: 200, Message: "OK", Data: data})
}

// GetClimbingSectors returns 暗线挖掘 data.
func (h *SectorSentimentHandler) GetClimbingSectors(c *gin.Context) {
	tradeDate := h.getTradeDate(c)
	data, err := h.service.GetClimbingSectors(tradeDate)
	if err != nil {
		log.Printf("[sector-sentiment] GetClimbingSectors error: %v", err)
		c.JSON(http.StatusInternalServerError, dto.APIResponse{Code: 500, Message: err.Error()})
		return
	}
	c.JSON(http.StatusOK, dto.APIResponse{Code: 200, Message: "OK", Data: data})
}
