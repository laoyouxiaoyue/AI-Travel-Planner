package services

import (
	"ai-travel-planner/internal/config"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
)

type MapService struct {
	config *config.Config
}

type AmapResponse struct {
	Status string `json:"status"`
	Info   string `json:"info"`
	Count  string `json:"count"`
	Pois   []Poi  `json:"pois"`
}

type Poi struct {
	ID       string  `json:"id"`
	Name     string  `json:"name"`
	Type     string  `json:"type"`
	Address  string  `json:"address"`
	Location string  `json:"location"`
	Lat      float64 `json:"lat"`
	Lng      float64 `json:"lng"`
	Tel      string  `json:"tel"`
	Distance string  `json:"distance"`
}

type RouteResponse struct {
	Status string `json:"status"`
	Info   string `json:"info"`
	Route  struct {
		Paths []struct {
			Distance int `json:"distance"`
			Duration int `json:"duration"`
			Steps    []struct {
				Instruction string `json:"instruction"`
				Road        string `json:"road"`
				Distance    int    `json:"distance"`
				Duration    int    `json:"duration"`
			} `json:"steps"`
		} `json:"paths"`
	} `json:"route"`
}

func NewMapService(cfg *config.Config) *MapService {
	return &MapService{
		config: cfg,
	}
}

// SearchPlaces 搜索地点
func (s *MapService) SearchPlaces(keyword, city string) ([]Poi, error) {
	baseURL := "https://restapi.amap.com/v3/place/text"
	params := url.Values{}
	params.Set("key", s.config.APIs.AmapAPIKey)
	params.Set("keywords", keyword)
	params.Set("city", city)
	params.Set("output", "json")

	resp, err := http.Get(baseURL + "?" + params.Encode())
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var amapResp AmapResponse
	if err := json.Unmarshal(body, &amapResp); err != nil {
		return nil, err
	}

	if amapResp.Status != "1" {
		return nil, fmt.Errorf("amap API error: %s", amapResp.Info)
	}

	return amapResp.Pois, nil
}

// GetRoute 获取路线规划
func (s *MapService) GetRoute(origin, destination, strategy string) (*RouteResponse, error) {
	baseURL := "https://restapi.amap.com/v3/direction/driving"
	params := url.Values{}
	params.Set("key", s.config.APIs.AmapAPIKey)
	params.Set("origin", origin)
	params.Set("destination", destination)
	params.Set("strategy", strategy)
	params.Set("output", "json")

	resp, err := http.Get(baseURL + "?" + params.Encode())
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var routeResp RouteResponse
	if err := json.Unmarshal(body, &routeResp); err != nil {
		return nil, err
	}

	if routeResp.Status != "1" {
		return nil, fmt.Errorf("amap API error: %s", routeResp.Info)
	}

	return &routeResp, nil
}

// GetNearbyPlaces 获取附近地点
func (s *MapService) GetNearbyPlaces(location, types string, radius int) ([]Poi, error) {
	baseURL := "https://restapi.amap.com/v3/place/around"
	params := url.Values{}
	params.Set("key", s.config.APIs.AmapAPIKey)
	params.Set("location", location)
	params.Set("types", types)
	params.Set("radius", fmt.Sprintf("%d", radius))
	params.Set("output", "json")

	resp, err := http.Get(baseURL + "?" + params.Encode())
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var amapResp AmapResponse
	if err := json.Unmarshal(body, &amapResp); err != nil {
		return nil, err
	}

	if amapResp.Status != "1" {
		return nil, fmt.Errorf("amap API error: %s", amapResp.Info)
	}

	return amapResp.Pois, nil
}





