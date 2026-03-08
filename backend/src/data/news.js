/**
 * 新闻数据层：委托 newsService 拉取真实 RSS，无 mock。
 */

import { getHotNews, getNewsByRegion, getAShareNews, getTickerTitles, getMapSpots } from '../services/newsService.js'

export async function hotNews() {
  return getHotNews()
}

export async function newsByRegion(region) {
  return getNewsByRegion(region)
}

export async function aShareNews() {
  return await getAShareNews()
}

export async function tickerTitles() {
  return await getTickerTitles()
}

export async function mapSpots() {
  return await getMapSpots()
}
