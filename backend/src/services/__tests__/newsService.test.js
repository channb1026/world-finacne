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
          { title: 'Test News - Reuters', link: 'https://example.com/1?dup=1', pubDate: new Date().toISOString() },
          { title: 'Fed signals slower pace as inflation cools', link: 'https://example.com/2', pubDate: new Date().toISOString() },
          { title: 'Fed signals slower pace after inflation cools', link: 'https://example.com/3', pubDate: new Date().toISOString() },
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

  it('getHotNews 会压缩跨源重复标题', async () => {
    const hot = await getHotNews()
    const titles = hot.map((item) => item.title)
    expect(titles.filter((title) => /Test News/i.test(title)).length).toBe(1)
    expect(titles.filter((title) => /Fed signals slower pace/i.test(title)).length).toBe(1)
  })

  it('getHotNews 会附带分类字段', async () => {
    const hot = await getHotNews()
    expect(hot[0]).toHaveProperty('category')
    expect(hot[0]).toHaveProperty('marketScope')
    expect(Array.isArray(hot[0].tags)).toBe(true)
  })
})
