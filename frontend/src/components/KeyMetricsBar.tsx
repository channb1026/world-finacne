import { useLocale } from '../i18n/LocaleContext'
import { useDataActions, useMarketData } from '../state/DataContext'
import { getKeyMetricDisplayName } from '../i18n/displayNames'

function formatLastUpdated(date: Date, locale: 'zh' | 'en'): string {
  const tag = locale === 'en' ? 'en-US' : 'zh-CN'
  return date.toLocaleTimeString(tag, { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function KeyMetricItem({
  name,
  value,
  changePct,
  locale,
  animate,
}: {
  name: string
  value: string
  changePct: number
  locale: 'zh' | 'en'
  animate: boolean
}) {
  return (
    <div className="key-metrics-bar__item">
      <span className="key-metrics-bar__name">{getKeyMetricDisplayName(name, locale)}</span>
      <span key={`${name}-${value}`} className={`key-metrics-bar__value ${animate ? 'value-flash' : ''}`}>{value}</span>
      <span key={`${name}-${changePct}`} className={`key-metrics-bar__chg ${changePct >= 0 ? 'up' : 'down'} ${animate ? 'value-flash' : ''}`}>
        {changePct >= 0 ? '+' : ''}{changePct}%
      </span>
    </div>
  )
}

export function KeyMetricsBar() {
  const { locale, t } = useLocale()
  const { refreshMarket } = useDataActions()
  const { keyMetrics, lastUpdated, error, loaded } = useMarketData()
  const loadedOnce = loaded.keyMetrics

  if (keyMetrics.length === 0) {
    const msg = !loadedOnce ? t('common.loading') : error.keyMetrics ? t('common.loadFailed') : t('common.noData')
    return (
      <div className="key-metrics-bar">
        <span>{msg}</span>
        {loadedOnce && (
          <button type="button" className="panel__retry" onClick={refreshMarket}>{t('common.retry')}</button>
        )}
      </div>
    )
  }

  return (
    <div className="key-metrics-bar">
      {lastUpdated && (
        <span className="key-metrics-bar__updated">{t('common.updated')} {formatLastUpdated(lastUpdated, locale)}</span>
      )}
      {keyMetrics.map((m) => (
        <KeyMetricItem key={m.name} {...m} locale={locale} animate={loadedOnce} />
      ))}
    </div>
  )
}
