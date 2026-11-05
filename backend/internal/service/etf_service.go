package service

import (
	"fmt"
	"sort"
	"strings"

	"trading-review-system/backend/internal/dto"
	"trading-review-system/backend/internal/models"
	"trading-review-system/backend/internal/repository"
)

// EtfService builds the ETF 全景驾驶舱 payloads. All aggregation endpoints share
// one load of the last 65 trading days of klines and compute metrics in Go.
type EtfService struct {
	repo *repository.EtfRepository
}

func NewEtfService(repo *repository.EtfRepository) *EtfService {
	return &EtfService{repo: repo}
}

// etfWindow is the shared, load-once data used by every aggregation endpoint.
type etfWindow struct {
	latest      string
	dates       []string // ascending distinct trade dates (oldest first)
	info        map[string]models.EtfInfo
	infoAll     []models.EtfInfo // ordered by symbol (deterministic fallbacks)
	closes      map[string][]float64
	highs       map[string][]float64
	amount      map[string]float64            // symbol -> latest-bar amount in window
	closeByDate map[string]map[string]float64 // date -> symbol -> close
	dailyRet    map[string]map[string]float64 // symbol -> date -> daily return %
}

func (s *EtfService) loadWindow(tradeDate string) (*etfWindow, error) {
	latest := tradeDate
	if latest == "" {
		l, err := s.repo.GetLatestTradeDate()
		if err != nil {
			return nil, err
		}
		latest = l
	} else if len(latest) > 10 {
		latest = latest[:10]
	}

	dates, err := s.repo.GetRecentTradeDates(latest, 65)
	if err != nil {
		return nil, err
	}
	infos, err := s.repo.GetAllEtfInfo()
	if err != nil {
		return nil, err
	}
	kmap, err := s.repo.GetKlineWindow(dates)
	if err != nil {
		return nil, err
	}

	w := &etfWindow{
		latest:      latest,
		dates:       dates,
		info:        make(map[string]models.EtfInfo, len(infos)),
		infoAll:     infos,
		closes:      make(map[string][]float64),
		highs:       make(map[string][]float64),
		amount:      make(map[string]float64),
		closeByDate: make(map[string]map[string]float64),
		dailyRet:    make(map[string]map[string]float64),
	}
	for _, inf := range infos {
		w.info[inf.Symbol] = inf
	}
	for sym, rows := range kmap {
		prevClose := 0.0
		prevSet := false
		for _, r := range rows {
			w.closes[sym] = append(w.closes[sym], r.Close)
			w.highs[sym] = append(w.highs[sym], r.High)
			w.amount[sym] = r.Amount

			m, ok := w.closeByDate[r.TradeDate]
			if !ok {
				m = make(map[string]float64)
				w.closeByDate[r.TradeDate] = m
			}
			m[sym] = r.Close

			if prevSet && prevClose > 0 {
				dm, ok := w.dailyRet[sym]
				if !ok {
					dm = make(map[string]float64)
					w.dailyRet[sym] = dm
				}
				dm[r.TradeDate] = (r.Close/prevClose - 1) * 100
			}
			prevClose = r.Close
			prevSet = true
		}
	}
	return w, nil
}

// GetMeta returns filter options and the latest trade date.
func (s *EtfService) GetMeta() (*dto.EtfMetaResponse, error) {
	types, subTypes, industries, err := s.repo.GetMeta()
	if err != nil {
		return nil, err
	}
	latest, err := s.repo.GetLatestTradeDate()
	if err != nil {
		return nil, err
	}
	return &dto.EtfMetaResponse{
		LatestTradeDate: latest,
		EtfTypes:        types,
		EtfSubTypes:     subTypes,
		IndustryNames:   industries,
	}, nil
}

