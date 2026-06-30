package handler

import (
	"net/http"
	"strconv"
	"time"

	"trading-review-system/backend/internal/dto"
	"trading-review-system/backend/internal/models"
	"trading-review-system/backend/internal/service"

	"github.com/gin-gonic/gin"
)

type MarketBreadthHandler struct {
	service *service.MarketBreadthService
}

func NewMarketBreadthHandler(service *service.MarketBreadthService) *MarketBreadthHandler {
	return &MarketBreadthHandler{service: service}
}

// GET /api/market-breadth/:date
func (h *MarketBreadthHandler) GetByDate(c *gin.Context) {
	dateStr := c.Param("date")
	date, err := time.ParseInLocation("2006-01-02", dateStr, time.Local)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.APIResponse{Code: 400, Message: "Invalid date format, expect YYYY-MM-DD"})
		return
	}

	breadth, err := h.service.GetByDate(date)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.APIResponse{Code: 500, Message: "Failed to fetch market breadth"})
		return
	}

	if breadth == nil {
		c.JSON(http.StatusOK, dto.APIResponse{Code: 200, Message: "Success", Data: nil})
		return
	}

	c.JSON(http.StatusOK, dto.APIResponse{Code: 200, Message: "Success", Data: breadth})
}

// PUT /api/market-breadth/:date
func (h *MarketBreadthHandler) Upsert(c *gin.Context) {
	dateStr := c.Param("date")
	date, err := time.ParseInLocation("2006-01-02", dateStr, time.Local)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.APIResponse{Code: 400, Message: "Invalid date format, expect YYYY-MM-DD"})
		return
	}

	var req models.MarketBreadth
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.APIResponse{Code: 400, Message: "Invalid payload"})
		return
	}

	req.TradeDate = date

	if err := h.service.Upsert(&req); err != nil {
		c.JSON(http.StatusInternalServerError, dto.APIResponse{Code: 500, Message: "Failed to upsert market breadth: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.APIResponse{Code: 200, Message: "Market breadth saved successfully", Data: req})
}

// GetTopSectorScores returns the top N sector scores for a given date.
func (h *MarketBreadthHandler) GetTopSectorScores(c *gin.Context) {
	tradeDate := c.Query("trade_date")
	if tradeDate == "" {
		// Default to today
		tradeDate = time.Now().Format("2006-01-02")
	}
	limit := 3
	if l, err := strconv.Atoi(c.Query("limit")); err == nil && l > 0 {
		limit = l
	}
	data, err := h.service.GetTopSectorScores(tradeDate, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.APIResponse{Code: 500, Message: err.Error()})
		return
	}
	c.JSON(http.StatusOK, dto.APIResponse{Code: 200, Message: "OK", Data: data})
}
