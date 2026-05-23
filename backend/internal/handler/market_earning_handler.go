package handler

import (
	"net/http"
	"trading-review-system/backend/internal/dto"
	"trading-review-system/backend/internal/service"

	"github.com/gin-gonic/gin"
)

type MarketEarningHandler struct {
	service *service.MarketEarningService
}

func NewMarketEarningHandler(service *service.MarketEarningService) *MarketEarningHandler {
	return &MarketEarningHandler{service: service}
}

func (h *MarketEarningHandler) GetLatest(c *gin.Context) {
	data, err := h.service.GetLatest()
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
