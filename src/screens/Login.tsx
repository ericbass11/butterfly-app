import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { store } from '@/lib/store'
import type { Role } from '@/lib/types'
import { Button } from '@/components/Button'
import { Icon } from '@/components/Icon'
import { MetamorphosisHero } from '@/components/MetamorphosisHero'
import { clsx } from '@/lib/utils'

const roleOptions: { value: Role; label: string; icon: string; desc: string }[] = [
  { value: 'patient', label: 'Paciente', icon: 'self_improvement', desc: 'Jornada de 45 dias' },
  { value: 'partner', label: 'Parceiro', icon: 'stethoscope', desc: 'Médico / terapeuta' },
  { value: 'admin', label: 'Admin', icon: 'admin_panel_settings', desc: 'Gestão do programa' },
]

/** Tela de aquisição/convite + login (RF01, User Flow passo 1). */
export function Login() {
  const { mode, signInDemo, signUp, signIn } = useAuth()
  const navigate = useNavigate()
  const isSupabase = mode === 'supabase'

  const [tab, setTab] = useState<'signup' | 'login'>('signup')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<Role>('patient')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  const showNameAndRole = !isSupabase || tab === 'signup'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setInfo(null)
    setSubmitting(true)
    try {
      if (!isSupabase) {
        await signInDemo(name, email, role)
        navigate(role === 'patient' && !store.isOnboarded() ? '/onboarding' : '/app', {
          replace: true,
        })
        return
      }
      if (tab === 'signup') {
        const { needsConfirmation } = await signUp(name, email, password, role)
        if (needsConfirmation) {
          setInfo('Cadastro criado! Confirme seu e-mail para entrar (verifique a caixa de entrada).')
          setTab('login')
          return
        }
      } else {
        await signIn(email, password)
      }
      // Guards decidem se vai para /onboarding (paciente) ou direto ao app.
      navigate('/app', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Algo deu errado. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-[520px] min-h-dvh flex flex-col px-container-padding pt-safe pb-8">
      <div className="flex-1 flex flex-col justify-center animate-fade-in">
        {/* Marca + vídeo-herói da metamorfose */}
        <div className="flex flex-col items-center text-center mb-8">
          <MetamorphosisHero className="w-full max-w-[360px] aspect-[16/10] mb-5" />
          <h1 className="font-headline-xl text-[34px] leading-tight font-bold text-primary tracking-tight">
            Butterfly
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant mt-2 max-w-xs">
            Sua metamorfose de 45 dias em direção à leveza e vitalidade começa aqui.
          </p>
        </div>

        {/* Alternador Entrar / Criar conta (só no modo Supabase) */}
        {isSupabase && (
          <div className="flex rounded-full bg-surface-container p-1 mb-5">
            {(['signup', 'login'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setTab(t)
                  setError(null)
                  setInfo(null)
                }}
                className={clsx(
                  'flex-1 rounded-full py-2 font-label-md text-label-md transition-all',
                  tab === t ? 'bg-surface-container-lowest text-primary shadow-ambient' : 'text-on-surface-variant',
                )}
              >
                {t === 'signup' ? 'Criar conta' : 'Entrar'}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {showNameAndRole && (
            <Field
              label="Seu nome"
              icon="badge"
              value={name}
              onChange={setName}
              placeholder="Como podemos te chamar?"
              required
            />
          )}
          <Field
            label={isSupabase ? 'E-mail' : 'E-mail do convite'}
            icon="mail"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="voce@email.com"
            required
          />
          {isSupabase && (
            <Field
              label="Senha"
              icon="lock"
              type="password"
              value={password}
              onChange={setPassword}
              placeholder="Mínimo 6 caracteres"
              required
            />
          )}

          {showNameAndRole && (
            <div>
              <label className="font-label-md text-label-md text-on-surface-variant mb-2 block">
                Tipo de acesso
              </label>
              <div className="grid grid-cols-3 gap-2">
                {roleOptions.map((opt) => (
                  <button
                    type="button"
                    key={opt.value}
                    onClick={() => setRole(opt.value)}
                    className={clsx(
                      'flex flex-col items-center gap-1 rounded-xl border p-3 text-center transition-all active:scale-95',
                      role === opt.value
                        ? 'border-primary bg-primary-container/15 text-primary'
                        : 'border-outline-variant bg-surface-container-lowest text-on-surface-variant',
                    )}
                  >
                    <Icon name={opt.icon} fill={role === opt.value} className="text-[24px]" />
                    <span className="font-label-md text-[13px] leading-none">{opt.label}</span>
                    <span className="text-[10px] leading-tight opacity-70">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && (
            <p className="flex items-center gap-2 rounded-xl bg-error-container/50 text-on-error-container px-4 py-3 font-body-sm text-body-sm">
              <Icon name="error" fill className="text-[18px]" /> {error}
            </p>
          )}
          {info && (
            <p className="flex items-center gap-2 rounded-xl bg-primary-container/20 text-on-primary-container px-4 py-3 font-body-sm text-body-sm">
              <Icon name="mark_email_read" fill className="text-[18px]" /> {info}
            </p>
          )}

          <Button type="submit" fullWidth iconRight="arrow_forward" disabled={submitting} className="mt-2">
            {submitting
              ? 'Aguarde…'
              : isSupabase
                ? tab === 'signup'
                  ? 'Criar conta e começar'
                  : 'Entrar'
                : 'Entrar na jornada'}
          </Button>
        </form>

        <p className="text-center font-body-sm text-body-sm text-on-surface-variant mt-6">
          {isSupabase ? 'Seus dados de saúde são protegidos (LGPD).' : 'Acesso exclusivo por convite.'} Ao
          continuar, você aceita os <span className="text-primary underline">Termos de Uso</span> e a
          Política de Privacidade.
        </p>

        <p className="text-center font-body-sm text-[11px] text-outline mt-3 flex items-center justify-center gap-1">
          <Icon name={isSupabase ? 'cloud_done' : 'cloud_off'} className="text-[14px]" />
          {isSupabase ? 'Conectado ao Supabase' : 'Modo demonstração (dados locais)'}
        </p>
      </div>
    </div>
  )
}

interface FieldProps {
  label: string
  icon: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
  required?: boolean
}

function Field({ label, icon, value, onChange, placeholder, type = 'text', required }: FieldProps) {
  return (
    <label className="block">
      <span className="font-label-md text-label-md text-on-surface-variant mb-1.5 block">{label}</span>
      <div className="flex items-center gap-3 rounded-xl border border-outline-variant bg-surface-container-lowest px-4 h-[52px] focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
        <Icon name={icon} className="text-on-surface-variant text-[20px]" />
        <input
          type={type}
          value={value}
          required={required}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-transparent outline-none font-body-md text-body-md text-on-surface placeholder:text-outline"
        />
      </div>
    </label>
  )
}
