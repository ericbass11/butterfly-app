import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { BottomNav } from './BottomNav'
import { pageVariants } from '@/lib/motion'

/** Casca do app autenticado: container mobile centralizado + navegação inferior. */
export function AppLayout() {
  const location = useLocation()
  // Anima a troca entre as rotas principais (Dashboard, Educação, Chat, Perfil…).
  const key = '/' + (location.pathname.split('/')[2] ?? '')

  return (
    <div className="mx-auto max-w-[520px] min-h-dvh bg-background relative overflow-x-hidden">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={key} variants={pageVariants} initial="initial" animate="animate" exit="exit">
          <Outlet />
        </motion.div>
      </AnimatePresence>
      <BottomNav />
    </div>
  )
}
