import { useEffect, useRef } from 'react'

export function useValueFlash<T extends HTMLElement>(value: string | number, enabled: boolean) {
  const ref = useRef<T | null>(null)
  const lastValueRef = useRef<string | number>(value)
  const mountedRef = useRef(false)

  useEffect(() => {
    if (!enabled) {
      lastValueRef.current = value
      return
    }

    if (!mountedRef.current) {
      mountedRef.current = true
      lastValueRef.current = value
      return
    }

    if (Object.is(lastValueRef.current, value)) return
    lastValueRef.current = value

    const node = ref.current
    if (!node) return

    node.classList.remove('value-flash')
    const rafId = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!node.isConnected) return
        node.classList.add('value-flash')
      })
    })

    const handleAnimationEnd = () => {
      node.classList.remove('value-flash')
    }

    node.addEventListener('animationend', handleAnimationEnd, { once: true })
    return () => {
      cancelAnimationFrame(rafId)
      node.removeEventListener('animationend', handleAnimationEnd)
    }
  }, [enabled, value])

  return ref
}
