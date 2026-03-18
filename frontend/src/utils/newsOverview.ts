import type { AShareNewsItem, NewsItem } from '../types/data'
import type { Locale } from '../i18n/translations'
import type { ActiveSignal } from './newsContextRanking'
import type { TimelineBucketSummary } from './newsTimeline'

export interface OverviewEntry {
  key: string
  count: number
}

export function summarizeThemeMix(items: Array<NewsItem | AShareNewsItem>, limit = 4): OverviewEntry[] {
  const counts = new Map<string, number>()
  for (const item of items) {
    if (!item.category) continue
    counts.set(item.category, (counts.get(item.category) || 0) + 1)
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([key, count]) => ({ key, count }))
}

export function summarizeScopeMix(items: Array<NewsItem | AShareNewsItem>, limit = 3): OverviewEntry[] {
  const counts = new Map<string, number>()
  for (const item of items) {
    if (!item.marketScope) continue
    counts.set(item.marketScope, (counts.get(item.marketScope) || 0) + 1)
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([key, count]) => ({ key, count }))
}

interface LeadSummaryInput {
  locale: Locale
  signals: ActiveSignal[]
  themeMix: OverviewEntry[]
  scopeMix: OverviewEntry[]
  timeline: TimelineBucketSummary[]
  itemCount: number
}

export function buildLeadSummary({
  locale,
  signals,
  themeMix,
  scopeMix,
  timeline,
  itemCount,
}: LeadSummaryInput): string {
  const signalText = signals.slice(0, 2).map((item) => item.label).join('、')
  const themeText = themeMix.slice(0, 2).map((item) => item.key).join('、')
  const scopeText = scopeMix[0]?.key
  const latestBucket = timeline.find((bucket) => bucket.key === '1h' && bucket.count > 0)
    || timeline.find((bucket) => bucket.key === '4h' && bucket.count > 0)
    || timeline.find((bucket) => bucket.count > 0)

  if (locale === 'zh') {
    const parts = [
      signalText ? `当前市场主线偏向${signalText}` : '',
      themeText ? `资讯主题集中在${themeText}` : '',
      scopeText === 'global' ? '叙事重心偏全球' : scopeText === 'china' ? '叙事重心偏中国' : scopeText === 'a_share' ? '叙事重心偏A股' : '',
      latestBucket?.topCategory ? `近${latestBucket.key === '1h' ? '1小时' : latestBucket.key === '4h' ? '4小时' : '24小时'}最活跃的是${latestBucket.topCategory}` : '',
      itemCount > 0 ? `当前可读事件 ${itemCount} 条` : '',
    ].filter(Boolean)
    return parts.join('，') || '当前暂无可总结的主线。'
  }

  const parts = [
    signalText ? `Current drivers lean toward ${signalText}` : '',
    themeText ? `with coverage concentrated in ${themeText}` : '',
    scopeText === 'global' ? 'and the narrative tilts global' : scopeText === 'china' ? 'and the narrative tilts China' : scopeText === 'a_share' ? 'and the narrative tilts A-share' : '',
    latestBucket?.topCategory ? `while the busiest recent theme is ${latestBucket.topCategory}` : '',
    itemCount > 0 ? `across ${itemCount} visible events` : '',
  ].filter(Boolean)
  return parts.join(', ') || 'No lead summary available right now.'
}
