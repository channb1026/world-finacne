import { describe, it, expect, vi } from 'vitest'
import { createCorsOptions, createRateLimiter, getAllowedOrigins, isOriginAllowed } from '../../security.js'

describe('security', () => {
  it('默认允许本地前端来源，并拒绝未配置来源', () => {
    const allowedOrigins = getAllowedOrigins('')
    expect(isOriginAllowed('http://localhost:5173', allowedOrigins)).toBe(true)
    expect(isOriginAllowed('https://evil.example.com', allowedOrigins)).toBe(false)
  })

  it('ALLOWED_ORIGINS 支持逗号分隔配置', () => {
    const allowedOrigins = getAllowedOrigins('https://app.example.com, https://admin.example.com/')
    expect(isOriginAllowed('https://app.example.com', allowedOrigins)).toBe(true)
    expect(isOriginAllowed('https://admin.example.com', allowedOrigins)).toBe(true)
    expect(isOriginAllowed('https://other.example.com', allowedOrigins)).toBe(false)
  })

  it('CORS 配置拒绝未授权 origin', () => {
    const options = createCorsOptions({
      allowedOrigins: new Set(['https://app.example.com']),
    })
    const callback = vi.fn()

    options.origin('https://evil.example.com', callback)

    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback.mock.calls[0][0]).toBeInstanceOf(Error)
  })

  it('限流器在窗口内超过阈值后返回 429', () => {
    let currentTime = 0
    const limiter = createRateLimiter({
      windowMs: 10_000,
      max: 2,
      now: () => currentTime,
    })
    const next = vi.fn()

    function createRes() {
      return {
        statusCode: 200,
        headers: {},
        body: null,
        setHeader(name, value) {
          this.headers[name] = value
        },
        status(code) {
          this.statusCode = code
          return this
        },
        json(payload) {
          this.body = payload
          return this
        },
      }
    }

    const req = {
      method: 'GET',
      path: '/api/news',
      headers: {},
      ip: '127.0.0.1',
      socket: { remoteAddress: '127.0.0.1' },
    }

    limiter(req, createRes(), next)
    limiter(req, createRes(), next)
    const blocked = createRes()
    limiter(req, blocked, next)

    expect(next).toHaveBeenCalledTimes(2)
    expect(blocked.statusCode).toBe(429)
    expect(blocked.body).toEqual({ error: 'Too many requests' })

    currentTime = 11_000
    const recovered = createRes()
    limiter(req, recovered, next)

    expect(recovered.statusCode).toBe(200)
    expect(next).toHaveBeenCalledTimes(3)
  })
})
