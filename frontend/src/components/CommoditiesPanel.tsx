import { useState, useEffect, useRef } from 'react'
import { fetchCommodities, POLL_INTERVAL_MARKET } from '../services/api'
import type { Commodity } from '../data/mock'
import { useLocale } from '../i18n/LocaleContext'
import { getCommodityDisplayName, getCommodityUnitDisplay } from '../i18n/displayNames'

function formatLastUpdated(date: Date, locale: 'zh' | 'en'): string {
  const tag = locale === 'en' ? 'en-US' : 'zh-CN'
  return date.toLocaleTimeString(tag, { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export function CommoditiesPanel() {
  const { locale, t } = useLocale()
  const [commodities, setCommodities] = useState<Commodity[]>([])
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [error, setError] = useState(false)
  const [loadedOnce, setLoadedOnce] = useState(false)
  const [flash, setFlash] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined)
  const hasLoadedRef = useRef(false)

  const load = () => {
    fetchCommodities()
      .then((data) => {
        if (hasLoadedRef.current) setFlash(true)
        setCommodities(data)
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

  if (commodities.length === 0) {
    const msg = !loadedOnce ? t('common.loading') : error ? t('common.loadFailed') : t('common.noData')
    return (
      <div className="panel panel--min-height">
        <div className="panel__title">{t('panel.commodities')}</div>
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
    <div className="panel">
      <div className="panel__title">
        {t('panel.commodities')}
        {lastUpdated && <span className="panel__updated">{t('common.updated')} {formatLastUpdated(lastUpdated, locale)}</span>}
      </div>
      <div className="panel__subtitle">{t('panel.mainVarieties')}</div>
      <div className={flash ? 'data-updated-flash' : ''}>
      {commodities.map((c) => (
        <div key={c.name} className="commodity-row">
          <span className="commodity-row__name">{getCommodityDisplayName(c.name, locale)}</span>
          <span className="commodity-row__value">
            {typeof c.value === 'number' && c.value > 1000 ? c.value.toLocaleString() : c.value}
          </span>
          <span className="commodity-row__unit">{getCommodityUnitDisplay(c.unit, locale)}</span>
          <span className={`commodity-row__chg ${c.changePct >= 0 ? 'up' : 'down'}`}>
            {c.changePct >= 0 ? '+' : ''}{c.changePct}%
          </span>
        </div>
      ))}
      </div>
    </div>
  )
}
