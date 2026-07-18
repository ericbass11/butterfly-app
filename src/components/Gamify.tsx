import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, animate, motion, useMotionValue, useTransform } from 'framer-motion'
import type { Habit, Stage } from '@/lib/types'
import { Icon } from './Icon'
import { Metamorphosis } from './Metamorphosis'
import { Button } from './Button'
import { stageMeta } from '@/lib/gamification'
import { badgeById } from '@/lib/badges'
import { clsx } from '@/lib/utils'
import { fadeUpItem } from '@/lib/motion'

const CONFETTI_COLORS = ['#2eb67d', '#006c46', '#645785', '#cebff3', '#7cfabb', '#f5c542']

// ---------------------------------------------------------------------------
// Número que "conta" até o valor (count-up) com mola.
// ---------------------------------------------------------------------------
export function AnimatedNumber({ value, className }: { value: number; className?: string }) {
  const mv = useMotionValue(value)
  const rounded = useTransform(mv, (v) => Math.round(v).toString())
  useEffect(() => {
    const controls = animate(mv, value, { duration: 0.7, ease: [0.22, 1, 0.36, 1] })
    return controls.stop
  }, [mv, value])
  return <motion.span className={className}>{rounded}</motion.span>
}

// ---------------------------------------------------------------------------
// Explosão de faíscas (localizada) — dispara ao marcar um hábito.
// ---------------------------------------------------------------------------
function SparkleBurst({ seed }: { seed: number }) {
  const parts = useMemo(
    () =>
      Array.from({ length: 9 }, (_, i) => {
        const angle = (i / 9) * Math.PI * 2 + Math.random()
        const dist = 20 + Math.random() * 22
        return {
          id: i,
          x: Math.cos(angle) * dist,
          y: Math.sin(angle) * dist,
          size: 5 + Math.random() * 5,
          color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
          rotate: Math.random() * 360,
        }
      }),
    // seed força novo cálculo a cada disparo
    [seed],
  )
  return (
    <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
      {parts.map((p) => (
        <motion.span
          key={p.id}
          initial={{ x: 0, y: 0, scale: 0.3, opacity: 1 }}
          animate={{ x: p.x, y: p.y, scale: 1, opacity: 0, rotate: p.rotate }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          style={{ position: 'absolute', width: p.size, height: p.size, borderRadius: 2, background: p.color }}
        />
      ))}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Botão de hábito com animação rica ao marcar.
// ---------------------------------------------------------------------------
export function HabitCheck({
  habit,
  active,
  onToggle,
}: {
  habit: Habit
  active: boolean
  onToggle: () => void
}) {
  const [burst, setBurst] = useState(0)

  function handle() {
    if (!active) setBurst((b) => b + 1) // faíscas só ao ATIVAR
    onToggle()
  }

  return (
    <motion.button
      variants={fadeUpItem}
      whileTap={{ scale: 0.97 }}
      onClick={handle}
      className={clsx(
        'group relative flex items-center justify-between p-4 rounded-xl border transition-colors overflow-visible',
        active
          ? 'bg-primary border-primary text-on-primary'
          : 'bg-surface-container-lowest border-outline-variant hover:border-primary-container',
      )}
    >
      <div className="flex items-center gap-4">
        <motion.div
          animate={active ? { scale: [1, 1.18, 1] } : { scale: 1 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className={clsx(
            'w-12 h-12 rounded-full flex items-center justify-center transition-colors',
            active ? 'bg-on-primary text-primary' : 'bg-secondary-fixed/50 text-secondary',
          )}
        >
          <Icon name={habit.icon} fill className="text-[24px]" />
        </motion.div>
        <div className="text-left">
          <span className={clsx('font-label-md text-label-md block', active ? 'text-on-primary' : 'text-on-surface')}>
            {habit.label}
          </span>
          <span className={clsx('font-body-sm text-body-sm', active ? 'text-on-primary/80' : 'text-on-surface-variant')}>
            {habit.hint}
          </span>
        </div>
      </div>

      <div className="relative w-7 h-7 flex items-center justify-center">
        {burst > 0 && <SparkleBurst seed={burst} />}
        <motion.div
          key={active ? 'on' : 'off'}
          initial={{ scale: active ? 0.3 : 1, rotate: active ? -30 : 0 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 18 }}
        >
          <Icon
            name="check_circle"
            fill={active}
            className={clsx('text-[24px]', active ? 'text-on-primary' : 'text-outline-variant')}
          />
        </motion.div>
        {/* "+pts" subindo ao ativar */}
        {burst > 0 && active && (
          <motion.span
            key={`p-${burst}`}
            initial={{ y: 4, opacity: 0, scale: 0.7 }}
            animate={{ y: -26, opacity: [0, 1, 1, 0], scale: 1 }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="absolute right-0 -top-1 font-label-md text-label-md text-on-primary whitespace-nowrap"
          >
            +{habit.points}
          </motion.span>
        )}
      </div>
    </motion.button>
  )
}

// ---------------------------------------------------------------------------
// Anel de progresso do dia (X/total hábitos).
// ---------------------------------------------------------------------------
export function DailyRing({ done, total, size = 44 }: { done: number; total: number; size?: number }) {
  const r = (size - 6) / 2
  const c = 2 * Math.PI * r
  const ratio = total ? done / total : 0
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#d8e5e1" strokeWidth="5" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#006c46"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={false}
          animate={{ strokeDashoffset: c * (1 - ratio) }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-label-md text-[11px] text-primary">
        {done}/{total}
      </span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Confete de tela cheia (portal). Renderize <Confetti run={bool} />.
// ---------------------------------------------------------------------------
export function Confetti({ run, pieces = 44 }: { run: boolean; pieces?: number }) {
  return createPortal(
    <AnimatePresence>
      {run && (
        <motion.div
          className="pointer-events-none fixed inset-0 z-[90] overflow-hidden"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {Array.from({ length: pieces }).map((_, i) => {
            const left = Math.random() * 100
            const delay = Math.random() * 0.3
            const duration = 1.4 + Math.random() * 1.1
            const size = 7 + Math.random() * 8
            const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length]
            const drift = (Math.random() - 0.5) * 120
            const rounded = Math.random() > 0.5
            return (
              <motion.span
                key={i}
                initial={{ y: -40, x: 0, opacity: 1, rotate: 0 }}
                animate={{ y: '105vh', x: drift, rotate: 360 + Math.random() * 360, opacity: [1, 1, 0.9, 0] }}
                transition={{ duration, delay, ease: 'easeIn' }}
                style={{
                  position: 'absolute',
                  left: `${left}%`,
                  top: 0,
                  width: size,
                  height: size * (rounded ? 1 : 0.5),
                  borderRadius: rounded ? '50%' : 2,
                  background: color,
                }}
              />
            )
          })}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

// ---------------------------------------------------------------------------
// Celebração de evolução de estágio (a grande recompensa).
// ---------------------------------------------------------------------------
export function StageCelebration({ stage, onClose }: { stage: Stage; onClose: () => void }) {
  const meta = stageMeta(stage)
  const isButterfly = stage === 'borboleta'
  return createPortal(
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[95] flex flex-col items-center justify-center px-8 text-center bg-inverse-surface/50 backdrop-blur-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <Confetti run pieces={isButterfly ? 70 : 44} />
        <motion.div
          initial={{ scale: 0.4, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 220, damping: 16, delay: 0.1 }}
          className="relative"
        >
          <div className="w-44 h-44 rounded-full bg-gradient-to-br from-secondary-fixed via-surface-container-lowest to-primary-fixed/50 shadow-ambient-lg flex items-center justify-center">
            <Metamorphosis stage={stage} size={140} />
          </div>
        </motion.div>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="font-label-md text-label-md text-primary-fixed uppercase tracking-wider mt-8"
        >
          {isButterfly ? 'Metamorfose completa!' : 'Você evoluiu!'}
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="font-headline-lg text-[30px] font-bold text-inverse-on-surface mt-1"
        >
          {isButterfly ? 'Você é uma Borboleta 🦋' : `Estágio ${meta.label}`}
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="font-body-md text-body-md text-inverse-on-surface/80 mt-2 max-w-xs"
        >
          {meta.blurb}
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
          className="mt-8 w-full max-w-xs"
        >
          <Button fullWidth icon="celebration" onClick={onClose}>
            Continuar a jornada
          </Button>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body,
  )
}

// ---------------------------------------------------------------------------
// Celebração de conquista desbloqueada (badge).
// ---------------------------------------------------------------------------
export function BadgeToast({ badges, onDone }: { badges: string[]; onDone: () => void }) {
  const id = badges[badges.length - 1]
  const badge = badgeById(id)
  const extra = badges.length - 1

  useEffect(() => {
    const t = setTimeout(onDone, 3600)
    return () => clearTimeout(t)
  }, [badges, onDone])

  if (!badge) return null
  return createPortal(
    <div className="pointer-events-none fixed inset-0 z-[93] flex items-start justify-center pt-20">
      <Confetti run pieces={30} />
      <motion.div
        initial={{ y: -40, opacity: 0, scale: 0.9 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 22 }}
        className="pointer-events-auto flex items-center gap-3 rounded-2xl bg-surface-container-lowest border border-primary-container/40 shadow-ambient-lg px-4 py-3 mx-4"
      >
        <motion.div
          initial={{ scale: 0.4, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 14, delay: 0.1 }}
          className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-container to-primary flex items-center justify-center shrink-0"
        >
          <Icon name={badge.icon} fill className="text-on-primary text-[24px]" />
        </motion.div>
        <div>
          <p className="font-label-md text-[11px] uppercase tracking-wider text-primary">Nova conquista!</p>
          <p className="font-label-md text-label-md text-on-surface">{badge.title}</p>
          {extra > 0 && <p className="font-body-sm text-[12px] text-on-surface-variant">+{extra} desbloqueada(s)</p>}
        </div>
      </motion.div>
    </div>,
    document.body,
  )
}

// ---------------------------------------------------------------------------
// Faixa "Dia completo!" (aparece ao concluir todos os hábitos do dia).
// ---------------------------------------------------------------------------
export function DailyCompleteToast({ show }: { show: boolean }) {
  return createPortal(
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: -80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 26 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[92] flex items-center gap-2 rounded-full bg-primary text-on-primary px-5 py-3 shadow-ambient-lg pt-safe"
        >
          <Icon name="local_fire_department" fill className="text-[20px]" />
          <span className="font-label-md text-label-md">Dia completo! Todos os hábitos ✓</span>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
