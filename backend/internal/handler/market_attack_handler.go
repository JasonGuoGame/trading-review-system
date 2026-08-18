package handler

import (
	"net/http"
	"trading-review-system/backend/internal/dto"
	"trading-review-system/backend/internal/service"

	"github.com/gin-gonic/gin"
)

type MarketAttackHandler struct {
	service *service.MarketAttackService
}

func NewMarketAttackHandler(service *service.MarketAttackService) *MarketAttackHandler {
	return &MarketAttackHandler{service: service}
}

func (h *MarketAttackHandler) GetTopAttacks(c *gin.Context) {
	date := c.Query("trade_date")
	res, err := h.service.GetTopAttacks(date)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.APIResponse{
			Code:    http.StatusInternalServerError,
			Message: "Failed to fetch top attacks: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, dto.APIResponse{
		Code:    http.StatusOK,
		Message: "Success",
		Data:    res,
	})
}

func (h *MarketAttackHandler) GetSectorDetail(c *gin.Context) {
	name := c.Param("name")
	date := c.Query("trade_date")
	if name == "" {
		c.JSON(http.StatusBadRequest, dto.APIResponse{
			Code:    http.StatusBadRequest,
			Message: "Sector name is required",
		})
		return
	}

	res, err := h.service.GetSectorDetail(date, name)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.APIResponse{
			Code:    http.StatusInternalServerError,
			Message: "Failed to fetch sector details: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, dto.APIResponse{
		Code:    http.StatusOK,
		Message: "Success",
		Data:    res,
	})
}

func (h *MarketAttackHandler) GetSectorTrend(c *gin.Context) {
	name := c.Query("sector_name")
	if name == "" {
		c.JSON(http.StatusBadRequest, dto.APIResponse{
			Code:    http.StatusBadRequest,
			Message: "Sector name is required",
		})
		return
	}

	res, err := h.service.GetSectorTrend(name)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.APIResponse{
			Code:    http.StatusInternalServerError,
			Message: "Failed to fetch sector trend: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, dto.APIResponse{
		Code:    http.StatusOK,
		Message: "Success",
		Data:    res,
	})
}

// GetTopVolume returns the top 50 stocks by trading amount.
func (h *MarketAttackHandler) GetTopVolume(c *gin.Context) {
	tradeDate := c.Query("trade_date")
	data, err := h.service.GetTopVolume(tradeDate)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.APIResponse{Code: 500, Message: err.Error()})
		return
	}
	c.JSON(http.StatusOK, dto.APIResponse{
		Code:    http.StatusOK,
		Message: "Success",
		Data:    data,
	})
}

// GetLimitSummary returns top sectors by limit-up/broken/limit-down counts.
func (h *MarketAttackHandler) GetLimitSummary(c *gin.Context) {
	tradeDate := c.Query("trade_date")
	data, err := h.service.GetLimitSummary(tradeDate)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.APIResponse{Code: 500, Message: err.Error()})
		return
	}
	c.JSON(http.StatusOK, dto.APIResponse{Code: 200, Message: "OK", Data: data})
}

// GetLimitStocks returns individual stocks for a sector's limit event.
func (h *MarketAttackHandler) GetLimitStocks(c *gin.Context) {
	tradeDate := c.Query("trade_date")
	sectorName := c.Query("sector_name")
	if sectorName == "" {
		c.JSON(http.StatusBadRequest, dto.APIResponse{Code: 400, Message: "sector_name is required"})
		return
	}
	eventType := c.Query("event_type")
	data, err := h.service.GetLimitStocks(tradeDate, sectorName, eventType)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.APIResponse{Code: 500, Message: err.Error()})
		return
	}
	c.JSON(http.StatusOK, dto.APIResponse{Code: 200, Message: "OK", Data: data})
}
