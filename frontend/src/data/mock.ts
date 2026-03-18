/** 类型定义：汇率、新闻、股市、地区等。数据均来自后端 API，无 mock。 */

/** 地图按国家划分，与后端 REGIONS 一致 */
export type RegionId = string

export interface FxPair {
  pair: string
  rate: number
  change: number
  changePct: number
}

export type NewsCategory = string

export interface RelatedNewsItem {
  title: string
  source: string
  time: string
  link?: string
}

export interface NewsItem {
  id: string
  title: string
  source: string
  time: string
  region?: RegionId
  category?: NewsCategory
  tags?: string[]
  marketScope?: 'global' | 'china' | 'a_share'
  publishedAtMs?: number
  relatedSources?: string[]
  sourceCount?: number
  articleCount?: number
  relatedItems?: RelatedNewsItem[]
  impactScore?: number
  impactLevel?: 'normal' | 'medium' | 'high'
  contextSignals?: string[]
  contextBoost?: number
  assetImpacts?: string[]
  lifecycleStage?: 'new' | 'developing' | 'watch'
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
  category?: NewsCategory
  tags?: string[]
  marketScope?: 'global' | 'china' | 'a_share'
  publishedAtMs?: number
  relatedSources?: string[]
  sourceCount?: number
  articleCount?: number
  relatedItems?: RelatedNewsItem[]
  impactScore?: number
  impactLevel?: 'normal' | 'medium' | 'high'
  contextSignals?: string[]
  contextBoost?: number
  assetImpacts?: string[]
  lifecycleStage?: 'new' | 'developing' | 'watch'
  link?: string
}

