import { LIVE_SLOTS } from '../data/liveSlots'
import { useLocale } from '../i18n/LocaleContext'

/** 直播位统一为「新窗口打开」卡片，避免嵌入显示 Video unavailable */
export function LivePanel() {
  const { t } = useLocale()
  return (
    <div className="panel live-panel">
      <div className="panel__title">{t('panel.live')}</div>
      <div className="live-panel__slots">
        {LIVE_SLOTS.map((slot) => (
          <div key={slot.id} className="live-slot">
            <div className="live-slot__header">
              <span className="live-slot__title">{slot.title}</span>
              <a
                href={slot.pageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="live-slot__open"
              >
                {t('panel.openInNewWindow')}
              </a>
            </div>
            <a
              href={slot.pageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="live-slot__link-card"
            >
              <span className="live-slot__link-icon">▶</span>
              <span className="live-slot__link-label">{t('panel.clickToWatch')}</span>
              <span className="live-slot__link-url">{slot.pageUrl.replace(/^https?:\/\//, '')}</span>
            </a>
          </div>
        ))}
      </div>
    </div>
  )
}
