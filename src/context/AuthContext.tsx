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
import { isSupabaseConfigured, supabase, triggerAutomation } from '@/lib/supabase'
import { ensureProfile, getProfile } from '@/lib/db'

export type AuthMode = 'supabase' | 'demo'

export interface SignUpResult {
  needsConfirmation: boolean
}

interface AuthContextValue {
  profile: Profile | null
  isAuthenticated: boolean
  loading: boolean
  mode: AuthMode
  /** Modo demo — login simulado com papel selecionável (RBAC). */
  signInDemo: (name: string, email: string, role?: Role) => Promise<Profile>
  /** Supabase — cadastro com e-mail e senha. */
  signUp: (name: string, email: string, password: string, role: Role) => Promise<SignUpResult>
  /** Supabase — login com e-mail e senha. */
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (patch: Partial<Profile>) => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const mode: AuthMode = isSupabaseConfigured ? 'supabase' : 'demo'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  // Bootstrap de sessão
  useEffect(() => {
    let active = true

    if (mode === 'demo') {
      setProfile(store.getProfile())
      setLoading(false)
      return
    }

    // Supabase: recupera sessão atual e escuta mudanças
    supabase!.auth.getSession().then(async ({ data }) => {
      if (!active) return
      const user = data.session?.user
      if (user) {
        try {
          const p = await getProfile(user.id)
          if (active) setProfile(p)
        } catch {
          /* ignora — perfil pode ainda não existir */
        }
      }
      if (active) setLoading(false)
    })

    const { data: sub } = supabase!.auth.onAuthStateChange(async (_event, session) => {
      const user = session?.user
      if (!user) {
        if (active) setProfile(null)
        return
      }
      try {
        const p = await getProfile(user.id)
        if (active) setProfile(p)
      } catch {
        /* ignora */
      }
    })

    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [])

  const signInDemo = useCallback(async (name: string, email: string, role: Role = 'patient') => {
    const p = createProfile(name.trim() || 'Convidada', email.trim(), role)
    store.setProfile(p)
    setProfile(p)
    await triggerAutomation('welcome', { name: p.name, email: p.email, role: p.role })
    return p
  }, [])

  const signUp = useCallback(
    async (name: string, email: string, password: string, role: Role): Promise<SignUpResult> => {
      const { data, error } = await supabase!.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { name: name.trim(), role } },
      })
      if (error) throw new Error(traduzErro(error.message))

      // Se a confirmação de e-mail estiver desativada, já vem sessão + usuário.
      if (data.session?.user) {
        const p = await ensureProfile(data.session.user.id, name.trim(), email.trim(), role)
        setProfile(p)
        await triggerAutomation('welcome', { name: p.name, email: p.email, role: p.role })
        return { needsConfirmation: false }
      }
      return { needsConfirmation: true }
    },
    [],
  )

  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase!.auth.signInWithPassword({
      email: email.trim(),
      password,
    })
    if (error) throw new Error(traduzErro(error.message))
    if (data.user) {
      const p = await getProfile(data.user.id)
      setProfile(p)
    }
  }, [])

  const signOut = useCallback(async () => {
    if (mode === 'supabase') {
      await supabase!.auth.signOut()
    }
    store.clearAll()
    setProfile(null)
  }, [])

  const updateProfile = useCallback((patch: Partial<Profile>) => {
    setProfile((prev) => {
      if (!prev) return prev
      const next = { ...prev, ...patch }
      if (mode === 'demo') {
        store.setProfile(next)
      } else {
        import('@/lib/db').then((db) => db.updateProfile(next.id, patch)).catch(() => {})
      }
      return next
    })
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      profile,
      isAuthenticated: Boolean(profile),
      loading,
      mode,
      signInDemo,
      signUp,
      signIn,
      signOut,
      updateProfile,
    }),
    [profile, loading, signInDemo, signUp, signIn, signOut, updateProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

function traduzErro(msg: string): string {
  const m = msg.toLowerCase()
  if (m.includes('invalid login')) return 'E-mail ou senha inválidos.'
  if (m.includes('already registered') || m.includes('already been registered'))
    return 'Este e-mail já possui cadastro. Faça login.'
  if (m.includes('password')) return 'Senha muito curta (mínimo 6 caracteres).'
  if (m.includes('email') && m.includes('confirm')) return 'Confirme seu e-mail antes de entrar.'
  return msg
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>')
  return ctx
}
