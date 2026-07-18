import { supabase } from './supabase'
import type { Anamnese, MealEntry, Profile, ProgramState, Role, Stage, TriageResult } from './types'
import { dataUrlToBlob, relativeDay } from './utils'
import { DAILY_MAX_POINTS } from './gamification'

const MEALS_BUCKET = 'meal-photos'
const SIGNED_URL_TTL = 60 * 60 // 1h

/**
 * Camada de acesso a dados (Supabase Postgres).
 * Mapeia linhas snake_case do banco para os tipos camelCase do app.
 * Só é usada quando o Supabase está configurado (ver AuthContext/ProgramContext).
 */

function client() {
  if (!supabase) throw new Error('Supabase não configurado')
  return supabase
}

// ---------- Profiles ----------

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await client()
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  return {
    id: data.id,
    name: data.name ?? '',
    email: data.email ?? '',
    role: (data.role ?? 'patient') as Role,
    avatarUrl: data.avatar_url ?? undefined,
    createdAt: data.created_at,
  }
}

/** Garante que exista uma linha em profiles (fallback caso o trigger não tenha rodado). */
export async function ensureProfile(
  userId: string,
  name: string,
  email: string,
  role: Role,
): Promise<Profile> {
  const existing = await getProfile(userId)
  if (existing) return existing
  const { data, error } = await client()
    .from('profiles')
    .upsert({ id: userId, name, email, role }, { onConflict: 'id' })
    .select()
    .single()
  if (error) throw error
  return {
    id: data.id,
    name: data.name ?? '',
    email: data.email ?? '',
    role: (data.role ?? 'patient') as Role,
    avatarUrl: data.avatar_url ?? undefined,
    createdAt: data.created_at,
  }
}

export async function updateProfile(userId: string, patch: Partial<Profile>): Promise<void> {
  const row: Record<string, unknown> = {}
  if (patch.name !== undefined) row.name = patch.name
  if (patch.avatarUrl !== undefined) row.avatar_url = patch.avatarUrl
  if (patch.role !== undefined) row.role = patch.role
  if (Object.keys(row).length === 0) return
  const { error } = await client().from('profiles').update(row).eq('id', userId)
  if (error) throw error
}

// ---------- Anamnese ----------

export async function saveAnamnese(
  userId: string,
  a: Anamnese,
  triage: TriageResult,
): Promise<void> {
  const { error } = await client().from('anamneses').insert({
    user_id: userId,
    goal: a.goal,
    age: a.age,
    has_diabetes: a.hasDiabetes,
    has_hypertension: a.hasHypertension,
    is_pregnant: a.isPregnant,
    eating_disorder_history: a.eatingDisorderHistory,
    medications: a.medications,
    observations: a.observations,
    risk_level: triage.level,
    requires_partner: triage.requiresPartner,
  })
  if (error) throw error
}

// ---------- Program state ----------

export async function getProgram(userId: string): Promise<ProgramState | null> {
  const { data, error } = await client()
    .from('program_state')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  const meals = await listMeals(userId)
  return {
    startDate: data.start_date,
    day: data.day,
    points: data.points,
    stage: data.stage as Stage,
    todayCheckins: (data.today_checkins ?? {}) as Record<string, boolean>,
    lastCheckinDate: data.last_checkin_date,
    streak: data.streak,
    meals,
  }
}

export async function isOnboarded(userId: string): Promise<boolean> {
  const { data, error } = await client()
    .from('program_state')
    .select('onboarded')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  return data?.onboarded === true
}

/** Cria/atualiza a linha de estado do programa (sem as refeições, que têm tabela própria). */
export async function upsertProgram(
  userId: string,
  state: ProgramState,
  onboarded?: boolean,
): Promise<void> {
  const row: Record<string, unknown> = {
    user_id: userId,
    start_date: state.startDate,
    day: state.day,
    points: state.points,
    stage: state.stage,
    today_checkins: state.todayCheckins,
    last_checkin_date: state.lastCheckinDate,
    streak: state.streak,
    updated_at: new Date().toISOString(),
  }
  if (onboarded !== undefined) row.onboarded = onboarded
  const { error } = await client().from('program_state').upsert(row, { onConflict: 'user_id' })
  if (error) throw error
}

export async function setOnboarded(userId: string, value: boolean): Promise<void> {
  const { error } = await client()
    .from('program_state')
    .update({ onboarded: value })
    .eq('user_id', userId)
  if (error) throw error
}

// ---------- Meals ----------

/** Resolve o campo `image` de uma refeição para uma URL exibível.
 *  Compatível com dois formatos: base64 legado ("data:...") e caminho no Storage. */
