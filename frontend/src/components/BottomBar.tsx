import { useState, useEffect, useRef } from 'react'
import { getTimezoneMode, setTimezoneMode, subscribeTimezone, formatTime } from '../stores/timezoneStore'
import { fetchCalendar, POLL_INTERVAL_NEWS } from '../services/api'
import type { CalendarEvent } from '../services/api'

export function BottomBar() {
  const [now, setNow] = useState(new Date())
  const [tz, setTz] = useState(getTimezoneMode())
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined)

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
      </div>
      <div className="bottom-bar__calendar">
        <span className="bottom-bar__label">即将到来</span>
        {events.length === 0 ? (
          <span className="bottom-bar__event bottom-bar__event--muted">暂无经济日历（央行/数据公布等）</span>
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
