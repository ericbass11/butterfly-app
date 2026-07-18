import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useProgram } from '@/context/ProgramContext'
import { TopBar } from '@/components/TopBar'
import { Icon } from '@/components/Icon'
import { Button } from '@/components/Button'
import { ButterflyAvatar } from '@/components/ButterflyAvatar'
import { PROGRAM_LENGTH, STAGES, stageMeta } from '@/lib/gamification'
import { isSupabaseConfigured } from '@/lib/supabase'
import { clsx } from '@/lib/utils'

export function Profile() {
  const { profile, signOut } = useAuth()
  const { program, reset } = useProgram()
  const navigate = useNavigate()
  const meta = stageMeta(program.stage)

  async function handleSignOut() {
    await signOut()
    navigate('/', { replace: true })
  }

  return (
    <div className="pt-20 pb-32 px-container-padding animate-fade-in">
      <TopBar brand title="Butterfly" right={<Icon name="settings" className="text-primary" />} />

      {/* Cabeçalho do perfil */}
      <div className="flex flex-col items-center text-center mb-6">
        <ButterflyAvatar stage={program.stage} size="lg" className="mb-4" />
        <h2 className="font-headline-lg text-[26px] font-bold text-on-surface">{profile?.name}</h2>
        <p className="font-body-md text-body-md text-on-surface-variant">{profile?.email}</p>
        <span className="inline-flex items-center gap-1.5 mt-3 rounded-full bg-secondary-fixed/60 px-3 py-1 font-label-md text-label-md text-on-secondary-fixed-variant">
          <Icon name={meta.icon} fill className="text-[16px]" /> {meta.label} · {roleLabel(profile?.role)}
        </span>
        <p className="font-body-sm text-body-sm text-on-surface-variant mt-3 max-w-xs italic">{meta.blurb}</p>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <Metric icon="bolt" value={program.points} label="Pontos" />
        <Metric icon="calendar_today" value={`${program.day}/${PROGRAM_LENGTH}`} label="Dias" />
        <Metric icon="local_fire_department" value={`${program.streak}`} label="Sequência" />
      </div>

      {/* Timeline da metamorfose */}
      <section className="mb-6">
        <h3 className="font-headline-md text-[20px] text-on-surface mb-4">Sua metamorfose</h3>
        <div className="flex flex-col gap-1">
          {STAGES.map((s, i) => {
            const reached = program.points >= s.threshold
            const current = s.key === program.stage
            return (
              <div key={s.key} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div
                    className={clsx(
                      'w-11 h-11 rounded-full flex items-center justify-center border-2 transition-colors',
                      reached
                        ? 'bg-primary-container border-primary-container text-on-primary'
                        : 'bg-surface-container border-outline-variant text-outline',
                    )}
                  >
                    <Icon name={s.icon} fill={reached} className="text-[22px]" />
                  </div>
                  {i < STAGES.length - 1 && (
                    <div className={clsx('w-0.5 flex-1 my-1', reached ? 'bg-primary-container' : 'bg-outline-variant')} />
                  )}
                </div>
                <div className="pb-4">
                  <div className="flex items-center gap-2">
                    <span className="font-label-md text-label-md text-on-surface">{s.label}</span>
                    {current && (
                      <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-label-md text-on-primary">
                        Você está aqui
                      </span>
                    )}
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">{s.blurb}</p>
                  <span className="font-body-sm text-[11px] text-outline">Meta: {s.threshold} pts</span>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Acessos por papel (RBAC) */}
      {profile?.role === 'partner' && (
        <RoleLink to="/app/parceiro" icon="stethoscope" title="Painel do Parceiro" desc="Acompanhe seus pacientes" />
      )}
      {profile?.role === 'admin' && (
        <RoleLink to="/app/admin" icon="admin_panel_settings" title="Painel Administrativo" desc="Gestão do programa" />
      )}

      {/* Configurações */}
      <section className="surface-card divide-y divide-outline-variant/60 mb-6">
        <Row icon="notifications" label="Notificações" />
        <Row icon="lock" label="Privacidade e dados (LGPD)" />
        <Row icon="description" label="Termos de Uso" />
        <Row icon="support_agent" label="Falar com a administração" />
      </section>

      {/* Estado do backend */}
      <div className="flex items-center gap-2 justify-center mb-4 font-body-sm text-[12px] text-on-surface-variant">
        <Icon name={isSupabaseConfigured ? 'cloud_done' : 'cloud_off'} className="text-[16px]" />
        {isSupabaseConfigured ? 'Conectado ao Supabase' : 'Modo demonstração (dados locais)'}
      </div>

      <div className="flex flex-col gap-3">
        <Button variant="ghost" fullWidth icon="restart_alt" onClick={reset}>
          Reiniciar progresso (demo)
        </Button>
        <Button variant="ghost" fullWidth icon="logout" onClick={handleSignOut} className="!text-error !border-error/40">
          Sair
        </Button>
      </div>
    </div>
  )
}

function roleLabel(role?: string) {
  return role === 'partner' ? 'Parceiro' : role === 'admin' ? 'Admin' : 'Paciente'
}

function Metric({ icon, value, label }: { icon: string; value: string | number; label: string }) {
  return (
    <div className="surface-card p-4 flex flex-col items-center text-center">
      <Icon name={icon} fill className="text-primary text-[24px] mb-1" />
      <span className="font-headline-md text-[22px] font-semibold text-on-surface">{value}</span>
      <span className="font-body-sm text-[12px] text-on-surface-variant">{label}</span>
    </div>
  )
}

function Row({ icon, label }: { icon: string; label: string }) {
  return (
    <button className="w-full flex items-center justify-between px-4 py-4 hover:bg-surface-container-low transition-colors text-left">
      <span className="flex items-center gap-3">
        <Icon name={icon} className="text-secondary text-[22px]" />
        <span className="font-body-md text-body-md text-on-surface">{label}</span>
      </span>
      <Icon name="chevron_right" className="text-on-surface-variant" />
    </button>
  )
}

function RoleLink({ to, icon, title, desc }: { to: string; icon: string; title: string; desc: string }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 rounded-xl bg-primary-container/15 border border-primary-container/30 p-4 mb-6 active:scale-[0.99] transition-transform"
    >
      <div className="w-11 h-11 rounded-full bg-primary flex items-center justify-center">
        <Icon name={icon} fill className="text-on-primary text-[22px]" />
      </div>
      <div className="flex-1">
        <span className="font-label-md text-label-md text-on-surface block">{title}</span>
        <span className="font-body-sm text-body-sm text-on-surface-variant">{desc}</span>
      </div>
      <Icon name="arrow_forward" className="text-primary" />
    </Link>
  )
}
