package handler

import (
	"net/http"
	"strconv"

	"trading-review-system/backend/internal/dto"
	"trading-review-system/backend/internal/service"

	"github.com/gin-gonic/gin"
)

type TradeHandler struct {
	service *service.TradeService
}

func NewTradeHandler(service *service.TradeService) *TradeHandler {
	return &TradeHandler{service: service}
}

// POST /api/trades
func (h *TradeHandler) Create(c *gin.Context) {
	var req dto.CreateTradeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.APIResponse{
			Code:    400,
			Message: "Invalid request: " + err.Error(),
		})
		return
	}

	trade, err := h.service.CreateTrade(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.APIResponse{
			Code:    500,
			Message: "Failed to create trade: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, dto.APIResponse{
		Code:    201,
		Message: "Trade created successfully",
		Data:    trade,
	})
}

// GET /api/trades
func (h *TradeHandler) List(c *gin.Context) {
	var query dto.TradeListQuery
	if err := c.ShouldBindQuery(&query); err != nil {
		c.JSON(http.StatusBadRequest, dto.APIResponse{
			Code:    400,
			Message: "Invalid query parameters: " + err.Error(),
		})
		return
	}

	result, err := h.service.ListTrades(query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.APIResponse{
			Code:    500,
			Message: "Failed to list trades: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, dto.APIResponse{
		Code:    200,
		Message: "OK",
		Data:    result,
	})
}

// GET /api/trades/:id
func (h *TradeHandler) GetByID(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.APIResponse{
			Code:    400,
			Message: "Invalid trade ID",
		})
		return
	}

	detail, err := h.service.GetTradeDetail(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, dto.APIResponse{
			Code:    404,
			Message: "Trade not found",
		})
		return
	}

	c.JSON(http.StatusOK, dto.APIResponse{
		Code:    200,
		Message: "OK",
		Data:    detail,
	})
}

// PUT /api/trades/:id
func (h *TradeHandler) Update(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.APIResponse{
			Code:    400,
			Message: "Invalid trade ID",
		})
		return
	}

	var req dto.UpdateTradeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.APIResponse{
			Code:    400,
			Message: "Invalid request: " + err.Error(),
		})
		return
	}

	trade, err := h.service.UpdateTrade(uint(id), req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.APIResponse{
			Code:    500,
			Message: "Failed to update trade: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, dto.APIResponse{
		Code:    200,
		Message: "Trade updated successfully",
		Data:    trade,
	})
}

// DELETE /api/trades/:id
func (h *TradeHandler) Delete(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.APIResponse{
			Code:    400,
			Message: "Invalid trade ID",
		})
		return
	}

	if err := h.service.DeleteTrade(uint(id)); err != nil {
		c.JSON(http.StatusInternalServerError, dto.APIResponse{
			Code:    500,
			Message: "Failed to delete trade: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, dto.APIResponse{
		Code:    200,
		Message: "Trade deleted successfully",
	})
}

// PUT /api/trades/:id/entry-decision
func (h *TradeHandler) UpsertEntryDecision(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.APIResponse{Code: 400, Message: "Invalid trade ID"})
		return
	}

	var req dto.CreateEntryDecisionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.APIResponse{Code: 400, Message: "Invalid request: " + err.Error()})
		return
	}

	if err := h.service.UpsertEntryDecision(uint(id), req); err != nil {
		c.JSON(http.StatusInternalServerError, dto.APIResponse{Code: 500, Message: "Failed to save entry decision: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.APIResponse{Code: 200, Message: "Entry decision saved"})
}

// PUT /api/trades/:id/exit-plan
func (h *TradeHandler) UpsertExitPlan(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.APIResponse{Code: 400, Message: "Invalid trade ID"})
		return
	}

	var req dto.CreateExitPlanRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.APIResponse{Code: 400, Message: "Invalid request: " + err.Error()})
		return
	}

	if err := h.service.UpsertExitPlan(uint(id), req); err != nil {
		c.JSON(http.StatusInternalServerError, dto.APIResponse{Code: 500, Message: "Failed to save exit plan: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.APIResponse{Code: 200, Message: "Exit plan saved"})
}

// PUT /api/trades/:id/tags
func (h *TradeHandler) SetTags(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.APIResponse{Code: 400, Message: "Invalid trade ID"})
		return
	}

	var req dto.SetTradeTagsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.APIResponse{Code: 400, Message: "Invalid request: " + err.Error()})
		return
	}

	if err := h.service.SetTradeTags(uint(id), req.TagIDs); err != nil {
		c.JSON(http.StatusInternalServerError, dto.APIResponse{Code: 500, Message: "Failed to set tags: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.APIResponse{Code: 200, Message: "Tags updated"})
}
