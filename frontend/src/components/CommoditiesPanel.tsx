import { useLocale } from '../i18n/LocaleContext'
import { useDataActions, useMarketData } from '../state/DataContext'
import { getCommodityDisplayName, getCommodityUnitDisplay } from '../i18n/displayNames'
import { formatLastUpdated } from '../utils/format'

function CommodityRow({
  name,
  value,
  unit,
  changePct,
  locale,
  animate,
}: {
  name: string
  value: number
  unit: string
  changePct: number
  locale: 'zh' | 'en'
  animate: boolean
}) {
  const displayValue =
    typeof value === 'number' && value > 1000 ? value.toLocaleString() : value

  return (
    <div className="commodity-row">
      <span className="commodity-row__name">{getCommodityDisplayName(name, locale)}</span>
      <span key={`${name}-${value}`} className={`commodity-row__value ${animate ? 'value-flash' : ''}`}>
        {displayValue}
      </span>
      <span className="commodity-row__unit">{getCommodityUnitDisplay(unit, locale)}</span>
      <span key={`${name}-${changePct}`} className={`commodity-row__chg ${changePct >= 0 ? 'up' : 'down'} ${animate ? 'value-flash' : ''}`}>
        {changePct >= 0 ? '+' : ''}{changePct}%
      </span>
    </div>
  )
}

export function CommoditiesPanel() {
  const { locale, t } = useLocale()
  const { refreshMarket } = useDataActions()
  const { commodities, lastUpdated, error, loaded } = useMarketData()
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
        {lastUpdated && <span className="panel__updated">{t('common.updated')} {formatLastUpdated(lastUpdated, locale)}</span>}
      </div>
      <div className="panel__subtitle">{t('panel.mainVarieties')}</div>
      <div>
      {commodities.map((c) => (
        <CommodityRow key={c.name} {...c} locale={locale} animate={loadedOnce} />
      ))}
      </div>
    </div>
  )
}
