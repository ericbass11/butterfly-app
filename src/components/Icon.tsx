import { clsx } from '@/lib/utils'

interface IconProps {
  name: string
  className?: string
  fill?: boolean
  weight?: number
  style?: React.CSSProperties
}

/** Material Symbols Outlined — traços lineares 2px, cantos arredondados. */
export function Icon({ name, className, fill = false, weight, style }: IconProps) {
  return (
    <span
      className={clsx('material-symbols-outlined select-none', fill && 'icon-fill', className)}
      style={{
        ...(weight ? { fontVariationSettings: `'FILL' ${fill ? 1 : 0}, 'wght' ${weight}` } : {}),
        ...style,
      }}
      aria-hidden="true"
    >
      {name}
    </span>
  )
}
