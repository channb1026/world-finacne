import { useState, useEffect, useRef } from 'react'
import { fetchTicker, POLL_INTERVAL_NEWS, type TickerItem } from '../services/api'
import { useLocale } from '../i18n/LocaleContext'

export function TickerStrip() {
  const { t } = useLocale()
  const [items, setItems] = useState<TickerItem[]>([])
  const [error, setError] = useState(false)
  const [loadedOnce, setLoadedOnce] = useState(false)
  const [flash, setFlash] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined)
  const hasLoadedRef = useRef(false)

  const load = () => {
    fetchTicker()
      .then((data) => {
        if (hasLoadedRef.current) setFlash(true)
        setItems(data)
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
    intervalRef.current = setInterval(load, POLL_INTERVAL_NEWS)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  if (items.length === 0) {
    const msg = !loadedOnce ? t('common.loading') : error ? t('common.loadFailed') : t('common.noData')
    return (
      <div className="ticker-strip">
        <span className="ticker-strip__label">{t('ticker.feed')}</span>
        <div className="ticker-strip__viewport ticker-strip__viewport--static">
          <span>{msg}</span>
          {loadedOnce && (
            <button type="button" className="panel__retry" onClick={load}>{t('common.retry')}</button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={`ticker-strip ${flash ? 'data-updated-flash' : ''}`}>
      <span className="ticker-strip__label">{t('ticker.feed')}</span>
      <div className="ticker-strip__viewport">
        <div className="ticker-strip__track">
          {[...items, ...items].map((item, i) => (
            <span key={i} className="ticker-strip__item">
              {item.link ? (
                <a href={item.link} target="_blank" rel="noopener noreferrer" className="ticker-strip__link">
                  {item.title}
                </a>
              ) : (
                item.title
              )}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
