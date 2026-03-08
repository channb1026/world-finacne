/** 直播位配置：点击即在新窗口打开官方直播页（嵌入易遇 Video unavailable，故不采用） */

export interface LiveSlot {
  id: string
  title: string
  pageUrl: string
}

export const LIVE_SLOTS: LiveSlot[] = [
  {
    id: 'france24',
    title: 'France 24',
    pageUrl: 'https://www.youtube.com/watch?v=jwK3gXNJDNk&autoplay=1',
  },
  {
    id: 'aljazeera',
    title: 'Al Jazeera',
    pageUrl: 'https://www.youtube.com/watch?v=Wq-odqeUrpM&autoplay=1',
  },
  {
    id: 'dw',
    title: 'DW News',
    pageUrl: 'https://www.youtube.com/watch?v=2e-fWHkFbIg&autoplay=1',
  },
  {
    id: 'cnbc',
    title: 'CNBC Live',
    pageUrl: 'https://www.cnbc.com/cnbc-live/',
  },
  {
    id: 'bloomberg',
    title: 'Bloomberg TV',
    pageUrl: 'https://www.bloomberg.com/live/',
  },
]
