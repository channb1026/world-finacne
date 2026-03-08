import { useState, useEffect, useRef } from 'react'
import { fetchRatesPanel, POLL_INTERVAL_MARKET } from '../services/api'
import type { RateItem } from '../data/mock'
import { useLocale } from '../i18n/LocaleContext'
import { getRateDisplayName } from '../i18n/displayNames'

export function RatesPanel() {
  const { t, locale } = useLocale()
  const [rates, setRates] = useState<RateItem[]>([])
  const [error, setError] = useState(false)
  const [loadedOnce, setLoadedOnce] = useState(false)
  const [flash, setFlash] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined)
  const hasLoadedRef = useRef(false)

  const load = () => {
    fetchRatesPanel()
      .then((data) => {
        if (hasLoadedRef.current) setFlash(true)
        setRates(data)
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
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [])

  return (
    <div className="panel panel--min-height">
      <div className="panel__title">{t('panel.rates')}</div>
      {rates.length === 0 ? (
        <div className="panel__state">
          <span>{!loadedOnce ? t('common.loading') : error ? t('common.loadFailed') : t('common.noData')}</span>
          {loadedOnce && (
            <button type="button" className="panel__retry" onClick={load}>{t('common.retry')}</button>
          )}
        </div>
      ) : (
        <div className={flash ? 'data-updated-flash' : ''}>
          {rates.map((r) => (
          <div key={r.name} className="rate-row">
            <span className="rate-row__name">{getRateDisplayName(r.name, locale)}</span>
            <span className="rate-row__value">{r.value}</span>
            <span className={`rate-row__chg ${r.changePct >= 0 ? 'up' : 'down'}`}>
              {r.changePct >= 0 ? '+' : ''}{r.changePct}%
            </span>
          </div>
          ))}
        </div>
      )}
    </div>
  )
}
