package service

import (
	"math"
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
	type stockInfo struct {
		name   string
		pct    float64
		amount float64
	}
	leaderMap := make(map[string]stockInfo)

	for _, log := range logs {
		if s.shouldFilter(log.SectorName) {
			continue
		}
		item, ok := sectorMap[log.SectorName]
		if !ok {
			item = &dto.MarketAttackTopItem{
				SectorName:     log.SectorName,
				NewStockCount:  log.SectorNewCount,
				NewTotalAmount: log.SectorNewAmount,
			}
			sectorMap[log.SectorName] = item
		}

		// Count action types, amounts and limits
		if log.ActionType == "进攻" {
			item.AttackCount++
			item.AttackAmount += log.AmountToday
		} else if log.ActionType == "撤退" {
			item.RetreatCount++
			item.RetreatAmount += log.AmountToday
		}
		if log.PctChg > 9.5 {
			item.LimitUpCount++
		} else if log.PctChg < -9.5 {
			item.LimitDownCount++
		}

		// Update leader (stock with max amount today)
		if curr, ok := leaderMap[log.SectorName]; !ok || log.AmountToday > curr.amount {
			leaderMap[log.SectorName] = stockInfo{name: log.Name, pct: log.PctChg, amount: log.AmountToday}
		}
	}

	var topList []dto.MarketAttackTopItem
	totalNewStocksSet := make(map[string]bool)
	var maxAmount float64
	var topSector string

	for name, item := range sectorMap {
		leader := leaderMap[name]
		item.LeaderStock = leader.name
		item.LeaderPct = leader.pct
		item.LeaderIsLimitUp = leader.pct > 9.5

		// Calculate Scores based on refactored formulas
		// attack_score = 进攻票数量 * 3 + 进攻类成交额 * 0.3 + 龙头涨幅 * 2 + 涨停数量 * 5
		item.AttackScore = float64(item.AttackCount)*3 + item.AttackAmount*0.3 + item.LeaderPct*2 + float64(item.LimitUpCount)*5
		// retreat_score = 撤退票数量 * 3 + 撤退类成交额 * 0.3 + 跌停数量 * 5
		item.RetreatScore = float64(item.RetreatCount)*3 + item.RetreatAmount*0.3 + float64(item.LimitDownCount)*5 
		item.NetScore = item.AttackScore - item.RetreatScore

		if item.NewStockCount > 0 {
			item.AttackRatio = float64(item.AttackCount) / float64(item.NewStockCount)
		}

		// Trend Identification Logic
		if item.NetScore < -10 || (item.RetreatCount > item.AttackCount && item.NetScore < 0) {
			item.Trend = "退潮"
		} else if item.NetScore > 100 || item.LimitUpCount >= 3 {
			item.Trend = "高潮"
		} else if item.AttackCount > 0 && item.RetreatCount > 0 && math.Abs(item.NetScore) < 30 {
			item.Trend = "分歧"
		} else if item.AttackRatio > 0.6 && item.NetScore > 30 {
			item.Trend = "主升"
		} else {
			item.Trend = "启动"
		}

		topList = append(topList, *item)

		if item.NewTotalAmount > maxAmount {
			maxAmount = item.NewTotalAmount
			topSector = name
		}
	}

	// Count unique stocks across all sectors
	limitUpStocksMap := make(map[string]string) // name -> symbol
	for _, log := range logs {
		totalNewStocksSet[log.Symbol] = true
		if log.PctChg > 9.5 {
			limitUpStocksMap[log.Name] = log.Symbol
		}
	}

	// Prepare LeaderHierarchy (Mocking levels for now, but identifying limit ups)
	leaderHierarchy := []dto.LeaderHierarchyItem{}
	if len(limitUpStocksMap) > 0 {
		stocks := []string{}
		for name := range limitUpStocksMap {
			stocks = append(stocks, name)
		}
		// Sort stocks by name for consistency
		sort.Strings(stocks)
		leaderHierarchy = append(leaderHierarchy, dto.LeaderHierarchyItem{
			Level:  1,
			Stocks: stocks,
		})
	}

	// Sort all by NetScore DESC
	sort.Slice(topList, func(i, j int) bool {
		return topList[i].NetScore > topList[j].NetScore
	})

	var attackList []dto.MarketAttackTopItem
	var retreatList []dto.MarketAttackTopItem

	for _, item := range topList {
		if item.NetScore > 0 {
			attackList = append(attackList, item)
		} else if item.NetScore < 0 {
			retreatList = append(retreatList, item)
		}
	}

	// Sort retreatList by NetScore ASC (most negative first)
	sort.Slice(retreatList, func(i, j int) bool {
		return retreatList[i].NetScore < retreatList[j].NetScore
	})

	// Limit each to 20
	if len(attackList) > 20 {
		attackList = attackList[:20]
	}
	if len(retreatList) > 20 {
		retreatList = retreatList[:20]
	}

	summary := dto.MarketAttackSummary{
		TotalNewStocks:    len(totalNewStocksSet),
		TopAttackSector:   topSector,
		MaxAttackAmount:   maxAmount,
		ActiveSectorCount: len(sectorMap),
	}

	return &dto.MarketAttackTopResponse{
		Summary:         summary,
		AttackList:      attackList,
		RetreatList:     retreatList,
		LeaderHierarchy: leaderHierarchy,
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
	var leaderIndex int = -1
	var maxPctChg float64 = -999.0

	for i, log := range logs {
		stocks = append(stocks, dto.AttackStockDetail{
			Symbol:          log.Symbol,
			Name:            log.Name,
			AmountYesterday: log.AmountYesterday,
			AmountToday:     log.AmountToday,
			AmountDiff:      log.AmountToday - log.AmountYesterday,
			PctChg:          log.PctChg,
			ClosePos:        log.ClosePos,
			ActionType:      log.ActionType,
			IsLeader:        false,
		})

		if log.PctChg > maxPctChg {
			maxPctChg = log.PctChg
			leaderIndex = i
		}
	}

	if leaderIndex != -1 && len(stocks) > 0 {
		stocks[leaderIndex].IsLeader = true
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
