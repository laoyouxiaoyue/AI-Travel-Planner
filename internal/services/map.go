package services

import (
	"ai-travel-planner/internal/config"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"time"
)

// AmapService 高德地图服务
type AmapService struct {
	config   *config.Config
	apiKey   string
	baseURL  string
	client   *http.Client
}

// NewAmapService 创建高德地图服务
func NewAmapService(cfg *config.Config) *AmapService {
	return &AmapService{
		config:  cfg,
		apiKey:  cfg.APIs.Amap.APIKey,
		baseURL: "https://restapi.amap.com/v3",
		client: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

// GetApiKey 获取API Key
func (s *AmapService) GetApiKey() string {
	return s.apiKey
}

// GeocodeResponse 地理编码响应
type GeocodeResponse struct {
	Status    string   `json:"status"`
	Count     string   `json:"count"`
	Info      string   `json:"info"`
	Geocodes  []Geocode `json:"geocodes"`
}

// Geocode 地理编码结果
type Geocode struct {
	FormattedAddress string `json:"formatted_address"`
	Country          string `json:"country"`
	Province         string `json:"province"`
	City             string `json:"city"`
	District         string `json:"district"`
	Location         string `json:"location"` // "经度,纬度"
	Level            string `json:"level"`
}

// RegeocodeResponse 逆地理编码响应
type RegeocodeResponse struct {
	Status    string   `json:"status"`
	Regeocode Regeocode `json:"regeocode"`
	Info      string   `json:"info"`
}

// Regeocode 逆地理编码结果
type Regeocode struct {
	FormattedAddress string                 `json:"formatted_address"`
	AddressComponent AddressComponent       `json:"addressComponent"`
	Pois             []POI                  `json:"pois"`
}

// AddressComponent 地址组件
type AddressComponent struct {
	Country  string `json:"country"`
	Province string `json:"province"`
	City     string `json:"city"`
	District string `json:"district"`
	Township string `json:"township"`
	Street   string `json:"street"`
	Adcode   string `json:"adcode"`
}

// POIResponse POI搜索响应
type POIResponse struct {
	Status string `json:"status"`
	Count  string `json:"count"`
	Info   string `json:"info"`
	Pois   []POI  `json:"pois"`
}

// POI 兴趣点
type POI struct {
	ID       string `json:"id"`
	Name     string `json:"name"`
	Type     string `json:"type"`
	Typecode string `json:"typecode"`
	Location string `json:"location"` // "经度,纬度"
	Address  string `json:"address"`
	Tel      string `json:"tel"`
	Distance string `json:"distance"`
}

// RouteResponse 路线规划响应
type RouteResponse struct {
	Status string    `json:"status"`
	Info   string    `json:"info"`
	Count  string    `json:"count"`
	Route  RouteData `json:"route"`
}

// RouteData 路线数据
type RouteData struct {
	Paths []Path `json:"paths"`
}

// Path 路径
type Path struct {
	Distance string `json:"distance"` // 距离（米）
	Duration string `json:"duration"` // 时间（秒）
	Steps    []Step `json:"steps"`
}

// Step 步骤
type Step struct {
	Instruction string `json:"instruction"`
	Road        string `json:"road"`
	Distance    string `json:"distance"`
	Duration    string `json:"duration"`
	Polyline    string `json:"polyline"`
	Action      string `json:"action"`
}

// DistanceResponse 距离计算响应
type DistanceResponse struct {
	Status string      `json:"status"`
	Info   string      `json:"info"`
	Results []DistanceResult `json:"results"`
}

// DistanceResult 距离结果
type DistanceResult struct {
	OriginID      string `json:"origin_id"`
	DestID        string `json:"dest_id"`
	Distance      string `json:"distance"` // 距离（米）
	Duration      string `json:"duration"` // 时间（秒）
}

// Geocode 地理编码：地址转坐标
func (s *AmapService) Geocode(address string) (*GeocodeResponse, error) {
	if s.apiKey == "" {
		return nil, fmt.Errorf("高德地图API Key未配置")
	}

	params := url.Values{}
	params.Set("key", s.apiKey)
	params.Set("address", address)

	resp, err := s.client.Get(fmt.Sprintf("%s/geocode/geo?%s", s.baseURL, params.Encode()))
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var result GeocodeResponse
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, err
	}

	if result.Status != "1" {
		return nil, fmt.Errorf("地理编码失败: %s", result.Info)
	}

	return &result, nil
}

// Regeocode 逆地理编码：坐标转地址
func (s *AmapService) Regeocode(longitude, latitude string) (*RegeocodeResponse, error) {
	if s.apiKey == "" {
		return nil, fmt.Errorf("高德地图API Key未配置")
	}

	params := url.Values{}
	params.Set("key", s.apiKey)
	params.Set("location", fmt.Sprintf("%s,%s", longitude, latitude))

	resp, err := s.client.Get(fmt.Sprintf("%s/geocode/regeo?%s", s.baseURL, params.Encode()))
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var result RegeocodeResponse
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, err
	}

	if result.Status != "1" {
		return nil, fmt.Errorf("逆地理编码失败: %s", result.Info)
	}

	return &result, nil
}

