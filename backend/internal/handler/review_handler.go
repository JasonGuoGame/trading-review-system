package handler

import (
	"net/http"
	"strconv"

	"trading-review-system/backend/internal/dto"
	"trading-review-system/backend/internal/service"

	"github.com/gin-gonic/gin"
)

type ReviewHandler struct {
	tradeService *service.TradeService
}

func NewReviewHandler(tradeService *service.TradeService) *ReviewHandler {
	return &ReviewHandler{tradeService: tradeService}
}

// PUT /api/trades/:id/review
func (h *ReviewHandler) Upsert(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.APIResponse{Code: 400, Message: "Invalid trade ID"})
		return
	}

	var req dto.UpsertReviewRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.APIResponse{Code: 400, Message: "Invalid request: " + err.Error()})
		return
	}

	if err := h.tradeService.UpsertReview(uint(id), req); err != nil {
		c.JSON(http.StatusInternalServerError, dto.APIResponse{Code: 500, Message: "Failed to save review: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.APIResponse{Code: 200, Message: "Review saved"})
}
