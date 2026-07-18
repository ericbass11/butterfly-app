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

/**
 * Lê a sessão persistida DIRETO do localStorage, de forma SÍNCRONA.
 *
 * O supabase-js grava a sessão em `sb-<ref>-auth-token` como JSON contendo o
 * objeto `user` completo. Bootstrapar a partir daí (em vez de esperar o
 * `getSession()` assíncrono) elimina o "flash" e o bounce para a tela de login
 * no refresh: enquanto houver um token no storage, a usuária permanece
 * autenticada — sem depender de corridas de rede, Web Locks ou renovação de
 * token. O `getSession()`/`onAuthStateChange` apenas refinam depois.
 */
function readStoredProfile(): Profile | null {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (!key || !/^sb-.*-auth-token$/.test(key)) continue
      const raw = localStorage.getItem(key)
      if (!raw) continue
      const parsed = JSON.parse(raw) as { user?: User; currentSession?: { user?: User } }
      const user = parsed?.user ?? parsed?.currentSession?.user
      if (user?.id) return profileFromUser(user)
    }
  } catch {
    /* localStorage indisponível ou JSON inválido — trata como sem sessão */
  }
  return null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // Estado inicial SÍNCRONO: no modo demo vem do store; no Supabase, lê a sessão
  // já persistida no localStorage. Assim, ao recarregar, a usuária JÁ nasce
  // autenticada — sem tela de carregamento nem redirecionamento para o login.
  const [profile, setProfile] = useState<Profile | null>(() =>
    mode === 'demo' ? store.getProfile() : readStoredProfile(),
  )
  // A presença da sessão é conhecida de forma síncrona (localStorage), então
  // nunca precisamos "segurar" a UI num estado de loading no boot.
  const [loading] = useState(false)

  // Mantém o perfil em sincronia com o Supabase em segundo plano. Nunca derruba
  // para o login por um nulo transitório — só um SIGNED_OUT real limpa a sessão.
  useEffect(() => {
    if (mode === 'demo') return
    let active = true

    // Reconcilia com a sessão canônica (renova o token se necessário). Só
    // ATUALIZA quando há sessão; jamais zera o perfil aqui.
    supabase!.auth.getSession().then(({ data }) => {
      if (active && data.session?.user) setProfile(profileFromUser(data.session.user))
    })

    const { data: sub } = supabase!.auth.onAuthStateChange((event, session) => {
      if (!active) return
      if (session?.user) {
        setProfile(profileFromUser(session.user))
      } else if (event === 'SIGNED_OUT') {
        // Só limpa em logout REAL — ignora nulos transitórios (foco, refresh de
        // token) que antes derrubavam o usuário para a tela de login.
        setProfile(null)
      }
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
      if (mode === 'demo') {
        store.setProfile(next)
      } else {
        // Sincroniza os METADADOS da sessão para a foto/nome persistirem em
        // qualquer evento de auth, reload ou nova aba (fonte de verdade do
        // perfil em memória). Também grava na tabela profiles (painéis/admin).
        const data: Record<string, unknown> = {}
        if (patch.name !== undefined) data.name = patch.name
        if (patch.avatarUrl !== undefined) data.avatar_url = patch.avatarUrl
        if (Object.keys(data).length > 0) supabase!.auth.updateUser({ data }).catch(() => {})
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
