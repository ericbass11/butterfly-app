import { motion } from 'framer-motion'
import type { Stage } from '@/lib/types'
import { stageMeta } from '@/lib/gamification'
import { clsx } from '@/lib/utils'
import { Metamorphosis } from './Metamorphosis'

const sizes = {
  sm: { box: 'w-12 h-12', svg: 34 },
  md: { box: 'w-24 h-24', svg: 68 },
  lg: { box: 'w-40 h-40', svg: 122 },
}

interface Props {
  stage: Stage
  size?: keyof typeof sizes
  className?: string
}

/** Avatar lúdico da metamorfose: Larva → Casulo → Borboleta (RF06). */
export function ButterflyAvatar({ stage, size = 'md', className }: Props) {
  const s = sizes[size]
  return (
    <motion.div
      initial={{ scale: 0.85, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={clsx(
        'relative rounded-full flex items-center justify-center overflow-hidden',
        'bg-gradient-to-br from-secondary-fixed via-surface-container-lowest to-primary-fixed/50 shadow-ambient-lg',
        s.box,
        className,
      )}
    >
      <div className="absolute inset-1 rounded-full bg-surface-container-lowest/60" />
      <motion.div
        key={stage}
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 220, damping: 18 }}
        className="relative z-10"
      >
        <Metamorphosis stage={stage} size={s.svg} />
      </motion.div>
    </motion.div>
  )
}

export function StageBadge({ stage }: { stage: Stage }) {
  const meta = stageMeta(stage)
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary-fixed/60 pl-1.5 pr-3 py-1 font-label-md text-label-md text-on-secondary-fixed-variant">
      <span className="w-6 h-6 rounded-full bg-surface-container-lowest flex items-center justify-center overflow-hidden">
        <Metamorphosis stage={stage} size={20} />
      </span>
      Estágio: {meta.label}
    </span>
  )
}
