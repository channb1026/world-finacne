import { useEffect, useRef, useState } from 'react'

/**
 * 数据变化时短暂返回 true，可用于给单个数字加闪动动画。
 * 首次渲染不触发，仅在后续 value 或 key 变化时触发。
 */
export function useFlashOnChange<T>(value: T, key?: string | number, duration = 600): boolean {
  const [flashing, setFlashing] = useState(false)
  const prevRef = useRef<T | undefined>(undefined)
  const keyRef = useRef<string | number | undefined>(undefined)

  useEffect(() => {
    const hasPrev = prevRef.current !== undefined
    const keyChanged = keyRef.current !== key
    const valueChanged = hasPrev && prevRef.current !== value

    if (keyChanged || valueChanged) {
      setFlashing(true)
      const timer = setTimeout(() => setFlashing(false), duration)
      prevRef.current = value
      keyRef.current = key
      return () => clearTimeout(timer)
    }

    prevRef.current = value
    keyRef.current = key
  }, [value, key, duration])

  return flashing
}

