import { memo } from 'react'
import { useLocale } from '../i18n/LocaleContext'
import { useDataActions, useMarketData } from '../state/DataContext'
import { getStockDisplayName } from '../i18n/displayNames'
import { useValueFlash } from '../hooks/useValueFlash'
import { formatLastUpdated } from '../utils/format'

const StockRow = memo(function StockRow({
  name,
  symbol,
  value,
  change,
  changePct,
  locale,
  animate,
}: {
  name: string
  symbol: string
  value: number
  change: number
  changePct: number
  locale: 'zh' | 'en'
  animate: boolean
}) {
  const valueRef = useValueFlash<HTMLSpanElement>(value, animate)
  const changeRef = useValueFlash<HTMLSpanElement>(`${change}-${changePct}`, animate)

  const heat = Math.min(Math.abs(changePct) / 4, 1)
  const heatColor = change >= 0 ? `rgba(63,185,80,${heat * 0.07})` : `rgba(248,81,73,${heat * 0.07})`

  return (
    <div className="stock-row" style={{ background: heatColor }}>
      <span className="stock-name">{getStockDisplayName(name, symbol, locale)}</span>
      <span ref={valueRef} className="stock-value">{value.toLocaleString()}</span>
      <span ref={changeRef} className={`stock-change ${change >= 0 ? 'up' : 'down'}`}>
        {change >= 0 ? '+' : ''}{changePct.toFixed(2)}%
      </span>
    </div>
  )
})

export function StocksPanel() {
  const { locale, t } = useLocale()
  const { refreshMarket } = useDataActions()
  const { stocks, lastUpdated, error, loaded } = useMarketData()
  const loadedOnce = loaded.stocks

  if (stocks.length === 0) {
    const msg = !loadedOnce ? t('common.loading') : error.stocks ? t('common.loadFailed') : t('common.noData')
    return (
      <div className="panel panel--min-height">
        <div className="panel__title">{t('panel.stocks')}</div>
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
    <div className="panel stocks-panel">
      <div className="panel__title">
        {t('panel.stocks')}
        {lastUpdated && <span className="panel__updated">{t('common.updated')} {formatLastUpdated(lastUpdated, locale)}</span>}
      </div>
      <div className="panel__subtitle">{t('panel.mainIndices')}</div>
      <div className="stocks-list">
        {stocks.map((s) => (
          <StockRow key={s.symbol} {...s} locale={locale} animate={loadedOnce} />
        ))}
      </div>
    </div>
  )
}
