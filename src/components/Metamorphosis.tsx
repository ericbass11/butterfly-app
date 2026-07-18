import { motion } from 'framer-motion'
import type { Stage } from '@/lib/types'

/**
 * Ilustrações SVG animadas da metamorfose (RF06), com vida própria:
 *  - Larva: corpo em segmentos que ondulam (rastejar) + antenas.
 *  - Casulo: crisálida pendurada que balança, com brilho interno pulsando
 *    e faíscas (transformação acontecendo lá dentro).
 *  - Borboleta: asas batendo + voo flutuante.
 */
export function Metamorphosis({ stage, size = 120 }: { stage: Stage; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none" role="img" aria-label={stage}>
      <defs>
        <linearGradient id="mm-green" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#5edda0" />
          <stop offset="1" stopColor="#006c46" />
        </linearGradient>
        <linearGradient id="mm-wing" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#cebff3" />
          <stop offset="0.55" stopColor="#645785" />
          <stop offset="1" stopColor="#2eb67d" />
        </linearGradient>
        <linearGradient id="mm-cocoon" x1="0.5" y1="0" x2="0.5" y2="1">
          <stop offset="0" stopColor="#7cfabb" />
          <stop offset="1" stopColor="#006c46" />
        </linearGradient>
        <radialGradient id="mm-glow" cx="0.5" cy="0.45" r="0.5">
          <stop offset="0" stopColor="#eafff4" />
          <stop offset="1" stopColor="#eafff4" stopOpacity="0" />
        </radialGradient>
      </defs>

      {stage === 'larva' && <Larva />}
      {stage === 'casulo' && <Cocoon />}
      {stage === 'borboleta' && <Butterfly />}
    </svg>
  )
}

// ---------- Larva ----------
function Larva() {
  // segmentos do corpo (x fixo, cy oscila em onda para simular o rastejar)
  const segs = [
    { x: 32, r: 9 },
    { x: 44, r: 11 },
    { x: 56, r: 12 },
    { x: 68, r: 11 },
    { x: 80, r: 10 },
  ]
  return (
    <motion.g
      animate={{ x: [0, 5, 0], rotate: [-1.5, 1.5, -1.5] }}
      transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
      style={{ transformOrigin: '60px 70px' }}
    >
      {/* rastro/sombra */}
      <ellipse cx="60" cy="90" rx="34" ry="4" fill="#006c46" opacity="0.12" />
      {segs.map((s, i) => (
        <motion.circle
          key={s.x}
          cx={s.x}
          r={s.r}
          fill="url(#mm-green)"
          stroke="#004128"
          strokeOpacity="0.15"
          animate={{ cy: [70, 63, 70] }}
          transition={{
            duration: 1.1,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.14,
          }}
        />
      ))}
      {/* cabeça */}
      <motion.g animate={{ y: [0, -7, 0] }} transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut', delay: segs.length * 0.14 }}>
        <circle cx="92" cy="70" r="13" fill="#2eb67d" stroke="#004128" strokeOpacity="0.2" />
        <circle cx="96" cy="66" r="2.4" fill="#04331f" />
        <circle cx="96" cy="74" r="2.4" fill="#04331f" />
        {/* antenas */}
        <path d="M98 59 q4 -8 9 -9" stroke="#04331f" strokeWidth="2" strokeLinecap="round" />
        <path d="M101 61 q6 -5 11 -4" stroke="#04331f" strokeWidth="2" strokeLinecap="round" />
        <circle cx="107" cy="50" r="1.8" fill="#7cfabb" />
        <circle cx="112" cy="57" r="1.8" fill="#7cfabb" />
      </motion.g>
    </motion.g>
  )
}

