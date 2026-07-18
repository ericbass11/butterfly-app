import type { Transition, Variants } from 'framer-motion'

// Molas e curvas base — leves e "orgânicas" (combinam com o tema borboleta).
export const spring: Transition = { type: 'spring', stiffness: 420, damping: 32, mass: 0.8 }
export const softSpring: Transition = { type: 'spring', stiffness: 260, damping: 28 }
export const ease: Transition = { duration: 0.4, ease: [0.22, 1, 0.36, 1] }

/** Entrada de tela (fade + sobe levemente). */
export const pageVariants: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2 } },
}

/** Container que aplica stagger nos filhos. */
export const staggerContainer: Variants = {
  initial: {},
  animate: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
}

/** Item de lista/cartão (sobe e aparece). */
export const fadeUpItem: Variants = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
}

/** Overlay/backdrop de modal. */
export const backdropVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
}

/** Folha/painel que sobe de baixo (bottom sheet / tela cheia). */
export const sheetVariants: Variants = {
  initial: { y: '100%' },
  animate: { y: 0, transition: { type: 'spring', stiffness: 380, damping: 40 } },
  exit: { y: '100%', transition: { duration: 0.25, ease: [0.4, 0, 1, 1] } },
}

/** Modal centrado (escala + fade). */
export const popVariants: Variants = {
  initial: { opacity: 0, scale: 0.92 },
  animate: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 400, damping: 30 } },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.15 } },
}

export const tap = { scale: 0.96 }
