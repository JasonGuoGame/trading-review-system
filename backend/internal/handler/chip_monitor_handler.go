package handler

import (
	"log"
	"net/http"

	"trading-review-system/backend/internal/dto"
	"trading-review-system/backend/internal/service"

	"github.com/gin-gonic/gin"
)

type ChipMonitorHandler struct {
	service *service.ChipMonitorService
}

func NewChipMonitorHandler(service *service.ChipMonitorService) *ChipMonitorHandler {
	return &ChipMonitorHandler{service: service}
}

// getTradeDate extracts trade_date from query string; falls back to latest.
func (h *ChipMonitorHandler) getTradeDate(c *gin.Context) string {
	if d := c.Query("trade_date"); d != "" {
		return d
	}
	latest, _ := h.service.GetLatestTradeDate()
	return latest
}

func (h *ChipMonitorHandler) GetLatestDate(c *gin.Context) {
	date, err := h.service.GetLatestTradeDate()
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.APIResponse{Code: 500, Message: err.Error()})
		return
	}
	c.JSON(http.StatusOK, dto.APIResponse{Code: 200, Message: "OK", Data: date})
}

func (h *ChipMonitorHandler) GetRadar(c *gin.Context) {
	tradeDate := h.getTradeDate(c)
	data, err := h.service.GetRadar(tradeDate)
	if err != nil {
		log.Printf("[chip-monitor] GetRadar error: %v", err)
		c.JSON(http.StatusInternalServerError, dto.APIResponse{Code: 500, Message: err.Error()})
		return
	}
	c.JSON(http.StatusOK, dto.APIResponse{Code: 200, Message: "OK", Data: data})
}

func (h *ChipMonitorHandler) GetAccumulation(c *gin.Context) {
	tradeDate := h.getTradeDate(c)
	data, err := h.service.GetAccumulation(tradeDate)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.APIResponse{Code: 500, Message: err.Error()})
		return
	}
	c.JSON(http.StatusOK, dto.APIResponse{Code: 200, Message: "OK", Data: data})
}

func (h *ChipMonitorHandler) GetPeakMove(c *gin.Context) {
	tradeDate := h.getTradeDate(c)
	data, err := h.service.GetPeakMove(tradeDate)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.APIResponse{Code: 500, Message: err.Error()})
		return
	}
	c.JSON(http.StatusOK, dto.APIResponse{Code: 200, Message: "OK", Data: data})
}

func (h *ChipMonitorHandler) GetDivergence(c *gin.Context) {
	tradeDate := h.getTradeDate(c)
	data, err := h.service.GetDivergence(tradeDate)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.APIResponse{Code: 500, Message: err.Error()})
		return
	}
	c.JSON(http.StatusOK, dto.APIResponse{Code: 200, Message: "OK", Data: data})
}

func (h *ChipMonitorHandler) GetDistribution(c *gin.Context) {
	tradeDate := h.getTradeDate(c)
	data, err := h.service.GetDistribution(tradeDate)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.APIResponse{Code: 500, Message: err.Error()})
		return
	}
	c.JSON(http.StatusOK, dto.APIResponse{Code: 200, Message: "OK", Data: data})
}

func (h *ChipMonitorHandler) SearchStock(c *gin.Context) {
	q := c.Query("q")
	if q == "" {
		c.JSON(http.StatusBadRequest, dto.APIResponse{Code: 400, Message: "请输入搜索关键词"})
		return
	}
	tradeDate := h.getTradeDate(c)

	data, err := h.service.SearchStock(tradeDate, q)
	if err != nil {
		log.Printf("[chip-monitor] SearchStock error: %v", err)
		c.JSON(http.StatusInternalServerError, dto.APIResponse{Code: 500, Message: err.Error()})
		return
	}
	if data == nil {
		c.JSON(http.StatusOK, dto.APIResponse{Code: 200, Message: "未找到该股票", Data: nil})
		return
	}
	c.JSON(http.StatusOK, dto.APIResponse{Code: 200, Message: "OK", Data: data})
}
