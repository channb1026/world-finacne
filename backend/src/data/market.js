/**
 * 行情数据层：委托 marketService 从 Yahoo Finance 拉取真实数据，无 mock。
 */

import {
  getRates,
  getStocks,
  getKeyMetrics,
  getCommodities,
  getAShareIndices,
  getRatesPanel,
  getCalendar,
} from '../services/marketService.js'

export async function rates() {
  return getRates()
}

export async function stocks() {
  return getStocks()
}

export async function keyMetrics() {
  return getKeyMetrics()
}

export async function commodities() {
  return getCommodities()
}

export async function aShareIndices() {
  return getAShareIndices()
}

export async function ratesPanel() {
  return getRatesPanel()
}

export async function calendar() {
  return getCalendar()
}
