import { useLocale } from '../i18n/LocaleContext'
import { useData } from '../state/DataContext'
import { getKeyMetricDisplayName } from '../i18n/displayNames'
import { useFlashOnChange } from '../hooks/useFlashOnChange'

function formatLastUpdated(date: Date, locale: 'zh' | 'en'): string {
  const tag = locale === 'en' ? 'en-US' : 'zh-CN'
  return date.toLocaleTimeString(tag, { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export function KeyMetricsBar() {
  const { locale, t } = useLocale()
  const { data, refreshMarket } = useData()
  const { keyMetrics, lastUpdated, error, loaded } = data
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
      {lastUpdated.market && (
        <span className="key-metrics-bar__updated">{t('common.updated')} {formatLastUpdated(lastUpdated.market, locale)}</span>
      )}
      {keyMetrics.map((m) => {
        const flashValue = useFlashOnChange(m.value, m.name)
        const flashChange = useFlashOnChange(m.changePct, `${m.name}-chg`)
        return (
          <div key={m.name} className="key-metrics-bar__item">
            <span className="key-metrics-bar__name">{getKeyMetricDisplayName(m.name, locale)}</span>
            <span className={`key-metrics-bar__value ${flashValue ? 'value-flash' : ''}`}>{m.value}</span>
            <span className={`key-metrics-bar__chg ${m.changePct >= 0 ? 'up' : 'down'} ${flashChange ? 'value-flash' : ''}`}>
              {m.changePct >= 0 ? '+' : ''}{m.changePct}%
            </span>
          </div>
        )
      })}
    </div>
  )
}
