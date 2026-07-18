import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useProgram } from '@/context/ProgramContext'
import type { Role } from '@/lib/types'

function Splash() {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-background">
      <span className="material-symbols-outlined icon-fill text-primary text-[48px] animate-flutter">
        flutter_dash
      </span>
    </div>
  )
}

/** Exige autenticação (RF01). */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading } = useAuth()
  const location = useLocation()
  if (loading) return <Splash />
  if (!isAuthenticated) return <Navigate to="/" replace state={{ from: location }} />
  return <>{children}</>
}

/** Exige que a anamnese/onboarding tenha sido concluído (RF02).
 *  Profissionais e administradores não passam pela anamnese de paciente. */
export function RequireOnboarded({ children }: { children: ReactNode }) {
  const { profile } = useAuth()
  const { ready, onboarded } = useProgram()
  if (profile && profile.role !== 'patient') return <>{children}</>
  if (!ready) return <Splash />
  if (!onboarded) return <Navigate to="/onboarding" replace />
  return <>{children}</>
}

/** Restringe rota por papel (RBAC). */
export function RequireRole({ role, children }: { role: Role; children: ReactNode }) {
  const { profile } = useAuth()
  if (!profile || profile.role !== role) return <Navigate to="/app" replace />
  return <>{children}</>
}
