import React, { ReactNode, useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useEditorStore } from '../model/store'
import type { ConceptDefinition } from '../model/conceptDefinitions'

interface InfoTooltipProps {
  content: ConceptDefinition
  children: ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
  className?: string
}

const TOOLTIP_OFFSET = 8

export function InfoTooltip({
  content,
  children,
  position = 'bottom',
  className = '',
}: InfoTooltipProps) {
  const showHelpTooltips = useEditorStore(s => s.showHelpTooltips)
  const [isVisible, setIsVisible] = useState(false)
  const [coords, setCoords] = useState({ x: 0, y: 0 })
  const triggerRef = useRef<HTMLSpanElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isVisible || !triggerRef.current) return

    const updatePosition = () => {
      const rect = triggerRef.current!.getBoundingClientRect()
      const tooltipRect = tooltipRef.current?.getBoundingClientRect()
      const tooltipWidth = tooltipRect?.width || 256
      const tooltipHeight = tooltipRect?.height || 150

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

  if (!showHelpTooltips) {
    return <>{children}</>
  }

  const tooltip = isVisible && createPortal(
    <div
      ref={tooltipRef}
      className="fixed z-[9999] pointer-events-none"
      style={{ left: coords.x, top: coords.y }}
    >
      <div className="w-64 p-3 bg-slate-800 dark:bg-slate-700 text-white rounded-lg shadow-lg text-left">
        <div className="font-semibold text-sm mb-1">{content.title}</div>
        <div className="text-xs text-slate-300 mb-2">{content.description}</div>
        {content.characteristics && content.characteristics.length > 0 && (
          <ul className="text-xs text-slate-300 space-y-0.5">
            {content.characteristics.map((item, index) => (
              <li key={index} className="flex items-start gap-1.5">
                <span className="text-slate-500 mt-0.5">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>,
    document.body
  )

  return (
    <span
      ref={triggerRef}
      className={`inline-flex cursor-help ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {tooltip}
    </span>
  )
}
