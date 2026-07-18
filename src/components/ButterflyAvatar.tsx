import { motion } from 'framer-motion'
import type { Stage } from '@/lib/types'
import { stageMeta } from '@/lib/gamification'
import { clsx } from '@/lib/utils'
import { Icon } from './Icon'

const stageIcon: Record<Stage, string> = {
  larva: 'pest_control',
  casulo: 'egg',
  borboleta: 'flutter_dash',
}

const sizes = {
  sm: { box: 'w-12 h-12', icon: 'text-[24px]' },
  md: { box: 'w-24 h-24', icon: 'text-[44px]' },
  lg: { box: 'w-40 h-40', icon: 'text-[80px]' },
}

interface Props {
  stage: Stage
  size?: keyof typeof sizes
  animated?: boolean
  className?: string
}

/** Avatar lúdico da metamorfose: Larva → Casulo → Borboleta (RF06). */
export function ButterflyAvatar({ stage, size = 'md', animated = true, className }: Props) {
  const s = sizes[size]
  const isButterfly = stage === 'borboleta'
  return (
    <motion.div
      initial={{ scale: 0.85, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={clsx(
        'relative rounded-full flex items-center justify-center',
        'bg-gradient-to-br from-secondary-fixed to-primary-fixed/60 shadow-ambient-lg',
        s.box,
        className,
      )}
    >
      <div className="absolute inset-1 rounded-full bg-surface-container-lowest/70 backdrop-blur-sm" />
      <motion.span
        key={stage}
        initial={{ scale: 0.5, rotate: -12, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 16 }}
        className="relative z-10"
      >
        <Icon
          name={stageIcon[stage]}
          fill
          className={clsx('text-primary', s.icon, animated && isButterfly && 'animate-flutter')}
        />
      </motion.span>
    </motion.div>
  )
}

export function StageBadge({ stage }: { stage: Stage }) {
  const meta = stageMeta(stage)
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary-fixed/60 px-3 py-1 font-label-md text-label-md text-on-secondary-fixed-variant">
      <Icon name={stageIcon[stage]} fill className="text-[16px]" />
      Estágio: {meta.label}
    </span>
  )
}
