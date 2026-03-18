import type { AShareNewsItem, NewsItem } from '../data/mock'

export type TimelineBucketKey = '1h' | '4h' | '24h'

export interface TimelineBucketSummary {
  key: TimelineBucketKey
  count: number
  topCategory?: string
}

const WINDOW_MS: Record<TimelineBucketKey, number> = {
  '1h': 60 * 60 * 1000,
  '4h': 4 * 60 * 60 * 1000,
  '24h': 24 * 60 * 60 * 1000,
}

export function summarizeNewsTimeline(
  items: Array<NewsItem | AShareNewsItem>,
  nowMs = Date.now(),
): TimelineBucketSummary[] {
  return (['1h', '4h', '24h'] as TimelineBucketKey[]).map((key) => {
    const bucketItems = items.filter((item) => {
      if (!item.publishedAtMs) return false
      return nowMs - item.publishedAtMs <= WINDOW_MS[key]
    })

    const categoryCounts = new Map<string, number>()
    for (const item of bucketItems) {
      if (!item.category) continue
      categoryCounts.set(item.category, (categoryCounts.get(item.category) || 0) + 1)
    }

    const topCategory = Array.from(categoryCounts.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0]

    return {
      key,
      count: bucketItems.length,
      topCategory,
    }
  })
}
