import { useState, useEffect, useRef } from 'react'
import { getTimezoneMode, setTimezoneMode, subscribeTimezone, formatTime } from '../stores/timezoneStore'
import { fetchCalendar, POLL_INTERVAL_NEWS } from '../services/api'
import type { CalendarEvent } from '../services/api'

function hasMapViewInUrl(): boolean {
  const p = new URLSearchParams(window.location.search)
  return p.has('lat') && p.has('lng') && p.has('zoom')
}

export function BottomBar() {
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
        <span className="bottom-bar__clock">{formatTime(now, tz)}</span>
        <button
          type="button"
          className="bottom-bar__tz-toggle"
          onClick={() => setTimezoneMode(tz === 'UTC' ? 'Asia/Shanghai' : 'UTC')}
        >
          {tz === 'UTC' ? '切至北京' : '切至 UTC'}
        </button>
        <span className="bottom-bar__refresh" title="数据轮询间隔">行情 3s · 新闻/快讯/日历 45s</span>
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
            {copied ? '已复制' : '复制视角链接'}
          </button>
        )}
      </div>
      <div className="bottom-bar__calendar">
        <span className="bottom-bar__label" title="经济日历数据接入中">即将到来</span>
        {events.length === 0 ? (
          <span className="bottom-bar__event bottom-bar__event--muted">经济日历（数据接入中，暂无事件）</span>
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