// GetOverview builds the 市场总览 payload.
func (s *EtfService) GetOverview(tradeDate string) (*dto.EtfOverviewResponse, error) {
	w, err := s.loadWindow(tradeDate)
	if err != nil {
		return nil, err
	}
	resp := &dto.EtfOverviewResponse{TradeDate: w.latest, TotalEtfs: len(w.infoAll)}

	up, flat, down := 0, 0, 0
	ma20Above, ma20Eligible := 0, 0
	ma60Above, ma60Eligible := 0, 0
	buckets := []dto.EtfTypeDist{
		{EtfType: "STOCK", Label: "股票"},
		{EtfType: "CROSS_BORDER", Label: "跨境"},
		{EtfType: "COMMODITY", Label: "商品"},
		{EtfType: "BOND_MONEY", Label: "债券/货币"},
		{EtfType: "OTHER", Label: "其他"},
	}
	bucketIdx := func(t string) int {
		switch t {
		case "STOCK":
			return 0
		case "CROSS_BORDER":
			return 1
		case "COMMODITY":
			return 2
		case "BOND", "MONEY":
			return 3
		default:
			return 4
		}
	}

	var strongestBroad, strongestIndustry, weakestIndustry, maxAmount *dto.EtfBrief
	for _, inf := range w.infoAll {
		sym := inf.Symbol
		closes := w.closes[sym]
		buckets[bucketIdx(inf.EtfType)].Count++

		hasToday := len(closes) >= 2
		today := ReturnN(closes, 1)
		if hasToday {
			switch {
			case today > 0:
				up++
			case today < 0:
				down++
			default:
				flat++
			}
		}
		if len(closes) >= 20 {
			ma20Eligible++
			if AboveMA(closes, 20) {
				ma20Above++
			}
		}
		if len(closes) >= 60 {
			ma60Eligible++
			if AboveMA(closes, 60) {
				ma60Above++
			}
		}

		if amt := w.amount[sym]; amt > 0 && (maxAmount == nil || amt > maxAmount.Amount) {
			maxAmount = s.brief(w, sym)
		}
		if !hasToday {
			continue
		}
		b := s.brief(w, sym)
		if inf.EtfSubType == "BROAD_INDEX" && (strongestBroad == nil || today > strongestBroad.TodayReturn) {
			strongestBroad = b
		}
		if inf.EtfType == "STOCK" && inf.IndustryName != "" {
			if strongestIndustry == nil || today > strongestIndustry.TodayReturn {
				strongestIndustry = b
			}
			if weakestIndustry == nil || today < weakestIndustry.TodayReturn {
				weakestIndustry = b
			}
		}
	}

	resp.TodayUpCount, resp.TodayFlatCount, resp.TodayDownCount = up, flat, down
	if up+flat+down > 0 {
		resp.TodayUpRatio = float64(up) / float64(up+flat+down) * 100
	}
	resp.Ma20AboveCount, resp.Ma20Eligible = ma20Above, ma20Eligible
	if ma20Eligible > 0 {
		resp.Ma20AboveRatio = float64(ma20Above) / float64(ma20Eligible) * 100
	}
	resp.Ma60AboveCount, resp.Ma60Eligible = ma60Above, ma60Eligible
	if ma60Eligible > 0 {
		resp.Ma60AboveRatio = float64(ma60Above) / float64(ma60Eligible) * 100
	}
	resp.TypeDistribution = buckets
	resp.Strength = dto.EtfStrength{Up: up, Flat: flat, Down: down}
	resp.Observations = dto.EtfObservations{
		StrongestBroad:    strongestBroad,
		StrongestIndustry: strongestIndustry,
		WeakestIndustry:   weakestIndustry,
		MaxAmount:         maxAmount,
	}
	return resp, nil
}

// brief builds a minimal EtfBrief for a symbol from the shared window.
func (s *EtfService) brief(w *etfWindow, symbol string) *dto.EtfBrief {
	inf := w.info[symbol]
	return &dto.EtfBrief{
		Symbol:       symbol,
		Name:         inf.Name,
		TodayReturn:  ReturnN(w.closes[symbol], 1),
		Ret5d:        ReturnN(w.closes[symbol], 5),
		Amount:       w.amount[symbol],
		EtfType:      inf.EtfType,
		IndustryName: inf.IndustryName,
	}
}

// broadDef identifies one of the 8 fixed broad-base representatives.
type broadDef struct {
	key, sub, pref, fallback string
}

var broadDefs = []broadDef{
	{"上证50", "上证50", "510050", ""},
	{"沪深300", "沪深300", "510300", ""},
	{"中证500", "中证500", "510500", ""},
	{"中证1000", "中证1000", "512100", ""},
	{"中证2000", "中证2000", "563300", ""},
	{"创业板", "创业板", "159915", ""},
	{"科创50", "科创50", "588000", ""},
	{"中证A500", "中证A500", "159338", "512050"},
}

