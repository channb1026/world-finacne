import { describe, it, expect } from 'vitest'
import { isSafeLink } from '../linkSafety'

describe('isSafeLink', () => {
  it('http 和 https 返回 true', () => {
    expect(isSafeLink('https://example.com')).toBe(true)
    expect(isSafeLink('http://example.com')).toBe(true)
  })

  it('javascript:、ftp:、空等非 http 返回 false', () => {
    expect(isSafeLink('javascript:alert(1)')).toBe(false)
    expect(isSafeLink('ftp://example.com')).toBe(false)
    expect(isSafeLink('')).toBe(false)
    expect(isSafeLink(undefined)).toBe(false)
  })
})
