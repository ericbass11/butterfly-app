import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from './Icon'
import { clsx } from '@/lib/utils'

interface TopBarProps {
  title?: string
  subtitle?: string
  showBack?: boolean
  left?: ReactNode
  right?: ReactNode
  brand?: boolean
}

export function TopBar({ title = 'Butterfly', subtitle, showBack, left, right, brand }: TopBarProps) {
  const navigate = useNavigate()
  return (
    <header
      className="fixed top-0 left-0 w-full z-40 flex justify-between items-center px-container-padding h-16
                 bg-surface/80 backdrop-blur-xl shadow-sm shadow-secondary/5 pt-safe
                 mx-auto max-w-[520px] left-1/2 -translate-x-1/2"
    >
      <div className="flex items-center gap-3 min-w-0">
        {showBack && (
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 -ml-2 flex items-center justify-center rounded-full text-on-surface hover:bg-surface-container-high active:scale-95"
            aria-label="Voltar"
          >
            <Icon name="arrow_back" />
          </button>
        )}
        {left}
        <div className="min-w-0">
          <h1
            className={clsx(
              'font-headline-md text-headline-md font-bold tracking-tight truncate',
              brand ? 'text-primary flex items-center gap-1.5' : 'text-on-surface',
            )}
          >
            {brand && <Icon name="eco" fill className="text-[22px]" />}
            {title}
          </h1>
          {subtitle && (
            <p className="font-body-sm text-body-sm text-on-surface-variant leading-none">{subtitle}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1">{right}</div>
    </header>
  )
}