// GetBroadTrend builds the 宽基趋势 payload.
func (s *EtfService) GetBroadTrend(tradeDate string) (*dto.EtfBroadTrendResponse, error) {
	w, err := s.loadWindow(tradeDate)
	if err != nil {
		return nil, err
	}

	type item struct {
		key    string
		symbol string
	}
	used := map[string]bool{}
	var items []item
	for _, def := range broadDefs {
		sym := ""
		if _, ok := w.info[def.pref]; ok {
			sym = def.pref
		} else if def.fallback != "" {
			if _, ok := w.info[def.fallback]; ok {
				sym = def.fallback
			}
		}
		if sym == "" {
			for _, inf := range w.infoAll {
				if used[inf.Symbol] {
					continue
				}
				if strings.Contains(inf.Name, def.sub) {
					sym = inf.Symbol
					break
				}
			}
		}
		if sym == "" {
			continue
		}
		used[sym] = true
		items = append(items, item{key: def.key, symbol: sym})
	}

	resp := &dto.EtfBroadTrendResponse{TradeDate: w.latest}
	ret5 := map[string]float64{}
	for _, it := range items {
		closes := w.closes[it.symbol]
		resp.Etfs = append(resp.Etfs, dto.EtfBroadItem{
			Symbol:      it.symbol,
			Name:        w.info[it.symbol].Name,
			TodayReturn: ReturnN(closes, 1),
			Ret5d:       ReturnN(closes, 5),
			Ret20d:      ReturnN(closes, 20),
		})
		ret5[it.key] = ReturnN(closes, 5)
	}
	sort.Slice(resp.Etfs, func(i, j int) bool {
		return resp.Etfs[i].TodayReturn > resp.Etfs[j].TodayReturn
	})

	trendDates := w.dates
	if len(trendDates) > 30 {
		trendDates = trendDates[len(trendDates)-30:]
	}
	resp.TrendDates = trendDates
	for _, it := range items {
		resp.Trend = append(resp.Trend, dto.EtfTrendSeries{
			Symbol: it.symbol,
			Name:   w.info[it.symbol].Name,
			Values: w.rebaseSeries(it.symbol, trendDates),
		})
	}

	resp.Spreads = dto.EtfSpreads{
		SizeStyle:   ret5["中证1000"] - ret5["沪深300"],
		GrowthValue: ret5["创业板"] - ret5["上证50"],
	}
	return resp, nil
}

// rebaseSeries rebases a symbol's close over the given dates to 100 at its first
// available close, forward-filling gaps.
func (w *etfWindow) rebaseSeries(sym string, dates []string) []float64 {
	vals := make([]float64, len(dates))
	base := 0.0
	last := 0.0
	for i, d := range dates {
		c, ok := w.closeByDate[d][sym]
		if !ok {
			if last != 0 {
				vals[i] = last
			}
			continue
		}
		if base == 0 {
			base = c
		}
		last = c / base * 100
		vals[i] = last
	}
	return vals
}

// groupIndustries returns non-empty industries with their member symbols.
func (w *etfWindow) groupIndustries() []industryAgg {
	members := map[string][]string{}
	for _, inf := range w.infoAll {
		if inf.IndustryName == "" {
			continue
		}
		members[inf.IndustryName] = append(members[inf.IndustryName], inf.Symbol)
	}
	names := make([]string, 0, len(members))
	for name := range members {
		names = append(names, name)
	}
	sort.Strings(names)
	out := make([]industryAgg, 0, len(names))
	for _, name := range names {
		out = append(out, industryAgg{name: name, members: members[name]})
	}
	return out
}

type industryAgg struct {
	name    string
	members []string
}

// GetIndustries builds the 行业主题 payload.
func (s *EtfService) GetIndustries(tradeDate string) (*dto.EtfIndustriesResponse, error) {
	w, err := s.loadWindow(tradeDate)
	if err != nil {
		return nil, err
	}
	resp := &dto.EtfIndustriesResponse{TradeDate: w.latest}
	for _, ind := range w.groupIndustries() {
		resp.Industries = append(resp.Industries, s.buildIndustry(w, ind))
	}
	sort.Slice(resp.Industries, func(i, j int) bool {
		return resp.Industries[i].TodayMedian > resp.Industries[j].TodayMedian
	})
	return resp, nil
}

