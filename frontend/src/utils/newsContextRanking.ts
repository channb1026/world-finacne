import type { AShareIndex, Commodity, KeyMetric, NewsItem, AShareNewsItem } from '../types/data'
import type { Locale } from '../i18n/translations'

export interface MarketContextSnapshot {
  keyMetrics: KeyMetric[]
  commodities: Commodity[]
  aShareIndices: AShareIndex[]
}

export interface ActiveSignal {
  id: string
  label: string
}

export type SignalId = 'usd' | 'oil' | 'gold' | 'risk' | 'a_share'
export type AssetImpactId = 'fx' | 'rates' | 'equities' | 'commodities' | 'china' | 'a_share'

const SIGNAL_LABELS: Record<SignalId, { zh: string; en: string }> = {
  usd: { zh: '美元/汇率', en: 'USD / FX' },
  oil: { zh: '原油/通胀', en: 'Crude / inflation' },
  gold: { zh: '黄金/避险', en: 'Gold / safe haven' },
  risk: { zh: '风险偏好', en: 'Risk sentiment' },
  a_share: { zh: 'A股盘面', en: 'A-share tape' },
}

const ASSET_IMPACT_LABELS: Record<AssetImpactId, { zh: string; en: string }> = {
  fx: { zh: '汇率', en: 'FX' },
  rates: { zh: '利率', en: 'Rates' },
  equities: { zh: '股市', en: 'Equities' },
  commodities: { zh: '大宗', en: 'Commodities' },
  china: { zh: '中国宏观', en: 'China macro' },
  a_share: { zh: 'A股', en: 'A-share' },
}

function getKeyMetricChange(name: string, metrics: KeyMetric[]): number {
  return metrics.find((item) => item.name === name)?.changePct ?? 0
}

function getCommodityChange(name: string, commodities: Commodity[]): number {
  return commodities.find((item) => item.name === name)?.changePct ?? 0
}

function getAverageAShareMove(indices: AShareIndex[]): number {
  if (indices.length === 0) return 0
  const total = indices.reduce((sum, item) => sum + item.changePct, 0)
  return total / indices.length
}

export function getSignalLabel(id: string, locale: Locale): string {
  if (id in SIGNAL_LABELS) {
    return SIGNAL_LABELS[id as SignalId][locale]
  }
  return id
}

export function getAssetImpactLabel(id: string, locale: Locale): string {
  if (id in ASSET_IMPACT_LABELS) {
    return ASSET_IMPACT_LABELS[id as AssetImpactId][locale]
  }
  return id
}

export function getActiveSignals(snapshot: MarketContextSnapshot, locale: Locale): ActiveSignal[] {
  const signals: SignalId[] = []
  const dollarMove = Math.abs(getKeyMetricChange('美元指数', snapshot.keyMetrics))
  const oilMove = Math.abs(getCommodityChange('WTI原油', snapshot.commodities))
  const goldMove = Math.abs(getCommodityChange('黄金', snapshot.commodities))
  const vixValue = Number(snapshot.keyMetrics.find((item) => item.name === 'VIX')?.value || 0)
  const cnyMove = Math.abs(getKeyMetricChange('在岸人民币', snapshot.keyMetrics))
  const aShareMove = getAverageAShareMove(snapshot.aShareIndices)

  if (dollarMove >= 0.25 || cnyMove >= 0.12) signals.push('usd')
  if (oilMove >= 1.5) signals.push('oil')
  if (goldMove >= 0.9) signals.push('gold')
  if (vixValue >= 20) signals.push('risk')
  if (Math.abs(aShareMove) >= 0.8) signals.push('a_share')

  return signals.map((id) => ({ id, label: getSignalLabel(id, locale) }))
}

function getSignalBoost(item: NewsItem | AShareNewsItem, signalIds: SignalId[]) {
  let score = 0
  const matchedSignals: SignalId[] = []
  const category = item.category || ''
  const tags = item.tags || []

  if (signalIds.includes('usd')) {
    let matched = false
    if (['央行/利率', '汇率/债券', '中国宏观'].includes(category)) score += 3
    if (['央行/利率', '汇率/债券', '中国宏观'].includes(category)) matched = true
    if (tags.some((tag) => ['美联储', '人民币', '美债'].includes(tag))) {
      score += 2
      matched = true
    }
    if (matched) matchedSignals.push('usd')
  }

  if (signalIds.includes('oil')) {
    let matched = false
    if (['大宗商品', '通胀/就业', '地缘/政策'].includes(category)) {
      score += 2
      matched = true
    }
    if (tags.includes('原油')) {
      score += 2
      matched = true
    }
    if (matched) matchedSignals.push('oil')
  }

  if (signalIds.includes('gold')) {
    let matched = false
    if (['地缘/政策', '汇率/债券', '大宗商品'].includes(category)) {
      score += 2
      matched = true
    }
    if (tags.includes('黄金')) {
      score += 2
      matched = true
    }
    if (matched) matchedSignals.push('gold')
  }

  if (signalIds.includes('risk')) {
    if (['地缘/政策', '股市/盘面', '央行/利率'].includes(category)) {
      score += 2
      matchedSignals.push('risk')
    }
  }

  if (signalIds.includes('a_share')) {
    let matched = false
    if (['A股盘面', 'A股公司', '中国宏观'].includes(category)) {
      score += 3
      matched = true
    }
    if (tags.includes('A股')) {
      score += 2
      matched = true
    }
    if (matched) matchedSignals.push('a_share')
  }

  return {
    score,
    matchedSignals,
  }
}

