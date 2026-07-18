import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { TopBar } from '@/components/TopBar'
import { Icon } from '@/components/Icon'
import { isSupabaseConfigured } from '@/lib/supabase'
import { getAdminStats, type AdminStats } from '@/lib/db'
import { demoAdminStats } from '@/data/roster'
import { pct } from '@/lib/utils'

/** Painel Administrativo (RF01, Persona 3 — Administradoras). */
export function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null)

  useEffect(() => {
    let active = true
    if (!isSupabaseConfigured) {
      setStats(demoAdminStats())
      return
    }
    getAdminStats()
      .then((s) => active && setStats(s))
      .catch(() => active && setStats({ totalPatients: 0, activeToday: 0, completionRate: 0, stageCounts: { larva: 0, casulo: 0, borboleta: 0 } }))
    return () => {
      active = false
    }
  }, [])

  const total = stats?.totalPatients ?? 0

  const kpis = [
    { icon: 'group', label: 'Usuárias ativas', value: stats ? String(stats.totalPatients) : '—' },
    { icon: 'trending_up', label: 'Engajamento hoje', value: stats ? pct(stats.activeToday) : '—' },
    { icon: 'emoji_events', label: 'Taxa de conclusão', value: stats ? pct(stats.completionRate) : '—' },
    { icon: 'smart_toy', label: 'Suporte via IA', value: 'Ativo' },
  ]

  return (
    <div className="pt-20 pb-32 px-container-padding animate-fade-in">
      <TopBar showBack title="Administração" subtitle="Saúde geral do programa" />

      {/* KPIs (Métricas de Sucesso do MVP) */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {kpis.map((k) => (
          <div key={k.label} className="surface-card p-4">
            <div className="flex items-center justify-between mb-2">
              <Icon name={k.icon} fill className="text-primary text-[24px]" />
            </div>
            <div className="font-headline-md text-[26px] font-bold text-on-surface">{k.value}</div>
            <div className="font-body-sm text-[12px] text-on-surface-variant leading-tight">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Distribuição por estágio */}
      <div className="surface-card p-5 mb-6">
        <h3 className="font-headline-md text-[20px] text-on-surface mb-4">Distribuição por estágio</h3>
        {!stats && <p className="font-body-sm text-body-sm text-on-surface-variant">Carregando…</p>}
        {stats && total === 0 && (
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Ainda não há pacientes cadastradas para exibir a distribuição.
          </p>
        )}
        {stats && total > 0 && (
          <div className="flex flex-col gap-4">
            <StageBar label="Larva" icon="pest_control" count={stats.stageCounts.larva} total={total} />
            <StageBar label="Casulo" icon="egg" count={stats.stageCounts.casulo} total={total} />
            <StageBar label="Borboleta" icon="flutter_dash" count={stats.stageCounts.borboleta} total={total} />
          </div>
        )}
      </div>

      {/* Gestão de conteúdo (CRUD conectado ao banco) */}
      <h3 className="font-headline-md text-[20px] text-on-surface mb-3">Gestão de conteúdo</h3>
      <div className="surface-card divide-y divide-outline-variant/60">
        <ManageRow to="/app/admin/gerenciar?tab=lessons" icon="play_circle" label="Aulas" desc="Criar e editar aulas e vídeos" />
        <ManageRow to="/app/admin/gerenciar?tab=ebooks" icon="menu_book" label="E-books" desc="Materiais para download" />
        <ManageRow to="/app/admin/gerenciar?tab=knowledge" icon="smart_toy" label="Base de conhecimento IA" desc="Respostas do método usadas no Chat" />
        <ManageRow to="/app/admin/gerenciar?tab=modules" icon="hub" label="Módulos" desc="Trilhas de aprendizado" />
        <ManageRow to="/app/admin/gerenciar?tab=users" icon="group" label="Usuárias e papéis" desc="Gerenciar acessos (RBAC)" />
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
        <div className="h-full bg-primary rounded-full transition-all" style={{ width: pct(ratio) }} />
      </div>
    </div>
  )
}

function ManageRow({ to, icon, label, desc }: { to: string; icon: string; label: string; desc: string }) {
  return (
    <Link to={to} className="w-full flex items-center justify-between px-4 py-4 hover:bg-surface-container-low transition-colors text-left">
      <span className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-secondary-fixed/50 flex items-center justify-center">
          <Icon name={icon} className="text-secondary text-[20px]" />
        </div>
        <span>
          <span className="font-label-md text-label-md text-on-surface block">{label}</span>
          <span className="font-body-sm text-body-sm text-on-surface-variant">{desc}</span>
        </span>
      </span>
      <Icon name="chevron_right" className="text-on-surface-variant" />
    </Link>
  )
}
