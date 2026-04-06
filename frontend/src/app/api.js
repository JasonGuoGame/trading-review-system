import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  tagTypes: ['Trade', 'TradeDetail', 'Tags', 'Dashboard', 'Analysis'],
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
      ],
    }),

    deleteOrder: builder.mutation({
      query: ({ id, tradeId }) => ({
        url: `/orders/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { tradeId }) => [
        { type: 'TradeDetail', id: tradeId },
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
} = apiSlice
