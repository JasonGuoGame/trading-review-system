import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  tagTypes: ['Trade', 'TradeDetail', 'Tags', 'Dashboard', 'Analysis', 'StockPool', 'MarketAttack', 'MarketEarning', 'StrategyPerf'],
  endpoints: (builder) => ({
    // === Trades ===
    getTrades: builder.query({
      query: (params) => ({
        url: '/trades',
        params,
      }),
      transformResponse: (res) => res.data,
      providesTags: ['Trade'],
    }),

    getTradeDetail: builder.query({
      query: (id) => `/trades/${id}`,
      transformResponse: (res) => res.data,
      providesTags: (result, error, id) => [{ type: 'TradeDetail', id }],
    }),

    createTrade: builder.mutation({
      query: (body) => ({
        url: '/trades',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Trade', 'Dashboard'],
    }),

    updateTrade: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/trades/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        'Trade',
        { type: 'TradeDetail', id },
        'Dashboard',
      ],
    }),

    deleteTrade: builder.mutation({
      query: (id) => ({
        url: `/trades/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Trade', 'Dashboard'],
    }),

    // === Orders ===
    createOrder: builder.mutation({
      query: ({ tradeId, ...body }) => ({
        url: `/trades/${tradeId}/orders`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, { tradeId }) => [
        { type: 'TradeDetail', id: tradeId },
        'Trade',
        'Dashboard',
      ],
    }),

    updateOrder: builder.mutation({
      query: ({ id, tradeId, ...body }) => ({
        url: `/orders/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (result, error, { tradeId }) => [
        { type: 'TradeDetail', id: tradeId },
        'Trade',
        'Dashboard',
      ],
    }),

    deleteOrder: builder.mutation({
      query: ({ id, tradeId }) => ({
        url: `/orders/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { tradeId }) => [
        { type: 'TradeDetail', id: tradeId },
        'Trade',
        'Dashboard',
      ],
    }),

    // === Entry Decision ===
    upsertEntryDecision: builder.mutation({
      query: ({ tradeId, ...body }) => ({
        url: `/trades/${tradeId}/entry-decision`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (result, error, { tradeId }) => [
        { type: 'TradeDetail', id: tradeId },
      ],
    }),

    // === Exit Plan ===
    upsertExitPlan: builder.mutation({
      query: ({ tradeId, ...body }) => ({
        url: `/trades/${tradeId}/exit-plan`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (result, error, { tradeId }) => [
        { type: 'TradeDetail', id: tradeId },
      ],
    }),

    // === Review ===
    upsertReview: builder.mutation({
      query: ({ tradeId, ...body }) => ({
        url: `/trades/${tradeId}/review`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (result, error, { tradeId }) => [
        { type: 'TradeDetail', id: tradeId },
      ],
    }),

    // === Tags ===
    getTags: builder.query({
      query: () => '/tags',
      transformResponse: (res) => res.data,
      providesTags: ['Tags'],
    }),

    createTag: builder.mutation({
      query: (body) => ({
        url: '/tags',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Tags'],
    }),

    setTradeTags: builder.mutation({
      query: ({ tradeId, tag_ids }) => ({
        url: `/trades/${tradeId}/tags`,
        method: 'PUT',
        body: { tag_ids },
      }),
      invalidatesTags: (result, error, { tradeId }) => [
        { type: 'TradeDetail', id: tradeId },
        'Trade',
      ],
    }),

    // === Dashboard ===
    getDashboardSummary: builder.query({
      query: () => '/dashboard/summary',
      transformResponse: (res) => res.data,
      providesTags: ['Dashboard'],
    }),

    getEquityCurve: builder.query({
      query: () => '/dashboard/equity-curve',
      transformResponse: (res) => res.data,
      providesTags: ['Dashboard'],
    }),

    getWinRate: builder.query({
      query: () => '/dashboard/win-rate',
      transformResponse: (res) => res.data,
      providesTags: ['Dashboard'],
    }),

    getRecentTrades: builder.query({
      query: () => '/dashboard/recent-trades',
      transformResponse: (res) => res.data,
      providesTags: ['Dashboard'],
    }),

    // === Analysis ===
    getSignalAnalysis: builder.query({
      query: () => '/analysis/signals',
      transformResponse: (res) => res.data,
      providesTags: ['Analysis'],
    }),

    getTagAnalysis: builder.query({
      query: () => '/analysis/tags',
      transformResponse: (res) => res.data,
      providesTags: ['Analysis'],
    }),

    getMarketAnalysis: builder.query({
      query: () => '/analysis/market',
      transformResponse: (res) => res.data,
      providesTags: ['Analysis'],
    }),

    getExecutionAnalysis: builder.query({
      query: () => '/analysis/execution',
      transformResponse: (res) => res.data,
      providesTags: ['Analysis'],
    }),

    getEmotionAnalysis: builder.query({
      query: () => '/analysis/emotion',
      transformResponse: (res) => res.data,
      providesTags: ['Analysis'],
    }),

    getMistakeAnalysis: builder.query({
      query: () => '/analysis/mistakes',
      transformResponse: (res) => res.data,
      providesTags: ['Analysis'],
    }),

    // === Daily Review ===
    getDailyReview: builder.query({
      query: (date) => `/daily-reviews/${date}`,
      transformResponse: (res) => res.data,
      providesTags: (result, error, arg) => [{ type: 'DailyReview', id: arg }],
    }),
    upsertDailyReview: builder.mutation({
      query: ({ date, ...body }) => ({
        url: `/daily-reviews/${date}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (result, error, { date }) => [
        { type: 'DailyReview', id: date },
        'Analysis',
      ],
    }),

    // === Market Breadth ===
    getMarketBreadth: builder.query({
      query: (date) => `/market-breadth/${date}`,
      transformResponse: (res) => res.data,
      providesTags: (result, error, arg) => [{ type: 'MarketBreadth', id: arg }],
    }),
    upsertMarketBreadth: builder.mutation({
      query: ({ date, ...body }) => ({
        url: `/market-breadth/${date}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (result, error, { date }) => [
        { type: 'MarketBreadth', id: date },
        'Dashboard', // Since dashboard will show market breadth
      ],
    }),
    // === Abnormal Capital ===
    getAbnormalCapital: builder.query({
      query: (params) => ({
        url: '/abnormal-capital',
        params,
      }),
      transformResponse: (res) => res.data,
      providesTags: ['AbnormalCapital'],
    }),
    getAbnormalSectors: builder.query({
      query: (params) => ({
        url: '/abnormal-capital/sectors',
        params,
      }),
      transformResponse: (res) => res.data,
      providesTags: ['AbnormalCapital'],
    }),

    // === Sector Fund Flow ===
    getSectorFundFlow: builder.query({
      query: (params) => ({
        url: '/sector-fund-flow',
        params,
      }),
      transformResponse: (res) => res.data,
    }),
    getSectorTrend: builder.query({
      query: (params) => ({
        url: '/sector-fund-flow/trend',
        params,
      }),
      transformResponse: (res) => res.data,
    }),

    // === Stock Pool ===
    getStockPool: builder.query({
      query: (params) => ({
        url: '/stock-pool',
        params,
      }),
      transformResponse: (res) => res.data,
      providesTags: ['StockPool'],
    }),
    getStockPoolCounts: builder.query({
      query: () => '/stock-pool/counts',
      transformResponse: (res) => res.data,
      providesTags: ['StockPool'],
    }),
    getStockDetail: builder.query({
      query: (symbol) => `/stock-pool/${symbol}/detail`,
      transformResponse: (res) => res.data,
      providesTags: (result, error, symbol) => [{ type: 'StockPool', id: symbol }],
    }),
    searchStockPool: builder.query({
      query: (q) => `/stock-pool/search?q=${encodeURIComponent(q)}`,
      transformResponse: (res) => res.data,
    }),
    createStockPool: builder.mutation({
      query: (body) => ({
        url: '/stock-pool',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['StockPool'],
    }),
    updateStockPoolStatus: builder.mutation({
      query: ({ id, status }) => ({
        url: `/stock-pool/${id}`,
        method: 'PUT',
        body: { status },
      }),
      invalidatesTags: ['StockPool'],
    }),
    setWatchFocus: builder.mutation({
      query: (params) => ({
        url: '/stock-pool/watch-focus',
        method: 'PUT',
        params: {
          symbol: params.symbol,
          trade_date: params.trade_date,
          pool_type: params.pool_type,
          status: params.status,
        },
        body: { focus: params.focus },
      }),
      invalidatesTags: ['StockPool'],
    }),
    deleteStockPool: builder.mutation({
      query: (params) => ({
        url: '/stock-pool',
        method: 'DELETE',
        params,
      }),
      invalidatesTags: ['StockPool'],
    }),
    // === Market Earning Effect ===
    getMarketEarningEffect: builder.query({
      query: () => '/market-earning-effect',
      transformResponse: (res) => res.data,
      providesTags: ['MarketEarning'],
    }),

    // === Strategy Performance ===
    getStrategyPerformance: builder.query({
      query: (days = 10) => `/strategy-performance?days=${days}`,
      transformResponse: (res) => res.data,
      providesTags: ['StrategyPerf'],
    }),

    // === Strategy Score Analysis ===
    getStrategyScoreAnalysis: builder.query({
      query: ({ strategy, days = 30 }) => `/strategy-analysis/trend?strategy=${encodeURIComponent(strategy)}&days=${days}`,
      transformResponse: (res) => res.data,
    }),

    getStrategyStocks: builder.query({
      query: (params) => ({
        url: '/strategy-analysis/stocks',
        params,
      }),
      transformResponse: (res) => res.data,
    }),

    // === Market Attack ===
    getTopMarketAttacks: builder.query({
      query: (params) => ({
        url: '/market-attack/top',
        params,
      }),
      transformResponse: (res) => res.data,
      providesTags: ['MarketAttack'],
    }),
    getSectorAttackDetail: builder.query({
      query: ({ name, ...params }) => ({
        url: `/market-attack/sector/${name}`,
        params,
      }),
      transformResponse: (res) => res.data,
      providesTags: (result, error, { name }) => [{ type: 'MarketAttack', id: name }],
    }),
    getSectorAttackTrend: builder.query({
      query: (params) => ({
        url: '/market-attack/trend',
        params,
      }),
      transformResponse: (res) => res.data,
    }),
  }),
})

export const {
  useGetTradesQuery,
  useGetTradeDetailQuery,
  useCreateTradeMutation,
  useUpdateTradeMutation,
  useDeleteTradeMutation,
  useCreateOrderMutation,
  useUpdateOrderMutation,
  useDeleteOrderMutation,
  useUpsertEntryDecisionMutation,
  useUpsertExitPlanMutation,
  useUpsertReviewMutation,
  useGetTagsQuery,
  useCreateTagMutation,
  useSetTradeTagsMutation,
  useGetDashboardSummaryQuery,
  useGetEquityCurveQuery,
  useGetWinRateQuery,
  useGetRecentTradesQuery,
  useGetSignalAnalysisQuery,
  useGetTagAnalysisQuery,
  useGetMarketAnalysisQuery,
  useGetExecutionAnalysisQuery,
  useGetEmotionAnalysisQuery,
  useGetMistakeAnalysisQuery,
  useGetDailyReviewQuery,
  useUpsertDailyReviewMutation,
  useGetMarketBreadthQuery,
  useUpsertMarketBreadthMutation,
  useGetAbnormalCapitalQuery,
  useGetAbnormalSectorsQuery,
  useGetSectorFundFlowQuery,
  useGetSectorTrendQuery,
  useGetStockPoolQuery,
  useGetStockPoolCountsQuery,
  useSearchStockPoolQuery,
  useGetStockDetailQuery,
  useCreateStockPoolMutation,
  useUpdateStockPoolStatusMutation,
  useSetWatchFocusMutation,
  useDeleteStockPoolMutation,
  useGetMarketEarningEffectQuery,
  useGetStrategyPerformanceQuery,
  useGetStrategyScoreAnalysisQuery,
  useGetStrategyStocksQuery,
  useGetTopMarketAttacksQuery,
  useGetSectorAttackDetailQuery,
  useGetSectorAttackTrendQuery,
} = apiSlice
