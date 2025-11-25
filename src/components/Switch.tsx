import React from 'react'

export interface SwitchProps {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  label?: string
  className?: string
}

export function Switch({ checked, onCheckedChange, label, className = '' }: SwitchProps) {
  return (
    <label className={`flex items-center gap-2 cursor-pointer ${className}`}>
      {label && (
        <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
          {label}
        </span>
      )}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onCheckedChange(!checked)}
        className={`
          relative inline-flex h-5 w-9 items-center rounded-full
          transition-colors duration-200 ease-in-out
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          dark:focus:ring-offset-neutral-900
          ${checked
            ? 'bg-blue-600 dark:bg-blue-500'
            : 'bg-slate-300 dark:bg-neutral-600'
          }
        `}
      >
        <span
          className={`
            inline-block h-4 w-4 transform rounded-full
            bg-white shadow-sm
            transition-transform duration-200 ease-in-out
            ${checked ? 'translate-x-[18px]' : 'translate-x-[2px]'}
          `}
        />
      </button>
    </label>
  )
}
