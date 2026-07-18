import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { store } from '@/lib/store'
import type { Role } from '@/lib/types'

/** Exige autenticação (RF01). */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading } = useAuth()
  const location = useLocation()
  if (loading) return null
  if (!isAuthenticated) return <Navigate to="/" replace state={{ from: location }} />
  return <>{children}</>
}

/** Exige que a anamnese/onboarding tenha sido concluído (RF02).
 *  Profissionais e administradores não passam pela anamnese de paciente. */
export function RequireOnboarded({ children }: { children: ReactNode }) {
  const { profile } = useAuth()
  if (profile && profile.role !== 'patient') return <>{children}</>
  if (!store.isOnboarded()) return <Navigate to="/onboarding" replace />
  return <>{children}</>
}

/** Restringe rota por papel (RBAC). */
export function RequireRole({ role, children }: { role: Role; children: ReactNode }) {
  const { profile } = useAuth()
  if (!profile || profile.role !== role) return <Navigate to="/app" replace />
  return <>{children}</>
}