function inferAssetImpacts(item: NewsItem | AShareNewsItem): AssetImpactId[] {
  const impacts = new Set<AssetImpactId>()
  const category = item.category || ''
  const tags = item.tags || []

  if (['央行/利率', '通胀/就业', '汇率/债券'].includes(category)) {
    impacts.add('rates')
    impacts.add('fx')
  }
  if (['股市/盘面', '公司/财报', '地缘/政策'].includes(category)) {
    impacts.add('equities')
  }
  if (['大宗商品', '地缘/政策'].includes(category)) {
    impacts.add('commodities')
  }
  if (['中国宏观'].includes(category)) {
    impacts.add('china')
    impacts.add('a_share')
  }
  if (['A股盘面', 'A股公司'].includes(category)) {
    impacts.add('a_share')
    impacts.add('china')
  }

  if (tags.some((tag) => ['美联储', '人民币', '美债', '通胀', '就业'].includes(tag))) {
    impacts.add('fx')
    impacts.add('rates')
  }
  if (tags.some((tag) => ['原油', '黄金'].includes(tag))) {
    impacts.add('commodities')
  }
  if (tags.some((tag) => ['科技股', '地产'].includes(tag))) {
    impacts.add('equities')
  }
  if (tags.some((tag) => ['A股', '财联社', '东方财富'].includes(tag))) {
    impacts.add('a_share')
    impacts.add('china')
  }

  return Array.from(impacts)
}

function inferLifecycleStage(item: NewsItem | AShareNewsItem): 'new' | 'developing' | 'watch' | undefined {
  const publishedAtMs = item.publishedAtMs || 0
  const ageMs = publishedAtMs > 0 ? Date.now() - publishedAtMs : Number.POSITIVE_INFINITY
  const sourceCount = item.sourceCount || 0
  const articleCount = item.articleCount || 0
  const impactScore = item.impactScore || 0

  if (ageMs <= 90 * 60 * 1000 && sourceCount <= 2 && articleCount <= 2) {
    return 'new'
  }
  if (sourceCount >= 3 || articleCount >= 4) {
    return 'developing'
  }
  if (item.impactLevel === 'high' || impactScore >= 6) {
    return 'watch'
  }
  return undefined
}

export function rankNewsWithMarketContext<T extends NewsItem | AShareNewsItem>(
  items: T[],
  snapshot: MarketContextSnapshot,
  locale: Locale,
) {
  const signals = getActiveSignals(snapshot, locale)
  const signalIds = signals.map((signal) => signal.id as SignalId)
  const rankedItems = items.map((item) => {
    const boost = getSignalBoost(item, signalIds)
    return {
      ...item,
      contextSignals: boost.matchedSignals,
      contextBoost: boost.score,
      assetImpacts: inferAssetImpacts(item),
      lifecycleStage: inferLifecycleStage(item),
    }
  }).sort((a, b) => {
    const scoreA = (a.impactScore || 0) + (a.contextBoost || 0)
    const scoreB = (b.impactScore || 0) + (b.contextBoost || 0)
    if (scoreB !== scoreA) return scoreB - scoreA
    return (b.sourceCount || 0) - (a.sourceCount || 0)
  })

  return {
    signals,
    items: rankedItems,
  }
}

export function isMarketMovingItem(item: NewsItem | AShareNewsItem): boolean {
  if (item.impactLevel === 'high') return true
  if ((item.contextBoost || 0) >= 3) return true
  if ((item.sourceCount || 0) >= 3 && (item.impactScore || 0) >= 5) return true
  return false
}

export function summarizeAssetImpacts(
  items: Array<NewsItem | AShareNewsItem>,
  locale: Locale,
): Array<{ id: AssetImpactId; label: string; count: number }> {
  const counts = new Map<AssetImpactId, number>()
  for (const item of items) {
    for (const impact of item.assetImpacts || []) {
      counts.set(impact as AssetImpactId, (counts.get(impact as AssetImpactId) || 0) + 1)
    }
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([id, count]) => ({ id, count, label: getAssetImpactLabel(id, locale) }))
}
