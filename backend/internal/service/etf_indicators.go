package service

import "sort"

// This file holds pure technical-indicator math over ascending (oldest→newest)
// price slices. Returns that express a percentage are already ×100 for display;
// MA/MACD/RSI return raw values.

// median returns the median of values (0 when empty).
func median(values []float64) float64 {
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

// ReturnN computes the N-trading-day return of an ascending close series as a
// percentage: close[last]/close[last-N] - 1, ×100. Returns 0 when too short.
func ReturnN(closes []float64, n int) float64 {
	if len(closes) <= n || n <= 0 {
		return 0
	}
	base := closes[len(closes)-1-n]
	if base == 0 {
		return 0
	}
	return (closes[len(closes)-1]/base - 1) * 100
}

// MA returns the mean of the last n closes (0 when len < n).
func MA(closes []float64, n int) float64 {
	if len(closes) < n || n <= 0 {
		return 0
	}
	sum := 0.0
	for _, v := range closes[len(closes)-n:] {
		sum += v
	}
	return sum / float64(n)
}

// MASeries returns the n-day moving average at each index (0 for the first n-1
// bars). Used to overlay MA5/20/60 on the detail chart.
func MASeries(closes []float64, n int) []float64 {
	out := make([]float64, len(closes))
	if n <= 0 {
		return out
	}
	sum := 0.0
	for i := 0; i < len(closes); i++ {
		sum += closes[i]
		if i >= n {
			sum -= closes[i-n]
		}
		if i >= n-1 {
			out[i] = sum / float64(n)
		}
	}
	return out
}

// AboveMA reports whether the last close is above MA(n). Callers must have
// already checked len(closes) >= n; a too-short series returns false here.
func AboveMA(closes []float64, n int) bool {
	if len(closes) < n {
		return false
	}
	return closes[len(closes)-1] > MA(closes, n)
}

// EMASeries returns the standard EMA (seed = first value), aligned to the input.
// multiplier = 2/(n+1).
func EMASeries(vals []float64, n int) []float64 {
	out := make([]float64, len(vals))
	if len(vals) == 0 || n <= 0 {
		return out
	}
	k := 2.0 / float64(n+1)
	ema := vals[0]
	out[0] = ema
	for i := 1; i < len(vals); i++ {
		ema = vals[i]*k + ema*(1-k)
		out[i] = ema
	}
	return out
}

// MACDSeries computes MACD over an ascending close series:
// DIF = EMA12 - EMA26, DEA = EMA9(DIF), hist = 2*(DIF-DEA).
func MACDSeries(closes []float64) (dif, dea, hist []float64) {
	n := len(closes)
	dif = make([]float64, n)
	dea = make([]float64, n)
	hist = make([]float64, n)
	if n == 0 {
		return
	}
	e12 := EMASeries(closes, 12)
	e26 := EMASeries(closes, 26)
	for i := 0; i < n; i++ {
		dif[i] = e12[i] - e26[i]
	}
	dea = EMASeries(dif, 9)
	for i := 0; i < n; i++ {
		hist[i] = 2 * (dif[i] - dea[i])
	}
	return
}

// RSISeries returns the Wilder RSI (over `period`) of an ascending close series.
// The first `period` entries are 0 (insufficient data).
func RSISeries(closes []float64, period int) []float64 {
	out := make([]float64, len(closes))
	if len(closes) <= period || period <= 0 {
		return out
	}
	gain := 0.0
	loss := 0.0
	for i := 1; i <= period; i++ {
		d := closes[i] - closes[i-1]
		if d >= 0 {
			gain += d
		} else {
			loss -= d
		}
	}
	avgGain := gain / float64(period)
	avgLoss := loss / float64(period)
	out[period] = rsiValue(avgGain, avgLoss)
	for i := period + 1; i < len(closes); i++ {
		d := closes[i] - closes[i-1]
		g := 0.0
		l := 0.0
		if d >= 0 {
			g = d
		} else {
			l = -d
		}
		avgGain = (avgGain*float64(period-1) + g) / float64(period)
		avgLoss = (avgLoss*float64(period-1) + l) / float64(period)
		out[i] = rsiValue(avgGain, avgLoss)
	}
	return out
}

func rsiValue(avgGain, avgLoss float64) float64 {
	if avgLoss == 0 {
		if avgGain == 0 {
			return 50
		}
		return 100
	}
	rs := avgGain / avgLoss
	return 100 - 100/(1+rs)
}

// Drawdown20 computes close / max(high over last 20d) - 1, ×100 (negative).
func Drawdown20(closes, highs []float64) float64 {
	if len(closes) < 20 || len(highs) < 20 {
		return 0
	}
	maxHigh := 0.0
	for _, h := range highs[len(highs)-20:] {
		if h > maxHigh {
			maxHigh = h
		}
	}
	if maxHigh == 0 {
		return 0
	}
	return (closes[len(closes)-1]/maxHigh - 1) * 100
}