// buildIndustry aggregates one industry's member ETFs.
func (s *EtfService) buildIndustry(w *etfWindow, ind industryAgg) dto.EtfIndustry {
	out := dto.EtfIndustry{IndustryName: ind.name, EtfCount: len(ind.members)}

	var todays, ret5s, ret20s []float64
	upCount, withData := 0, 0
	ma20Above, ma20Eligible := 0, 0
	totalAmount := 0.0
	for _, sym := range ind.members {
		closes := w.closes[sym]
		totalAmount += w.amount[sym]
		if len(closes) >= 2 {
			withData++
			t := ReturnN(closes, 1)
			todays = append(todays, t)
			if t > 0 {
				upCount++
			}
		}
		if len(closes) >= 6 {
			ret5s = append(ret5s, ReturnN(closes, 5))
		}
		if len(closes) >= 21 {
			ret20s = append(ret20s, ReturnN(closes, 20))
		}
		if len(closes) >= 20 {
			ma20Eligible++
			if AboveMA(closes, 20) {
				ma20Above++
			}
		}
	}

	out.TodayAvg = mean(todays)
	out.TodayMedian = median(todays)
	out.Ret5dAvg = mean(ret5s)
	out.Ret20dAvg = mean(ret20s)
	if withData > 0 {
		out.UpRatio = float64(upCount) / float64(withData) * 100
	}
	if ma20Eligible > 0 {
		out.Ma20Ratio = float64(ma20Above) / float64(ma20Eligible) * 100
	}
	out.TotalAmount = totalAmount
	return out
}

// GetIndustryEtfs lists one industry's constituent ETFs.
func (s *EtfService) GetIndustryEtfs(industryName, tradeDate string) (*dto.EtfIndustryEtfsResponse, error) {
	w, err := s.loadWindow(tradeDate)
	if err != nil {
		return nil, err
	}
	resp := &dto.EtfIndustryEtfsResponse{IndustryName: industryName, TradeDate: w.latest}
	for _, inf := range w.infoAll {
		if inf.IndustryName != industryName {
			continue
		}
		resp.Etfs = append(resp.Etfs, *s.brief(w, inf.Symbol))
	}
	sort.Slice(resp.Etfs, func(i, j int) bool {
		return resp.Etfs[i].TodayReturn > resp.Etfs[j].TodayReturn
	})
	return resp, nil
}

// GetRotation builds the 行业轮动 payload.
func (s *EtfService) GetRotation(tradeDate string) (*dto.EtfRotationResponse, error) {
	w, err := s.loadWindow(tradeDate)
	if err != nil {
		return nil, err
	}

	industries := w.groupIndustries()
	rotDates := w.dates
	if len(rotDates) > 10 {
		rotDates = rotDates[len(rotDates)-10:]
	}
	nDays := len(rotDates)

	// Per-day: industry -> median daily return, then rank.
	dayMeds := make([]map[string]float64, nDays)
	dayRanks := make([]map[string]int, nDays)
	for i, d := range rotDates {
		m := map[string]float64{}
		for _, ind := range industries {
			var rets []float64
			for _, sym := range ind.members {
				if r, ok := w.dailyRet[sym][d]; ok {
					rets = append(rets, r)
				}
			}
			if len(rets) > 0 {
				m[ind.name] = median(rets)
			}
		}
		dayMeds[i] = m
		dayRanks[i] = rankByValue(m, true)
	}

	// Rank by 5-day median return (consistent with /industries).
	ret5Map := map[string]float64{}
	for _, ind := range industries {
		ret5Map[ind.name] = median(memberReturns(w, ind, 5))
	}
	rank5d := rankByValue(ret5Map, true)

	resp := &dto.EtfRotationResponse{TradeDate: w.latest}
	for _, ind := range industries {
		name := ind.name
		last := nDays - 1
		todayRank := dayRanks[last][name]
		yesterdayRank := 0
		if last >= 1 {
			yesterdayRank = dayRanks[last-1][name]
		}

		start := nDays - 7
		if start < 0 {
			start = 0
		}
		dailyRanks := make([]int, 0, last-start+1)
		for i := start; i <= last; i++ {
			dailyRanks = append(dailyRanks, dayRanks[i][name])
		}

		consec := 0
		for i := last; i >= 0; i-- {
			r := dayRanks[i][name]
			if r >= 1 && r <= 5 {
				consec++
			} else {
				break
			}
		}

		status := "保持"
		switch {
		case consec >= 2:
			status = "持续强势"
		case yesterdayRank > 0 && todayRank < yesterdayRank:
			status = "排名上升"
		case yesterdayRank > 0 && todayRank > yesterdayRank:
			status = "排名下降"
		}

		resp.Industries = append(resp.Industries, dto.EtfRotationItem{
			IndustryName:       name,
			TodayRank:          todayRank,
			YesterdayRank:      yesterdayRank,
			Rank5d:             rank5d[name],
			Ret1d:              dayMeds[last][name],
			Ret5d:              ret5Map[name],
			Ret20d:             median(memberReturns(w, ind, 20)),
			ConsecutiveTopDays: consec,
			Status:             status,
			DailyRanks:         dailyRanks,
		})
	}
	sort.Slice(resp.Industries, func(i, j int) bool {
		return resp.Industries[i].TodayRank < resp.Industries[j].TodayRank
	})
	return resp, nil
}

