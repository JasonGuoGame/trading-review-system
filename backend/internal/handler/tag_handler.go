package handler

import (
	"net/http"

	"trading-review-system/backend/internal/dto"
	"trading-review-system/backend/internal/service"

	"github.com/gin-gonic/gin"
)

type TagHandler struct {
	service *service.TagService
}

func NewTagHandler(service *service.TagService) *TagHandler {
	return &TagHandler{service: service}
}

// GET /api/tags
func (h *TagHandler) List(c *gin.Context) {
	tags, err := h.service.GetAllTags()
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.APIResponse{Code: 500, Message: "Failed to list tags"})
		return
	}

	c.JSON(http.StatusOK, dto.APIResponse{Code: 200, Message: "OK", Data: tags})
}

// POST /api/tags
func (h *TagHandler) Create(c *gin.Context) {
	var req dto.CreateTagRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.APIResponse{Code: 400, Message: "Invalid request: " + err.Error()})
		return
	}

	tag, err := h.service.CreateTag(req.Name, req.Category)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.APIResponse{Code: 500, Message: "Failed to create tag: " + err.Error()})
		return
	}

	c.JSON(http.StatusCreated, dto.APIResponse{Code: 201, Message: "Tag created", Data: tag})
}
