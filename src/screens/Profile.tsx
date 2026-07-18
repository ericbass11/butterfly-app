import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useProgram } from '@/context/ProgramContext'
import { TopBar } from '@/components/TopBar'
import { Icon } from '@/components/Icon'
import { Button } from '@/components/Button'
import { UserAvatar } from '@/components/UserAvatar'
import { EditProfile } from '@/components/EditProfile'
import { Metamorphosis } from '@/components/Metamorphosis'
import { motion } from 'framer-motion'
import { PROGRAM_LENGTH, STAGES, stageMeta } from '@/lib/gamification'
import { BADGES } from '@/lib/badges'
import { isSupabaseConfigured } from '@/lib/supabase'
import { clsx } from '@/lib/utils'
import { fadeUpItem, staggerContainer } from '@/lib/motion'

export function Profile() {
  const { profile, signOut } = useAuth()
  const { program, reset } = useProgram()
  const navigate = useNavigate()
  const meta = stageMeta(program.stage)
  const [editOpen, setEditOpen] = useState(false)

  async function handleSignOut() {
    await signOut()
    navigate('/', { replace: true })
  }

  return (
    <div className="pt-20 pb-32 px-container-padding animate-fade-in">
      <TopBar
        brand
        title="Butterfly"
        right={
          <button
            onClick={() => setEditOpen(true)}
            className="w-10 h-10 flex items-center justify-center rounded-full text-primary hover:bg-surface-container-high active:scale-95"
            aria-label="Editar perfil"
          >
            <Icon name="edit" />
          </button>
        }
      />

      {/* Cabeçalho do perfil */}
      <div className="flex flex-col items-center text-center mb-6">
        <button
          onClick={() => setEditOpen(true)}
          className="relative mb-4 active:scale-95 transition-transform"
          aria-label="Alterar foto"
        >
          <UserAvatar stage={program.stage} photoUrl={profile?.avatarUrl} size="lg" />
          <span className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-primary flex items-center justify-center border-2 border-surface shadow-ambient">
            <Icon name="photo_camera" fill className="text-on-primary text-[20px]" />
          </span>
        </button>
        <h2 className="font-headline-lg text-[26px] font-bold text-on-surface">{profile?.name}</h2>
        <p className="font-body-md text-body-md text-on-surface-variant">{profile?.email}</p>
        <span className="inline-flex items-center gap-1.5 mt-3 rounded-full bg-secondary-fixed/60 pl-1.5 pr-3 py-1 font-label-md text-label-md text-on-secondary-fixed-variant">
          <span className="w-6 h-6 rounded-full bg-surface-container-lowest flex items-center justify-center overflow-hidden">
            <Metamorphosis stage={program.stage} size={20} />
          </span>
          {meta.label} · {roleLabel(profile?.role)}
        </span>
        <p className="font-body-sm text-body-sm text-on-surface-variant mt-3 max-w-xs italic">{meta.blurb}</p>
        <Button variant="ghost" icon="edit" onClick={() => setEditOpen(true)} className="mt-4 !min-h-[40px] !px-5">
          Editar perfil
        </Button>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <Metric icon="bolt" value={program.points} label="Pontos" />
        <Metric icon="calendar_today" value={`${program.day}/${PROGRAM_LENGTH}`} label="Dias" />
        <Metric icon="local_fire_department" value={`${program.streak}`} label="Sequência" />
      </div>

      {/* Conquistas */}
      <section className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-headline-md text-[20px] text-on-surface">Conquistas</h3>
          <span className="font-label-md text-label-md text-primary">
            {program.badges?.length ?? 0}/{BADGES.length}
          </span>
        </div>
        <motion.div
          className="grid grid-cols-4 gap-3"
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, amount: 0.1 }}
        >
          {BADGES.map((b) => {
            const unlocked = (program.badges ?? []).includes(b.id)
            return (
              <motion.div
                key={b.id}
                variants={fadeUpItem}
                whileTap={{ scale: 0.92 }}
                title={`${b.title} — ${b.desc}`}
                className="flex flex-col items-center gap-1 text-center"
              >
                <div
                  className={clsx(
                    'w-14 h-14 rounded-2xl flex items-center justify-center relative',
                    unlocked
                      ? 'bg-gradient-to-br from-primary-container to-primary text-on-primary shadow-ambient'
                      : 'bg-surface-container text-outline',
                  )}
                >
                  <Icon name={unlocked ? b.icon : 'lock'} fill={unlocked} className="text-[26px]" />
                </div>
                <span
                  className={clsx(
                    'font-body-sm text-[10px] leading-tight line-clamp-2',
                    unlocked ? 'text-on-surface' : 'text-outline',
                  )}
                >
                  {b.title}
                </span>
              </motion.div>
            )
          })}
        </motion.div>
      </section>

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
                      'w-11 h-11 rounded-full flex items-center justify-center border-2 overflow-hidden bg-surface-container-lowest transition-colors',
                      reached ? 'border-primary-container' : 'border-outline-variant',
                    )}
                  >
                    <div className={clsx('transition-all', !reached && 'grayscale opacity-40')}>
                      <Metamorphosis stage={s.key} size={30} />
                    </div>
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

      <EditProfile open={editOpen} onClose={() => setEditOpen(false)} />
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
