import { memo } from 'react'
import { useLocale } from '../i18n/LocaleContext'
import { useDataActions, useMarketData } from '../state/DataContext'
import { useValueFlash } from '../hooks/useValueFlash'
import { formatLastUpdated } from '../utils/format'

const FXRow = memo(function FXRow({
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
  const rateRef = useValueFlash<HTMLSpanElement>(rate, animate)
  const changeRef = useValueFlash<HTMLSpanElement>(`${change}-${changePct}`, animate)

  const heat = Math.min(Math.abs(changePct) / 3, 1)
  const heatColor = change >= 0 ? `rgba(63,185,80,${heat * 0.06})` : `rgba(248,81,73,${heat * 0.06})`

  return (
    <div className="fx-row" style={{ background: heatColor }}>
      <span className="fx-pair">{pair}</span>
      <span ref={rateRef} className="fx-rate">{rate.toFixed(4)}</span>
      <span ref={changeRef} className={`fx-change ${change >= 0 ? 'up' : 'down'}`}>
        {change >= 0 ? '+' : ''}{change.toFixed(4)} ({changePct >= 0 ? '+' : ''}{changePct}%)
      </span>
    </div>
  )
})

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
