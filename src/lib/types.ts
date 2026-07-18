// Tipos de domínio do App Butterfly (MVP Fase 1)

export type Role = 'patient' | 'partner' | 'admin'

export type Stage = 'larva' | 'casulo' | 'borboleta'

export interface Profile {
  id: string
  name: string
  email: string
  role: Role
  avatarUrl?: string
  createdAt: string
}

/** Respostas da anamnese (RF02 — triagem e segurança clínica) */
export interface Anamnese {
  goal: string
  age: number
  hasDiabetes: boolean
  hasHypertension: boolean
  isPregnant: boolean
  eatingDisorderHistory: boolean
  medications: string
  observations: string
}

export type RiskLevel = 'clear' | 'attention' | 'blocked'

export interface TriageResult {
  level: RiskLevel
  reasons: string[]
  requiresPartner: boolean
}

/** Estado do programa de 45 dias para o usuário */
export interface ProgramState {
  startDate: string // ISO
  day: number // 1..45
  points: number
  stage: Stage
  // check-ins do dia corrente por chave de hábito
  todayCheckins: Record<string, boolean>
  lastCheckinDate: string | null // yyyy-mm-dd
  meals: MealEntry[]
  streak: number
  badges: string[] // ids de conquistas desbloqueadas
}

export interface MealEntry {
  id: string
  dataUrl: string // foto (base64) no modo demo
  note: string
  createdAt: string
}

export interface Habit {
  key: string
  label: string
  hint: string
  icon: string // Material Symbol
  points: number
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  tip?: string
  createdAt: string
}