async function resolveMealImages(rows: { image: string | null }[]): Promise<string[]> {
  const paths = rows.map((r) => r.image ?? '').filter((v) => v && !v.startsWith('data:'))
  const signedByPath = new Map<string, string>()
  if (paths.length > 0) {
    const { data } = await client().storage.from(MEALS_BUCKET).createSignedUrls(paths, SIGNED_URL_TTL)
    for (const item of data ?? []) {
      if (item.signedUrl && item.path) signedByPath.set(item.path, item.signedUrl)
    }
  }
  return rows.map((r) => {
    const img = r.image ?? ''
    if (!img) return ''
    if (img.startsWith('data:')) return img
    return signedByPath.get(img) ?? ''
  })
}

export async function listMeals(userId: string): Promise<MealEntry[]> {
  const { data, error } = await client()
    .from('meals')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(60)
  if (error) throw error
  const rows = data ?? []
  const urls = await resolveMealImages(rows)
  return rows.map((m, i) => ({
    id: m.id,
    dataUrl: urls[i],
    note: m.note ?? '',
    createdAt: m.created_at,
  }))
}

export async function insertMeal(
  userId: string,
  dataUrl: string,
  note: string,
): Promise<MealEntry> {
  // Faz upload da foto para o bucket privado (pasta = id da usuária) e guarda o caminho.
  const blob = dataUrlToBlob(dataUrl)
  const ext = (blob.type.split('/')[1] || 'jpg').replace('jpeg', 'jpg')
  const path = `${userId}/${crypto.randomUUID()}.${ext}`
  const { error: upErr } = await client()
    .storage.from(MEALS_BUCKET)
    .upload(path, blob, { contentType: blob.type, upsert: false })
  if (upErr) throw upErr

  const { data, error } = await client()
    .from('meals')
    .insert({ user_id: userId, image: path, note })
    .select()
    .single()
  if (error) throw error

  const { data: signed } = await client().storage
    .from(MEALS_BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL)
  return {
    id: data.id,
    dataUrl: signed?.signedUrl ?? '',
    note: data.note ?? '',
    createdAt: data.created_at,
  }
}

// ---------- Painéis (Parceiro / Admin) ----------

export interface RosterPatient {
  id: string
  name: string
  day: number
  stage: Stage
  points: number
  adherence: number // 0..1
  risk: 'clear' | 'attention' | 'blocked'
  lastCheckin: string
}

/** Lista pacientes com estado do programa e risco (leitura via RLS de parceiro/admin). */
export async function getRoster(): Promise<RosterPatient[]> {
  const sb = client()
  const [profilesRes, programRes, anamnesesRes] = await Promise.all([
    sb.from('profiles').select('id, name, role').eq('role', 'patient'),
    sb.from('program_state').select('*'),
    sb.from('anamneses').select('user_id, risk_level, created_at').order('created_at', { ascending: false }),
  ])
  if (profilesRes.error) throw profilesRes.error

  const programByUser = new Map<string, Record<string, unknown>>()
  for (const p of programRes.data ?? []) programByUser.set(p.user_id as string, p)

  // risco = anamnese mais recente por usuária
  const riskByUser = new Map<string, string>()
  for (const a of anamnesesRes.data ?? []) {
    if (!riskByUser.has(a.user_id as string)) riskByUser.set(a.user_id as string, (a.risk_level as string) ?? 'clear')
  }

  return (profilesRes.data ?? []).map((prof) => {
    const prog = programByUser.get(prof.id) as
      | { day: number; points: number; stage: Stage; last_checkin_date: string | null }
      | undefined
    const day = prog?.day ?? 0
    const points = prog?.points ?? 0
    const denom = Math.max(day, 1) * DAILY_MAX_POINTS
    return {
      id: prof.id,
      name: (prof.name as string) || 'Sem nome',
      day,
      stage: (prog?.stage ?? 'larva') as Stage,
      points,
      adherence: Math.min(points / denom, 1),
      risk: (riskByUser.get(prof.id) ?? 'clear') as RosterPatient['risk'],
      lastCheckin: relativeDay(prog?.last_checkin_date ?? null),
    }
  })
}

export interface AdminStats {
  totalPatients: number
  activeToday: number // % que fez check-in hoje
  completionRate: number // % que chegou a Borboleta
  stageCounts: { larva: number; casulo: number; borboleta: number }
}

export async function getAdminStats(): Promise<AdminStats> {
  const roster = await getRoster()
  const total = roster.length
  const activeToday = roster.filter((r) => r.lastCheckin === 'Hoje').length
  const borboleta = roster.filter((r) => r.stage === 'borboleta').length
  return {
    totalPatients: total,
    activeToday: total ? activeToday / total : 0,
    completionRate: total ? borboleta / total : 0,
    stageCounts: {
      larva: roster.filter((r) => r.stage === 'larva').length,
      casulo: roster.filter((r) => r.stage === 'casulo').length,
      borboleta,
    },
  }
}
