import { useMemo, useState } from 'react'
import { useLocale } from '../i18n/LocaleContext'
import type { MessageKey } from '../i18n/translations'
import { useDataActions, useSourceHealth } from '../state/DataContext'

function formatTimestamp(date: Date | null, locale: 'zh' | 'en') {
  if (!date) return ''
  return date.toLocaleTimeString(locale === 'zh' ? 'zh-CN' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
}

function formatRelative(dateString: string | null, locale: 'zh' | 'en') {
  if (!dateString) return locale === 'zh' ? '无记录' : 'No record'
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return dateString
  return date.toLocaleString(locale === 'zh' ? 'zh-CN' : 'en-US', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

const CATEGORY_ORDER = ['market', 'calendar', 'news']
const FILTERS = ['all', 'market', 'calendar', 'news'] as const
type FilterKey = (typeof FILTERS)[number]
type CategoryKey = typeof CATEGORY_ORDER[number]
type Translate = (key: MessageKey) => string

function getFilterLabel(filter: FilterKey, t: Translate) {
  if (filter === 'all') return t('sourceHealth.filterAll')
  return t(`sourceHealth.filter.${filter}` as MessageKey)
}

function getCategoryLabel(category: CategoryKey, t: Translate) {
  return t(`sourceHealth.filter.${category}` as MessageKey)
}

export function SourceHealthPanel() {
  const { locale, t } = useLocale()
  const { refreshSourceHealth } = useDataActions()
  const { sourceHealth, lastUpdated, error, loaded } = useSourceHealth()
  const loadedOnce = loaded.sourceHealth
  const [filter, setFilter] = useState<FilterKey>('all')
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  const ordered = useMemo(() => [...sourceHealth].sort((a, b) => {
    const categoryDiff =
      CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category)
    if (categoryDiff !== 0) return categoryDiff
    if (a.status !== b.status) return a.status === 'down' ? -1 : 1
    return a.name.localeCompare(b.name)
  }), [sourceHealth])

  const alerts = useMemo(() => {
    const find = (key: string) => ordered.find((item) => item.key === key)
    const newsItems = ordered.filter((item) => item.category === 'news')
    const downNews = newsItems.filter((item) => item.status === 'down')
    const next = []

    if (find('market:yahoo-finance')?.status === 'down' && find('market:frankfurter')?.status === 'down') {
      next.push({
        key: 'fx-critical',
        level: 'critical',
        text: t('sourceHealth.alert.fxCritical'),
      })
    }
    if (find('calendar:tradingeconomics')?.status === 'down' && find('calendar:eodhd')?.status === 'down') {
      next.push({
        key: 'calendar-critical',
        level: 'critical',
        text: t('sourceHealth.alert.calendarCritical'),
      })
    }
    if (newsItems.length > 0 && downNews.length === newsItems.length) {
      next.push({
        key: 'news-critical',
        level: 'critical',
        text: t('sourceHealth.alert.newsCritical'),
      })
    } else if (newsItems.length > 0 && downNews.length / newsItems.length >= 0.35) {
      next.push({
        key: 'news-warning',
        level: 'warning',
        text: t('sourceHealth.alert.newsWarning').replace('{count}', String(downNews.length)).replace('{total}', String(newsItems.length)),
      })
    }

    return next
  }, [ordered, t])

  const visibleItems = filter === 'all'
    ? ordered
    : ordered.filter((item) => item.category === filter)

  const grouped = useMemo(() => {
    return CATEGORY_ORDER
      .map((category) => ({
        category: category as CategoryKey,
        items: visibleItems.filter((item) => item.category === category),
      }))
      .filter((group) => group.items.length > 0)
  }, [visibleItems])

  return (
    <div className="panel source-health-panel">
      <div className="panel__title">
        {t('panel.sourceHealth')}
        {lastUpdated && (
          <span className="panel__updated">
            {t('common.updated')} {formatTimestamp(lastUpdated, locale)}
          </span>
        )}
      </div>
      <div className="source-health-toolbar">
        {FILTERS.map((item) => (
          <button
            key={item}
            type="button"
            className={`source-health-toolbar__btn ${filter === item ? 'is-active' : ''}`}
            onClick={() => setFilter(item)}
          >
            {getFilterLabel(item, t)}
          </button>
        ))}
      </div>
      {alerts.length > 0 && (
        <div className="source-health-alerts">
          {alerts.map((alert) => (
            <div key={alert.key} className={`source-health-alert source-health-alert--${alert.level}`}>
              {alert.text}
            </div>
          ))}
        </div>
      )}
      {ordered.length === 0 ? (
        <div className="panel__state">
          <span>
            {!loadedOnce
              ? t('common.loading')
              : error.sourceHealth
                ? t('common.loadFailed')
                : t('common.noData')}
          </span>
          {loadedOnce && (
            <button type="button" className="panel__retry" onClick={refreshSourceHealth}>
              {t('common.retry')}
            </button>
          )}
        </div>
      ) : (
        <div className="source-health-list">
          {grouped.map((group) => {
            const downCount = group.items.filter((item) => item.status === 'down').length
            const isCollapsed = collapsed[group.category] === true
            return (
              <div key={group.category} className="source-health-group">
                <button
                  type="button"
                  className="source-health-group__toggle"
                  onClick={() =>
                    setCollapsed((prev) => ({ ...prev, [group.category]: !prev[group.category] }))
                  }
                >
                  <span>{getCategoryLabel(group.category, t)}</span>
                  <span className="source-health-group__summary">
                    {group.items.length - downCount}/{group.items.length} {t('sourceHealth.up')}
                  </span>
                </button>
                {!isCollapsed && group.items.map((source) => (
                  <div key={source.key} className="source-health-row">
                    <div className="source-health-row__head">
                      <span className={`source-health-row__dot is-${source.status}`} />
                      <span className="source-health-row__name">{source.name}</span>
                      <span className="source-health-row__category">{source.category}</span>
                    </div>
                    <div className="source-health-row__meta">
                      <span>{source.status === 'up' ? t('sourceHealth.up') : source.status === 'down' ? t('sourceHealth.down') : t('sourceHealth.unknown')}</span>
                      <span>{t('sourceHealth.lastSuccess')} {formatRelative(source.lastSuccessAt, locale)}</span>
                      {source.status === 'down' && (
                        <span>{source.message || t('sourceHealth.noMessage')}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
