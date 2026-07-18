import type { Anamnese, Profile, ProgramState, Role } from './types'
import { PROGRAM_LENGTH, stageForPoints, todayKey } from './gamification'

// Persistência local (modo demo). Estruturado para espelhar as tabelas do
// Supabase (profiles, anamneses, program_state) e facilitar a migração.

const KEYS = {
  profile: 'butterfly.profile',
  anamnese: 'butterfly.anamnese',
  program: 'butterfly.program',
  onboarded: 'butterfly.onboarded',
} as const

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* quota / privacy mode — ignora silenciosamente no demo */
  }
}

export const store = {
  getProfile: () => read<Profile>(KEYS.profile),
  setProfile: (p: Profile) => write(KEYS.profile, p),

  getAnamnese: () => read<Anamnese>(KEYS.anamnese),
  setAnamnese: (a: Anamnese) => write(KEYS.anamnese, a),

  isOnboarded: () => read<boolean>(KEYS.onboarded) === true,
  setOnboarded: (v: boolean) => write(KEYS.onboarded, v),

  getProgram: () => read<ProgramState>(KEYS.program),
  setProgram: (s: ProgramState) => write(KEYS.program, s),

  clearAll: () => {
    Object.values(KEYS).forEach((k) => localStorage.removeItem(k))
  },
}

export function createInitialProgram(): ProgramState {
  return {
    startDate: new Date().toISOString(),
    day: 1,
    points: 0,
    stage: 'larva',
    todayCheckins: {},
    lastCheckinDate: null,
    meals: [],
    streak: 0,
  }
}

/** Normaliza o estado ao abrir o app: vira o dia se a data mudou. */
export function refreshProgram(state: ProgramState): ProgramState {
  const today = todayKey()
  if (state.lastCheckinDate && state.lastCheckinDate !== today) {
    // Novo dia: zera os check-ins do dia e avança o contador do programa.
    const nextDay = Math.min(state.day + 1, PROGRAM_LENGTH)
    return {
      ...state,
      day: nextDay,
      todayCheckins: {},
      stage: stageForPoints(state.points, nextDay),
    }
  }
  return { ...state, stage: stageForPoints(state.points, state.day) }
}

export function createProfile(name: string, email: string, role: Role = 'patient'): Profile {
  return {
    id: `demo-${Date.now()}`,
    name,
    email,
    role,
    createdAt: new Date().toISOString(),
  }
}
