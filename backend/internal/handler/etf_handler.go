package handler

import (
	"log"
	"net/http"
	"strconv"

	"trading-review-system/backend/internal/dto"
	"trading-review-system/backend/internal/service"

	"github.com/gin-gonic/gin"
)

type EtfHandler struct {
	service *service.EtfService
}

func NewEtfHandler(service *service.EtfService) *EtfHandler {
	return &EtfHandler{service: service}
}

func queryInt(c *gin.Context, key string, def int) int {
	v := c.Query(key)
	if v == "" {
		return def
	}
	n, err := strconv.Atoi(v)
	if err != nil {
		return def
	}
	return n
}

// GetMeta returns filter options plus the latest trade date.
func (h *EtfHandler) GetMeta(c *gin.Context) {
	data, err := h.service.GetMeta()
	if err != nil {
		log.Printf("[etf] meta error: %v", err)
		c.JSON(http.StatusInternalServerError, dto.APIResponse{Code: 500, Message: err.Error()})
		return
	}
	c.JSON(http.StatusOK, dto.APIResponse{Code: 200, Message: "OK", Data: data})
}

// GetOverview returns the 市场总览 payload.
func (h *EtfHandler) GetOverview(c *gin.Context) {
	data, err := h.service.GetOverview(c.Query("trade_date"))
	if err != nil {
		log.Printf("[etf] overview error: %v", err)
		c.JSON(http.StatusInternalServerError, dto.APIResponse{Code: 500, Message: err.Error()})
		return
	}
	c.JSON(http.StatusOK, dto.APIResponse{Code: 200, Message: "OK", Data: data})
}

// GetBroadTrend returns the 宽基趋势 payload.
func (h *EtfHandler) GetBroadTrend(c *gin.Context) {
	data, err := h.service.GetBroadTrend(c.Query("trade_date"))
	if err != nil {
		log.Printf("[etf] broad-trend error: %v", err)
		c.JSON(http.StatusInternalServerError, dto.APIResponse{Code: 500, Message: err.Error()})
		return
	}
	c.JSON(http.StatusOK, dto.APIResponse{Code: 200, Message: "OK", Data: data})
}

// GetIndustries returns the 行业主题 payload.
func (h *EtfHandler) GetIndustries(c *gin.Context) {
	data, err := h.service.GetIndustries(c.Query("trade_date"))
	if err != nil {
		log.Printf("[etf] industries error: %v", err)
		c.JSON(http.StatusInternalServerError, dto.APIResponse{Code: 500, Message: err.Error()})
		return
	}
	c.JSON(http.StatusOK, dto.APIResponse{Code: 200, Message: "OK", Data: data})
}

// GetIndustryEtfs lists one industry's constituent ETFs.
func (h *EtfHandler) GetIndustryEtfs(c *gin.Context) {
	industryName := c.Query("industry_name")
	if industryName == "" {
		c.JSON(http.StatusBadRequest, dto.APIResponse{Code: 400, Message: "industry_name is required"})
		return
	}
	data, err := h.service.GetIndustryEtfs(industryName, c.Query("trade_date"))
	if err != nil {
		log.Printf("[etf] industry-etfs error: %v", err)
		c.JSON(http.StatusInternalServerError, dto.APIResponse{Code: 500, Message: err.Error()})
		return
	}
	c.JSON(http.StatusOK, dto.APIResponse{Code: 200, Message: "OK", Data: data})
}

// GetRotation returns the 行业轮动 payload.
func (h *EtfHandler) GetRotation(c *gin.Context) {
	data, err := h.service.GetRotation(c.Query("trade_date"))
	if err != nil {
		log.Printf("[etf] rotation error: %v", err)
		c.JSON(http.StatusInternalServerError, dto.APIResponse{Code: 500, Message: err.Error()})
		return
	}
	c.JSON(http.StatusOK, dto.APIResponse{Code: 200, Message: "OK", Data: data})
}

// GetRanking returns the ETF 排行 payload.
func (h *EtfHandler) GetRanking(c *gin.Context) {
	data, err := h.service.GetRanking(
		c.Query("trade_date"),
		c.Query("etf_type"),
		c.Query("etf_sub_type"),
		c.Query("industry_name"),
		c.DefaultQuery("sort_by", "today_return"),
		c.DefaultQuery("order", "desc"),
		queryInt(c, "page", 1),
		queryInt(c, "page_size", 50),
	)
	if err != nil {
		log.Printf("[etf] ranking error: %v", err)
		c.JSON(http.StatusInternalServerError, dto.APIResponse{Code: 500, Message: err.Error()})
		return
	}
	c.JSON(http.StatusOK, dto.APIResponse{Code: 200, Message: "OK", Data: data})
}

// GetDetail returns the ETF 详情 payload.
func (h *EtfHandler) GetDetail(c *gin.Context) {
	symbol := c.Query("symbol")
	if symbol == "" {
		c.JSON(http.StatusBadRequest, dto.APIResponse{Code: 400, Message: "symbol is required"})
		return
	}
	data, err := h.service.GetDetail(symbol, c.Query("trade_date"))
	if err != nil {
		log.Printf("[etf] detail error: %v", err)
		c.JSON(http.StatusInternalServerError, dto.APIResponse{Code: 500, Message: err.Error()})
		return
	}
	c.JSON(http.StatusOK, dto.APIResponse{Code: 200, Message: "OK", Data: data})
}
