package handler

import (
	"log"
	"net/http"

	"trading-review-system/backend/internal/dto"
	"trading-review-system/backend/internal/service"

	"github.com/gin-gonic/gin"
)

type RagHandler struct {
	service *service.RagService
}

func NewRagHandler(service *service.RagService) *RagHandler {
	return &RagHandler{service: service}
}

// Analyze handles POST /api/rag/analyze.
func (h *RagHandler) Analyze(c *gin.Context) {
	var req dto.RAGAnalyzeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.APIResponse{Code: 400, Message: "invalid request: " + err.Error()})
		return
	}

	if req.Query == "" {
		c.JSON(http.StatusBadRequest, dto.APIResponse{Code: 400, Message: "query is required"})
		return
	}

	log.Printf("[rag] analyze query=%q author=%q", req.Query, req.Author)

	result, err := h.service.Analyze(req.Query, req.Author)
	if err != nil {
		log.Printf("[rag] analyze error: %v", err)
		c.JSON(http.StatusInternalServerError, dto.APIResponse{Code: 500, Message: "AI分析失败: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.APIResponse{Code: 200, Message: "OK", Data: result})
}

// GetHotTopics handles GET /api/rag/hot-topics.
func (h *RagHandler) GetHotTopics(c *gin.Context) {
	topics, err := h.service.GetHotTopics()
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.APIResponse{Code: 500, Message: err.Error()})
		return
	}
	if topics == nil {
		topics = []service.HotTopic{}
	}
	c.JSON(http.StatusOK, dto.APIResponse{Code: 200, Message: "OK", Data: topics})
}

// GetAuthors handles GET /api/rag/authors.
func (h *RagHandler) GetAuthors(c *gin.Context) {
	authors, err := h.service.GetAuthors()
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.APIResponse{Code: 500, Message: err.Error()})
		return
	}
	if authors == nil {
		authors = []string{}
	}
	c.JSON(http.StatusOK, dto.APIResponse{Code: 200, Message: "OK", Data: authors})
}

// GetSystemStatus handles GET /api/rag/system-status.
func (h *RagHandler) GetSystemStatus(c *gin.Context) {
	status := h.service.GetSystemStatus()
	c.JSON(http.StatusOK, dto.APIResponse{Code: 200, Message: "OK", Data: status})
}
