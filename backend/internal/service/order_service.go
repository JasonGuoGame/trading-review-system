package service

import (
	"fmt"
	"time"

	"trading-review-system/backend/internal/dto"
	"trading-review-system/backend/internal/models"
	"trading-review-system/backend/internal/repository"
)

type OrderService struct {
	repo *repository.OrderRepository
}

func NewOrderService(repo *repository.OrderRepository) *OrderService {
	return &OrderService{repo: repo}
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

	if err := s.repo.Create(order); err != nil {
		return nil, err
	}
	return order, nil
}

func (s *OrderService) UpdateOrder(id uint, req dto.UpdateOrderRequest) (*models.Order, error) {
	order, err := s.repo.FindByID(id)
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

	if err := s.repo.Update(order); err != nil {
		return nil, err
	}
	return order, nil
}

func (s *OrderService) DeleteOrder(id uint) error {
	return s.repo.Delete(id)
}
