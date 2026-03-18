const DEFAULT_ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
]

function normalizeOrigin(origin) {
  return typeof origin === 'string' ? origin.trim().replace(/\/$/, '') : ''
}

export function getAllowedOrigins(envValue = process.env.ALLOWED_ORIGINS) {
  const configured = String(envValue ?? '')
    .split(',')
    .map(normalizeOrigin)
    .filter(Boolean)

  const list = configured.length > 0 ? configured : DEFAULT_ALLOWED_ORIGINS
  return new Set(list)
}

export function isOriginAllowed(origin, allowedOrigins = getAllowedOrigins()) {
  if (!origin) return true
  return allowedOrigins.has(normalizeOrigin(origin))
}

export function createCorsOptions({
  allowedOrigins = getAllowedOrigins(),
} = {}) {
  return {
    origin(origin, callback) {
      if (isOriginAllowed(origin, allowedOrigins)) {
        callback(null, true)
        return
      }
      callback(new Error('CORS origin denied'))
    },
    optionsSuccessStatus: 204,
  }
}

function getClientKey(req) {
  const forwarded = req.headers['x-forwarded-for']
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim()
  }
  return req.ip || req.socket?.remoteAddress || 'unknown'
}

export function createRateLimiter({
  windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60_000),
  max = Number(process.env.RATE_LIMIT_MAX ?? 120),
  now = () => Date.now(),
} = {}) {
  const buckets = new Map()

  return function rateLimiter(req, res, next) {
    if (req.method === 'OPTIONS' || req.path === '/api/health') {
      next()
      return
    }

    const currentTime = now()
    const key = getClientKey(req)
    const existing = buckets.get(key)
    const bucket =
      !existing || currentTime >= existing.resetAt
        ? { count: 0, resetAt: currentTime + windowMs }
        : existing

    bucket.count += 1
    buckets.set(key, bucket)

    const remaining = Math.max(max - bucket.count, 0)
    res.setHeader('X-RateLimit-Limit', String(max))
    res.setHeader('X-RateLimit-Remaining', String(remaining))
    res.setHeader('X-RateLimit-Reset', String(Math.ceil(bucket.resetAt / 1000)))

    if (bucket.count > max) {
      res.setHeader('Retry-After', String(Math.max(1, Math.ceil((bucket.resetAt - currentTime) / 1000))))
      res.status(429).json({ error: 'Too many requests' })
      return
    }

    if (buckets.size > 5000) {
      for (const [bucketKey, value] of buckets.entries()) {
        if (currentTime >= value.resetAt) {
          buckets.delete(bucketKey)
        }
      }
    }

    next()
  }
}
