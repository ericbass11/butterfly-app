import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Profile, Role } from '@/lib/types'
import { createProfile, store } from '@/lib/store'
import { triggerAutomation } from '@/lib/supabase'

interface AuthContextValue {
  profile: Profile | null
  isAuthenticated: boolean
  loading: boolean
  /** RF01 — login demo com papel selecionável (RBAC) */
  signIn: (name: string, email: string, role?: Role) => Promise<Profile>
  signOut: () => void
  updateProfile: (patch: Partial<Profile>) => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setProfile(store.getProfile())
    setLoading(false)
  }, [])

  const signIn = useCallback(async (name: string, email: string, role: Role = 'patient') => {
    const p = createProfile(name.trim() || 'Convidada', email.trim(), role)
    store.setProfile(p)
    setProfile(p)
    await triggerAutomation('welcome', { name: p.name, email: p.email, role: p.role })
    return p
  }, [])

  const signOut = useCallback(() => {
    store.clearAll()
    setProfile(null)
  }, [])

  const updateProfile = useCallback((patch: Partial<Profile>) => {
    setProfile((prev) => {
      if (!prev) return prev
      const next = { ...prev, ...patch }
      store.setProfile(next)
      return next
    })
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      profile,
      isAuthenticated: Boolean(profile),
      loading,
      signIn,
      signOut,
      updateProfile,
    }),
    [profile, loading, signIn, signOut, updateProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>')
  return ctx
}
