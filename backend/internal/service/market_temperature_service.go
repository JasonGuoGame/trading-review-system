package service

import (
	"sort"

	"trading-review-system/backend/internal/dto"
	"trading-review-system/backend/internal/repository"
)

type MarketTemperatureService struct {
	repo *repository.MarketTemperatureRepository
}

func NewMarketTemperatureService(repo *repository.MarketTemperatureRepository) *MarketTemperatureService {
	return &MarketTemperatureService{repo: repo}
}

func (s *MarketTemperatureService) GetLatestTradeDate() (string, error) {
	return s.repo.GetLatestTradeDate()
}

// rsiStatus maps an average RSI to a Chinese temperature label.
func rsiStatus(avg float64) string {
	switch {
	case avg >= 70:
		return "🔥 极热"
	case avg >= 60:
		return "🟠 强势"
	case avg >= 50:
		return "🟢 偏暖"
	case avg >= 40:
		return "⚪ 中性"
	case avg >= 30:
		return "🔵 偏冷"
	default:
		return "❄ 极冷"
	}
}

// rsiDist holds the 4-bucket RSI distribution (each a percentage 0-100).
type rsiDist struct {
	lt30   float64 // RSI < 30
	b30to50 float64 // 30 <= RSI <= 50
	b50to70 float64 // 50 <  RSI <= 70
	gt70   float64 // RSI > 70
}

func computeDistribution(values []float64) rsiDist {
	n := len(values)
	if n == 0 {
		return rsiDist{}
	}
	var lt30, b3050, b5070, gt70 int
	for _, v := range values {
		switch {
		case v < 30:
			lt30++
		case v <= 50:
			b3050++
		case v <= 70:
			b5070++
		default:
			gt70++
		}
	}
	f := float64(n)
	return rsiDist{
		lt30:    float64(lt30) / f * 100,
		b30to50: float64(b3050) / f * 100,
		b50to70: float64(b5070) / f * 100,
		gt70:    float64(gt70) / f * 100,
	}
}

func avgRSI(values []float64) float64 {
	if len(values) == 0 {
		return 0
	}
	var sum float64
	for _, v := range values {
		sum += v
	}
	return sum / float64(len(values))
}

func medianRSI(values []float64) float64 {
	if len(values) == 0 {
		return 0
	}
	sorted := make([]float64, len(values))
	copy(sorted, values)
	sort.Float64s(sorted)
	n := len(sorted)
	if n%2 == 1 {
		return sorted[n/2]
	}
	return (sorted[n/2-1] + sorted[n/2]) / 2
}

func valuesFromMap(m map[string]float64) []float64 {
	out := make([]float64, 0, len(m))
	for _, v := range m {
		out = append(out, v)
	}
	return out
}

