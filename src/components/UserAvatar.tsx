import { motion } from 'framer-motion'
import type { Stage } from '@/lib/types'
import { ButterflyAvatar } from './ButterflyAvatar'
import { Metamorphosis } from './Metamorphosis'
import { clsx } from '@/lib/utils'

const boxes: Record<'sm' | 'md' | 'lg', { box: string; badge: string; badgeSvg: number }> = {
  sm: { box: 'w-12 h-12', badge: 'w-5 h-5', badgeSvg: 16 },
  md: { box: 'w-24 h-24', badge: 'w-7 h-7', badgeSvg: 22 },
  lg: { box: 'w-40 h-40', badge: 'w-11 h-11', badgeSvg: 34 },
}

interface Props {
  stage: Stage
  photoUrl?: string
  size?: 'sm' | 'md' | 'lg'
  showStage?: boolean
  className?: string
}

/**
 * Avatar da usuária: mostra a FOTO de perfil quando existe; caso contrário,
 * a ilustração animada da metamorfose. Um selo do estágio (larva/casulo/
 * borboleta) aparece no canto.
 */
export function UserAvatar({ stage, photoUrl, size = 'md', showStage = true, className }: Props) {
  const s = boxes[size]
  if (!photoUrl) {
    return <ButterflyAvatar stage={stage} size={size} className={className} />
  }
  return (
    <div className={clsx('relative', s.box, className)}>
      <motion.img
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        src={photoUrl}
        alt="Foto de perfil"
        className="w-full h-full rounded-full object-cover border-2 border-primary-container shadow-ambient-lg bg-surface-container-high"
      />
      {showStage && (
        <div
          className={clsx(
            'absolute -bottom-0.5 -right-0.5 rounded-full bg-surface-container-lowest flex items-center justify-center border-2 border-surface shadow-sm overflow-hidden',
            s.badge,
          )}
        >
          <Metamorphosis stage={stage} size={s.badgeSvg} />
        </div>
      )}
    </div>
  )
}
