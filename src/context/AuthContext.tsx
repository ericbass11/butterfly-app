import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { User } from '@supabase/supabase-js'
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
  signInDemo: (name: string, email: string, role?: Role) => Promise<Profile>
  signUp: (name: string, email: string, password: string, role: Role) => Promise<SignUpResult>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (patch: Partial<Profile>) => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const mode: AuthMode = isSupabaseConfigured ? 'supabase' : 'demo'

/** Deriva um Profile a partir do usuário da sessão (metadata) — sem round-trip. */
function profileFromUser(user: User): Profile {
  const md = (user.user_metadata ?? {}) as Record<string, unknown>
  return {
    id: user.id,
    name: (md.name as string) ?? '',
    email: user.email ?? '',
    role: ((md.role as string) ?? 'patient') as Role,
    avatarUrl: (md.avatar_url as string) ?? undefined,
    createdAt: user.created_at ?? new Date(0).toISOString(),
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  // Bootstrap de sessão — o perfil vem SÍNCRONO da sessão (sem await de rede
  // dentro do onAuthStateChange, que é anti-padrão e trava no refresh).
  useEffect(() => {
    let active = true

    if (mode === 'demo') {
      setProfile(store.getProfile())
      setLoading(false)
      return
    }

    supabase!.auth.getSession().then(({ data }) => {
      if (!active) return
      setProfile(data.session?.user ? profileFromUser(data.session.user) : null)
      setLoading(false)
    })

    const { data: sub } = supabase!.auth.onAuthStateChange((_event, session) => {
      if (!active) return
      setProfile(session?.user ? profileFromUser(session.user) : null)
    })

    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [])

  // Refina o perfil com dados canônicos do banco (avatar, edições) — não bloqueia
  // a autenticação e nunca zera o perfil.
  useEffect(() => {
    if (mode !== 'supabase' || !profile?.id) return
    let active = true
    getProfile(profile.id)
      .then((p) => {
        if (active && p) setProfile((prev) => (prev && prev.id === p.id ? { ...prev, ...p } : prev))
      })
      .catch(() => {})
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id])

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

      if (data.session?.user) {
        setProfile(profileFromUser(data.session.user))
        ensureProfile(data.session.user.id, name.trim(), email.trim(), role).catch(() => {})
        await triggerAutomation('welcome', { name: name.trim(), email: email.trim(), role })
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
    if (data.user) setProfile(profileFromUser(data.user))
  }, [])

  const signOut = useCallback(async () => {
    if (mode === 'supabase') await supabase!.auth.signOut()
    store.clearAll()
    setProfile(null)
  }, [])

  const updateProfile = useCallback((patch: Partial<Profile>) => {
    setProfile((prev) => {
      if (!prev) return prev
      const next = { ...prev, ...patch }
      if (mode === 'demo') store.setProfile(next)
      else import('@/lib/db').then((db) => db.updateProfile(next.id, patch)).catch(() => {})
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