// GetMarketTemperature builds the full market-temperature payload for a trade
// date (defaults to the latest fund-flow date when empty).
func (s *MarketTemperatureService) GetMarketTemperature(tradeDate string) (*dto.MarketTemperatureResponse, error) {
	if tradeDate == "" {
		latest, err := s.repo.GetLatestTradeDate()
		if err != nil {
			return nil, err
		}
		tradeDate = latest
	}
	if len(tradeDate) > 10 {
		tradeDate = tradeDate[:10]
	}

	// 1. Sector names from fund flow.
	sectorNames, err := s.repo.GetFundFlowSectors(tradeDate)
	if err != nil {
		return nil, err
	}

	// 2. Stock→sector memberships, fuzzy-matched to fund-flow sector names via
	// coreSectorName (strips GN/SW2/概念-/行业- prefixes and 加权 suffix).
	relations, err := s.repo.GetStockSectorRelations()
	if err != nil {
		return nil, err
	}
	coreSet := make(map[string]bool, len(sectorNames))
	for _, n := range sectorNames {
		coreSet[n] = true
	}
	coreToSymbols := make(map[string]map[string]bool)
	for _, rel := range relations {
		core := coreSectorName(rel.SectorName)
		if !coreSet[core] {
			continue
		}
		m, ok := coreToSymbols[core]
		if !ok {
			m = make(map[string]bool)
			coreToSymbols[core] = m
		}
		m[rel.Symbol] = true
	}

	// 3. RSI for today and the previous trading day.
	todayRSI, err := s.repo.GetRSIByDate(tradeDate)
	if err != nil {
		return nil, err
	}
	prevDate, err := s.repo.GetPreviousTradeDate(tradeDate)
	if err != nil {
		return nil, err
	}
	var prevRSI map[string]float64
	if prevDate != "" {
		prevRSI, err = s.repo.GetRSIByDate(prevDate)
		if err != nil {
			return nil, err
		}
	}

	// 4. Market-wide summary.
	allValues := valuesFromMap(todayRSI)
	dist := computeDistribution(allValues)
	marketAvg := avgRSI(allValues)
	market := dto.MarketTemperatureSummary{
		AvgRSI:       marketAvg,
		MedianRSI:    medianRSI(allValues),
		RsiGt70Pct:   dist.gt70,
		RsiGt50Pct:   dist.b50to70 + dist.gt70,
		RsiLt30Pct:   dist.lt30,
		Rsi30To50Pct: dist.b30to50,
		Distribution: []dto.RSIDistribution{
			{Label: "<30", Pct: dist.lt30},
			{Label: "30-50", Pct: dist.b30to50},
			{Label: "50-70", Pct: dist.b50to70},
			{Label: "70-100", Pct: dist.gt70},
		},
		Status: rsiStatus(marketAvg),
	}
	if len(prevRSI) > 0 {
		prevDist := computeDistribution(valuesFromMap(prevRSI))
		market.PrevGt50Pct = prevDist.b50to70 + prevDist.gt70
		market.DiffusionPct = market.RsiGt50Pct - market.PrevGt50Pct
	}

	// 5. Market trend over the last 20 trading days (avg + median).
	dates, err := s.repo.GetRecentTradeDates(20)
	if err != nil {
		return nil, err
	}
	trendValues, err := s.repo.GetRSIValuesForDates(dates)
	if err != nil {
		return nil, err
	}
	trend := make([]dto.MarketTemperatureTrend, 0, len(dates))
	for _, d := range dates {
		vals := trendValues[d]
		if len(vals) == 0 {
			continue
		}
		trend = append(trend, dto.MarketTemperatureTrend{
			TradeDate:  d,
			AvgRSI:     avgRSI(vals),
			MedianRSI:  medianRSI(vals),
		})
	}

	// 6. Per-sector aggregation.
	sectors := make([]dto.SectorTemperature, 0, len(sectorNames))
	for _, name := range sectorNames {
		symbols := coreToSymbols[name]
		secValues := make([]float64, 0, len(symbols))
		for sym := range symbols {
			if rsi, ok := todayRSI[sym]; ok {
				secValues = append(secValues, rsi)
			}
		}
		if len(secValues) == 0 {
			continue
		}
		secDist := computeDistribution(secValues)
		secAvg := avgRSI(secValues)
		delta := 0.0
		if len(prevRSI) > 0 {
			prevValues := make([]float64, 0, len(symbols))
			for sym := range symbols {
				if rsi, ok := prevRSI[sym]; ok {
					prevValues = append(prevValues, rsi)
				}
			}
			if len(prevValues) > 0 {
				delta = secAvg - avgRSI(prevValues)
			}
		}
		sectors = append(sectors, dto.SectorTemperature{
			SectorName: name,
			AvgRSI:     secAvg,
			MedianRSI:  medianRSI(secValues),
			RsiGt70Pct: secDist.gt70,
			RsiGt50Pct: secDist.b50to70 + secDist.gt70,
			RsiLt30Pct: secDist.lt30,
			StockCount: len(secValues),
			DeltaRSI:   delta,
			Status:     rsiStatus(secAvg),
		})
	}
	sort.Slice(sectors, func(i, j int) bool {
		return sectors[i].AvgRSI > sectors[j].AvgRSI
	})

	// 7. Whole-market RSI radar (5 bands).
	radar := dto.RSIRadar{}
	for _, v := range allValues {
		switch {
		case v >= 80:
			radar.SuperStrong++
		case v >= 70:
			radar.Strong++
		case v >= 40:
			radar.Normal++
		case v >= 30:
			radar.Weak++
		default:
			radar.SuperWeak++
		}
	}

	return &dto.MarketTemperatureResponse{
		TradeDate: tradeDate,
		Market:    market,
		Trend:     trend,
		Sectors:   sectors,
		Radar:     radar,
	}, nil
}

// GetRSIExtremeStocks returns all stocks with RSI above 70 (kind="overbought")
// or below 30 (kind="oversold") on the trade date, sorted by extremeness
// (descending for overbought, ascending for oversold).
func (s *MarketTemperatureService) GetRSIExtremeStocks(tradeDate, kind string) (*dto.RSIExtremeStocksResponse, error) {
	if tradeDate == "" {
		latest, err := s.repo.GetLatestTradeDate()
		if err != nil {
			return nil, err
		}
		tradeDate = latest
	}
	if len(tradeDate) > 10 {
		tradeDate = tradeDate[:10]
	}

	rsiMap, err := s.repo.GetRSIByDate(tradeDate)
	if err != nil {
		return nil, err
	}

	type symRSI struct {
		symbol string
		rsi    float64
	}
	matches := make([]symRSI, 0, len(rsiMap))
	for sym, rsi := range rsiMap {
		if kind == "overbought" && rsi > 70 {
			matches = append(matches, symRSI{sym, rsi})
		} else if kind == "oversold" && rsi < 30 {
			matches = append(matches, symRSI{sym, rsi})
		}
	}
	if kind == "overbought" {
		sort.Slice(matches, func(i, j int) bool { return matches[i].rsi > matches[j].rsi })
	} else {
		sort.Slice(matches, func(i, j int) bool { return matches[i].rsi < matches[j].rsi })
	}

	symbols := make([]string, len(matches))
	for i, m := range matches {
		symbols[i] = m.symbol
	}
	names, err := s.repo.GetStockNames(symbols)
	if err != nil {
		return nil, err
	}

	stocks := make([]dto.RSIExtremeStock, 0, len(matches))
	for _, m := range matches {
		name := names[m.symbol]
		if name == "" {
			name = m.symbol
		}
		stocks = append(stocks, dto.RSIExtremeStock{Symbol: m.symbol, Name: name, RSI: m.rsi})
	}

	return &dto.RSIExtremeStocksResponse{TradeDate: tradeDate, Kind: kind, Stocks: stocks}, nil
}

