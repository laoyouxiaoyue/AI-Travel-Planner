package handlers

import (
	"ai-travel-planner/internal/services"
	"net/http"

	"github.com/gin-gonic/gin"
)

type MapHandler struct {
	mapService *services.AmapService
}

func NewMapHandler(mapService *services.AmapService) *MapHandler {
	return &MapHandler{
		mapService: mapService,
	}
}

// GeocodeRequest 地理编码请求
type GeocodeRequest struct {
	Address string `json:"address" binding:"required"`
}

// Geocode 地理编码：地址转坐标
func (h *MapHandler) Geocode(c *gin.Context) {
	var req GeocodeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "地址参数不能为空"})
		return
	}

	result, err := h.mapService.Geocode(req.Address)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":   result.Status,
		"count":    result.Count,
		"geocodes": result.Geocodes,
	})
}

// RegeocodeRequest 逆地理编码请求
type RegeocodeRequest struct {
	Longitude string `json:"longitude" binding:"required"`
	Latitude  string `json:"latitude" binding:"required"`
}

// Regeocode 逆地理编码：坐标转地址
func (h *MapHandler) Regeocode(c *gin.Context) {
	var req RegeocodeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "坐标参数不能为空"})
		return
	}

	result, err := h.mapService.Regeocode(req.Longitude, req.Latitude)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":    result.Status,
		"regeocode": result.Regeocode,
	})
}

// SearchPOIRequest POI搜索请求
type SearchPOIRequest struct {
	Keyword string `json:"keyword" binding:"required"`
	City    string `json:"city"`
	Types   string `json:"types"` // POI类型，如：餐饮服务|购物服务
}

// SearchPOI POI搜索
func (h *MapHandler) SearchPOI(c *gin.Context) {
	var req SearchPOIRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "关键词不能为空"})
		return
	}

	result, err := h.mapService.SearchPOI(req.Keyword, req.City, req.Types)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status": result.Status,
		"count":  result.Count,
		"pois":   result.Pois,
	})
}

// RouteRequest 路线规划请求
type RouteRequest struct {
	Origin      string `json:"origin" binding:"required"`      // 起点坐标 "经度,纬度" 或地址
	Destination string `json:"destination" binding:"required"` // 终点坐标 "经度,纬度" 或地址
	Mode        string `json:"mode"`                           // driving:驾车 walking:步行 transit:公交
	City        string `json:"city"`                           // 城市（公交路线规划时需要）
}

// Route 路线规划
func (h *MapHandler) Route(c *gin.Context) {
	var req RouteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "起点和终点不能为空"})
		return
	}

	var result *services.RouteResponse
	var err error

	switch req.Mode {
	case "driving":
		result, err = h.mapService.DrivingRoute(req.Origin, req.Destination)
	case "walking":
		result, err = h.mapService.WalkingRoute(req.Origin, req.Destination)
	case "transit":
		result, err = h.mapService.TransitRoute(req.Origin, req.Destination, req.City)
	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "不支持的路线规划模式，支持: driving, walking, transit"})
		return
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status": result.Status,
		"route":  result.Route,
		"count":  result.Count,
	})
}

// DistanceRequest 距离计算请求
type DistanceRequest struct {
	Origins      string `json:"origins" binding:"required"`      // 起点坐标，多个用|分隔 "经度,纬度|经度,纬度"
	Destinations string `json:"destinations" binding:"required"` // 终点坐标，多个用|分隔
	Mode         string `json:"mode"`                            // 0:直线距离 1:驾车距离 3:步行距离
}

// Distance 计算距离
func (h *MapHandler) Distance(c *gin.Context) {
	var req DistanceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "起点和终点不能为空"})
		return
	}

	result, err := h.mapService.CalculateDistance(req.Origins, req.Destinations, req.Mode)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  result.Status,
		"results": result.Results,
	})
}

// GetAmapApiKey 获取高德地图API Key（用于前端加载SDK）
func (h *MapHandler) GetAmapApiKey(c *gin.Context) {
	apiKey := h.mapService.GetApiKey()
	if apiKey == "" {
		c.JSON(http.StatusOK, gin.H{
			"apiKey": "",
			"message": "高德地图API Key未配置",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"apiKey": apiKey,
	})
}
