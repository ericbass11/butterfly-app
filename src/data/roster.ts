// Dados simulados para os painéis de Parceiro e Admin no MODO DEMO (sem Supabase).
// No modo Supabase, os painéis usam db.getRoster()/db.getAdminStats() com dados reais.
import type { AdminStats, RosterPatient } from '@/lib/db'

export const DEMO_PATIENTS: RosterPatient[] = [
  { id: 'p1', name: 'Ana R.', day: 12, stage: 'casulo', points: 380, adherence: 0.86, risk: 'clear', lastCheckin: 'Hoje' },
  { id: 'p2', name: 'Bianca M.', day: 5, stage: 'larva', points: 170, adherence: 0.62, risk: 'attention', lastCheckin: 'Ontem' },
  { id: 'p3', name: 'Camila S.', day: 41, stage: 'casulo', points: 640, adherence: 0.94, risk: 'clear', lastCheckin: 'Hoje' },
  { id: 'p4', name: 'Denise L.', day: 2, stage: 'larva', points: 30, adherence: 0.3, risk: 'blocked', lastCheckin: 'Há 3 dias' },
  { id: 'p5', name: 'Elaine T.', day: 45, stage: 'borboleta', points: 820, adherence: 0.98, risk: 'clear', lastCheckin: 'Hoje' },
]

export function demoAdminStats(): AdminStats {
  const r = DEMO_PATIENTS
  const total = r.length
  return {
    totalPatients: total,
    activeToday: r.filter((p) => p.lastCheckin === 'Hoje').length / total,
    completionRate: r.filter((p) => p.stage === 'borboleta').length / total,
    stageCounts: {
      larva: r.filter((p) => p.stage === 'larva').length,
      casulo: r.filter((p) => p.stage === 'casulo').length,
      borboleta: r.filter((p) => p.stage === 'borboleta').length,
    },
  }
}
