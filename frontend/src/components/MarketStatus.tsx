import { useState, useEffect } from 'react'

/** 根据当前 UTC 小时简化为三地开市状态（仅作展示） */
function useMarketStatus() {
  const [status, setStatus] = useState<{ asia: boolean; europe: boolean; americas: boolean }>({ asia: false, europe: false, americas: false })

  useEffect(() => {
    const update = () => {
      const utcHour = new Date().getUTCHours()
      // 亚太约 0–8 UTC 活跃，欧洲约 7–16，美洲约 13–21
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
  const { asia, europe, americas } = useMarketStatus()

  return (
    <div className="panel market-status">
      <div className="panel__title">市场状态</div>
      <div className="market-status__list">
        <div className="market-status__row">
          <span className="market-status__name">亚太</span>
          <span className={`market-status__dot ${asia ? 'open' : 'closed'}`} />
          <span className="market-status__label">{asia ? '开市' : '休市'}</span>
        </div>
        <div className="market-status__row">
          <span className="market-status__name">欧洲</span>
          <span className={`market-status__dot ${europe ? 'open' : 'closed'}`} />
          <span className="market-status__label">{europe ? '开市' : '休市'}</span>
        </div>
        <div className="market-status__row">
          <span className="market-status__name">美洲</span>
          <span className={`market-status__dot ${americas ? 'open' : 'closed'}`} />
          <span className="market-status__label">{americas ? '开市' : '休市'}</span>
        </div>
      </div>
    </div>
  )
}