// memberReturns returns the N-day returns of an industry's members (valid ones).
func memberReturns(w *etfWindow, ind industryAgg, n int) []float64 {
	var out []float64
	for _, sym := range ind.members {
		if len(w.closes[sym]) >= n+1 {
			out = append(out, ReturnN(w.closes[sym], n))
		}
	}
	return out
}

// rankByValue assigns 1-based ranks (desc or asc), ties broken by key.
func rankByValue(m map[string]float64, desc bool) map[string]int {
	type kv struct {
		k string
		v float64
	}
	items := make([]kv, 0, len(m))
	for k, v := range m {
		items = append(items, kv{k, v})
	}
	sort.Slice(items, func(i, j int) bool {
		if items[i].v != items[j].v {
			if desc {
				return items[i].v > items[j].v
			}
			return items[i].v < items[j].v
		}
		return items[i].k < items[j].k
	})
	rank := make(map[string]int, len(items))
	for i, it := range items {
		rank[it.k] = i + 1
	}
	return rank
}

// GetRanking builds the ETF 排行 payload with filters, sorting and pagination.
func (s *EtfService) GetRanking(tradeDate, etfType, etfSubType, industryName, sortBy, order string, page, pageSize int) (*dto.EtfRankingResponse, error) {
	w, err := s.loadWindow(tradeDate)
	if err != nil {
		return nil, err
	}

	validSort := map[string]bool{"today_return": true, "ret_5d": true, "ret_20d": true, "amount": true, "ma20_status": true}
	if !validSort[sortBy] {
		sortBy = "today_return"
	}
	if order != "asc" {
		order = "desc"
	}
	if page < 1 {
		page = 1
	}
	if pageSize < 1 {
		pageSize = 50
	}
	if pageSize > 200 {
		pageSize = 200
	}

	items := make([]dto.EtfRankingItem, 0, len(w.infoAll))
	for _, inf := range w.infoAll {
		if etfType != "" && inf.EtfType != etfType {
			continue
		}
		if etfSubType != "" && inf.EtfSubType != etfSubType {
			continue
		}
		if industryName != "" && inf.IndustryName != industryName {
			continue
		}
		closes := w.closes[inf.Symbol]
		items = append(items, dto.EtfRankingItem{
			Symbol:       inf.Symbol,
			Name:         inf.Name,
			EtfType:      inf.EtfType,
			EtfSubType:   inf.EtfSubType,
			IndustryName: inf.IndustryName,
			TodayReturn:  ReturnN(closes, 1),
			Ret5d:        ReturnN(closes, 5),
			Ret20d:       ReturnN(closes, 20),
			Ma20Status:   maStatus(closes, 20),
			Amount:       w.amount[inf.Symbol],
		})
	}

	sortKey := func(it dto.EtfRankingItem) float64 {
		switch sortBy {
		case "ret_5d":
			return it.Ret5d
		case "ret_20d":
			return it.Ret20d
		case "amount":
			return it.Amount
		case "ma20_status":
			switch it.Ma20Status {
			case "站上":
				return 2
			case "站下":
				return 1
			default:
				return 0
			}
		default:
			return it.TodayReturn
		}
	}
	sort.Slice(items, func(i, j int) bool {
		if order == "asc" {
			return sortKey(items[i]) < sortKey(items[j])
		}
		return sortKey(items[i]) > sortKey(items[j])
	})

	total := len(items)
	start := (page - 1) * pageSize
	if start > total {
		start = total
	}
	end := start + pageSize
	if end > total {
		end = total
	}
	return &dto.EtfRankingResponse{TradeDate: w.latest, Total: total, Etfs: items[start:end]}, nil
}

