import type { Locale } from '../i18n/translations'

export function formatLastUpdated(date: Date, locale: Locale): string {
  const tag = locale === 'en' ? 'en-US' : 'zh-CN'
  return date.toLocaleTimeString(tag, {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}
