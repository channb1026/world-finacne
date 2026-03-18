import type { AShareNewsItem, NewsItem } from '../data/mock'

export type TimeWindowKey = '1h' | '4h' | '24h' | 'all'

const WINDOW_MS: Record<Exclude<TimeWindowKey, 'all'>, number> = {
  '1h': 60 * 60 * 1000,
  '4h': 4 * 60 * 60 * 1000,
  '24h': 24 * 60 * 60 * 1000,
}

export function filterNewsByWindow<T extends NewsItem | AShareNewsItem>(items: T[], window: TimeWindowKey) {
  if (window === 'all') return items
  const cutoff = Date.now() - WINDOW_MS[window]
  const filtered = items.filter((item) => (item.publishedAtMs || 0) >= cutoff)
  return filtered.length > 0 ? filtered : items
}
