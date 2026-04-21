package service

import (
	"fmt"
	"time"

	"trading-review-system/backend/internal/dto"
	"trading-review-system/backend/internal/models"
	"trading-review-system/backend/internal/repository"
)

type OrderService struct {
	repos *repository.Repositories
}

func NewOrderService(repos *repository.Repositories) *OrderService {
	return &OrderService{repos: repos}
}

func (s *OrderService) CreateOrder(tradeID uint, req dto.CreateOrderRequest) (*models.Order, error) {
	order := &models.Order{
		TradeID:     tradeID,
		OrderType:   req.OrderType,
		Price:       req.Price,
		Quantity:    req.Quantity,
		PositionPct: req.PositionPct,
		Reason:      req.Reason,
	}

	if req.OrderDate != "" {
		t, err := time.Parse("2006-01-02", req.OrderDate)
		if err != nil {
			return nil, fmt.Errorf("invalid order_date format: %w", err)
		}
		order.OrderDate = t
	} else {
		order.OrderDate = time.Now()
	}

	if err := s.repos.Order.Create(order); err != nil {
		return nil, err
	}
	s.recalculateTrade(tradeID)
	return order, nil
}
func (s *OrderService) UpdateOrder(id uint, req dto.UpdateOrderRequest) (*models.Order, error) {
	order, err := s.repos.Order.FindByID(id)
	if err != nil {
		return nil, err
	}

	if req.OrderType != nil {
		order.OrderType = *req.OrderType
	}
	if req.Price != nil {
		order.Price = *req.Price
	}
	if req.Quantity != nil {
		order.Quantity = *req.Quantity
	}
	if req.PositionPct != nil {
		order.PositionPct = *req.PositionPct
	}
	if req.OrderDate != nil {
		t, err := time.Parse("2006-01-02", *req.OrderDate)
		if err == nil {
			order.OrderDate = t
		}
	}
	if req.Reason != nil {
		order.Reason = *req.Reason
	}

	if err := s.repos.Order.Update(order); err != nil {
		return nil, err
	}
	s.recalculateTrade(order.TradeID)
	return order, nil
}

func (s *OrderService) DeleteOrder(id uint) error {
	order, err := s.repos.Order.FindByID(id)
	if err != nil {
		return err
	}
	err = s.repos.Order.Delete(id)
	if err == nil {
		s.recalculateTrade(order.TradeID)
	}
	return err
}

func (s *OrderService) recalculateTrade(tradeID uint) {
	trade, err := s.repos.Trade.FindByID(tradeID)
	if err != nil {
		return
	}
	orders, err := s.repos.Order.FindByTradeID(tradeID)
	if err != nil {
		return
	}

	var buyQty, sellQty float64
	var buyValue, sellValue float64
	var lastExitDate time.Time

	for _, o := range orders {
		if o.OrderType == "buy" {
			buyQty += o.Quantity
			buyValue += o.Quantity * o.Price
		} else if o.OrderType == "sell" {
			sellQty += o.Quantity
			sellValue += o.Quantity * o.Price
			if o.OrderDate.After(lastExitDate) {
				lastExitDate = o.OrderDate
			}
		}
	}

	// Calculate Pnl
	trade.TotalPnl = sellValue - (sellQty * (buyValue / max(buyQty, 1)))

	// Close trade if sold everything
	if sellQty > 0 && sellQty >= buyQty {
		trade.Status = "closed"
		trade.ExitDate = &lastExitDate
		if buyValue > 0 {
			trade.TotalPnlPct = (trade.TotalPnl / buyValue) * 100
		}
	} else if sellQty < buyQty {
		trade.Status = "open"
		trade.ExitDate = nil
	}
	
	s.repos.Trade.Update(trade)
}

func max(a, b float64) float64 {
	if a > b {
		return a
	}
	return b
}
