package service

import (
	"fmt"
	"log"

	"trading-review-system/backend/internal/dto"
	"trading-review-system/backend/internal/repository"
)

type SectorSentimentService struct {
	repo *repository.SectorSentimentRepository
}

func NewSectorSentimentService(repo *repository.SectorSentimentRepository) *SectorSentimentService {
	return &SectorSentimentService{repo: repo}
}

// GetLatestTradeDate returns the most recent trade_date.
func (s *SectorSentimentService) GetLatestTradeDate() (string, error) {
	return s.repo.GetLatestTradeDate()
}

// ============================================================
// 1. 连强信号
// ============================================================

func (s *SectorSentimentService) GetConsistentStrength(tradeDate string) ([]dto.ConsistentStrengthItem, error) {
	rows, err := s.repo.GetConsistentStrength(tradeDate)
	if err != nil {
		return nil, fmt.Errorf("连强信号查询失败: %w", err)
	}

	items := make([]dto.ConsistentStrengthItem, len(rows))
	for i, row := range rows {
		ranks, err := s.repo.GetSectorRecentRanks(row.SectorName, tradeDate)
		if err != nil {
			log.Printf("[sector-sentiment] GetSectorRecentRanks for %q: %v", row.SectorName, err)
			ranks = make([]*int, 5)
		}
		items[i] = dto.ConsistentStrengthItem{
			SectorName:  row.SectorName,
			StrongDays:  row.StrongDays,
			RecentRanks: ranks,
		}
	}
	return items, nil
}

// ============================================================
// 2. 新面孔信号
// ============================================================

func (s *SectorSentimentService) GetNewFaces(tradeDate string) ([]dto.NewFaceItem, error) {
	rows, err := s.repo.GetNewFaces(tradeDate)
	if err != nil {
		return nil, fmt.Errorf("新面孔信号查询失败: %w", err)
	}

	items := make([]dto.NewFaceItem, len(rows))
	for i, row := range rows {
		items[i] = dto.NewFaceItem{
			SectorName:    row.SectorName,
			TodayRank:     row.TodayRank,
			YesterdayRank: row.YesterdayRank,
			RankJump:      row.RankJump,
		}
	}
	return items, nil
}

// ============================================================
// 3. 冰点回升信号
// ============================================================

func (s *SectorSentimentService) GetIceRecovery(tradeDate string) ([]dto.IceRecoveryItem, error) {
	rows, err := s.repo.GetIceRecovery(tradeDate)
	if err != nil {
		return nil, fmt.Errorf("冰点回升信号查询失败: %w", err)
	}

	items := make([]dto.IceRecoveryItem, len(rows))
	for i, row := range rows {
		prevRates, err := s.repo.GetSectorPrev5dRates(row.SectorName, tradeDate)
		if err != nil {
			log.Printf("[sector-sentiment] GetSectorPrev5dRates for %q: %v", row.SectorName, err)
			prevRates = make([]float64, 0)
		}
		items[i] = dto.IceRecoveryItem{
			SectorName:  row.SectorName,
			RedRate:     row.RedRate,
			Prev5dMax:   row.Prev5dMax,
			Prev5dRates: prevRates,
		}
	}
	return items, nil
}

// ============================================================
// 4. 背离信号
// ============================================================

