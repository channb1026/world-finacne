/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useCallback, useMemo, useState, useEffect } from 'react'
import type { Locale } from './translations'
import { getMessage } from './translations'

const STORAGE_KEY = 'war-room-locale'

function loadUrlLocale(): Locale | null {
  try {
    const value = new URLSearchParams(window.location.search).get('locale')
    if (value === 'zh' || value === 'en') return value
  } catch (err) {
    console.warn('[i18n] loadUrlLocale failed:', err)
  }
  return null
}

function loadStoredLocale(): Locale {
  const urlLocale = loadUrlLocale()
  if (urlLocale) return urlLocale
  try {
    const v = localStorage.getItem(STORAGE_KEY) as Locale | null
    if (v === 'zh' || v === 'en') return v
  } catch (err) {
    console.warn('[i18n] loadStoredLocale failed:', err)
  }
  return 'zh'
}

type LocaleContextValue = {
  locale: Locale
  setLocale: (l: Locale) => void
  t: (key: string) => string
}

const LocaleContext = createContext<LocaleContextValue | null>(null)

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(loadStoredLocale)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, locale)
    } catch (err) {
      console.warn('[i18n] persist locale failed:', err)
    }
  }, [locale])

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l)
  }, [])

  const t = useCallback(
    (key: string) => getMessage(key, locale),
    [locale]
  )

  const value = useMemo<LocaleContextValue>(
    () => ({ locale, setLocale, t }),
    [locale, setLocale, t]
  )

  return (
    <LocaleContext.Provider value={value}>
      {children}
    </LocaleContext.Provider>
  )
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext)
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider')
  return ctx
}
