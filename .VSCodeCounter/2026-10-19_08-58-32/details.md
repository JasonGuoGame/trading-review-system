# Details

Date : 2026-10-19 08:58:32

Directory c:\\ws\\trading-review-system

Total : 188 files,  30913 codes, 1320 comments, 3131 blanks, all 35364 lines

[Summary](results.md) / Details / [Diff Summary](diff.md) / [Diff Details](diff-details.md)

## Files
| filename | language | code | comment | blank | total |
| :--- | :--- | ---: | ---: | ---: | ---: |
| [.claude/settings.local.json](/.claude/settings.local.json) | JSON | 95 | 0 | 1 | 96 |
| [README.md](/README.md) | Markdown | 123 | 0 | 37 | 160 |
| [a\_share\_trading\_system\_playbook.md](/a_share_trading_system_playbook.md) | Markdown | 336 | 0 | 237 | 573 |
| [api\_test.json](/api_test.json) | JSON | 1 | 0 | 0 | 1 |
| [api\_test\_v2.json](/api_test_v2.json) | JSON | 1 | 0 | 0 | 1 |
| [api\_test\_v3.json](/api_test_v3.json) | JSON | 1 | 0 | 0 | 1 |
| [backend/Dockerfile](/backend/Dockerfile) | Docker | 15 | 12 | 13 | 40 |
| [backend/check\_db.go](/backend/check_db.go) | Go | 24 | 0 | 3 | 27 |
| [backend/cmd/insert\_divergence/main.go](/backend/cmd/insert_divergence/main.go) | Go | 72 | 1 | 8 | 81 |
| [backend/cmd/seed\_stock\_pool/main.go](/backend/cmd/seed_stock_pool/main.go) | Go | 46 | 2 | 9 | 57 |
| [backend/cmd/server/main.go](/backend/cmd/server/main.go) | Go | 45 | 8 | 12 | 65 |
| [backend/go.mod](/backend/go.mod) | Go Module File | 40 | 0 | 4 | 44 |
| [backend/go.sum](/backend/go.sum) | Go Checksum File | 106 | 0 | 1 | 107 |
| [backend/internal/config/config.go](/backend/internal/config/config.go) | Go | 63 | 1 | 13 | 77 |
| [backend/internal/database/database.go](/backend/internal/database/database.go) | Go | 85 | 4 | 16 | 105 |
| [backend/internal/database/migration.go](/backend/internal/database/migration.go) | Go | 23 | 0 | 7 | 30 |
| [backend/internal/database/seed.go](/backend/internal/database/seed.go) | Go | 67 | 6 | 14 | 87 |
| [backend/internal/dto/abnormal\_dto.go](/backend/internal/dto/abnormal_dto.go) | Go | 29 | 0 | 6 | 35 |
| [backend/internal/dto/analysis\_dto.go](/backend/internal/dto/analysis_dto.go) | Go | 39 | 1 | 8 | 48 |
| [backend/internal/dto/chip\_monitor\_dto.go](/backend/internal/dto/chip_monitor_dto.go) | Go | 44 | 4 | 5 | 53 |
| [backend/internal/dto/dashboard\_dto.go](/backend/internal/dto/dashboard_dto.go) | Go | 59 | 1 | 11 | 71 |
| [backend/internal/dto/fund\_flow\_dto.go](/backend/internal/dto/fund_flow_dto.go) | Go | 58 | 0 | 7 | 65 |
| [backend/internal/dto/market\_attack\_dto.go](/backend/internal/dto/market_attack_dto.go) | Go | 104 | 7 | 16 | 127 |
| [backend/internal/dto/market\_breadth\_dto.go](/backend/internal/dto/market_breadth_dto.go) | Go | 30 | 10 | 5 | 45 |
| [backend/internal/dto/market\_earning\_dto.go](/backend/internal/dto/market_earning_dto.go) | Go | 11 | 0 | 3 | 14 |
| [backend/internal/dto/market\_temperature\_dto.go](/backend/internal/dto/market_temperature_dto.go) | Go | 74 | 14 | 12 | 100 |
| [backend/internal/dto/rag\_dto.go](/backend/internal/dto/rag_dto.go) | Go | 49 | 10 | 11 | 70 |
| [backend/internal/dto/sector\_sentiment\_dto.go](/backend/internal/dto/sector_sentiment_dto.go) | Go | 163 | 50 | 32 | 245 |
| [backend/internal/dto/stock\_pool\_dto.go](/backend/internal/dto/stock_pool_dto.go) | Go | 61 | 1 | 10 | 72 |
| [backend/internal/dto/strategy\_performance\_dto.go](/backend/internal/dto/strategy_performance_dto.go) | Go | 43 | 0 | 6 | 49 |
| [backend/internal/dto/strategy\_score\_analysis\_dto.go](/backend/internal/dto/strategy_score_analysis_dto.go) | Go | 103 | 2 | 15 | 120 |
| [backend/internal/dto/trade\_dto.go](/backend/internal/dto/trade_dto.go) | Go | 109 | 3 | 17 | 129 |
| [backend/internal/handler/abnormal\_handler.go](/backend/internal/handler/abnormal_handler.go) | Go | 52 | 0 | 11 | 63 |
| [backend/internal/handler/analysis\_handler.go](/backend/internal/handler/analysis_handler.go) | Go | 61 | 6 | 12 | 79 |
| [backend/internal/handler/chip\_monitor\_handler.go](/backend/internal/handler/chip_monitor_handler.go) | Go | 94 | 1 | 15 | 110 |
| [backend/internal/handler/daily\_review\_handler.go](/backend/internal/handler/daily_review_handler.go) | Go | 54 | 2 | 16 | 72 |
| [backend/internal/handler/dashboard\_handler.go](/backend/internal/handler/dashboard_handler.go) | Go | 61 | 6 | 12 | 79 |
| [backend/internal/handler/fund\_flow\_handler.go](/backend/internal/handler/fund_flow_handler.go) | Go | 65 | 0 | 13 | 78 |
| [backend/internal/handler/handlers.go](/backend/internal/handler/handlers.go) | Go | 50 | 0 | 4 | 54 |
| [backend/internal/handler/market\_attack\_handler.go](/backend/internal/handler/market_attack_handler.go) | Go | 113 | 3 | 16 | 132 |
| [backend/internal/handler/market\_breadth\_handler.go](/backend/internal/handler/market_breadth_handler.go) | Go | 114 | 8 | 19 | 141 |
| [backend/internal/handler/market\_earning\_handler.go](/backend/internal/handler/market_earning_handler.go) | Go | 25 | 0 | 7 | 32 |
| [backend/internal/handler/market\_temperature\_handler.go](/backend/internal/handler/market_temperature_handler.go) | Go | 62 | 4 | 10 | 76 |
| [backend/internal/handler/order\_handler.go](/backend/internal/handler/order_handler.go) | Go | 62 | 3 | 17 | 82 |
| [backend/internal/handler/rag\_handler.go](/backend/internal/handler/rag_handler.go) | Go | 59 | 4 | 14 | 77 |
| [backend/internal/handler/research\_sql\_handler.go](/backend/internal/handler/research_sql_handler.go) | Go | 115 | 7 | 14 | 136 |
| [backend/internal/handler/review\_handler.go](/backend/internal/handler/review_handler.go) | Go | 31 | 1 | 10 | 42 |
| [backend/internal/handler/sector\_sentiment\_handler.go](/backend/internal/handler/sector_sentiment_handler.go) | Go | 204 | 18 | 22 | 244 |
| [backend/internal/handler/stock\_pool\_handler.go](/backend/internal/handler/stock_pool_handler.go) | Go | 310 | 2 | 58 | 370 |
| [backend/internal/handler/strategy\_performance\_handler.go](/backend/internal/handler/strategy_performance_handler.go) | Go | 30 | 0 | 8 | 38 |
| [backend/internal/handler/strategy\_score\_analysis\_handler.go](/backend/internal/handler/strategy_score_analysis_handler.go) | Go | 56 | 0 | 13 | 69 |
| [backend/internal/handler/tag\_handler.go](/backend/internal/handler/tag_handler.go) | Go | 34 | 2 | 11 | 47 |
| [backend/internal/handler/trade\_checklist\_handler.go](/backend/internal/handler/trade_checklist_handler.go) | Go | 48 | 2 | 14 | 64 |
| [backend/internal/handler/trade\_handler.go](/backend/internal/handler/trade_handler.go) | Go | 186 | 8 | 34 | 228 |
| [backend/internal/middleware/middleware.go](/backend/internal/middleware/middleware.go) | Go | 25 | 0 | 7 | 32 |
| [backend/internal/models/abnormal\_capital.go](/backend/internal/models/abnormal_capital.go) | Go | 17 | 0 | 4 | 21 |
| [backend/internal/models/chip\_factor.go](/backend/internal/models/chip_factor.go) | Go | 82 | 1 | 7 | 90 |
| [backend/internal/models/daily\_review.go](/backend/internal/models/daily_review.go) | Go | 24 | 6 | 10 | 40 |
| [backend/internal/models/entry\_decision.go](/backend/internal/models/entry_decision.go) | Go | 57 | 3 | 8 | 68 |
| [backend/internal/models/exit\_plan.go](/backend/internal/models/exit_plan.go) | Go | 14 | 0 | 3 | 17 |
| [backend/internal/models/market\_attack.go](/backend/internal/models/market_attack.go) | Go | 19 | 0 | 4 | 23 |
| [backend/internal/models/market\_breadth.go](/backend/internal/models/market_breadth.go) | Go | 35 | 0 | 3 | 38 |
| [backend/internal/models/market\_earning\_effect.go](/backend/internal/models/market_earning_effect.go) | Go | 16 | 0 | 4 | 20 |
| [backend/internal/models/order.go](/backend/internal/models/order.go) | Go | 15 | 0 | 3 | 18 |
| [backend/internal/models/research\_sql.go](/backend/internal/models/research_sql.go) | Go | 38 | 3 | 7 | 48 |
| [backend/internal/models/review.go](/backend/internal/models/review.go) | Go | 14 | 0 | 3 | 17 |
| [backend/internal/models/sector\_breadth.go](/backend/internal/models/sector_breadth.go) | Go | 16 | 1 | 4 | 21 |
| [backend/internal/models/sector\_fund\_flow.go](/backend/internal/models/sector_fund_flow.go) | Go | 15 | 2 | 4 | 21 |
| [backend/internal/models/sector\_score.go](/backend/internal/models/sector_score.go) | Go | 20 | 1 | 4 | 25 |
| [backend/internal/models/stk\_daily\_kline.go](/backend/internal/models/stk_daily_kline.go) | Go | 17 | 0 | 4 | 21 |
| [backend/internal/models/stock.go](/backend/internal/models/stock.go) | Go | 8 | 1 | 3 | 12 |
| [backend/internal/models/stock\_pool.go](/backend/internal/models/stock_pool.go) | Go | 34 | 0 | 6 | 40 |
| [backend/internal/models/strategy\_performance\_history.go](/backend/internal/models/strategy_performance_history.go) | Go | 18 | 0 | 4 | 22 |
| [backend/internal/models/strategy\_score\_analysis.go](/backend/internal/models/strategy_score_analysis.go) | Go | 16 | 0 | 4 | 20 |
| [backend/internal/models/tag.go](/backend/internal/models/tag.go) | Go | 11 | 0 | 3 | 14 |
| [backend/internal/models/trade.go](/backend/internal/models/trade.go) | Go | 52 | 1 | 6 | 59 |
| [backend/internal/models/trade\_checklist.go](/backend/internal/models/trade_checklist.go) | Go | 18 | 0 | 6 | 24 |
| [backend/internal/models/trade\_tag.go](/backend/internal/models/trade_tag.go) | Go | 5 | 0 | 2 | 7 |
| [backend/internal/repository/abnormal\_repo.go](/backend/internal/repository/abnormal_repo.go) | Go | 98 | 2 | 19 | 119 |
| [backend/internal/repository/chip\_monitor\_repo.go](/backend/internal/repository/chip_monitor_repo.go) | Go | 177 | 22 | 24 | 223 |
| [backend/internal/repository/daily\_review\_repo.go](/backend/internal/repository/daily_review_repo.go) | Go | 72 | 7 | 15 | 94 |
| [backend/internal/repository/entry\_decision\_repo.go](/backend/internal/repository/entry_decision_repo.go) | Go | 58 | 4 | 9 | 71 |
| [backend/internal/repository/exit\_plan\_repo.go](/backend/internal/repository/exit_plan_repo.go) | Go | 34 | 0 | 7 | 41 |
| [backend/internal/repository/fund\_flow\_repo.go](/backend/internal/repository/fund_flow_repo.go) | Go | 103 | 9 | 15 | 127 |
| [backend/internal/repository/kline\_repo.go](/backend/internal/repository/kline_repo.go) | Go | 31 | 2 | 8 | 41 |
| [backend/internal/repository/market\_attack\_repo.go](/backend/internal/repository/market_attack_repo.go) | Go | 250 | 12 | 18 | 280 |
| [backend/internal/repository/market\_breadth\_repo.go](/backend/internal/repository/market_breadth_repo.go) | Go | 300 | 37 | 31 | 368 |
| [backend/internal/repository/market\_earning\_repo.go](/backend/internal/repository/market_earning_repo.go) | Go | 19 | 0 | 6 | 25 |
| [backend/internal/repository/market\_temperature\_repo.go](/backend/internal/repository/market_temperature_repo.go) | Go | 187 | 24 | 16 | 227 |
| [backend/internal/repository/order\_repo.go](/backend/internal/repository/order_repo.go) | Go | 33 | 0 | 10 | 43 |
| [backend/internal/repository/repositories.go](/backend/internal/repository/repositories.go) | Go | 50 | 0 | 4 | 54 |
| [backend/internal/repository/research\_sql\_repo.go](/backend/internal/repository/research_sql_repo.go) | Go | 117 | 13 | 23 | 153 |
| [backend/internal/repository/review\_repo.go](/backend/internal/repository/review_repo.go) | Go | 34 | 0 | 7 | 41 |
| [backend/internal/repository/sector\_sentiment\_repo.go](/backend/internal/repository/sector_sentiment_repo.go) | Go | 1,100 | 142 | 61 | 1,303 |
| [backend/internal/repository/stock\_pool\_repo.go](/backend/internal/repository/stock_pool_repo.go) | Go | 148 | 3 | 21 | 172 |
| [backend/internal/repository/strategy\_performance\_repo.go](/backend/internal/repository/strategy_performance_repo.go) | Go | 72 | 3 | 10 | 85 |
| [backend/internal/repository/strategy\_score\_analysis\_repo.go](/backend/internal/repository/strategy_score_analysis_repo.go) | Go | 202 | 13 | 14 | 229 |
| [backend/internal/repository/tag\_repo.go](/backend/internal/repository/tag_repo.go) | Go | 51 | 0 | 10 | 61 |
| [backend/internal/repository/trade\_checklist\_repo.go](/backend/internal/repository/trade_checklist_repo.go) | Go | 39 | 0 | 10 | 49 |
| [backend/internal/repository/trade\_repo.go](/backend/internal/repository/trade_repo.go) | Go | 178 | 13 | 30 | 221 |
| [backend/internal/router/router.go](/backend/internal/router/router.go) | Go | 151 | 23 | 27 | 201 |
| [backend/internal/scheduler/market\_breadth\_job.go](/backend/internal/scheduler/market_breadth_job.go) | Go | 143 | 26 | 30 | 199 |
| [backend/internal/service/abnormal\_service.go](/backend/internal/service/abnormal_service.go) | Go | 161 | 7 | 25 | 193 |
| [backend/internal/service/analysis\_service.go](/backend/internal/service/analysis_service.go) | Go | 83 | 5 | 18 | 106 |
| [backend/internal/service/chip\_monitor\_service.go](/backend/internal/service/chip_monitor_service.go) | Go | 171 | 5 | 22 | 198 |
| [backend/internal/service/daily\_review\_service.go](/backend/internal/service/daily_review_service.go) | Go | 18 | 0 | 7 | 25 |
| [backend/internal/service/dashboard\_service.go](/backend/internal/service/dashboard_service.go) | Go | 261 | 4 | 41 | 306 |
| [backend/internal/service/fund\_flow\_service.go](/backend/internal/service/fund_flow_service.go) | Go | 323 | 25 | 46 | 394 |
| [backend/internal/service/market\_attack\_service.go](/backend/internal/service/market_attack_service.go) | Go | 428 | 27 | 49 | 504 |
| [backend/internal/service/market\_breadth\_service.go](/backend/internal/service/market_breadth_service.go) | Go | 151 | 18 | 19 | 188 |
| [backend/internal/service/market\_earning\_service.go](/backend/internal/service/market_earning_service.go) | Go | 29 | 0 | 6 | 35 |
| [backend/internal/service/market\_temperature\_service.go](/backend/internal/service/market_temperature_service.go) | Go | 410 | 24 | 36 | 470 |
| [backend/internal/service/order\_service.go](/backend/internal/service/order_service.go) | Go | 124 | 2 | 18 | 144 |
| [backend/internal/service/rag\_service.go](/backend/internal/service/rag_service.go) | Go | 333 | 32 | 56 | 421 |
| [backend/internal/service/research\_sql\_service.go](/backend/internal/service/research_sql_service.go) | Go | 101 | 13 | 23 | 137 |
| [backend/internal/service/sector\_sentiment\_service.go](/backend/internal/service/sector_sentiment_service.go) | Go | 594 | 72 | 70 | 736 |
| [backend/internal/service/services.go](/backend/internal/service/services.go) | Go | 52 | 0 | 5 | 57 |
| [backend/internal/service/stock\_pool\_service.go](/backend/internal/service/stock_pool_service.go) | Go | 643 | 30 | 90 | 763 |
| [backend/internal/service/strategy\_performance\_service.go](/backend/internal/service/strategy_performance_service.go) | Go | 514 | 29 | 57 | 600 |
| [backend/internal/service/strategy\_score\_analysis\_service.go](/backend/internal/service/strategy_score_analysis_service.go) | Go | 297 | 14 | 33 | 344 |
| [backend/internal/service/tag\_service.go](/backend/internal/service/tag_service.go) | Go | 27 | 0 | 7 | 34 |
| [backend/internal/service/trade\_checklist\_service.go](/backend/internal/service/trade_checklist_service.go) | Go | 18 | 0 | 7 | 25 |
| [backend/internal/service/trade\_service.go](/backend/internal/service/trade_service.go) | Go | 221 | 3 | 27 | 251 |
| [backend/scripts/chroma\_query.py](/backend/scripts/chroma_query.py) | Python | 67 | 14 | 21 | 102 |
| [backend/scripts/chroma\_server.py](/backend/scripts/chroma_server.py) | Python | 161 | 21 | 31 | 213 |
| [backend/scripts/ingest\_from\_mysql.py](/backend/scripts/ingest_from_mysql.py) | Python | 176 | 17 | 31 | 224 |
| [backend/scripts/ingest\_posts.py](/backend/scripts/ingest_posts.py) | Python | 86 | 21 | 24 | 131 |
| [backend/scripts/test\_posts.jsonl](/backend/scripts/test_posts.jsonl) | JSON Lines | 10 | 0 | 1 | 11 |
| [docker-compose.yml](/docker-compose.yml) | YAML | 49 | 0 | 5 | 54 |
| [frontend/Dockerfile](/frontend/Dockerfile) | Docker | 11 | 2 | 2 | 15 |
| [frontend/index.html](/frontend/index.html) | HTML | 14 | 0 | 1 | 15 |
| [frontend/nginx.conf](/frontend/nginx.conf) | Properties | 23 | 4 | 5 | 32 |
| [frontend/package-lock.json](/frontend/package-lock.json) | JSON | 3,244 | 0 | 1 | 3,245 |
| [frontend/package.json](/frontend/package.json) | JSON | 28 | 0 | 1 | 29 |
| [frontend/src/App.jsx](/frontend/src/App.jsx) | JavaScript JSX | 138 | 0 | 9 | 147 |
| [frontend/src/app/api.js](/frontend/src/app/api.js) | JavaScript | 729 | 23 | 48 | 800 |
| [frontend/src/app/store.js](/frontend/src/app/store.js) | JavaScript | 9 | 0 | 2 | 11 |
| [frontend/src/components/TagSelector.jsx](/frontend/src/components/TagSelector.jsx) | JavaScript JSX | 90 | 3 | 12 | 105 |
| [frontend/src/components/abnormal/AbnormalCapitalSearch.jsx](/frontend/src/components/abnormal/AbnormalCapitalSearch.jsx) | JavaScript JSX | 73 | 0 | 7 | 80 |
| [frontend/src/components/abnormal/DetailDrawer.jsx](/frontend/src/components/abnormal/DetailDrawer.jsx) | JavaScript JSX | 91 | 4 | 12 | 107 |
| [frontend/src/components/abnormal/FilterBar.jsx](/frontend/src/components/abnormal/FilterBar.jsx) | JavaScript JSX | 111 | 2 | 8 | 121 |
| [frontend/src/components/abnormal/StockTable.jsx](/frontend/src/components/abnormal/StockTable.jsx) | JavaScript JSX | 113 | 0 | 6 | 119 |
| [frontend/src/components/abnormal/SummaryBar.jsx](/frontend/src/components/abnormal/SummaryBar.jsx) | JavaScript JSX | 78 | 0 | 6 | 84 |
| [frontend/src/components/attack/AttackRankTable.jsx](/frontend/src/components/attack/AttackRankTable.jsx) | JavaScript JSX | 104 | 0 | 5 | 109 |
| [frontend/src/components/attack/AttackSummary.jsx](/frontend/src/components/attack/AttackSummary.jsx) | JavaScript JSX | 48 | 0 | 4 | 52 |
| [frontend/src/components/attack/AttackTrendChart.jsx](/frontend/src/components/attack/AttackTrendChart.jsx) | JavaScript JSX | 53 | 0 | 5 | 58 |
| [frontend/src/components/attack/BattlefieldOverview.jsx](/frontend/src/components/attack/BattlefieldOverview.jsx) | JavaScript JSX | 107 | 0 | 8 | 115 |
| [frontend/src/components/attack/LeaderHierarchy.jsx](/frontend/src/components/attack/LeaderHierarchy.jsx) | JavaScript JSX | 38 | 1 | 6 | 45 |
| [frontend/src/components/attack/SectorDetailDrawer.jsx](/frontend/src/components/attack/SectorDetailDrawer.jsx) | JavaScript JSX | 169 | 0 | 10 | 179 |
| [frontend/src/components/attack/ThermalBattlefield.jsx](/frontend/src/components/attack/ThermalBattlefield.jsx) | JavaScript JSX | 56 | 1 | 7 | 64 |
| [frontend/src/components/fundflow/DateSelector.jsx](/frontend/src/components/fundflow/DateSelector.jsx) | JavaScript JSX | 44 | 0 | 4 | 48 |
| [frontend/src/components/fundflow/FlowHeatMap.jsx](/frontend/src/components/fundflow/FlowHeatMap.jsx) | JavaScript JSX | 144 | 3 | 14 | 161 |
| [frontend/src/components/fundflow/MarketFlowSummary.jsx](/frontend/src/components/fundflow/MarketFlowSummary.jsx) | JavaScript JSX | 44 | 0 | 4 | 48 |
| [frontend/src/components/fundflow/SectorDriftModal.jsx](/frontend/src/components/fundflow/SectorDriftModal.jsx) | JavaScript JSX | 187 | 8 | 16 | 211 |
| [frontend/src/components/fundflow/StrongSectorPanel.jsx](/frontend/src/components/fundflow/StrongSectorPanel.jsx) | JavaScript JSX | 123 | 2 | 5 | 130 |
| [frontend/src/components/fundflow/WeakSectorPanel.jsx](/frontend/src/components/fundflow/WeakSectorPanel.jsx) | JavaScript JSX | 110 | 2 | 5 | 117 |
| [frontend/src/components/stockpool/AddStockModal.jsx](/frontend/src/components/stockpool/AddStockModal.jsx) | JavaScript JSX | 106 | 1 | 12 | 119 |
| [frontend/src/components/stockpool/HeaderSummary.jsx](/frontend/src/components/stockpool/HeaderSummary.jsx) | JavaScript JSX | 66 | 1 | 5 | 72 |
| [frontend/src/components/stockpool/PoolTabs.jsx](/frontend/src/components/stockpool/PoolTabs.jsx) | JavaScript JSX | 50 | 0 | 6 | 56 |
| [frontend/src/components/stockpool/StockDetailDrawer.jsx](/frontend/src/components/stockpool/StockDetailDrawer.jsx) | JavaScript JSX | 225 | 0 | 24 | 249 |
| [frontend/src/components/stockpool/StockPoolSearch.jsx](/frontend/src/components/stockpool/StockPoolSearch.jsx) | JavaScript JSX | 182 | 3 | 13 | 198 |
| [frontend/src/components/stockpool/StockPoolTable.jsx](/frontend/src/components/stockpool/StockPoolTable.jsx) | JavaScript JSX | 538 | 1 | 26 | 565 |
| [frontend/src/components/stockpool/StrategyPerformanceHeader.jsx](/frontend/src/components/stockpool/StrategyPerformanceHeader.jsx) | JavaScript JSX | 755 | 12 | 39 | 806 |
| [frontend/src/components/stockpool/StrategyScoreAnalysisDrawer.jsx](/frontend/src/components/stockpool/StrategyScoreAnalysisDrawer.jsx) | JavaScript JSX | 851 | 13 | 35 | 899 |
| [frontend/src/components/stockpool/TradingPhaseGuide.jsx](/frontend/src/components/stockpool/TradingPhaseGuide.jsx) | JavaScript JSX | 295 | 7 | 9 | 311 |
| [frontend/src/components/stockpool/VolumePriceStrategy.jsx](/frontend/src/components/stockpool/VolumePriceStrategy.jsx) | JavaScript JSX | 289 | 7 | 11 | 307 |
| [frontend/src/components/stockpool/WinnerModeHeader.jsx](/frontend/src/components/stockpool/WinnerModeHeader.jsx) | JavaScript JSX | 162 | 4 | 16 | 182 |
| [frontend/src/index.css](/frontend/src/index.css) | PostCSS | 78 | 9 | 16 | 103 |
| [frontend/src/main.jsx](/frontend/src/main.jsx) | JavaScript JSX | 31 | 0 | 3 | 34 |
| [frontend/src/pages/AbnormalCapitalPage.jsx](/frontend/src/pages/AbnormalCapitalPage.jsx) | JavaScript JSX | 79 | 0 | 15 | 94 |
| [frontend/src/pages/Analysis.jsx](/frontend/src/pages/Analysis.jsx) | JavaScript JSX | 280 | 6 | 13 | 299 |
| [frontend/src/pages/ChipMonitorPage.jsx](/frontend/src/pages/ChipMonitorPage.jsx) | JavaScript JSX | 316 | 10 | 30 | 356 |
| [frontend/src/pages/DailyReview.jsx](/frontend/src/pages/DailyReview.jsx) | JavaScript JSX | 293 | 5 | 27 | 325 |
| [frontend/src/pages/Dashboard.jsx](/frontend/src/pages/Dashboard.jsx) | JavaScript JSX | 402 | 4 | 17 | 423 |
| [frontend/src/pages/MarketAttackPage.jsx](/frontend/src/pages/MarketAttackPage.jsx) | JavaScript JSX | 527 | 4 | 30 | 561 |
| [frontend/src/pages/MarketTemperaturePage.jsx](/frontend/src/pages/MarketTemperaturePage.jsx) | JavaScript JSX | 439 | 12 | 28 | 479 |
| [frontend/src/pages/RAGAnalysisPage.jsx](/frontend/src/pages/RAGAnalysisPage.jsx) | JavaScript JSX | 225 | 10 | 18 | 253 |
| [frontend/src/pages/ResearchLabPage.jsx](/frontend/src/pages/ResearchLabPage.jsx) | JavaScript JSX | 601 | 25 | 37 | 663 |
| [frontend/src/pages/SectorFundFlowPage.jsx](/frontend/src/pages/SectorFundFlowPage.jsx) | JavaScript JSX | 70 | 0 | 12 | 82 |
| [frontend/src/pages/SectorSentimentPage.jsx](/frontend/src/pages/SectorSentimentPage.jsx) | JavaScript JSX | 1,830 | 86 | 105 | 2,021 |
| [frontend/src/pages/StockPoolPage.jsx](/frontend/src/pages/StockPoolPage.jsx) | JavaScript JSX | 343 | 3 | 27 | 373 |
| [frontend/src/pages/TradeDetail.jsx](/frontend/src/pages/TradeDetail.jsx) | JavaScript JSX | 744 | 18 | 50 | 812 |
| [frontend/src/pages/TradeForm.jsx](/frontend/src/pages/TradeForm.jsx) | JavaScript JSX | 367 | 9 | 26 | 402 |
| [frontend/src/pages/TradePlaybook.jsx](/frontend/src/pages/TradePlaybook.jsx) | JavaScript JSX | 695 | 16 | 38 | 749 |
| [frontend/src/pages/Trades.jsx](/frontend/src/pages/Trades.jsx) | JavaScript JSX | 236 | 13 | 10 | 259 |
| [frontend/src/utils/constants.js](/frontend/src/utils/constants.js) | JavaScript | 66 | 7 | 7 | 80 |
| [frontend/src/utils/format.js](/frontend/src/utils/format.js) | JavaScript | 33 | 8 | 9 | 50 |
| [frontend/vite.config.js](/frontend/vite.config.js) | JavaScript | 14 | 0 | 2 | 16 |

[Summary](results.md) / Details / [Diff Summary](diff.md) / [Diff Details](diff-details.md)