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
