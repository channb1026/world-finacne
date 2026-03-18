import { memo } from 'react'
import { useLocale } from '../i18n/LocaleContext'
import { useDataActions, useMarketData } from '../state/DataContext'
import { getKeyMetricDisplayName } from '../i18n/displayNames'
import { useValueFlash } from '../hooks/useValueFlash'
import { formatLastUpdated } from '../utils/format'

const KeyMetricItem = memo(function KeyMetricItem({
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
  const valueRef = useValueFlash<HTMLSpanElement>(value, animate)
  const changeRef = useValueFlash<HTMLSpanElement>(changePct, animate)

  return (
    <div className="key-metrics-bar__item">
      <span className="key-metrics-bar__name">{getKeyMetricDisplayName(name, locale)}</span>
      <span ref={valueRef} className="key-metrics-bar__value">{value}</span>
      <span ref={changeRef} className={`key-metrics-bar__chg ${changePct >= 0 ? 'up' : 'down'}`}>
        {changePct >= 0 ? '+' : ''}{changePct}%
      </span>
    </div>
  )
})

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
