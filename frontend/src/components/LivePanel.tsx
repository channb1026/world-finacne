import { LIVE_SLOTS } from '../data/liveSlots'

/** 直播位统一为「新窗口打开」卡片，避免嵌入显示 Video unavailable */
export function LivePanel() {
  return (
    <div className="panel live-panel">
      <div className="panel__title">频道直播</div>
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
                新窗口打开
              </a>
            </div>
            <a
              href={slot.pageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="live-slot__link-card"
            >
              <span className="live-slot__link-icon">▶</span>
              <span className="live-slot__link-label">点击在新窗口观看直播</span>
              <span className="live-slot__link-url">{slot.pageUrl.replace(/^https?:\/\//, '')}</span>
            </a>
          </div>
        ))}
      </div>
    </div>
  )
}
