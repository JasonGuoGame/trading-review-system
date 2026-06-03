package handler

import (
	"net/http"
	"time"

	"trading-review-system/backend/internal/dto"
	"trading-review-system/backend/internal/models"
	"trading-review-system/backend/internal/service"

	"github.com/gin-gonic/gin"
)

type TradeChecklistHandler struct {
	service *service.TradeChecklistService
}

func NewTradeChecklistHandler(service *service.TradeChecklistService) *TradeChecklistHandler {
	return &TradeChecklistHandler{service: service}
}

// GET /api/trade-checklist/:date
func (h *TradeChecklistHandler) GetByDate(c *gin.Context) {
	dateStr := c.Param("date")
	date, err := time.ParseInLocation("2006-01-02", dateStr, time.Local)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.APIResponse{Code: 400, Message: "Invalid date format, expect YYYY-MM-DD"})
		return
	}

	checklist, err := h.service.GetByDate(date)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.APIResponse{Code: 500, Message: "Failed to fetch checklist"})
		return
	}

	c.JSON(http.StatusOK, dto.APIResponse{Code: 200, Message: "Success", Data: checklist})
}

// PUT /api/trade-checklist/:date
func (h *TradeChecklistHandler) Upsert(c *gin.Context) {
	dateStr := c.Param("date")
	date, err := time.ParseInLocation("2006-01-02", dateStr, time.Local)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.APIResponse{Code: 400, Message: "Invalid date format, expect YYYY-MM-DD"})
		return
	}

	var req models.TradeChecklist
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.APIResponse{Code: 400, Message: "Invalid payload"})
		return
	}

	req.Date = date

	if err := h.service.Upsert(&req); err != nil {
		c.JSON(http.StatusInternalServerError, dto.APIResponse{Code: 500, Message: "Failed to save checklist: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.APIResponse{Code: 200, Message: "Checklist saved", Data: req})
}
