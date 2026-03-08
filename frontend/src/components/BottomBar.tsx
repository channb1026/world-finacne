import { useState, useEffect, useRef } from 'react'
import { getTimezoneMode, setTimezoneMode, subscribeTimezone, formatTime } from '../stores/timezoneStore'
import { fetchCalendar, POLL_INTERVAL_NEWS } from '../services/api'
import type { CalendarEvent } from '../services/api'
import { useLocale } from '../i18n/LocaleContext'
import type { Locale } from '../i18n/translations'

function hasMapViewInUrl(): boolean {
  const p = new URLSearchParams(window.location.search)
  return p.has('lat') && p.has('lng') && p.has('zoom')
}

export function BottomBar() {
  const { locale, setLocale, t } = useLocale()
  const [now, setNow] = useState(new Date())
  const [tz, setTz] = useState(getTimezoneMode())
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [copied, setCopied] = useState(false)
  const [showCopyLink, setShowCopyLink] = useState(hasMapViewInUrl())
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined)

  useEffect(() => {
    const onMapViewChange = () => setShowCopyLink(hasMapViewInUrl())
    window.addEventListener('mapviewchange', onMapViewChange)
    window.addEventListener('popstate', onMapViewChange)
    return () => {
      window.removeEventListener('mapviewchange', onMapViewChange)
      window.removeEventListener('popstate', onMapViewChange)
    }
  }, [])

  useEffect(() => {
    const unsub = subscribeTimezone(() => setTz(getTimezoneMode()))
    return unsub
  }, [])

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const load = () => fetchCalendar().then(setEvents)
    load()
    intervalRef.current = setInterval(load, POLL_INTERVAL_NEWS)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  return (
    <div className="bottom-bar">
      <div className="bottom-bar__time">
        <span className="bottom-bar__clock">{formatTime(now, tz, locale)}</span>
        <button
          type="button"
          className="bottom-bar__tz-toggle"
          onClick={() => setTimezoneMode(tz === 'UTC' ? 'Asia/Shanghai' : 'UTC')}
        >
          {tz === 'UTC' ? t('bottomBar.switchToBeijing') : t('bottomBar.switchToUtc')}
        </button>
        <span className="bottom-bar__refresh" title={locale === 'zh' ? '数据轮询间隔' : 'Poll interval'}>{t('bottomBar.refreshHint')}</span>
        <span className="bottom-bar__lang">
          <button type="button" className={locale === 'zh' ? 'bottom-bar__lang-btn is-active' : 'bottom-bar__lang-btn'} onClick={() => setLocale('zh' as Locale)}>{t('locale.zh')}</button>
          <span className="bottom-bar__lang-sep">/</span>
          <button type="button" className={locale === 'en' ? 'bottom-bar__lang-btn is-active' : 'bottom-bar__lang-btn'} onClick={() => setLocale('en' as Locale)}>{t('locale.en')}</button>
        </span>
        {showCopyLink && (
          <button
            type="button"
            className="bottom-bar__copy-link"
            onClick={() => {
              navigator.clipboard.writeText(window.location.href).then(() => {
                setCopied(true)
                setTimeout(() => setCopied(false), 1600)
              })
            }}
          >
            {copied ? t('bottomBar.copied') : t('bottomBar.copyViewLink')}
          </button>
        )}
      </div>
      <div className="bottom-bar__calendar">
        <span className="bottom-bar__label" title={locale === 'zh' ? '经济日历数据接入中' : 'Economic calendar'}>{t('bottomBar.comingUp')}</span>
        {events.length === 0 ? (
          <span className="bottom-bar__event bottom-bar__event--muted">{t('bottomBar.calendarPlaceholder')}</span>
        ) : (
          events.map((e, i) => (
            <span key={i} className="bottom-bar__event">
              {e.date} {e.event} {e.time}
            </span>
          ))
        )}
      </div>
    </div>
  )
}
