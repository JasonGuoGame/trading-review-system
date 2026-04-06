package handler

import (
	"net/http"
	"time"

	"trading-review-system/backend/internal/dto"
	"trading-review-system/backend/internal/models"
	"trading-review-system/backend/internal/service"

	"github.com/gin-gonic/gin"
)

type DailyReviewHandler struct {
	service *service.DailyReviewService
}

func NewDailyReviewHandler(service *service.DailyReviewService) *DailyReviewHandler {
	return &DailyReviewHandler{service: service}
}

func parseDatePathParam(c *gin.Context) (time.Time, error) {
	dateStr := c.Param("date")
	return time.ParseInLocation("2006-01-02", dateStr, time.Local)
}

// GET /api/daily-reviews/:date
func (h *DailyReviewHandler) GetByDate(c *gin.Context) {
	date, err := parseDatePathParam(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.APIResponse{Code: 400, Message: "Invalid date format, expect YYYY-MM-DD"})
		return
	}

	review, err := h.service.GetByDate(date)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.APIResponse{Code: 500, Message: "Failed to fetch review"})
		return
	}

	if review == nil {
		c.JSON(http.StatusOK, dto.APIResponse{Code: 200, Message: "Success", Data: nil})
		return
	}

	c.JSON(http.StatusOK, dto.APIResponse{Code: 200, Message: "Success", Data: review})
}

// PUT /api/daily-reviews/:date
func (h *DailyReviewHandler) Upsert(c *gin.Context) {
	date, err := parseDatePathParam(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.APIResponse{Code: 400, Message: "Invalid date format, expect YYYY-MM-DD"})
		return
	}

	var req models.DailyReview
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.APIResponse{Code: 400, Message: "Invalid payload"})
		return
	}

	req.Date = date

	if err := h.service.Upsert(&req); err != nil {
		c.JSON(http.StatusInternalServerError, dto.APIResponse{Code: 500, Message: "Failed to upsert review: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.APIResponse{Code: 200, Message: "Review saved successfully", Data: req})
}
