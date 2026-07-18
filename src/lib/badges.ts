import type { ProgramState } from './types'
import { DAILY_MAX_POINTS, HABITS } from './gamification'

export interface Badge {
  id: string
  title: string
  desc: string
  icon: string // Material Symbol
  /** Condição de desbloqueio (avaliada sobre o estado atual). */
  test: (p: ProgramState, ctx: { todayComplete: boolean }) => boolean
}

/** Catálogo de conquistas do App Butterfly (RF06 — gamificação). */
export const BADGES: Badge[] = [
  { id: 'bem_vinda', title: 'Bem-vinda', desc: 'Você começou sua jornada de 45 dias.', icon: 'waving_hand', test: () => true },
  { id: 'primeiro_ponto', title: 'Primeiro Ponto', desc: 'Marcou seu primeiro hábito.', icon: 'bolt', test: (p) => p.points >= 1 },
  { id: 'primeira_foto', title: 'Prato Registrado', desc: 'Enviou a foto da primeira refeição.', icon: 'photo_camera', test: (p) => p.meals.length >= 1 },
  { id: 'dia_perfeito', title: 'Dia Perfeito', desc: 'Completou todos os hábitos de um dia.', icon: 'task_alt', test: (_p, c) => c.todayComplete },
  { id: 'constancia_3', title: 'Constância', desc: '3 dias de check-in seguidos.', icon: 'local_fire_department', test: (p) => p.streak >= 3 },
  { id: 'semana_de_fogo', title: 'Semana de Fogo', desc: '7 dias seguidos sem falhar.', icon: 'whatshot', test: (p) => p.streak >= 7 },
  { id: 'primeira_semana', title: 'Primeira Semana', desc: 'Chegou ao dia 7 do protocolo.', icon: 'calendar_month', test: (p) => p.day >= 7 },
  { id: 'colecionadora', title: 'Colecionadora', desc: 'Registrou 10 refeições.', icon: 'gallery_thumbnail', test: (p) => p.meals.length >= 10 },
  { id: 'casulo', title: 'Casulo', desc: 'Atingiu o estágio Casulo.', icon: 'egg', test: (p) => p.points >= 300 },
  { id: 'meia_jornada', title: 'Meia Jornada', desc: 'Passou da metade dos 45 dias.', icon: 'pace', test: (p) => p.day >= 23 },
  { id: 'mestre_pontos', title: '500 Pontos', desc: 'Acumulou 500 pontos.', icon: 'military_tech', test: (p) => p.points >= 500 },
  { id: 'borboleta', title: 'Borboleta', desc: 'Completou a metamorfose. Você voa!', icon: 'flutter_dash', test: (p) => p.stage === 'borboleta' },
]

export function badgeById(id: string): Badge | undefined {
  return BADGES.find((b) => b.id === id)
}

/** Retorna os ids de todas as conquistas satisfeitas pelo estado atual. */
export function evaluateBadges(p: ProgramState, todayComplete: boolean): string[] {
  return BADGES.filter((b) => b.test(p, { todayComplete })).map((b) => b.id)
}

/** Quantos pontos valem todos os hábitos do dia (para "dia perfeito"). */
export function isDayComplete(todayCheckins: Record<string, boolean>): boolean {
  const pts = HABITS.reduce((s, h) => (todayCheckins[h.key] ? s + h.points : s), 0)
  return pts >= DAILY_MAX_POINTS
}
