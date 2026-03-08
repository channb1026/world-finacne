/**
 * 时区显示：UTC / 北京时 切换，供底部条等使用。
 */

type TimezoneMode = 'UTC' | 'Asia/Shanghai'

let mode: TimezoneMode = 'Asia/Shanghai'
const listeners = new Set<() => void>()

export function getTimezoneMode(): TimezoneMode {
  return mode
}

export function setTimezoneMode(m: TimezoneMode): void {
  if (mode === m) return
  mode = m
  listeners.forEach((fn) => fn())
}

export function subscribeTimezone(fn: () => void): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function formatTime(date: Date, tz: TimezoneMode): string {
  if (tz === 'UTC') {
    return date.toISOString().replace('T', ' ').slice(0, 19) + ' UTC'
  }
  const s = date.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false })
  return s + ' 北京'
}
