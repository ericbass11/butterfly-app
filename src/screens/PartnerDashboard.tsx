import { useEffect, useState } from 'react'
import { TopBar } from '@/components/TopBar'
import { Icon } from '@/components/Icon'
import { isSupabaseConfigured } from '@/lib/supabase'
import { getRoster, type RosterPatient } from '@/lib/db'
import { DEMO_PATIENTS } from '@/data/roster'
import { clsx, pct } from '@/lib/utils'

/** Painel do Profissional Parceiro (RF01, Persona 2). */
export function PartnerDashboard() {
  const [rows, setRows] = useState<RosterPatient[] | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let active = true
    if (!isSupabaseConfigured) {
      setRows(DEMO_PATIENTS)
      return
    }
    getRoster()
      .then((r) => active && setRows(r))
      .catch(() => active && setError(true))
    return () => {
      active = false
    }
  }, [])

  const attention = rows?.filter((p) => p.risk !== 'clear').length ?? 0

  return (
    <div className="pt-20 pb-32 px-container-padding animate-fade-in">
      <TopBar showBack title="Meus Pacientes" subtitle="Acompanhamento clínico" />

      <div className="grid grid-cols-2 gap-3 mb-6">
        <SummaryCard icon="groups" label="Pacientes" value={rows ? String(rows.length) : '—'} />
        <SummaryCard icon="warning" label="Requerem atenção" value={rows ? String(attention) : '—'} accent="error" />
      </div>

      <h3 className="font-headline-md text-[20px] text-on-surface mb-3">Lista de acompanhamento</h3>

      {error && <EmptyState icon="cloud_off" text="Não foi possível carregar os pacientes." />}
      {!error && rows === null && <Loading />}
      {!error && rows?.length === 0 && (
        <EmptyState icon="person_off" text="Nenhuma paciente cadastrada ainda." />
      )}

      <div className="flex flex-col gap-3">
        {rows?.map((p) => <PatientCard key={p.id} p={p} />)}
      </div>
    </div>
  )
}

function Loading() {
  return (
    <div className="flex flex-col gap-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="surface-card p-4 h-24 animate-pulse bg-surface-container-low" />
      ))}
    </div>
  )
}

function EmptyState({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="surface-card p-8 flex flex-col items-center text-center text-on-surface-variant">
      <Icon name={icon} className="text-[40px] mb-2 opacity-60" />
      <p className="font-body-sm text-body-sm">{text}</p>
    </div>
  )
}

function SummaryCard({ icon, label, value, accent }: { icon: string; label: string; value: string; accent?: 'error' }) {
  return (
    <div className="surface-card p-4">
      <Icon name={icon} fill className={clsx('text-[24px] mb-2', accent === 'error' ? 'text-error' : 'text-primary')} />
      <div className="font-headline-md text-[24px] font-semibold text-on-surface">{value}</div>
      <div className="font-body-sm text-body-sm text-on-surface-variant">{label}</div>
    </div>
  )
}

const riskStyle: Record<RosterPatient['risk'], { label: string; cls: string }> = {
  clear: { label: 'OK', cls: 'bg-primary-container/20 text-primary' },
  attention: { label: 'Atenção', cls: 'bg-secondary-fixed text-on-secondary-fixed-variant' },
  blocked: { label: 'Bloqueado', cls: 'bg-error-container text-on-error-container' },
}

function PatientCard({ p }: { p: RosterPatient }) {
  const risk = riskStyle[p.risk]
  return (
    <button className="surface-card p-4 text-left hover:border-primary-container transition-colors active:scale-[0.99]">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-secondary-fixed flex items-center justify-center">
            <Icon name="person" fill className="text-secondary text-[22px]" />
          </div>
          <div>
            <span className="font-label-md text-label-md text-on-surface block">{p.name}</span>
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              Dia {p.day}/45 · {p.stage}
            </span>
          </div>
        </div>
        <span className={clsx('rounded-full px-3 py-1 font-label-md text-[12px]', risk.cls)}>{risk.label}</span>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex-1 mr-4">
          <div className="flex justify-between font-body-sm text-[12px] text-on-surface-variant mb-1">
            <span>Adesão</span>
            <span>{pct(p.adherence)}</span>
          </div>
          <div className="h-1.5 w-full bg-tertiary-fixed rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full" style={{ width: pct(p.adherence) }} />
          </div>
        </div>
        <span className="font-body-sm text-[12px] text-on-surface-variant whitespace-nowrap">
          <Icon name="schedule" className="text-[14px] align-middle" /> {p.lastCheckin}
        </span>
      </div>
    </button>
  )
}
