import React, { ReactNode, useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'

interface SimpleTooltipProps {
  text: string
  children: ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
}

const TOOLTIP_OFFSET = 6

export function SimpleTooltip({
  text,
  children,
  position = 'bottom',
}: SimpleTooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [coords, setCoords] = useState({ x: 0, y: 0 })
  const triggerRef = useRef<HTMLSpanElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isVisible || !triggerRef.current) return

    const updatePosition = () => {
      const rect = triggerRef.current!.getBoundingClientRect()
      const tooltipRect = tooltipRef.current?.getBoundingClientRect()
      const tooltipWidth = tooltipRect?.width || 100
      const tooltipHeight = tooltipRect?.height || 28

      let x = 0
      let y = 0

      switch (position) {
        case 'top':
          x = rect.left + rect.width / 2 - tooltipWidth / 2
          y = rect.top - tooltipHeight - TOOLTIP_OFFSET
          break
        case 'bottom':
          x = rect.left + rect.width / 2 - tooltipWidth / 2
          y = rect.bottom + TOOLTIP_OFFSET
          break
        case 'left':
          x = rect.left - tooltipWidth - TOOLTIP_OFFSET
          y = rect.top + rect.height / 2 - tooltipHeight / 2
          break
        case 'right':
          x = rect.right + TOOLTIP_OFFSET
          y = rect.top + rect.height / 2 - tooltipHeight / 2
          break
      }

      // Keep tooltip within viewport bounds
      const padding = 8
      x = Math.max(padding, Math.min(x, window.innerWidth - tooltipWidth - padding))
      y = Math.max(padding, Math.min(y, window.innerHeight - tooltipHeight - padding))

      setCoords({ x, y })
    }

    updatePosition()
    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)

    return () => {
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [isVisible, position])

  const tooltip = isVisible && createPortal(
    <div
      ref={tooltipRef}
      className="fixed z-[9999] pointer-events-none"
      style={{ left: coords.x, top: coords.y }}
    >
      <div className="px-2 py-1 bg-slate-800 dark:bg-slate-700 text-white text-xs rounded shadow-lg whitespace-nowrap">
        {text}
      </div>
    </div>,
    document.body
  )

  return (
    <span
      ref={triggerRef}
      className="inline-flex"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {tooltip}
    </span>
  )
}
