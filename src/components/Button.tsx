import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { motion } from 'framer-motion'
import { clsx } from '@/lib/utils'
import { Icon } from './Icon'

type Variant = 'primary' | 'ghost' | 'tonal'

interface ButtonProps
  extends Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    'onAnimationStart' | 'onAnimationEnd' | 'onDrag' | 'onDragStart' | 'onDragEnd'
  > {
  variant?: Variant
  icon?: string
  iconRight?: string
  fullWidth?: boolean
  children: ReactNode
}

const base =
  'inline-flex items-center justify-center gap-2 min-h-[48px] px-6 rounded-full font-label-md text-label-md transition-all active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none'

const variants: Record<Variant, string> = {
  primary: 'bg-primary text-on-primary shadow-ambient hover:bg-on-primary-fixed-variant',
  ghost: 'border border-secondary-fixed-dim text-secondary hover:bg-secondary-fixed/40',
  tonal: 'bg-primary-container text-on-primary hover:opacity-90',
}

export function Button({
  variant = 'primary',
  icon,
  iconRight,
  fullWidth,
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className={clsx(base, variants[variant], fullWidth && 'w-full', className)}
      {...rest}
    >
      {icon && <Icon name={icon} className="text-[20px]" />}
      <span>{children}</span>
      {iconRight && <Icon name={iconRight} className="text-[20px]" />}
    </motion.button>
  )
}
