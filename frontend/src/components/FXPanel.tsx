import { useLocale } from '../i18n/LocaleContext'
import { useData } from '../state/DataContext'
import { useFlashOnChange } from '../hooks/useFlashOnChange'

function formatLastUpdated(date: Date, locale: 'zh' | 'en'): string {
  const tag = locale === 'en' ? 'en-US' : 'zh-CN'
  return date.toLocaleTimeString(tag, { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export function FXPanel() {
  const { locale, t } = useLocale()
  const { data, refreshMarket } = useData()
  const { rates, lastUpdated, error, loaded } = data
  const loadedOnce = loaded.rates

  if (rates.length === 0) {
    const msg = !loadedOnce ? t('common.loading') : error.rates ? t('common.loadFailed') : t('common.noData')
    return (
      <div className="panel panel--min-height">
        <div className="panel__title">{t('panel.fx')}</div>
        <div className="panel__state">
          <span>{msg}</span>
          {loadedOnce && (
            <button type="button" className="panel__retry" onClick={refreshMarket}>{t('common.retry')}</button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="panel">
      <div className="panel__title">
        {t('panel.fx')}
        {lastUpdated.market && <span className="panel__updated">{t('common.updated')} {formatLastUpdated(lastUpdated.market, locale)}</span>}
      </div>
      <div className="panel__subtitle">{t('panel.mainRates')}</div>
      <div>
      {rates.map((fx) => {
        const flashRate = useFlashOnChange(fx.rate, fx.pair)
        const flashChange = useFlashOnChange(fx.change, `${fx.pair}-chg`)
        return (
          <div key={fx.pair} className="fx-row">
            <span className="fx-pair">{fx.pair}</span>
            <span className={`fx-rate ${flashRate ? 'value-flash' : ''}`}>{fx.rate.toFixed(4)}</span>
            <span className={`fx-change ${fx.change >= 0 ? 'up' : 'down'} ${flashChange ? 'value-flash' : ''}`}>
              {fx.change >= 0 ? '+' : ''}{fx.change.toFixed(4)} ({fx.changePct >= 0 ? '+' : ''}{fx.changePct}%)
            </span>
          </div>
        )
      })}
      </div>
    </div>
  )
}
