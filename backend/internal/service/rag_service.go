package service

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"
	"time"

	"gorm.io/gorm"

	"trading-review-system/backend/internal/config"
	"trading-review-system/backend/internal/dto"
)

// RagService handles AI-powered analysis via RAG (ChromaDB Sidecar + Ollama).
type RagService struct {
	chromaDBURL string // ChromaDB Python HTTP sidecar (http://host:8001)
	ollamaURL   string
	ollamaModel string
	httpClient  *http.Client
	db          *gorm.DB // for forum_post queries
}

func NewRagService(cfg *config.Config, db *gorm.DB) *RagService {
	return &RagService{
		chromaDBURL: strings.TrimRight(cfg.ChromaDBURL, "/"),
		ollamaURL:   strings.TrimRight(cfg.OllamaURL, "/"),
		ollamaModel: cfg.OllamaModel,
		httpClient:  &http.Client{Timeout: 300 * time.Second},
		db:          db,
	}
}

// HotTopic represents a trending discussion topic from forum_post.
type HotTopic struct {
	Topic string `json:"topic"`
	Count int    `json:"count"`
}

// GetHotTopics returns today's top 5 most discussed topics.
// Falls back to last 7 days if no posts today.
func (s *RagService) GetHotTopics() ([]HotTopic, error) {
	if s.db == nil {
		return nil, nil
	}
	var topics []HotTopic
	// Try today first, fall back to recent 7 days
	for _, cond := range []string{
		"created_time >= CURDATE()",
		"created_time >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)",
	} {
		err := s.db.Raw(`
			SELECT topic, COUNT(*) AS count
			FROM forum_post
			WHERE `+cond+` AND topic IS NOT NULL AND topic != '全市场'
			GROUP BY topic ORDER BY count DESC LIMIT 5
		`).Scan(&topics).Error
		if err != nil {
			return nil, err
		}
		if len(topics) > 0 {
			break
		}
	}
	return topics, nil
}

// GetAuthors returns recent distinct authors for the filter dropdown.
func (s *RagService) GetAuthors() ([]string, error) {
	if s.db == nil {
		return nil, nil
	}
	var authors []string
	err := s.db.Raw(`
		SELECT author FROM (
			SELECT DISTINCT author, MAX(id) AS max_id
			FROM forum_post
			WHERE author != ''
			GROUP BY author
		) t
		ORDER BY max_id DESC LIMIT 50
	`).Scan(&authors).Error
	if err != nil {
		return nil, err
	}
	return authors, nil
}

// GetSystemStatus checks the health of all dependent services.
func (s *RagService) GetSystemStatus() *dto.SystemStatusResponse {
	result := &dto.SystemStatusResponse{}

	// 1. Ollama
	result.Ollama = dto.SystemStatusItem{Name: "Ollama (LLM + Embedding)"}
	resp, err := s.httpClient.Get(s.ollamaURL + "/api/tags")
	if err != nil {
		result.Ollama = dto.SystemStatusItem{Name: "Ollama", Status: "error", Message: err.Error()}
	} else {
		resp.Body.Close()
		if resp.StatusCode == 200 {
			result.Ollama = dto.SystemStatusItem{Name: "Ollama", Status: "ok",
				Message: fmt.Sprintf("%s:%s 运行中", s.ollamaURL, s.ollamaModel)}
		} else {
			result.Ollama = dto.SystemStatusItem{Name: "Ollama", Status: "error",
				Message: fmt.Sprintf("返回 %d", resp.StatusCode)}
		}
	}

	// 2. ChromaDB sidecar
	result.ChromaDB = dto.SystemStatusItem{Name: "ChromaDB Sidecar"}
	resp2, err := s.httpClient.Get(s.chromaDBURL + "/health")
	if err != nil {
		result.ChromaDB = dto.SystemStatusItem{Name: "ChromaDB Sidecar", Status: "error", Message: err.Error()}
	} else {
		defer resp2.Body.Close()
		if resp2.StatusCode == 200 {
			var health struct {
				Status     string `json:"status"`
				Collection string `json:"collection"`
				Count      int    `json:"count"`
			}
			json.NewDecoder(resp2.Body).Decode(&health)
			result.ChromaDB = dto.SystemStatusItem{Name: "ChromaDB Sidecar", Status: "ok",
				Message: fmt.Sprintf("collection=%s count=%d", health.Collection, health.Count)}
		} else {
			result.ChromaDB = dto.SystemStatusItem{Name: "ChromaDB Sidecar", Status: "error",
				Message: fmt.Sprintf("返回 %d", resp2.StatusCode)}
		}
	}

	// 3. MySQL
	result.MySQL = dto.SystemStatusItem{Name: "MySQL (forum_post)"}
	if s.db == nil {
		result.MySQL = dto.SystemStatusItem{Name: "MySQL", Status: "error", Message: "未配置数据库连接"}
	} else {
		sqlDB, err := s.db.DB()
		if err != nil {
			result.MySQL = dto.SystemStatusItem{Name: "MySQL", Status: "error", Message: err.Error()}
		} else {
			err = sqlDB.Ping()
			if err != nil {
				result.MySQL = dto.SystemStatusItem{Name: "MySQL", Status: "error", Message: err.Error()}
			} else {
				var count int64
				s.db.Raw("SELECT COUNT(*) FROM forum_post").Scan(&count)
				result.MySQL = dto.SystemStatusItem{Name: "MySQL", Status: "ok",
					Message: fmt.Sprintf("forum_post: %d 条帖子", count)}
			}
		}
	}

	return result
}

