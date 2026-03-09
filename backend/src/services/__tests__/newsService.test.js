/**
 * 新闻服务：getHotNews 返回数组，item 含 title/link/source。
 * Mock rss-parser 避免真实网络请求。
 */
import { describe, it, expect, vi } from 'vitest'

vi.mock('rss-parser', () => ({
  default: class MockParser {
    constructor() {}
    async parseURL() {
      return {
        items: [
          { title: 'Test News', link: 'https://example.com/1', pubDate: new Date().toISOString() },
        ],
      }
    }
  },
}))

import { getHotNews } from '../newsService.js'

describe('newsService', () => {
  it('getHotNews 返回数组', async () => {
    const hot = await getHotNews()
    expect(Array.isArray(hot)).toBe(true)
  })

  it('getHotNews 项含 title、link、source', async () => {
    const hot = await getHotNews()
    if (hot.length > 0) {
      expect(hot[0]).toHaveProperty('title')
      expect(hot[0]).toHaveProperty('link')
      expect(hot[0]).toHaveProperty('source')
    }
  })
})
