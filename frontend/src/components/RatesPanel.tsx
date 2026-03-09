import { useLocale } from '../i18n/LocaleContext'
import { useData } from '../state/DataContext'
import { getRateDisplayName } from '../i18n/displayNames'
import { useFlashOnChange } from '../hooks/useFlashOnChange'

export function RatesPanel() {
  const { t, locale } = useLocale()
  const { data, refreshMarket } = useData()
  const { ratesPanel, error, loaded } = data
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
        {ratesPanel.map((r) => {
          const flashValue = useFlashOnChange(r.value, r.name)
          const flashChange = useFlashOnChange(r.changePct, `${r.name}-chg`)
          return (
            <div key={r.name} className="rate-row">
              <span className="rate-row__name">{getRateDisplayName(r.name, locale)}</span>
              <span className={`rate-row__value ${flashValue ? 'value-flash' : ''}`}>{r.value}</span>
              <span className={`rate-row__chg ${r.changePct >= 0 ? 'up' : 'down'} ${flashChange ? 'value-flash' : ''}`}>
                {r.changePct >= 0 ? '+' : ''}{r.changePct}%
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