// Analyze performs the full RAG pipeline: ChromaDB → build context → Ollama → structured result.
func (s *RagService) Analyze(query string, author string) (*dto.RAGAnalyzeResponse, error) {
	// Step 0 — fetch hot topics from MySQL for context
	hotTopics, _ := s.GetHotTopics()

	// Step 1 — query ChromaDB via HTTP sidecar
	docs, err := s.queryChroma(query, author)
	if err != nil {
		return nil, fmt.Errorf("ChromaDB query failed: %w", err)
	}

	// Step 2 — build context string from retrieved documents
	contextStr := s.buildContext(docs)

	// Step 3 — call Ollama with the structured prompt
	rawOutput, err := s.callOllama(query, contextStr, author, hotTopics)
	if err != nil {
		return nil, fmt.Errorf("Ollama call failed: %w", err)
	}

	// Step 4 — parse the raw output into thinking / report sections
	thinking, report := s.parseOutput(rawOutput)

	// Step 5 — build source list
	sources := s.buildSources(docs)

	return &dto.RAGAnalyzeResponse{
		Thinking: thinking,
		Report:   report,
		Sources:  sources,
	}, nil
}

// queryChroma calls the ChromaDB Python HTTP sidecar.
// If author filter returns empty, retries without filter.
func (s *RagService) queryChroma(query string, author string) ([]string, error) {
	for _, useFilter := range []bool{true, false} {
		if !useFilter && author == "" {
			continue // no need to retry without filter if no filter was used
		}

		reqBody := map[string]interface{}{
			"query_text": query,
			"n_results":  10,
		}
		if useFilter && author != "" {
			reqBody["author"] = author
		}

		jsonBody, err := json.Marshal(reqBody)
		if err != nil {
			return nil, fmt.Errorf("marshal request: %w", err)
		}

		resp, err := s.httpClient.Post(
			s.chromaDBURL+"/query",
			"application/json",
			bytes.NewBuffer(jsonBody),
		)
		if err != nil {
			return nil, fmt.Errorf("chroma sidecar http post: %w", err)
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			bodyBytes, _ := io.ReadAll(resp.Body)
			return nil, fmt.Errorf("chroma sidecar returned %d: %s", resp.StatusCode, string(bodyBytes))
		}

		var output dto.ChromaSubprocessOutput
		if err := json.NewDecoder(resp.Body).Decode(&output); err != nil {
			return nil, fmt.Errorf("decode chroma response: %w", err)
		}

		if output.Error != nil && *output.Error != "" {
			return nil, fmt.Errorf("chroma sidecar error: %s", *output.Error)
		}

		// Flatten documents from all result groups
		var docs []string
		for _, group := range output.Documents {
			docs = append(docs, group...)
		}

		if len(docs) > 0 {
			if useFilter && author != "" {
				log.Printf("[rag] retrieved %d documents with author filter %q", len(docs), author)
			} else {
				log.Printf("[rag] author filter %q returned empty, fallback: %d documents", author, len(docs))
			}
			return docs, nil
		}

		// If author filter returned empty, log and retry without filter
		if useFilter {
			log.Printf("[rag] author filter %q returned 0 docs, retrying without filter", author)
		}
	}
	return nil, nil
}

// buildContext builds the context string injected into the prompt.
// Each document is truncated to avoid exceeding the LLM context window.
func (s *RagService) buildContext(docs []string) string {
	if len(docs) == 0 {
		return "（未检索到相关资料）"
	}
	maxDocs := 8
	maxCharsPerDoc := 600
	if len(docs) > maxDocs {
		docs = docs[:maxDocs]
	}
	var sb strings.Builder
	for i, doc := range docs {
		runes := []rune(doc)
		if len(runes) > maxCharsPerDoc {
			doc = string(runes[:maxCharsPerDoc]) + "…"
		}
		sb.WriteString(fmt.Sprintf("\n【帖子%d】\n%s\n", i+1, doc))
	}
	return sb.String()
}

