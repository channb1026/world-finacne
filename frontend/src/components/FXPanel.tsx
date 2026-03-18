import { useLocale } from '../i18n/LocaleContext'
import { useDataActions, useMarketData } from '../state/DataContext'

function formatLastUpdated(date: Date, locale: 'zh' | 'en'): string {
  const tag = locale === 'en' ? 'en-US' : 'zh-CN'
  return date.toLocaleTimeString(tag, { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function FXRow({
  pair,
  rate,
  change,
  changePct,
  animate,
}: {
  pair: string
  rate: number
  change: number
  changePct: number
  animate: boolean
}) {
  const rateKey = `${pair}-${rate}`
  const changeKey = `${pair}-${change}`

  return (
    <div className="fx-row">
      <span className="fx-pair">{pair}</span>
      <span key={rateKey} className={`fx-rate ${animate ? 'value-flash' : ''}`}>{rate.toFixed(4)}</span>
      <span key={changeKey} className={`fx-change ${change >= 0 ? 'up' : 'down'} ${animate ? 'value-flash' : ''}`}>
        {change >= 0 ? '+' : ''}{change.toFixed(4)} ({changePct >= 0 ? '+' : ''}{changePct}%)
      </span>
    </div>
  )
}

export function FXPanel() {
  const { locale, t } = useLocale()
  const { refreshMarket } = useDataActions()
  const { rates, lastUpdated, error, loaded } = useMarketData()
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
        {lastUpdated && <span className="panel__updated">{t('common.updated')} {formatLastUpdated(lastUpdated, locale)}</span>}
      </div>
      <div className="panel__subtitle">{t('panel.mainRates')}</div>
      <div>
      {rates.map((fx) => (
        <FXRow key={fx.pair} {...fx} animate={loadedOnce} />
      ))}
      </div>
    </div>
  )
}
