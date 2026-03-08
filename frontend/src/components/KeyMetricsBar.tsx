import { useState, useEffect, useRef } from 'react'
import { fetchKeyMetrics, POLL_INTERVAL_MARKET } from '../services/api'
import type { KeyMetric } from '../data/mock'
import { useLocale } from '../i18n/LocaleContext'
import { getKeyMetricDisplayName } from '../i18n/displayNames'

function formatLastUpdated(date: Date, locale: 'zh' | 'en'): string {
  const tag = locale === 'en' ? 'en-US' : 'zh-CN'
  return date.toLocaleTimeString(tag, { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export function KeyMetricsBar() {
  const { locale, t } = useLocale()
  const [metrics, setMetrics] = useState<KeyMetric[]>([])
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [error, setError] = useState(false)
  const [loadedOnce, setLoadedOnce] = useState(false)
  const [flash, setFlash] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined)
  const hasLoadedRef = useRef(false)

  const load = () => {
    fetchKeyMetrics()
      .then((data) => {
        if (hasLoadedRef.current) setFlash(true)
        setMetrics(data)
        setLastUpdated(new Date())
        setError(false)
      })
      .catch(() => setError(true))
      .finally(() => { setLoadedOnce(true); hasLoadedRef.current = true })
  }

  useEffect(() => {
    if (flash) {
      const t = setTimeout(() => setFlash(false), 560)
      return () => clearTimeout(t)
    }
  }, [flash])

  useEffect(() => {
    load()
    intervalRef.current = setInterval(load, POLL_INTERVAL_MARKET)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  if (metrics.length === 0) {
    const msg = !loadedOnce ? t('common.loading') : error ? t('common.loadFailed') : t('common.noData')
    return (
      <div className="key-metrics-bar">
        <span>{msg}</span>
        {loadedOnce && (
          <button type="button" className="panel__retry" onClick={load}>{t('common.retry')}</button>
        )}
      </div>
    )
  }

  return (
    <div className={`key-metrics-bar ${flash ? 'data-updated-flash' : ''}`}>
      {lastUpdated && (
        <span className="key-metrics-bar__updated">{t('common.updated')} {formatLastUpdated(lastUpdated, locale)}</span>
      )}
      {metrics.map((m) => (
        <div key={m.name} className="key-metrics-bar__item">
          <span className="key-metrics-bar__name">{getKeyMetricDisplayName(m.name, locale)}</span>
          <span className="key-metrics-bar__value">{m.value}</span>
          <span className={`key-metrics-bar__chg ${m.changePct >= 0 ? 'up' : 'down'}`}>
            {m.changePct >= 0 ? '+' : ''}{m.changePct}%
          </span>
        </div>
      ))}
    </div>
  )
}