// ---------- Casulo ----------
function Cocoon() {
  return (
    <g>
      {/* fio de sustentação */}
      <line x1="60" y1="8" x2="60" y2="30" stroke="#3d4a41" strokeWidth="2" strokeLinecap="round" />
      <motion.g
        animate={{ rotate: [-6, 6, -6] }}
        transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transformOrigin: '60px 12px' }}
      >
        {/* corpo da crisálida */}
        <path
          d="M60 28 C74 28 82 44 82 64 C82 84 72 96 60 96 C48 96 38 84 38 64 C38 44 46 28 60 28 Z"
          fill="url(#mm-cocoon)"
          stroke="#004128"
          strokeOpacity="0.25"
        />
        {/* nervuras */}
        <path d="M50 40 C48 60 50 78 58 92" stroke="#004128" strokeOpacity="0.25" strokeWidth="1.5" fill="none" />
        <path d="M70 40 C72 60 70 78 62 92" stroke="#004128" strokeOpacity="0.25" strokeWidth="1.5" fill="none" />
        <path d="M60 30 L60 94" stroke="#004128" strokeOpacity="0.2" strokeWidth="1.2" />
        {/* brilho interno pulsando (transformação) */}
        <motion.ellipse
          cx="60"
          cy="62"
          rx="14"
          ry="24"
          fill="url(#mm-glow)"
          animate={{ opacity: [0.25, 0.85, 0.25], scale: [0.9, 1.08, 0.9] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          style={{ transformOrigin: '60px 62px' }}
        />
        {/* pontos de luz que sobem */}
        {[
          { x: 54, d: 0 },
          { x: 66, d: 0.7 },
          { x: 60, d: 1.3 },
        ].map((p) => (
          <motion.circle
            key={p.x + '-' + p.d}
            cx={p.x}
            r="1.8"
            fill="#eafff4"
            animate={{ cy: [78, 46], opacity: [0, 1, 0] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut', delay: p.d }}
          />
        ))}
      </motion.g>
      {/* faíscas ao redor */}
      {[
        { x: 30, y: 40, d: 0.2 },
        { x: 92, y: 52, d: 1 },
        { x: 34, y: 80, d: 1.6 },
        { x: 88, y: 84, d: 0.6 },
      ].map((s) => (
        <motion.g
          key={`${s.x}-${s.y}`}
          animate={{ opacity: [0, 1, 0], scale: [0.4, 1, 0.4] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: s.d }}
          style={{ transformOrigin: `${s.x}px ${s.y}px` }}
        >
          <path
            d={`M${s.x} ${s.y - 5} L${s.x + 1.4} ${s.y - 1.4} L${s.x + 5} ${s.y} L${s.x + 1.4} ${s.y + 1.4} L${s.x} ${s.y + 5} L${s.x - 1.4} ${s.y + 1.4} L${s.x - 5} ${s.y} L${s.x - 1.4} ${s.y - 1.4} Z`}
            fill="#7cfabb"
          />
        </motion.g>
      ))}
    </g>
  )
}

// ---------- Borboleta ----------
function Butterfly() {
  return (
    <motion.g
      animate={{ y: [0, -7, 0], rotate: [-3, 3, -3] }}
      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      style={{ transformOrigin: '60px 60px' }}
    >
      {/* asas — batem juntas na direção do corpo (scaleX) */}
      <motion.g
        animate={{ scaleX: [1, 0.32, 1] }}
        transition={{ duration: 0.62, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transformOrigin: '60px 60px', transformBox: 'view-box' }}
      >
        {/* asa superior esquerda */}
        <path d="M58 54 C40 30 16 28 16 46 C16 60 34 62 58 60 Z" fill="url(#mm-wing)" stroke="#4c406c" strokeOpacity="0.3" />
        {/* asa inferior esquerda */}
        <path d="M58 62 C42 74 24 80 24 66 C24 56 42 58 58 60 Z" fill="url(#mm-wing)" stroke="#4c406c" strokeOpacity="0.3" />
        {/* asa superior direita */}
        <path d="M62 54 C80 30 104 28 104 46 C104 60 86 62 62 60 Z" fill="url(#mm-wing)" stroke="#4c406c" strokeOpacity="0.3" />
        {/* asa inferior direita */}
        <path d="M62 62 C78 74 96 80 96 66 C96 56 78 58 62 60 Z" fill="url(#mm-wing)" stroke="#4c406c" strokeOpacity="0.3" />
        {/* detalhes nas asas */}
        <circle cx="30" cy="46" r="3.5" fill="#eafff4" opacity="0.7" />
        <circle cx="90" cy="46" r="3.5" fill="#eafff4" opacity="0.7" />
        <circle cx="36" cy="66" r="2.4" fill="#7cfabb" opacity="0.8" />
        <circle cx="84" cy="66" r="2.4" fill="#7cfabb" opacity="0.8" />
      </motion.g>

      {/* corpo */}
      <ellipse cx="60" cy="60" rx="3.4" ry="20" fill="#2e2445" />
      <circle cx="60" cy="41" r="4.4" fill="#2e2445" />
      {/* antenas */}
      <path d="M60 38 q-5 -10 -11 -12" stroke="#2e2445" strokeWidth="2" strokeLinecap="round" />
      <path d="M60 38 q5 -10 11 -12" stroke="#2e2445" strokeWidth="2" strokeLinecap="round" />
      <circle cx="49" cy="26" r="2.2" fill="#645785" />
      <circle cx="71" cy="26" r="2.2" fill="#645785" />
    </motion.g>
  )
}