// buildSources builds the source summaries for the API response.
func (s *RagService) buildSources(docs []string) []string {
	sources := make([]string, 0, len(docs))
	for i, doc := range docs {
		preview := doc
		if len([]rune(preview)) > 80 {
			preview = string([]rune(preview)[:80]) + "…"
		}
		sources = append(sources, fmt.Sprintf("帖子%d: %s", i+1, preview))
	}
	return sources
}

// callOllama sends the prompt to Ollama and returns the raw response text.
func (s *RagService) callOllama(query string, contextStr string, author string, hotTopics []HotTopic) (string, error) {
	prompt := s.buildPrompt(query, contextStr, author, hotTopics)

	reqBody := dto.OllamaChatRequest{
		Model:  s.ollamaModel,
		Stream: false,
		Messages: []dto.OllamaMessage{
			{Role: "user", Content: prompt},
		},
		Options: &dto.OllamaOptions{NumCtx: 8192},
	}

	jsonBody, err := json.Marshal(reqBody)
	if err != nil {
		return "", fmt.Errorf("marshal ollama request: %w", err)
	}

	resp, err := s.httpClient.Post(
		s.ollamaURL+"/api/chat",
		"application/json",
		bytes.NewBuffer(jsonBody),
	)
	if err != nil {
		return "", fmt.Errorf("ollama http post: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("ollama returned %d: %s", resp.StatusCode, string(bodyBytes))
	}

	var cr dto.OllamaChatResponse
	if err := json.NewDecoder(resp.Body).Decode(&cr); err != nil {
		return "", fmt.Errorf("decode ollama response: %w", err)
	}

	return cr.Message.Content, nil
}

// buildPrompt builds the structured system prompt for DeepSeek R1.
func (s *RagService) buildPrompt(query string, contextStr string, author string, hotTopics []HotTopic) string {
	// Build hot topics summary
	hotSummary := ""
	if len(hotTopics) > 0 {
		parts := make([]string, len(hotTopics))
		for i, t := range hotTopics {
			parts[i] = fmt.Sprintf("%s(%d次)", t.Topic, t.Count)
		}
		hotSummary = "今日论坛最热话题: " + strings.Join(parts, "、")
	}

	// Smart routing hints based on query content
	routingHint := ""
	lowerQ := strings.ToLower(query)
	if strings.Contains(lowerQ, "最热") || strings.Contains(lowerQ, "热门") || strings.Contains(lowerQ, "讨论") {
		routingHint = fmt.Sprintf("用户询问论坛讨论热点。请结合今日热榜（%s）和检索到的帖子，给出综合判断。", hotSummary)
	} else if author != "" {
		routingHint = fmt.Sprintf("用户定向分析作者「%s」。请从资料中提取该作者提到的所有股票代码/名称，并区分看好/看空。总结其操作风格。如果检索结果中未找到该作者的帖子，请诚实说明并从现有资料中尽力回答。", author)
	} else {
		routingHint = "请根据检索到的帖子进行深度分析。如涉及特定股票，归纳利好利空并关注技术位。"
	}

	today := time.Now().Format("2006-01-02")

	return fmt.Sprintf(`你是一个资深A股量化策略分析师。

只能基于提供的资料分析，不允许编造。如果资料中没有直接答案，诚实说明。

### 核心约束 ###
1. 今天的日期是 %s。
2. 资料中越接近今天的言论，参考权重越高。超过30天的旧帖仅作背景参考。

%s

### 今日市场热度 ###
%s

### 检索到的水木论坛帖子 ###
%s

### 用户问题 ###
%s

### 输出要求 ###
请按以下结构输出：

【思考过程】
1. 检索到的主要观点
2. 多空分歧
3. 情绪与资金线索
4. 风险点

【最终报告】
1. 行业判断
2. 当前阶段（启动/加速/分歧/退潮）
3. 是否可参与（给出明确结论）
4. 操作建议（短线/中线）
5. 涉及个股（如有）：列出股票代码/名称及观点方向（看好/看空/中性）`, today, routingHint, hotSummary, contextStr, query)
}

// parseOutput splits the raw LLM output into thinking and report sections.
func (s *RagService) parseOutput(raw string) (thinking string, report string) {
	// Try to split by the 【最终报告】 marker
	parts := strings.SplitN(raw, "【最终报告】", 2)
	if len(parts) == 2 {
		thinking = strings.TrimSpace(strings.TrimPrefix(parts[0], "【思考过程】"))
		thinking = strings.TrimSpace(thinking)
		report = "【最终报告】\n" + strings.TrimSpace(parts[1])
	} else {
		// Fallback: return raw as thinking, empty report
		thinking = raw
		report = ""
	}

	log.Printf("[rag] thinking length=%d, report length=%d", len(thinking), len(report))
	return
}
