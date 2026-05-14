package service

import (
	"sort"
	"strings"
	"trading-review-system/backend/internal/dto"
	"trading-review-system/backend/internal/repository"
)

type MarketAttackService struct {
	repo      *repository.MarketAttackRepository
	blacklist []string
}

func NewMarketAttackService(repo *repository.MarketAttackRepository, blacklist []string) *MarketAttackService {
	return &MarketAttackService{
		repo:      repo,
		blacklist: blacklist,
	}
}

func (s *MarketAttackService) shouldFilter(name string) bool {
	for _, kw := range s.blacklist {
		if strings.Contains(name, kw) {
			return true
		}
	}
	return false
}

func (s *MarketAttackService) GetTopAttacks(date string) (*dto.MarketAttackTopResponse, error) {
	if date == "" {
		var err error
		date, err = s.repo.GetLatestTradeDate()
		if err != nil {
			return nil, err
		}
	}

	logs, err := s.repo.GetAttackLogs(date)
	if err != nil {
		return nil, err
	}

	// Aggregate by sector
	sectorMap := make(map[string]*dto.MarketAttackTopItem)
	leaderMap := make(map[string]struct {
		name   string
		amount float64
	})

	for _, log := range logs {
		if s.shouldFilter(log.SectorName) {
			continue
		}
		if _, ok := sectorMap[log.SectorName]; !ok {
			score := float64(log.SectorNewCount)*40 + log.SectorNewAmount*0.6
			sectorMap[log.SectorName] = &dto.MarketAttackTopItem{
				SectorName:     log.SectorName,
				NewStockCount:  log.SectorNewCount,
				NewTotalAmount: log.SectorNewAmount,
				AttackScore:    score,
			}
		}

		// Update leader (stock with max amount today)
		if curr, ok := leaderMap[log.SectorName]; !ok || log.AmountToday > curr.amount {
			leaderMap[log.SectorName] = struct {
				name   string
				amount float64
			}{name: log.Name, amount: log.AmountToday}
		}
	}

	var topList []dto.MarketAttackTopItem
	totalNewStocksSet := make(map[string]bool)
	var maxAmount float64
	var topSector string

	for name, item := range sectorMap {
		item.LeaderStock = leaderMap[name].name
		// Trend calculation (simplified: compare with previous days if available, but for now just placeholder)
		item.Trend = "UP" 
		topList = append(topList, *item)

		if item.NewTotalAmount > maxAmount {
			maxAmount = item.NewTotalAmount
			topSector = name
		}
	}

	// Count unique stocks across all sectors
	for _, log := range logs {
		totalNewStocksSet[log.Symbol] = true
	}

	// Sort by score DESC
	sort.Slice(topList, func(i, j int) bool {
		return topList[i].AttackScore > topList[j].AttackScore
	})

	// Limit to TOP 10
	if len(topList) > 10 {
		topList = topList[:10]
	}

	summary := dto.MarketAttackSummary{
		TotalNewStocks:    len(totalNewStocksSet),
		TopAttackSector:   topSector,
		MaxAttackAmount:   maxAmount,
		ActiveSectorCount: len(sectorMap),
	}

	return &dto.MarketAttackTopResponse{
		Summary: summary,
		TopList: topList,
	}, nil
}

func (s *MarketAttackService) GetSectorDetail(date, sectorName string) (*dto.SectorAttackDetail, error) {
	if date == "" {
		var err error
		date, err = s.repo.GetLatestTradeDate()
		if err != nil {
			return nil, err
		}
	}

	logs, err := s.repo.GetSectorStocks(date, sectorName)
	if err != nil {
		return nil, err
	}

	var stocks []dto.AttackStockDetail
	for _, log := range logs {
		stocks = append(stocks, dto.AttackStockDetail{
			Symbol:          log.Symbol,
			Name:            log.Name,
			AmountYesterday: log.AmountYesterday,
			AmountToday:     log.AmountToday,
			AmountDiff:      log.AmountToday - log.AmountYesterday,
			PctChg:          log.PctChg,
		})
	}

	// Sort stocks by AmountToday DESC
	sort.Slice(stocks, func(i, j int) bool {
		return stocks[i].AmountToday > stocks[j].AmountToday
	})

	return &dto.SectorAttackDetail{
		SectorName: sectorName,
		Stocks:     stocks,
	}, nil
}

func (s *MarketAttackService) GetSectorTrend(sectorName string) (*dto.MarketAttackTrendResponse, error) {
	logs, err := s.repo.GetHistoricalSectorStats(sectorName, 20)
	if err != nil {
		return nil, err
	}

	var trend []dto.AttackTrendItem
	// Logs are already DESC by date from repo
	for i := len(logs) - 1; i >= 0; i-- {
		log := logs[i]
		score := float64(log.SectorNewCount)*40 + log.SectorNewAmount*0.6
		trend = append(trend, dto.AttackTrendItem{
			TradeDate:   log.TradeDate.Format("2006-01-02"),
			AttackScore: score,
		})
	}

	return &dto.MarketAttackTrendResponse{
		SectorName: sectorName,
		Trend:      trend,
	}, nil
}
