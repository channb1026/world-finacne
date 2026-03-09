import { useLocale } from '../i18n/LocaleContext'

/** 地图懒加载占位：保持布局，避免首屏加载 Leaflet 时 layout shift */
export function MapSkeleton() {
  const { t } = useLocale()
  return (
    <div className="map-wrap map-skeleton" aria-hidden>
      <div className="map-skeleton__content">{t('common.loading')}</div>
    </div>
  )
}
