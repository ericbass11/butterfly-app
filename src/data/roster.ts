// Dados simulados para os painéis de Parceiro e Admin (RF01 — RBAC).

export interface PatientRow {
  id: string
  name: string
  day: number
  stage: 'larva' | 'casulo' | 'borboleta'
  adherence: number // 0..1
  risk: 'clear' | 'attention' | 'blocked'
  lastCheckin: string
}

export const PATIENTS: PatientRow[] = [
  { id: 'p1', name: 'Ana R.', day: 12, stage: 'casulo', adherence: 0.86, risk: 'clear', lastCheckin: 'Hoje' },
  { id: 'p2', name: 'Bianca M.', day: 5, stage: 'larva', adherence: 0.62, risk: 'attention', lastCheckin: 'Ontem' },
  { id: 'p3', name: 'Camila S.', day: 41, stage: 'casulo', adherence: 0.94, risk: 'clear', lastCheckin: 'Hoje' },
  { id: 'p4', name: 'Denise L.', day: 2, stage: 'larva', adherence: 0.3, risk: 'blocked', lastCheckin: 'Há 3 dias' },
  { id: 'p5', name: 'Elaine T.', day: 45, stage: 'borboleta', adherence: 0.98, risk: 'clear', lastCheckin: 'Hoje' },
]

export const ADMIN_KPIS = [
  { icon: 'group', label: 'Usuárias ativas', value: '238', trend: '+12%' },
  { icon: 'trending_up', label: 'Engajamento diário', value: '71%', trend: '+4%' },
  { icon: 'emoji_events', label: 'Taxa de conclusão', value: '58%', trend: '+9%' },
  { icon: 'forum', label: 'Tickets absorvidos por IA', value: '82%', trend: '+15%' },
]