func (s *SectorSentimentService) GetDivergence(tradeDate string) (*dto.DivergenceResponse, error) {
	rows, err := s.repo.GetDivergenceTrend(tradeDate)
	if err != nil {
		return nil, fmt.Errorf("背离信号查询失败: %w", err)
	}

	medRate, err := s.repo.GetIndustryMedianRate(tradeDate)
	if err != nil {
		log.Printf("[sector-sentiment] GetIndustryMedianRate error: %v", err)
		medRate = 0
	}

	trend := make([]dto.DivergenceTrendPoint, len(rows))
	for i, row := range rows {
		var heatPct float64
		if row.TotalSectors > 0 {
			heatPct = float64(row.HotSectorsCount) / float64(row.TotalSectors) * 100
		}
		trend[i] = dto.DivergenceTrendPoint{
			TradeDate:       row.TradeDate,
			BroadAvgRate:    row.BroadAvgRate,
			IndustryAvgRate: row.IndustryAvgRate,
			IndustryMedRate: medRate,
			HotSectorsCount: row.HotSectorsCount,
			TotalSectors:    row.TotalSectors,
			MarketHeatPct:   heatPct,
		}
	}

	var latest *dto.DivergenceTrendPoint
	if len(trend) > 0 {
		latest = &trend[len(trend)-1]
	}

	warning := s.determineDivergenceWarning(trend)

	return &dto.DivergenceResponse{
		Trend:        trend,
		LatestStatus: latest,
		Warning:      warning,
	}, nil
}

func (s *SectorSentimentService) determineDivergenceWarning(trend []dto.DivergenceTrendPoint) string {
	if len(trend) == 0 {
		return "healthy"
	}
	latest := trend[len(trend)-1]

	if latest.BroadAvgRate >= 50 && latest.IndustryAvgRate < 50 {
		return "fake_prosperity"
	}
	if latest.BroadAvgRate < 50 && latest.IndustryAvgRate >= 50 {
		return "undercurrent"
	}
	if latest.BroadAvgRate >= 50 && latest.IndustryAvgRate >= 50 {
		return "healthy"
	}
	return "weak"
}

// ============================================================
// 5. 资金抱团度
// ============================================================

func (s *SectorSentimentService) GetConcentration(tradeDate string) ([]dto.ConcentrationItem, error) {
	rows, err := s.repo.GetConcentration(tradeDate)
	if err != nil {
		return nil, fmt.Errorf("资金抱团度查询失败: %w", err)
	}

	items := make([]dto.ConcentrationItem, len(rows))
	for i, row := range rows {
		items[i] = dto.ConcentrationItem{
			SectorName:  row.SectorName,
			RedRate:     row.RedRate,
			TotalStocks: row.TotalStocks,
		}
	}
	return items, nil
}

// ============================================================
// Full report
// ============================================================

func (s *SectorSentimentService) GetFullReport(tradeDate string) (*dto.SectorSentimentFullResponse, error) {
	if tradeDate == "" {
		var err error
		tradeDate, err = s.GetLatestTradeDate()
		if err != nil {
			return nil, fmt.Errorf("获取最新交易日期失败: %w", err)
		}
	}

	consistent, err := s.GetConsistentStrength(tradeDate)
	if err != nil {
		log.Printf("[sector-sentiment] consistent strength partial error: %v", err)
		consistent = []dto.ConsistentStrengthItem{}
	}

	newFaces, err := s.GetNewFaces(tradeDate)
	if err != nil {
		log.Printf("[sector-sentiment] new faces partial error: %v", err)
		newFaces = []dto.NewFaceItem{}
	}

	iceRecovery, err := s.GetIceRecovery(tradeDate)
	if err != nil {
		log.Printf("[sector-sentiment] ice recovery partial error: %v", err)
		iceRecovery = []dto.IceRecoveryItem{}
	}

	divergence, err := s.GetDivergence(tradeDate)
	if err != nil {
		log.Printf("[sector-sentiment] divergence partial error: %v", err)
		divergence = &dto.DivergenceResponse{}
	}

	concentration, err := s.GetConcentration(tradeDate)
	if err != nil {
		log.Printf("[sector-sentiment] concentration partial error: %v", err)
		concentration = []dto.ConcentrationItem{}
	}

	return &dto.SectorSentimentFullResponse{
		TradeDate:          tradeDate,
		ConsistentStrength: consistent,
		NewFaces:           newFaces,
		IceRecovery:        iceRecovery,
		Divergence:         divergence,
		Concentration:      concentration,
	}, nil
}
