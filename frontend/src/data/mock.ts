/** 类型定义：汇率、新闻、股市、地区等。数据均来自后端 API，无 mock。 */

/** 地图按国家划分，与后端 REGIONS 一致 */
export type RegionId = string

export interface FxPair {
  pair: string
  rate: number
  change: number
  changePct: number
}

export type NewsCategory = '政治' | '经济' | '军事' | '科技' | '人工智能' | '事件'

export interface NewsItem {
  id: string
  title: string
  source: string
  time: string
  region?: RegionId
  category?: NewsCategory
  link?: string
}

export interface StockIndex {
  name: string
  symbol: string
  value: number
  change: number
  changePct: number
}

export interface MapSpot {
  id: RegionId
  name: string
  lat: number
  lng: number
  count: number
}

export interface KeyMetric {
  name: string
  value: string
  changePct: number
}

export interface Commodity {
  name: string
  value: number
  unit: string
  changePct: number
}

export interface RateItem {
  name: string
  value: string
  changePct: number
}

export interface AShareIndex {
  name: string
  symbol: string
  value: number
  change: number
  changePct: number
}

export interface AShareNewsItem {
  id: string
  title: string
  source: string
  time: string
  link?: string
}

/** 地图按国家展示，默认几何与中文名（count 由 /api/map-spots 实时返回） */
export const MAP_SPOTS_DEFAULT: MapSpot[] = [
  { id: 'US', name: '美国', lat: 40.7, lng: -74, count: 0 },
  { id: 'UK', name: '英国', lat: 51.5, lng: -0.1, count: 0 },
  { id: 'CN', name: '中国', lat: 31.2, lng: 121.5, count: 0 },
  { id: 'CA', name: '加拿大', lat: 43.65, lng: -79.38, count: 0 },
  { id: 'DE', name: '德国', lat: 52.52, lng: 13.4, count: 0 },
  { id: 'FR', name: '法国', lat: 48.86, lng: 2.35, count: 0 },
  { id: 'IT', name: '意大利', lat: 41.9, lng: 12.5, count: 0 },
  { id: 'ES', name: '西班牙', lat: 40.42, lng: -3.7, count: 0 },
  { id: 'NL', name: '荷兰', lat: 52.37, lng: 4.89, count: 0 },
  { id: 'RU', name: '俄罗斯', lat: 55.75, lng: 37.62, count: 0 },
  { id: 'JP', name: '日本', lat: 35.7, lng: 139.7, count: 0 },
  { id: 'KR', name: '韩国', lat: 37.57, lng: 126.98, count: 0 },
  { id: 'IN', name: '印度', lat: 19.08, lng: 72.88, count: 0 },
  { id: 'AU', name: '澳大利亚', lat: -33.87, lng: 151.21, count: 0 },
  { id: 'BR', name: '巴西', lat: -23.55, lng: -46.63, count: 0 },
  { id: 'MX', name: '墨西哥', lat: 19.43, lng: -99.13, count: 0 },
  { id: 'AE', name: '阿联酋', lat: 25.2, lng: 55.3, count: 0 },
  { id: 'SA', name: '沙特', lat: 24.71, lng: 46.68, count: 0 },
  { id: 'TR', name: '土耳其', lat: 39.93, lng: 32.85, count: 0 },
  { id: 'PL', name: '波兰', lat: 52.23, lng: 21.01, count: 0 },
  { id: 'SG', name: '新加坡', lat: 1.35, lng: 103.8, count: 0 },
  { id: 'ID', name: '印尼', lat: -6.2, lng: 106.82, count: 0 },
  { id: 'TH', name: '泰国', lat: 13.75, lng: 100.5, count: 0 },
  { id: 'VN', name: '越南', lat: 21.03, lng: 105.85, count: 0 },
]
