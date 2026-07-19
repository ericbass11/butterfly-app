import { motion } from 'framer-motion'
import { clsx } from '@/lib/utils'

interface Props {
  size?: number
  className?: string
}

/**
 * Flutter — mascote ORIGINAL do app (uma borboleta simpática que guia a usuária
 * no tutorial). Personagem próprio, sem relação com marcas de terceiros.
 * Asas batem suavemente, corpo flutua e ela pisca de vez em quando.
 */
export function Mascot({ size = 96, className }: Props) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      className={clsx('drop-shadow-[0_6px_10px_rgba(0,0,0,0.15)]', className)}
      initial={{ y: 0 }}
      animate={{ y: [0, -5, 0] }}
      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      aria-hidden
    >
      <defs>
        <linearGradient id="flWingTop" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#5ce7d6" />
          <stop offset="0.5" stopColor="#4aa0ff" />
          <stop offset="1" stopColor="#8b6bff" />
        </linearGradient>
        <linearGradient id="flWingBot" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffd05a" />
          <stop offset="0.55" stopColor="#ff7a59" />
          <stop offset="1" stopColor="#e85aa6" />
        </linearGradient>
      </defs>

      {/* Asas — batem juntas (escala horizontal a partir do centro) */}
      <motion.g
        style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
        animate={{ scaleX: [1, 0.72, 1] }}
        transition={{ duration: 0.85, repeat: Infinity, ease: 'easeInOut' }}
      >
        <g stroke="#0c3b2e" strokeWidth="3.5" strokeLinejoin="round">
          {/* metade direita */}
          <g id="flHalf">
            <path d="M60 56 C 92 26 116 40 108 66 C 116 82 86 86 60 66 Z" fill="url(#flWingTop)" />
            <path d="M60 66 C 88 74 108 92 94 106 C 80 118 60 98 60 74 Z" fill="url(#flWingBot)" />
          </g>
          {/* metade esquerda (espelhada) */}
          <use href="#flHalf" transform="matrix(-1 0 0 1 120 0)" />
        </g>
      </motion.g>

      {/* Antenas */}
      <g fill="none" stroke="#0c3b2e" strokeWidth="3.5" strokeLinecap="round">
        <path d="M56 40 C 50 30 44 28 42 22" />
        <path d="M64 40 C 70 30 76 28 78 22" />
      </g>
      <circle cx="42" cy="21" r="3.5" fill="#0c3b2e" />
      <circle cx="78" cy="21" r="3.5" fill="#0c3b2e" />

      {/* Corpo */}
      <ellipse cx="60" cy="66" rx="8" ry="22" fill="#3a2f2a" />

      {/* Rosto amigável */}
      <circle cx="55" cy="52" r="5" fill="#fff" />
      <circle cx="65" cy="52" r="5" fill="#fff" />
      <motion.g
        animate={{ scaleY: [1, 1, 0.1, 1, 1] }}
        transition={{ duration: 4, repeat: Infinity, times: [0, 0.9, 0.94, 0.98, 1] }}
        style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
      >
        <circle cx="56" cy="53" r="2.4" fill="#14110f" />
        <circle cx="66" cy="53" r="2.4" fill="#14110f" />
      </motion.g>
      <path d="M55 61 Q 60 65 65 61" fill="none" stroke="#14110f" strokeWidth="2.4" strokeLinecap="round" />
      {/* bochechas */}
      <circle cx="49" cy="60" r="3" fill="#ff8fa3" opacity="0.6" />
      <circle cx="71" cy="60" r="3" fill="#ff8fa3" opacity="0.6" />
    </motion.svg>
  )
}
