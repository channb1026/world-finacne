import { useLocale } from '../i18n/LocaleContext'
import { useData } from '../state/DataContext'
import { getCommodityDisplayName, getCommodityUnitDisplay } from '../i18n/displayNames'
import { useFlashOnChange } from '../hooks/useFlashOnChange'

function formatLastUpdated(date: Date, locale: 'zh' | 'en'): string {
  const tag = locale === 'en' ? 'en-US' : 'zh-CN'
  return date.toLocaleTimeString(tag, { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export function CommoditiesPanel() {
  const { locale, t } = useLocale()
  const { data, refreshMarket } = useData()
  const { commodities, lastUpdated, error, loaded } = data
  const loadedOnce = loaded.commodities

  if (commodities.length === 0) {
    const msg = !loadedOnce ? t('common.loading') : error.commodities ? t('common.loadFailed') : t('common.noData')
    return (
      <div className="panel panel--min-height">
        <div className="panel__title">{t('panel.commodities')}</div>
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
        {t('panel.commodities')}
        {lastUpdated.market && <span className="panel__updated">{t('common.updated')} {formatLastUpdated(lastUpdated.market, locale)}</span>}
      </div>
      <div className="panel__subtitle">{t('panel.mainVarieties')}</div>
      <div>
      {commodities.map((c) => {
        const flashValue = useFlashOnChange(c.value, c.name)
        const flashChange = useFlashOnChange(c.changePct, `${c.name}-chg`)
        const displayValue =
          typeof c.value === 'number' && c.value > 1000 ? c.value.toLocaleString() : c.value
        return (
          <div key={c.name} className="commodity-row">
            <span className="commodity-row__name">{getCommodityDisplayName(c.name, locale)}</span>
            <span className={`commodity-row__value ${flashValue ? 'value-flash' : ''}`}>
              {displayValue}
            </span>
            <span className="commodity-row__unit">{getCommodityUnitDisplay(c.unit, locale)}</span>
            <span className={`commodity-row__chg ${c.changePct >= 0 ? 'up' : 'down'} ${flashChange ? 'value-flash' : ''}`}>
              {c.changePct >= 0 ? '+' : ''}{c.changePct}%
            </span>
          </div>
        )
      })}
      </div>
    </div>
  )
}