/** 地图按国家/地区展示，默认几何与中文名（count 由 /api/map-spots 实时返回） */
export const MAP_SPOTS_DEFAULT: MapSpot[] = [
  { id: 'US', name: '美国', lat: 40.7, lng: -74, count: 0 },
  { id: 'CA', name: '加拿大', lat: 43.65, lng: -79.38, count: 0 },
  { id: 'MX', name: '墨西哥', lat: 19.43, lng: -99.13, count: 0 },
  { id: 'BR', name: '巴西', lat: -23.55, lng: -46.63, count: 0 },
  { id: 'AR', name: '阿根廷', lat: -34.6, lng: -58.38, count: 0 },
  { id: 'CL', name: '智利', lat: -33.45, lng: -70.67, count: 0 },
  { id: 'CO', name: '哥伦比亚', lat: 4.71, lng: -74.07, count: 0 },
  { id: 'PE', name: '秘鲁', lat: -12.05, lng: -77.05, count: 0 },
  { id: 'EC', name: '厄瓜多尔', lat: -0.22, lng: -78.51, count: 0 },
  { id: 'VE', name: '委内瑞拉', lat: 10.48, lng: -66.9, count: 0 },
  { id: 'UY', name: '乌拉圭', lat: -34.9, lng: -56.16, count: 0 },
  { id: 'PY', name: '巴拉圭', lat: -25.3, lng: -57.58, count: 0 },
  { id: 'BO', name: '玻利维亚', lat: -16.5, lng: -68.15, count: 0 },
  { id: 'UK', name: '英国', lat: 51.5, lng: -0.1, count: 0 },
  { id: 'IE', name: '爱尔兰', lat: 53.35, lng: -6.26, count: 0 },
  { id: 'FR', name: '法国', lat: 48.86, lng: 2.35, count: 0 },
  { id: 'DE', name: '德国', lat: 52.52, lng: 13.4, count: 0 },
  { id: 'NL', name: '荷兰', lat: 52.37, lng: 4.89, count: 0 },
  { id: 'BE', name: '比利时', lat: 50.85, lng: 4.35, count: 0 },
  { id: 'AT', name: '奥地利', lat: 48.21, lng: 16.37, count: 0 },
  { id: 'CH', name: '瑞士', lat: 46.95, lng: 7.45, count: 0 },
  { id: 'IT', name: '意大利', lat: 41.9, lng: 12.5, count: 0 },
  { id: 'ES', name: '西班牙', lat: 40.42, lng: -3.7, count: 0 },
  { id: 'PT', name: '葡萄牙', lat: 38.72, lng: -9.13, count: 0 },
  { id: 'SE', name: '瑞典', lat: 59.33, lng: 18.07, count: 0 },
  { id: 'NO', name: '挪威', lat: 59.91, lng: 10.75, count: 0 },
  { id: 'DK', name: '丹麦', lat: 55.68, lng: 12.57, count: 0 },
  { id: 'FI', name: '芬兰', lat: 60.17, lng: 24.94, count: 0 },
  { id: 'IS', name: '冰岛', lat: 64.15, lng: -21.95, count: 0 },
  { id: 'PL', name: '波兰', lat: 52.23, lng: 21.01, count: 0 },
  { id: 'CZ', name: '捷克', lat: 50.08, lng: 14.43, count: 0 },
  { id: 'SK', name: '斯洛伐克', lat: 48.15, lng: 17.11, count: 0 },
  { id: 'HU', name: '匈牙利', lat: 47.5, lng: 19.08, count: 0 },
  { id: 'RO', name: '罗马尼亚', lat: 44.43, lng: 26.1, count: 0 },
  { id: 'BG', name: '保加利亚', lat: 42.7, lng: 23.32, count: 0 },
  { id: 'GR', name: '希腊', lat: 37.98, lng: 23.73, count: 0 },
  { id: 'HR', name: '克罗地亚', lat: 45.81, lng: 15.98, count: 0 },
  { id: 'RS', name: '塞尔维亚', lat: 44.82, lng: 20.46, count: 0 },
  { id: 'UA', name: '乌克兰', lat: 50.45, lng: 30.52, count: 0 },
  { id: 'RU', name: '俄罗斯', lat: 55.75, lng: 37.62, count: 0 },
  { id: 'TR', name: '土耳其', lat: 39.93, lng: 32.85, count: 0 },
  { id: 'AE', name: '阿联酋', lat: 25.2, lng: 55.3, count: 0 },
  { id: 'SA', name: '沙特', lat: 24.71, lng: 46.68, count: 0 },
  { id: 'QA', name: '卡塔尔', lat: 25.29, lng: 51.53, count: 0 },
  { id: 'KW', name: '科威特', lat: 29.38, lng: 47.99, count: 0 },
  { id: 'IL', name: '以色列', lat: 32.09, lng: 34.78, count: 0 },
  { id: 'JO', name: '约旦', lat: 31.95, lng: 35.93, count: 0 },
  { id: 'EG', name: '埃及', lat: 30.04, lng: 31.24, count: 0 },
  { id: 'CN', name: '中国', lat: 31.2, lng: 121.5, count: 0 },
  { id: 'TW', name: '台湾', lat: 25.03, lng: 121.56, count: 0 },
  { id: 'HK', name: '香港', lat: 22.28, lng: 114.16, count: 0 },
  { id: 'MO', name: '澳门', lat: 22.2, lng: 113.55, count: 0 },
  { id: 'JP', name: '日本', lat: 35.7, lng: 139.7, count: 0 },
  { id: 'KR', name: '韩国', lat: 37.57, lng: 126.98, count: 0 },
  { id: 'IN', name: '印度', lat: 19.08, lng: 72.88, count: 0 },
  { id: 'TH', name: '泰国', lat: 13.75, lng: 100.5, count: 0 },
  { id: 'VN', name: '越南', lat: 21.03, lng: 105.85, count: 0 },
  { id: 'SG', name: '新加坡', lat: 1.35, lng: 103.8, count: 0 },
  { id: 'MY', name: '马来西亚', lat: 3.14, lng: 101.69, count: 0 },
  { id: 'ID', name: '印尼', lat: -6.2, lng: 106.82, count: 0 },
  { id: 'PH', name: '菲律宾', lat: 14.6, lng: 120.98, count: 0 },
  { id: 'AU', name: '澳大利亚', lat: -33.87, lng: 151.21, count: 0 },
  { id: 'NZ', name: '新西兰', lat: -36.85, lng: 174.76, count: 0 },
  { id: 'ZA', name: '南非', lat: -33.92, lng: 18.42, count: 0 },
]
