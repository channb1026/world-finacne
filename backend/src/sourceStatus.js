const sourceStatusByKey = new Map()

function touchSource(key, patch = {}) {
  const existing = sourceStatusByKey.get(key) || {
    key,
    name: key,
    category: 'unknown',
    status: 'unknown',
    message: '',
    lastSuccessAt: null,
    lastFailureAt: null,
    meta: {},
  }

  const next = {
    ...existing,
    ...patch,
    meta: {
      ...existing.meta,
      ...(patch.meta || {}),
    },
  }

  sourceStatusByKey.set(key, next)
}

export function registerSource(key, patch = {}) {
  touchSource(key, patch)
}

export function markSourceSuccess(key, patch = {}) {
  touchSource(key, {
    ...patch,
    status: 'up',
    message: patch.message ?? '',
    lastSuccessAt: new Date().toISOString(),
  })
}

export function markSourceFailure(key, error, patch = {}) {
  touchSource(key, {
    ...patch,
    status: 'down',
    message: error instanceof Error ? error.message : String(error ?? patch.message ?? ''),
    lastFailureAt: new Date().toISOString(),
  })
}

export function getSourceStatuses() {
  return Array.from(sourceStatusByKey.values())
    .sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name))
    .map((item) => ({ ...item, meta: { ...item.meta } }))
}
