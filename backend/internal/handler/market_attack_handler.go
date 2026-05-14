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
