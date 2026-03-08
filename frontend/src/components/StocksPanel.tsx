import { useState, useEffect, useRef } from 'react'
import { fetchStocks, POLL_INTERVAL_MARKET } from '../services/api'
import type { StockIndex } from '../data/mock'
import { useLocale } from '../i18n/LocaleContext'
import { getStockDisplayName } from '../i18n/displayNames'

function formatLastUpdated(date: Date, locale: 'zh' | 'en'): string {
  const tag = locale === 'en' ? 'en-US' : 'zh-CN'
  return date.toLocaleTimeString(tag, { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export function StocksPanel() {
  const { locale, t } = useLocale()
  const [stocks, setStocks] = useState<StockIndex[]>([])
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [error, setError] = useState(false)
  const [loadedOnce, setLoadedOnce] = useState(false)
  const [flash, setFlash] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined)
  const hasLoadedRef = useRef(false)

  const load = () => {
    fetchStocks()
      .then((data) => {
        if (hasLoadedRef.current) setFlash(true)
        setStocks(data)
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

  if (stocks.length === 0) {
    const msg = !loadedOnce ? t('common.loading') : error ? t('common.loadFailed') : t('common.noData')
    return (
      <div className="panel panel--min-height">
        <div className="panel__title">{t('panel.stocks')}</div>
        <div className="panel__state">
          <span>{msg}</span>
          {loadedOnce && (
            <button type="button" className="panel__retry" onClick={load}>{t('common.retry')}</button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="panel stocks-panel">
      <div className="panel__title">
        {t('panel.stocks')}
        {lastUpdated && <span className="panel__updated">{t('common.updated')} {formatLastUpdated(lastUpdated, locale)}</span>}
      </div>
      <div className="panel__subtitle">{t('panel.mainIndices')}</div>
      <div className={`stocks-list ${flash ? 'data-updated-flash' : ''}`}>
        {stocks.map((s) => (
          <div key={s.symbol} className="stock-row">
            <span className="stock-name">{getStockDisplayName(s.name, s.symbol, locale)}</span>
            <span className="stock-value">{s.value.toLocaleString()}</span>
            <span className={`stock-change ${s.change >= 0 ? 'up' : 'down'}`}>
              {s.change >= 0 ? '+' : ''}{s.changePct.toFixed(2)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
