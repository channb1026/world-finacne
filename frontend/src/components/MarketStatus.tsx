import { useState, useEffect } from 'react'
import { useLocale } from '../i18n/LocaleContext'

/** 根据当前 UTC 小时简化为三地开市状态（仅作展示） */
function useMarketStatus() {
  const [status, setStatus] = useState<{ asia: boolean; europe: boolean; americas: boolean }>({ asia: false, europe: false, americas: false })

  useEffect(() => {
    const update = () => {
      const utcHour = new Date().getUTCHours()
      setStatus({
        asia: utcHour >= 0 && utcHour < 9,
        europe: utcHour >= 7 && utcHour < 17,
        americas: utcHour >= 13 || utcHour < 5,
      })
    }
    update()
    const t = setInterval(update, 60 * 1000)
    return () => clearInterval(t)
  }, [])

  return status
}

export function MarketStatus() {
  const { t } = useLocale()
  const { asia, europe, americas } = useMarketStatus()

  return (
    <div className="panel market-status">
      <div className="panel__title">{t('panel.marketStatus')}</div>
      <div className="market-status__list">
        <div className="market-status__row">
          <span className="market-status__name">{t('marketStatus.asia')}</span>
          <span className={`market-status__dot ${asia ? 'open' : 'closed'}`} />
          <span className="market-status__label">{asia ? t('marketStatus.open') : t('marketStatus.closed')}</span>
        </div>
        <div className="market-status__row">
          <span className="market-status__name">{t('marketStatus.europe')}</span>
          <span className={`market-status__dot ${europe ? 'open' : 'closed'}`} />
          <span className="market-status__label">{europe ? t('marketStatus.open') : t('marketStatus.closed')}</span>
        </div>
        <div className="market-status__row">
          <span className="market-status__name">{t('marketStatus.americas')}</span>
          <span className={`market-status__dot ${americas ? 'open' : 'closed'}`} />
          <span className="market-status__label">{americas ? t('marketStatus.open') : t('marketStatus.closed')}</span>
        </div>
      </div>
    </div>
  )
}
