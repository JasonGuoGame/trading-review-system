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

	"trading-review-system/backend/internal/config"
	"trading-review-system/backend/internal/dto"
)

// RagService handles AI-powered analysis via RAG (ChromaDB Sidecar + Ollama).
type RagService struct {
	chromaDBURL string // ChromaDB Python HTTP sidecar (http://host:8001)
	ollamaURL   string
	ollamaModel string
	httpClient  *http.Client
}

func NewRagService(cfg *config.Config) *RagService {
	return &RagService{
		chromaDBURL: strings.TrimRight(cfg.ChromaDBURL, "/"),
		ollamaURL:   strings.TrimRight(cfg.OllamaURL, "/"),
		ollamaModel: cfg.OllamaModel,
		httpClient:  &http.Client{Timeout: 300 * time.Second},
	}
}

// Analyze performs the full RAG pipeline: ChromaDB → build context → Ollama → structured result.
func (s *RagService) Analyze(query string, author string) (*dto.RAGAnalyzeResponse, error) {
	// Step 1 — query ChromaDB via HTTP sidecar
	docs, err := s.queryChroma(query, author)
	if err != nil {
		return nil, fmt.Errorf("ChromaDB query failed: %w", err)
	}

	// Step 2 — build context string from retrieved documents
	contextStr := s.buildContext(docs)

	// Step 3 — call Ollama with the structured prompt
	rawOutput, err := s.callOllama(query, contextStr)
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
func (s *RagService) queryChroma(query string, author string) ([]string, error) {
	reqBody := map[string]interface{}{
		"query_text": query,
		"n_results":  8,
	}
	if author != "" {
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
	log.Printf("[rag] retrieved %d documents from ChromaDB", len(docs))
	return docs, nil
}

// buildContext builds the context string injected into the prompt.
func (s *RagService) buildContext(docs []string) string {
	if len(docs) == 0 {
		return "（未检索到相关资料）"
	}
	var sb strings.Builder
	for i, doc := range docs {
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
func (s *RagService) callOllama(query string, contextStr string) (string, error) {
	prompt := s.buildPrompt(query, contextStr)

	reqBody := dto.OllamaChatRequest{
		Model:  s.ollamaModel,
		Stream: false,
		Messages: []dto.OllamaMessage{
			{Role: "user", Content: prompt},
		},
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
func (s *RagService) buildPrompt(query string, contextStr string) string {
	return fmt.Sprintf(`你是一个专业A股投研分析助手。

只能基于提供的水木论坛资料分析，不允许编造。

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

资料如下：
%s

问题：
%s`, contextStr, query)
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
