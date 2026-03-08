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

/** locale 用于界面语言：en 时显示 "Beijing"，否则 "北京" */
export function formatTime(date: Date, tz: TimezoneMode, locale: 'zh' | 'en' = 'zh'): string {
  if (tz === 'UTC') {
    return date.toISOString().replace('T', ' ').slice(0, 19) + ' UTC'
  }
  const localeTag = locale === 'en' ? 'en-US' : 'zh-CN'
  const s = date.toLocaleString(localeTag, { timeZone: 'Asia/Shanghai', hour12: false })
  const suffix = locale === 'en' ? ' Beijing' : ' 北京'
  return s + suffix
}
