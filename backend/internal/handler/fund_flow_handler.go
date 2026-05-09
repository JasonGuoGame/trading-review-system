package handler

import (
	"net/http"

	"trading-review-system/backend/internal/dto"
	"trading-review-system/backend/internal/service"

	"github.com/gin-gonic/gin"
)

type FundFlowHandler struct {
	service *service.FundFlowService
}

func NewFundFlowHandler(service *service.FundFlowService) *FundFlowHandler {
	return &FundFlowHandler{service: service}
}

func (h *FundFlowHandler) GetFundFlow(c *gin.Context) {
	var query dto.FundFlowQuery
	if err := c.ShouldBindQuery(&query); err != nil {
		c.JSON(http.StatusBadRequest, dto.APIResponse{
			Code:    http.StatusBadRequest,
			Message: "Invalid query parameters",
		})
		return
	}

	res, err := h.service.GetFundFlowData(query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.APIResponse{
			Code:    http.StatusInternalServerError,
			Message: "Failed to fetch fund flow data",
		})
		return
	}

	c.JSON(http.StatusOK, dto.APIResponse{
		Code:    http.StatusOK,
		Message: "Success",
		Data:    res,
	})
}

func (h *FundFlowHandler) GetFundFlowTrend(c *gin.Context) {
	sector := c.Query("sector")
	endDate := c.Query("end_date")

	if sector == "" {
		c.JSON(http.StatusBadRequest, dto.APIResponse{
			Code:    http.StatusBadRequest,
			Message: "Sector parameter is required",
		})
		return
	}

	res, err := h.service.GetSectorTrendDetail(sector, endDate)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.APIResponse{
			Code:    http.StatusInternalServerError,
			Message: "Failed to fetch sector trend detail",
		})
		return
	}

	c.JSON(http.StatusOK, dto.APIResponse{
		Code:    http.StatusOK,
		Message: "Success",
		Data:    res,
	})
}
