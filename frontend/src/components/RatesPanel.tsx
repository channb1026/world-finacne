import { useLocale } from '../i18n/LocaleContext'
import { useDataActions, useMarketData } from '../state/DataContext'
import { getRateDisplayName } from '../i18n/displayNames'

function RateRow({
  name,
  value,
  changePct,
  locale,
  animate,
}: {
  name: string
  value: string
  changePct: number
  locale: 'zh' | 'en'
  animate: boolean
}) {
  return (
    <div className="rate-row">
      <span className="rate-row__name">{getRateDisplayName(name, locale)}</span>
      <span key={`${name}-${value}`} className={`rate-row__value ${animate ? 'value-flash' : ''}`}>{value}</span>
      <span key={`${name}-${changePct}`} className={`rate-row__chg ${changePct >= 0 ? 'up' : 'down'} ${animate ? 'value-flash' : ''}`}>
        {changePct >= 0 ? '+' : ''}{changePct}%
      </span>
    </div>
  )
}

export function RatesPanel() {
  const { t, locale } = useLocale()
  const { refreshMarket } = useDataActions()
  const { ratesPanel, error, loaded } = useMarketData()
  const loadedOnce = loaded.ratesPanel

  if (ratesPanel.length === 0) {
    return (
      <div className="panel panel--min-height">
        <div className="panel__title">{t('panel.rates')}</div>
        <div className="panel__state">
          <span>{!loadedOnce ? t('common.loading') : error.ratesPanel ? t('common.loadFailed') : t('common.noData')}</span>
          {loadedOnce && (
            <button type="button" className="panel__retry" onClick={refreshMarket}>{t('common.retry')}</button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="panel panel--min-height">
      <div className="panel__title">{t('panel.rates')}</div>
      <div>
        {ratesPanel.map((r) => (
          <RateRow key={r.name} {...r} locale={locale} animate={loadedOnce} />
        ))}
      </div>
    </div>
  )
}
