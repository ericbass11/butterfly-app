import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { BottomNav } from './BottomNav'
import { GuidedTour, type TourStep } from './GuidedTour'
import { useAuth } from '@/context/AuthContext'
import { store } from '@/lib/store'
import { pageVariants } from '@/lib/motion'

const TOUR_STEPS: TourStep[] = [
  {
    title: 'Oi! Eu sou a Flutter 🦋',
    text: 'Sua guia por aqui. Em 30 segundinhos te mostro como usar o Butterfly. Bora?',
  },
  {
    target: 'journey',
    title: 'Sua Jornada',
    text: 'Aqui você acompanha o dia do protocolo, seus pontos e a sua sequência.',
  },
  {
    target: 'checkin',
    title: 'Check-in diário',
    text: 'Marque seus hábitos do dia. Cada um vira pontos e faz sua borboleta evoluir!',
  },
  {
    target: 'meal',
    title: 'Registre refeições',
    text: 'Toque aqui pra enviar a foto da sua refeição e acompanhar sua alimentação.',
  },
  {
    target: 'nav-educacao',
    title: 'Educação',
    text: 'Assista às aulas e leia os e-books do protocolo, no seu ritmo.',
  },
  {
    target: 'nav-chat',
    title: 'Chat com IA',
    text: 'Tem dúvida? Fale com a IA a qualquer hora — é só perguntar.',
  },
  {
    target: 'nav-perfil',
    title: 'Seu Perfil',
    text: 'Veja suas conquistas, sua metamorfose e personalize sua conta.',
  },
  {
    title: 'Tudo pronto! ✨',
    text: 'Agora é com você. Vamos começar sua metamorfose!',
  },
]

/** Casca do app autenticado: container mobile centralizado + navegação inferior. */
export function AppLayout() {
  const location = useLocation()
  const { profile } = useAuth()
  const userId = profile?.id ?? null
  const isDashboard = location.pathname === '/app' || location.pathname === '/app/'
  const [tourOpen, setTourOpen] = useState(false)

  // Abre o tutorial guiado na primeira vez no Dashboard.
  useEffect(() => {
    // Abre para QUALQUER perfil (não só paciente) na primeira vez no Dashboard.
    // O passo de boas-vindas não depende de nenhum elemento; os demais aguardam
    // o alvo montar (retry no próprio tour), então não exigimos `ready`.
    if (!userId || !isDashboard) return
    if (store.getTourSeen(userId)) return
    const t = setTimeout(() => setTourOpen(true), 700) // deixa o Dashboard montar
    return () => clearTimeout(t)
  }, [userId, isDashboard])

  function closeTour() {
    if (userId) store.setTourSeen(userId, true)
    setTourOpen(false)
  }

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
      {tourOpen && <GuidedTour steps={TOUR_STEPS} onDone={closeTour} />}
    </div>
  )
}