// GetSectorDrill returns a single sector's 30-day RSI drift and its top-RSI
// member stocks. sectorName is the fund-flow sector name (as shown on the page);
// member symbols are resolved by fuzzy-matching stock_sector_relation via
// coreSectorName, exactly as in GetMarketTemperature.
func (s *MarketTemperatureService) GetSectorDrill(sectorName, tradeDate string) (*dto.SectorDrillResponse, error) {
	if tradeDate == "" {
		latest, err := s.repo.GetLatestTradeDate()
		if err != nil {
			return nil, err
		}
		tradeDate = latest
	}
	if len(tradeDate) > 10 {
		tradeDate = tradeDate[:10]
	}

	// 1. Member symbols.
	relations, err := s.repo.GetStockSectorRelations()
	if err != nil {
		return nil, err
	}
	target := coreSectorName(sectorName)
	memberSet := make(map[string]bool)
	for _, rel := range relations {
		if coreSectorName(rel.SectorName) == target {
			memberSet[rel.Symbol] = true
		}
	}

	// 2. Last 30 trading days up to (and including) the selected date.
	dates, err := s.repo.GetRecentTradeDatesUpTo(tradeDate, 30)
	if err != nil {
		return nil, err
	}
	empty := &dto.SectorDrillResponse{
		SectorName: sectorName,
		TradeDate:  tradeDate,
		Trend:      []dto.SectorRSITrend{},
		TopStocks:  []dto.SectorTopStock{},
	}
	if len(dates) == 0 {
		return empty, nil
	}

	series, err := s.repo.GetSectorRSISeries(dates)
	if err != nil {
		return nil, err
	}

	// 3. 30-day drift: per-day avg + median RSI of the sector's members.
	trend := make([]dto.SectorRSITrend, 0, len(dates))
	for _, d := range dates {
		dayMap := series[d]
		vals := make([]float64, 0, len(memberSet))
		for sym := range memberSet {
			if rsi, ok := dayMap[sym]; ok {
				vals = append(vals, rsi)
			}
		}
		if len(vals) == 0 {
			continue
		}
		trend = append(trend, dto.SectorRSITrend{
			TradeDate: d,
			AvgRSI:    avgRSI(vals),
			MedianRSI: medianRSI(vals),
		})
	}

	// 4. Top-RSI stocks: rank members by their latest-day RSI, tracking the
	// 30-day peak alongside.
	latestDate := dates[len(dates)-1]
	type stockRSI struct {
		symbol string
		rsi    float64
		peak   float64
	}
	ranked := make([]stockRSI, 0, len(memberSet))
	for sym := range memberSet {
		latest, ok := series[latestDate][sym]
		if !ok {
			continue
		}
		peak := latest
		for _, d := range dates {
			if rsi, ok := series[d][sym]; ok && rsi > peak {
				peak = rsi
			}
		}
		ranked = append(ranked, stockRSI{symbol: sym, rsi: latest, peak: peak})
	}
	sort.Slice(ranked, func(i, j int) bool { return ranked[i].rsi > ranked[j].rsi })
	if len(ranked) > 5 {
		ranked = ranked[:5]
	}

	topSymbols := make([]string, len(ranked))
	for i, r := range ranked {
		topSymbols[i] = r.symbol
	}
	names, err := s.repo.GetStockNames(topSymbols)
	if err != nil {
		return nil, err
	}

	topStocks := make([]dto.SectorTopStock, 0, len(ranked))
	for _, r := range ranked {
		name := names[r.symbol]
		if name == "" {
			name = r.symbol
		}
		topStocks = append(topStocks, dto.SectorTopStock{
			Symbol:  r.symbol,
			Name:    name,
			RSI:     r.rsi,
			PeakRSI: r.peak,
		})
	}

	return &dto.SectorDrillResponse{
		SectorName: sectorName,
		TradeDate:  tradeDate,
		Trend:      trend,
		TopStocks:  topStocks,
	}, nil
}
