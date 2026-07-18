import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { store } from '@/lib/store'
import type { Role } from '@/lib/types'
import { Button } from '@/components/Button'
import { Icon } from '@/components/Icon'
import { clsx } from '@/lib/utils'

const roleOptions: { value: Role; label: string; icon: string; desc: string }[] = [
  { value: 'patient', label: 'Paciente', icon: 'self_improvement', desc: 'Jornada de 45 dias' },
  { value: 'partner', label: 'Parceiro', icon: 'stethoscope', desc: 'Médico / terapeuta' },
  { value: 'admin', label: 'Admin', icon: 'admin_panel_settings', desc: 'Gestão do programa' },
]

/** Tela de aquisição/convite + login (RF01, User Flow passo 1). */
export function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<Role>('patient')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    await signIn(name, email, role)
    if (role === 'patient') {
      navigate(store.isOnboarded() ? '/app' : '/onboarding', { replace: true })
    } else {
      navigate('/app', { replace: true })
    }
  }

  return (
    <div className="mx-auto max-w-[520px] min-h-dvh flex flex-col px-container-padding pt-safe pb-8">
      <div className="flex-1 flex flex-col justify-center animate-fade-in">
        {/* Marca */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-primary-container flex items-center justify-center shadow-ambient-lg mb-5">
            <Icon name="spa" fill className="text-on-primary text-[40px]" />
          </div>
          <h1 className="font-headline-xl text-[34px] leading-tight font-bold text-primary tracking-tight">
            Butterfly
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant mt-2 max-w-xs">
            Sua metamorfose de 45 dias em direção à leveza e vitalidade começa aqui.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Field
            label="Seu nome"
            icon="badge"
            value={name}
            onChange={setName}
            placeholder="Como podemos te chamar?"
            required
          />
          <Field
            label="E-mail do convite"
            icon="mail"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="voce@email.com"
            required
          />

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

          <Button type="submit" fullWidth iconRight="arrow_forward" disabled={submitting} className="mt-2">
            {submitting ? 'Entrando…' : 'Entrar na jornada'}
          </Button>
        </form>

        <p className="text-center font-body-sm text-body-sm text-on-surface-variant mt-6">
          Acesso exclusivo por convite. Ao continuar, você aceita os{' '}
          <span className="text-primary underline">Termos de Uso</span> e a Política de Privacidade.
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