// GetDetail builds the ETF 详情 payload with full indicator series.
func (s *EtfService) GetDetail(symbol, tradeDate string) (*dto.EtfDetailResponse, error) {
	infos, err := s.repo.GetAllEtfInfo()
	if err != nil {
		return nil, err
	}
	var info *models.EtfInfo
	for i := range infos {
		if infos[i].Symbol == symbol {
			info = &infos[i]
			break
		}
	}
	if info == nil {
		return nil, fmt.Errorf("ETF not found: %s", symbol)
	}

	rows, err := s.repo.GetSymbolKline(symbol, 250)
	if err != nil {
		return nil, err
	}
	closes := make([]float64, 0, len(rows))
	highs := make([]float64, 0, len(rows))
	for _, r := range rows {
		closes = append(closes, r.Close)
		highs = append(highs, r.High)
	}

	ma5 := MASeries(closes, 5)
	ma20 := MASeries(closes, 20)
	ma60 := MASeries(closes, 60)
	dif, dea, hist := MACDSeries(closes)
	rsi := RSISeries(closes, 14)

	klines := make([]dto.EtfKlinePoint, len(rows))
	for i, r := range rows {
		klines[i] = dto.EtfKlinePoint{
			TradeDate: r.TradeDate,
			Open:      r.Open,
			High:      r.High,
			Low:       r.Low,
			Close:     r.Close,
			Volume:    r.Volume,
			Amount:    r.Amount,
			Ma5:       ma5[i],
			Ma20:      ma20[i],
			Ma60:      ma60[i],
			Dif:       dif[i],
			Dea:       dea[i],
			Macd:      hist[i],
			Rsi14:     rsi[i],
		}
	}

	latestClose := 0.0
	amount := 0.0
	if len(rows) > 0 {
		latestClose = rows[len(rows)-1].Close
		amount = rows[len(rows)-1].Amount
	}

	return &dto.EtfDetailResponse{
		Symbol:       info.Symbol,
		Name:         info.Name,
		EtfType:      info.EtfType,
		EtfSubType:   info.EtfSubType,
		IndustryName: info.IndustryName,
		Exchange:     info.Exchange,
		LatestClose:  latestClose,
		TodayReturn:  ReturnN(closes, 1),
		Amount:       amount,
		Stats: dto.EtfDetailStats{
			Ret5d:       ReturnN(closes, 5),
			Ret20d:      ReturnN(closes, 20),
			Ret60d:      ReturnN(closes, 60),
			High20d:     maxOfLast(highs, 20),
			Drawdown20d: Drawdown20(closes, highs),
			Ma20Status:  maStatus(closes, 20),
			Ma60Status:  maStatus(closes, 60),
		},
		Klines: klines,
	}, nil
}

func maStatus(closes []float64, n int) string {
	if len(closes) < n {
		return "-"
	}
	if AboveMA(closes, n) {
		return "站上"
	}
	return "站下"
}

func maxOfLast(highs []float64, n int) float64 {
	if len(highs) == 0 {
		return 0
	}
	start := len(highs) - n
	if start < 0 {
		start = 0
	}
	m := 0.0
	for _, v := range highs[start:] {
		if v > m {
			m = v
		}
	}
	return m
}

func mean(values []float64) float64 {
	if len(values) == 0 {
		return 0
	}
	sum := 0.0
	for _, v := range values {
		sum += v
	}
	return sum / float64(len(values))
}