// SearchPOI POI搜索
func (s *AmapService) SearchPOI(keyword string, city string, types string) (*POIResponse, error) {
	if s.apiKey == "" {
		return nil, fmt.Errorf("高德地图API Key未配置")
	}

	params := url.Values{}
	params.Set("key", s.apiKey)
	params.Set("keywords", keyword)
	if city != "" {
		params.Set("city", city)
	}
	if types != "" {
		params.Set("types", types)
	}
	params.Set("offset", "20")
	params.Set("page", "1")
	params.Set("extensions", "all")

	resp, err := s.client.Get(fmt.Sprintf("%s/place/text?%s", s.baseURL, params.Encode()))
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var result POIResponse
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, err
	}

	if result.Status != "1" {
		return nil, fmt.Errorf("POI搜索失败: %s", result.Info)
	}

	return &result, nil
}

// DrivingRoute 驾车路线规划
func (s *AmapService) DrivingRoute(origin, destination string) (*RouteResponse, error) {
	return s.route("driving", origin, destination)
}

// WalkingRoute 步行路线规划
func (s *AmapService) WalkingRoute(origin, destination string) (*RouteResponse, error) {
	return s.route("walking", origin, destination)
}

// TransitRoute 公交路线规划
func (s *AmapService) TransitRoute(origin, destination string, city string) (*RouteResponse, error) {
	if s.apiKey == "" {
		return nil, fmt.Errorf("高德地图API Key未配置")
	}

	params := url.Values{}
	params.Set("key", s.apiKey)
	params.Set("origin", origin)
	params.Set("destination", destination)
	if city != "" {
		params.Set("city", city)
	}

	resp, err := s.client.Get(fmt.Sprintf("%s/direction/transit/integrated?%s", s.baseURL, params.Encode()))
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var result RouteResponse
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, err
	}

	if result.Status != "1" {
		return nil, fmt.Errorf("公交路线规划失败: %s", result.Info)
	}

	return &result, nil
}

// route 通用路线规划方法
func (s *AmapService) route(mode, origin, destination string) (*RouteResponse, error) {
	if s.apiKey == "" {
		return nil, fmt.Errorf("高德地图API Key未配置")
	}

	params := url.Values{}
	params.Set("key", s.apiKey)
	params.Set("origin", origin)
	params.Set("destination", destination)

	var apiPath string
	switch mode {
	case "driving":
		apiPath = "/direction/driving"
	case "walking":
		apiPath = "/direction/walking"
	default:
		return nil, fmt.Errorf("不支持的路线规划模式: %s", mode)
	}

	resp, err := s.client.Get(fmt.Sprintf("%s%s?%s", s.baseURL, apiPath, params.Encode()))
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var result RouteResponse
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, err
	}

	if result.Status != "1" {
		return nil, fmt.Errorf("路线规划失败: %s", result.Info)
	}

	return &result, nil
}

// CalculateDistance 计算距离
func (s *AmapService) CalculateDistance(origins, destinations string, mode string) (*DistanceResponse, error) {
	if s.apiKey == "" {
		return nil, fmt.Errorf("高德地图API Key未配置")
	}

	params := url.Values{}
	params.Set("key", s.apiKey)
	params.Set("origins", origins)
	params.Set("destination", destinations)
	if mode != "" {
		params.Set("type", mode) // 0:直线距离 1:驾车距离 3:步行距离
	}

	resp, err := s.client.Get(fmt.Sprintf("%s/distance?%s", s.baseURL, params.Encode()))
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var result DistanceResponse
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, err
	}

	if result.Status != "1" {
		return nil, fmt.Errorf("距离计算失败: %s", result.Info)
	}

	return &result, nil
}
