import { clsx } from '@/lib/utils'
import { pct } from '@/lib/utils'

interface ProgressBarProps {
  ratio: number
  className?: string
  /** Mostra um marcador de "borboleta" na cabeça da barra (RF06 — toque lúdico). */
  butterflyHead?: boolean
}

export function ProgressBar({ ratio, className, butterflyHead }: ProgressBarProps) {
  const width = pct(ratio)
  return (
    <div className={clsx('relative h-2 w-full bg-tertiary-fixed rounded-full overflow-visible', className)}>
      <div
        className="absolute top-0 left-0 h-full bg-primary rounded-full transition-all duration-1000 ease-out"
        style={{ width }}
      >
        {butterflyHead && ratio > 0.02 && (
          <span
            className="material-symbols-outlined icon-fill absolute -right-2 -top-[7px] text-[16px] text-primary drop-shadow-sm"
            aria-hidden="true"
          >
            flutter_dash
          </span>
        )}
      </div>
    </div>
  )
}
