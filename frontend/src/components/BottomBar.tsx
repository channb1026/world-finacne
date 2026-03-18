import { useState, useEffect, useRef } from 'react'
import { getTimezoneMode, setTimezoneMode, subscribeTimezone, formatTime } from '../stores/timezoneStore'
import { fetchCalendar, POLL_INTERVAL_NEWS } from '../services/api'
import type { CalendarEvent } from '../services/api'
import { useLocale } from '../i18n/LocaleContext'
import type { Locale } from '../i18n/translations'
import { useVisibility } from '../state/DataContext'

function hasMapViewInUrl(): boolean {
  const p = new URLSearchParams(window.location.search)
  return p.has('lat') && p.has('lng') && p.has('zoom')
}

function formatCalendarDateTime(dateTime: string, locale: Locale): string {
  const date = new Date(dateTime)
  if (Number.isNaN(date.getTime())) return dateTime
  return date.toLocaleString(locale === 'zh' ? 'zh-CN' : 'en-US', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

function formatCalendarMeta(label: string, value: string | undefined): string | null {
  if (!value) return null
  return `${label}${value}`
}

export function BottomBar() {
  const { locale, setLocale, t } = useLocale()
  const isVisible = useVisibility()
  const [now, setNow] = useState(new Date())
  const [tz, setTz] = useState(getTimezoneMode())
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [copied, setCopied] = useState(false)
  const [showCopyLink, setShowCopyLink] = useState(hasMapViewInUrl())
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const abortRef = useRef<AbortController | null>(null)
  const copyResetRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

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
    const runLoad = async () => {
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller
      try {
        const nextEvents = await fetchCalendar(locale, controller.signal)
        if (!controller.signal.aborted) {
          setEvents(nextEvents)
        }
      } catch {
        if (!controller.signal.aborted) {
          setEvents([])
        }
      }
    }

    const schedule = () => {
      if (!isVisible) return
      timerRef.current = setTimeout(async () => {
        await runLoad()
        schedule()
      }, POLL_INTERVAL_NEWS)
    }

    if (isVisible) {
      void runLoad()
      schedule()
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      abortRef.current?.abort()
    }
  }, [isVisible, locale])

  useEffect(() => {
    return () => {
      if (copyResetRef.current) clearTimeout(copyResetRef.current)
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
                if (copyResetRef.current) clearTimeout(copyResetRef.current)
                copyResetRef.current = setTimeout(() => setCopied(false), 1600)
              })
            }}
          >
            {copied ? t('bottomBar.copied') : t('bottomBar.copyViewLink')}
          </button>
        )}
      </div>
      <div className="bottom-bar__calendar">
        <span className="bottom-bar__label" title={locale === 'zh' ? '全球经济日历' : 'Global economic calendar'}>{t('bottomBar.comingUp')}</span>
        {events.length === 0 ? (
          <span className="bottom-bar__event bottom-bar__event--muted">{t('bottomBar.calendarPlaceholder')}</span>
        ) : (
          events.map((e) => {
            const actual = formatCalendarMeta(locale === 'zh' ? '今 ' : 'A ', e.actual)
            const forecast = formatCalendarMeta(locale === 'zh' ? '预 ' : 'F ', e.forecast)
            const previous = formatCalendarMeta(locale === 'zh' ? '前 ' : 'P ', e.previous)
            const metrics = [actual, forecast, previous].filter(Boolean).join(' · ')
            const importance = e.importance > 0 ? ' !'.repeat(e.importance) : ''

            return (
              <span key={e.id} className="bottom-bar__event" title={`${e.country} · ${e.event}`}>
                {formatCalendarDateTime(e.dateTime, locale)} {e.country} {e.event}{importance}
                {metrics ? ` · ${metrics}` : ''}
              </span>
            )
          })
        )}
      </div>
    </div>
  )
}
