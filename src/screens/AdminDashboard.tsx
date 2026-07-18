import { TopBar } from '@/components/TopBar'
import { Icon } from '@/components/Icon'
import { ADMIN_KPIS, PATIENTS } from '@/data/roster'
import { clsx } from '@/lib/utils'

/** Painel Administrativo (RF01, Persona 3 — Administradoras). */
export function AdminDashboard() {
  const stageCounts = {
    larva: PATIENTS.filter((p) => p.stage === 'larva').length,
    casulo: PATIENTS.filter((p) => p.stage === 'casulo').length,
    borboleta: PATIENTS.filter((p) => p.stage === 'borboleta').length,
  }
  const total = PATIENTS.length

  return (
    <div className="pt-20 pb-32 px-container-padding animate-fade-in">
      <TopBar showBack title="Administração" subtitle="Saúde geral do programa" />

      {/* KPIs (Métricas de Sucesso do MVP) */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {ADMIN_KPIS.map((k) => (
          <div key={k.label} className="surface-card p-4">
            <div className="flex items-center justify-between mb-2">
              <Icon name={k.icon} fill className="text-primary text-[24px]" />
              <span className="font-label-md text-[11px] text-primary bg-primary-container/20 rounded-full px-2 py-0.5">
                {k.trend}
              </span>
            </div>
            <div className="font-headline-md text-[26px] font-bold text-on-surface">{k.value}</div>
            <div className="font-body-sm text-[12px] text-on-surface-variant leading-tight">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Distribuição por estágio */}
      <div className="surface-card p-5 mb-6">
        <h3 className="font-headline-md text-[20px] text-on-surface mb-4">Distribuição por estágio</h3>
        <div className="flex flex-col gap-4">
          <StageBar label="Larva" icon="pest_control" count={stageCounts.larva} total={total} />
          <StageBar label="Casulo" icon="egg" count={stageCounts.casulo} total={total} />
          <StageBar label="Borboleta" icon="flutter_dash" count={stageCounts.borboleta} total={total} />
        </div>
      </div>

      {/* Gestão rápida */}
      <h3 className="font-headline-md text-[20px] text-on-surface mb-3">Gestão</h3>
      <div className="surface-card divide-y divide-outline-variant/60">
        <ManageRow icon="person_add" label="Convidar usuárias" desc="Gerar link exclusivo de acesso" />
        <ManageRow icon="handshake" label="Parceiros de saúde" desc="Gerenciar médicos e terapeutas" />
        <ManageRow icon="verified_user" label="Liberações pendentes" desc="Aprovar acessos ao protocolo" badge="1" />
        <ManageRow icon="smart_toy" label="Base de conhecimento IA" desc="Editar respostas do método" />
      </div>
    </div>
  )
}

function StageBar({ label, icon, count, total }: { label: string; icon: string; count: number; total: number }) {
  const ratio = total ? count / total : 0
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="flex items-center gap-2 font-label-md text-label-md text-on-surface">
          <Icon name={icon} fill className="text-secondary text-[18px]" /> {label}
        </span>
        <span className="font-body-sm text-body-sm text-on-surface-variant">{count} usuárias</span>
      </div>
      <div className="h-2 w-full bg-tertiary-fixed rounded-full overflow-hidden">
        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${Math.round(ratio * 100)}%` }} />
      </div>
    </div>
  )
}

function ManageRow({ icon, label, desc, badge }: { icon: string; label: string; desc: string; badge?: string }) {
  return (
    <button className="w-full flex items-center justify-between px-4 py-4 hover:bg-surface-container-low transition-colors text-left">
      <span className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-secondary-fixed/50 flex items-center justify-center">
          <Icon name={icon} className="text-secondary text-[20px]" />
        </div>
        <span>
          <span className="font-label-md text-label-md text-on-surface block">{label}</span>
          <span className="font-body-sm text-body-sm text-on-surface-variant">{desc}</span>
        </span>
      </span>
      <span className="flex items-center gap-2">
        {badge && (
          <span className={clsx('w-6 h-6 rounded-full bg-error text-on-error flex items-center justify-center text-[12px] font-label-md')}>
            {badge}
          </span>
        )}
        <Icon name="chevron_right" className="text-on-surface-variant" />
      </span>
    </button>
  )
}
