package handler

import (
	"log"
	"net/http"

	"trading-review-system/backend/internal/dto"
	"trading-review-system/backend/internal/service"

	"github.com/gin-gonic/gin"
)

type MarketTemperatureHandler struct {
	service *service.MarketTemperatureService
}

func NewMarketTemperatureHandler(service *service.MarketTemperatureService) *MarketTemperatureHandler {
	return &MarketTemperatureHandler{service: service}
}

// GetLatestDate returns the most recent trade_date in stk_sector_fund_flow.
func (h *MarketTemperatureHandler) GetLatestDate(c *gin.Context) {
	date, err := h.service.GetLatestTradeDate()
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.APIResponse{Code: 500, Message: err.Error()})
		return
	}
	c.JSON(http.StatusOK, dto.APIResponse{Code: 200, Message: "OK", Data: date})
}

// GetMarketTemperature returns the full market-temperature payload.
func (h *MarketTemperatureHandler) GetMarketTemperature(c *gin.Context) {
	tradeDate := c.Query("trade_date")
	data, err := h.service.GetMarketTemperature(tradeDate)
	if err != nil {
		log.Printf("[market-temperature] error: %v", err)
		c.JSON(http.StatusInternalServerError, dto.APIResponse{Code: 500, Message: err.Error()})
		return
	}
	c.JSON(http.StatusOK, dto.APIResponse{Code: 200, Message: "OK", Data: data})
}

// GetRSIExtremeStocks returns all stocks with RSI > 70 (超买) or < 30 (超卖).
func (h *MarketTemperatureHandler) GetRSIExtremeStocks(c *gin.Context) {
	tradeDate := c.Query("trade_date")
	kind := c.Query("kind")
	if kind != "overbought" && kind != "oversold" {
		c.JSON(http.StatusBadRequest, dto.APIResponse{Code: 400, Message: "kind must be 'overbought' or 'oversold'"})
		return
	}
	data, err := h.service.GetRSIExtremeStocks(tradeDate, kind)
	if err != nil {
		log.Printf("[market-temperature] rsi stocks error: %v", err)
		c.JSON(http.StatusInternalServerError, dto.APIResponse{Code: 500, Message: err.Error()})
		return
	}
	c.JSON(http.StatusOK, dto.APIResponse{Code: 200, Message: "OK", Data: data})
}

// GetSectorDrill returns a single sector's 30-day RSI drift and top-RSI stocks.
func (h *MarketTemperatureHandler) GetSectorDrill(c *gin.Context) {
	sectorName := c.Query("sector_name")
	tradeDate := c.Query("trade_date")
	if sectorName == "" {
		c.JSON(http.StatusBadRequest, dto.APIResponse{Code: 400, Message: "sector_name is required"})
		return
	}
	data, err := h.service.GetSectorDrill(sectorName, tradeDate)
	if err != nil {
		log.Printf("[market-temperature] sector drill error: %v", err)
		c.JSON(http.StatusInternalServerError, dto.APIResponse{Code: 500, Message: err.Error()})
		return
	}
	c.JSON(http.StatusOK, dto.APIResponse{Code: 200, Message: "OK", Data: data})
}
