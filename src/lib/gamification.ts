import type { Habit, ProgramState, Stage } from './types'

export const PROGRAM_LENGTH = 45

/** Hábitos rastreáveis do check-in diário (RF04) */
export const HABITS: Habit[] = [
  { key: 'water', label: 'Tomei Água', hint: 'Meta: 2L', icon: 'water_drop', points: 10 },
  { key: 'activity', label: 'Atividade Física', hint: '30 min ativos', icon: 'directions_run', points: 15 },
  { key: 'food', label: 'Alimentação Permitida', hint: 'Seguindo o plano', icon: 'restaurant', points: 20 },
  { key: 'mind', label: 'Mente & Mindfulness', hint: 'Respiro / gratidão', icon: 'self_improvement', points: 10 },
]

export const DAILY_MAX_POINTS = HABITS.reduce((s, h) => s + h.points, 0)

/** Estágios da metamorfose e limiares de pontos para evolução visual (RF06) */
export const STAGES: {
  key: Stage
  label: string
  icon: string
  threshold: number // pontos acumulados a partir dos quais o estágio é atingido
  blurb: string
}[] = [
  { key: 'larva', label: 'Larva', icon: 'pest_control', threshold: 0, blurb: 'O início. Nutrindo as bases da sua transformação.' },
  { key: 'casulo', label: 'Casulo', icon: 'egg', threshold: 300, blurb: 'Em transformação. A disciplina está criando suas asas.' },
  { key: 'borboleta', label: 'Borboleta', icon: 'flutter_dash', threshold: 750, blurb: 'Metamorfose completa. Leveza, vitalidade e voo.' },
]

export function stageForPoints(points: number, day: number): Stage {
  // Borboleta requer concluir o protocolo (dia 45) além dos pontos
  if (day >= PROGRAM_LENGTH && points >= STAGES[2].threshold) return 'borboleta'
  if (points >= STAGES[1].threshold) return 'casulo'
  return 'larva'
}

export function stageMeta(stage: Stage) {
  return STAGES.find((s) => s.key === stage) ?? STAGES[0]
}

/** Progresso global do programa (0..1) combinando dia e pontos */
export function programProgress(state: ProgramState): number {
  const dayRatio = Math.min(state.day / PROGRAM_LENGTH, 1)
  return dayRatio
}

/** Progresso rumo ao próximo estágio (0..1) */
export function stageProgress(points: number): { current: Stage; next: Stage | null; ratio: number } {
  if (points >= STAGES[2].threshold) return { current: 'borboleta', next: null, ratio: 1 }
  if (points >= STAGES[1].threshold) {
    const span = STAGES[2].threshold - STAGES[1].threshold
    return { current: 'casulo', next: 'borboleta', ratio: (points - STAGES[1].threshold) / span }
  }
  const span = STAGES[1].threshold - STAGES[0].threshold
  return { current: 'larva', next: 'casulo', ratio: points / span }
}

export function todayKey(date = new Date()): string {
  return date.toISOString().slice(0, 10)
}
