package handler

import (
	"net/http"
	"trading-review-system/backend/internal/dto"
	"trading-review-system/backend/internal/service"

	"github.com/gin-gonic/gin"
)

type AbnormalHandler struct {
	service *service.AbnormalService
}

func NewAbnormalHandler(service *service.AbnormalService) *AbnormalHandler {
	return &AbnormalHandler{service: service}
}

func (h *AbnormalHandler) GetAbnormalCapital(c *gin.Context) {
	var query dto.AbnormalCapitalQuery
	if err := c.ShouldBindQuery(&query); err != nil {
		c.JSON(http.StatusBadRequest, dto.APIResponse{
			Code:    http.StatusBadRequest,
			Message: "Invalid query parameters",
		})
		return
	}

	res, err := h.service.GetAbnormalCapital(query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.APIResponse{
			Code:    http.StatusInternalServerError,
			Message: "Failed to fetch abnormal capital data",
		})
		return
	}

	c.JSON(http.StatusOK, dto.APIResponse{
		Code:    http.StatusOK,
		Message: "Success",
		Data:    res,
	})
}
