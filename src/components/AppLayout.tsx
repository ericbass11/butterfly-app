import { Outlet } from 'react-router-dom'
import { BottomNav } from './BottomNav'

/** Casca do app autenticado: container mobile centralizado + navegação inferior. */
export function AppLayout() {
  return (
    <div className="mx-auto max-w-[520px] min-h-dvh bg-background relative">
      <Outlet />
      <BottomNav />
    </div>
  )
}
