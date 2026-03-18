/**
 * 中英文文案映射，键为 dot 路径，值为 { zh, en }。
 */

export type Locale = 'zh' | 'en'

export const messages: Record<string, { zh: string; en: string }> = {
  'common.loading': { zh: '加载中…', en: 'Loading…' },
  'common.loadFailed': { zh: '加载失败', en: 'Load failed' },
  'common.noData': { zh: '暂无数据', en: 'No data' },
  'common.retry': { zh: '重试', en: 'Retry' },
  'common.updated': { zh: '更新', en: 'Updated' },
  'common.close': { zh: '关闭', en: 'Close' },

  'bottomBar.switchToBeijing': { zh: '切至北京', en: 'Switch to Beijing' },
  'bottomBar.switchToUtc': { zh: '切至 UTC', en: 'Switch to UTC' },
  'bottomBar.refreshHint': { zh: '行情 3s · 新闻/快讯/日历 45s', en: 'Market 3s · News/Breaking/Calendar 45s' },
  'bottomBar.copyViewLink': { zh: '复制视角链接', en: 'Copy view link' },
  'bottomBar.copied': { zh: '已复制', en: 'Copied' },
  'bottomBar.comingUp': { zh: '即将到来', en: 'Coming up' },
  'bottomBar.calendarPlaceholder': { zh: '当前窗口暂无经济事件', en: 'No economic events in the current window' },

  'ticker.feed': { zh: '快讯', en: 'Breaking' },

  'map.preset.world': { zh: '全球', en: 'World' },
  'map.preset.americas': { zh: '美洲', en: 'Americas' },
  'map.preset.europe': { zh: '欧洲', en: 'Europe' },
  'map.preset.asia': { zh: '亚太', en: 'Asia-Pacific' },
  'map.preset.china': { zh: '中国', en: 'China' },
  'map.preset.mena': { zh: '中东', en: 'Middle East' },
  'map.preset.africa': { zh: '非洲', en: 'Africa' },
  'map.legendSpots': { zh: '亮点 = 该地区新闻条数', en: 'Spots = news count by region' },
  'map.showSpots': { zh: '显示亮点', en: 'Show spots' },
  'map.ariaPresets': { zh: '地图区域预设', en: 'Map region presets' },
  'map.ariaLegend': { zh: '地图图例与图层', en: 'Map legend and layers' },
  'map.ariaSpotsLayer': { zh: '显示新闻亮点图层', en: 'Show news spots layer' },
  'map.spotHint': { zh: '条情报（点击查看）', en: ' items (click to view)' },

  'panel.fx': { zh: '关键汇率 · 对人民币', en: 'Key FX vs CNY' },
  'panel.mainRates': { zh: '主要汇率', en: 'Major rates' },
  'panel.commodities': { zh: '大宗商品', en: 'Commodities' },
  'panel.mainVarieties': { zh: '主要品种', en: 'Major varieties' },
  'panel.news': { zh: '热点财经', en: 'Hot topics' },
  'panel.aShare': { zh: '中国 A 股', en: 'China A-Share' },
  'panel.aShareNews': { zh: 'A 股资讯', en: 'A-Share news' },
  'panel.mainIndices': { zh: '主要指数', en: 'Major indices' },
  'panel.stocks': { zh: '全球股市', en: 'Global stocks' },
  'panel.rates': { zh: '利率 · 波动率', en: 'Rates & volatility' },
  'panel.marketStatus': { zh: '市场状态', en: 'Market status' },
  'panel.live': { zh: '频道直播', en: 'Live' },
  'panel.sourceHealth': { zh: '源状态监控', en: 'Source health' },
  'panel.openInNewWindow': { zh: '新窗口打开', en: 'Open in new window' },
  'panel.clickToWatch': { zh: '点击在新窗口观看直播', en: 'Click to watch in new window' },
  'panel.filterAll': { zh: '全部', en: 'All' },
  'panel.filterByCategory': { zh: '按分类筛选', en: 'Filter by category' },
  'news.impact.high': { zh: '高影响', en: 'High impact' },
  'news.impact.medium': { zh: '关注', en: 'Watch' },

  'regionDrawer.intel': { zh: '地区情报', en: 'Regional intel' },
  'regionDrawer.regionNews': { zh: '该地区资讯', en: 'News in this region' },
  'regionDrawer.noRegionNews': { zh: '暂无该地区最新情报', en: 'No regional news' },

  'marketStatus.asia': { zh: '亚太', en: 'Asia-Pacific' },
  'marketStatus.europe': { zh: '欧洲', en: 'Europe' },
  'marketStatus.americas': { zh: '美洲', en: 'Americas' },
  'marketStatus.open': { zh: '开市', en: 'Open' },
  'marketStatus.closed': { zh: '休市', en: 'Closed' },

  'aShare.noNews': { zh: '暂无 A 股资讯（部分 RSS 可能无法连接）', en: 'No A-Share news (some feeds may be unavailable)' },
  'sourceHealth.up': { zh: '正常', en: 'Up' },
  'sourceHealth.down': { zh: '异常', en: 'Down' },
  'sourceHealth.unknown': { zh: '未知', en: 'Unknown' },
  'sourceHealth.lastSuccess': { zh: '最近成功', en: 'Last success' },
  'sourceHealth.noMessage': { zh: '无错误信息', en: 'No error message' },
  'sourceHealth.filterAll': { zh: '全部', en: 'All' },
  'sourceHealth.filter.market': { zh: '行情', en: 'Market' },
  'sourceHealth.filter.calendar': { zh: '日历', en: 'Calendar' },
  'sourceHealth.filter.news': { zh: '新闻', en: 'News' },
  'sourceHealth.alert.fxCritical': { zh: '关键汇率主源与备用源同时异常，FX 数据存在中断风险。', en: 'Both primary and fallback FX sources are down.' },
  'sourceHealth.alert.calendarCritical': { zh: '经济日历主源与备用源同时异常，事件流可能中断。', en: 'Both primary and fallback calendar sources are down.' },
  'sourceHealth.alert.newsCritical': { zh: '新闻聚合源全部异常，新闻流已失去可用输入。', en: 'All news ingestion sources are down.' },
  'sourceHealth.alert.newsWarning': { zh: '新闻源异常占比偏高：{count}/{total} 个源异常。', en: 'News source failures are elevated: {count}/{total} down.' },

  'locale.zh': { zh: '中文', en: '中文' },
  'locale.en': { zh: 'English', en: 'English' },
}

export function getMessage(key: string, locale: Locale): string {
  const entry = messages[key]
  if (!entry) return key
  return entry[locale] ?? entry.zh
}
