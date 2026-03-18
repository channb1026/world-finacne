import { memo, useState } from 'react'
import type { AShareNewsItem, NewsItem } from '../types/data'
import { useLocale } from '../i18n/LocaleContext'
import { getNewsCategoryDisplay, getNewsSourceDisplay, getNewsTagDisplay, getStoryClusterDisplay } from '../i18n/displayNames'
import { isSafeLink } from '../utils/linkSafety'
import { getAssetImpactLabel, getSignalLabel } from '../utils/newsContextRanking'

type EventItem = NewsItem | AShareNewsItem

interface NewsEventCardProps {
  item: EventItem
  compact?: boolean
}

export const NewsEventCard = memo(function NewsEventCard({ item, compact = false }: NewsEventCardProps) {
  const { locale, t } = useLocale()
  const [expanded, setExpanded] = useState(false)
  const href = isSafeLink(item.link) ? item.link : undefined
  const clusterLabel = getStoryClusterDisplay(item.sourceCount, locale)
  const relatedSources = (item.relatedSources || [])
    .map((source) => getNewsSourceDisplay(source, locale))
    .filter(Boolean)
  const visibleSources = relatedSources.slice(0, 3)
  const remainingSources = Math.max(0, relatedSources.length - visibleSources.length)
  const clusterTitle = relatedSources.length > 1 ? relatedSources.join(' / ') : undefined
  const impactLabel = item.impactLevel === 'high'
    ? t('news.impact.high')
    : item.impactLevel === 'medium'
      ? t('news.impact.medium')
      : ''
  const lifecycleLabel = item.lifecycleStage === 'new'
    ? t('news.lifecycle.new')
    : item.lifecycleStage === 'developing'
      ? t('news.lifecycle.developing')
      : item.lifecycleStage === 'watch'
        ? t('news.lifecycle.watch')
        : ''
  const relatedItems = (item.relatedItems || []).filter((entry) => entry.title && entry.source)
  const extraItems = relatedItems.filter((entry) => !(entry.title === item.title && entry.source === item.source))
  const displayItems = expanded ? extraItems : extraItems.slice(0, 2)
  const contextSignals = (item.contextSignals || []).map((signal) => getSignalLabel(signal, locale))
  const assetImpacts = (item.assetImpacts || []).map((impact) => getAssetImpactLabel(impact, locale))

  return (
    <div className="news-item">
      <div className="news-item__row">
        <div className="news-item__title">
          {href ? (
            <a href={href} target="_blank" rel="noopener noreferrer" className="news-item__link">{item.title}</a>
          ) : (
            item.title
          )}
        </div>
        {item.category && (
          <span className="news-item__tag" data-category={item.category}>
            {getNewsCategoryDisplay(item.category, locale)}
          </span>
        )}
        {impactLabel && (
          <span className={`news-item__impact news-item__impact--${item.impactLevel}`}>
            {impactLabel}
          </span>
        )}
        {lifecycleLabel && (
          <span className={`news-item__stage news-item__stage--${item.lifecycleStage}`}>
            {lifecycleLabel}
          </span>
        )}
      </div>
      <div className="news-item__meta" title={clusterTitle}>
        {getNewsSourceDisplay(item.source, locale)} · {item.time}
        {clusterLabel ? ` · ${clusterLabel}` : ''}
        {item.tags && item.tags.length > 0 ? ` · ${item.tags.slice(0, 2).map((tag) => getNewsTagDisplay(tag, locale)).join(' / ')}` : ''}
      </div>
      {contextSignals.length > 0 && (
        <div className="news-item__context">
          <span className="news-item__context-label">{t('news.whyNow')}</span>
          {contextSignals.map((signal) => (
            <span key={signal} className="news-item__context-chip">{signal}</span>
          ))}
        </div>
      )}
      {assetImpacts.length > 0 && (
        <div className="news-item__context news-item__context--asset">
          <span className="news-item__context-label">{t('news.assetImpact')}</span>
          {assetImpacts.map((impact) => (
            <span key={impact} className="news-item__context-chip news-item__context-chip--asset">{impact}</span>
          ))}
        </div>
      )}
      {relatedSources.length > 1 && (
        <div className="news-item__sources" title={clusterTitle}>
          {visibleSources.map((source) => (
            <span key={source} className="news-item__source-chip">{source}</span>
          ))}
          {remainingSources > 0 && (
            <span className="news-item__source-chip news-item__source-chip--more">+{remainingSources}</span>
          )}
        </div>
      )}
      {displayItems.length > 0 && (
        <div className={`news-item__related ${compact ? 'news-item__related--compact' : ''}`}>
          {displayItems.map((entry) => {
            const relatedHref = isSafeLink(entry.link) ? entry.link : undefined
            return (
              <div key={`${entry.source}-${entry.title}`} className="news-item__related-row">
                <span className="news-item__related-source">{getNewsSourceDisplay(entry.source, locale)}</span>
                <span className="news-item__related-sep">·</span>
                {relatedHref ? (
                  <a href={relatedHref} target="_blank" rel="noopener noreferrer" className="news-item__related-link">
                    {entry.title}
                  </a>
                ) : (
                  <span className="news-item__related-link">{entry.title}</span>
                )}
              </div>
            )
          })}
          {extraItems.length > 2 && (
            <button type="button" className="news-item__expand" onClick={() => setExpanded((value) => !value)}>
              {expanded ? (locale === 'zh' ? '收起事件' : 'Collapse') : (locale === 'zh' ? `展开事件 (${extraItems.length})` : `Expand (${extraItems.length})`)}
            </button>
          )}
        </div>
      )}
    </div>
  )
})
