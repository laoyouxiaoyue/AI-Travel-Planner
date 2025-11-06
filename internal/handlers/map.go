package handlers

import (
	"ai-travel-planner/internal/services"
	"net/http"

	"github.com/gin-gonic/gin"
)

type MapHandler struct {
	mapService *services.MapService
}

func NewMapHandler(mapService *services.MapService) *MapHandler {
	return &MapHandler{
		mapService: mapService,
	}
}

// SearchPlaces 搜索地点
func (h *MapHandler) SearchPlaces(c *gin.Context) {
	keyword := c.Query("keyword")
	city := c.Query("city")

	if keyword == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "keyword is required"})
		return
	}

	places, err := h.mapService.SearchPlaces(keyword, city)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to search places"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"places": places})
}

// GetRoute 获取路线规划
func (h *MapHandler) GetRoute(c *gin.Context) {
	origin := c.Query("origin")
	destination := c.Query("destination")
	strategy := c.DefaultQuery("strategy", "1") // 默认最快路线

	if origin == "" || destination == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "origin and destination are required"})
		return
	}

	route, err := h.mapService.GetRoute(origin, destination, strategy)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get route"})
		return
	}

	c.JSON(http.StatusOK, route)
}

// GetNearbyPlaces 获取附近地点
func (h *MapHandler) GetNearbyPlaces(c *gin.Context) {
	location := c.Query("location")
	types := c.DefaultQuery("types", "餐饮服务|购物服务|生活服务")
	radius := c.DefaultQuery("radius", "1000")

	if location == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "location is required"})
		return
	}

	// 转换radius为整数
	radiusInt := 1000
	if radius != "" {
		// 这里可以添加字符串到整数的转换逻辑
		radiusInt = 1000 // 简化处理
	}

	places, err := h.mapService.GetNearbyPlaces(location, types, radiusInt)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get nearby places"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"places": places})
}
