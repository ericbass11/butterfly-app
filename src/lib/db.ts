import { supabase } from './supabase'
import type { Anamnese, MealEntry, Profile, ProgramState, Role, Stage, TriageResult } from './types'

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

export async function listMeals(userId: string): Promise<MealEntry[]> {
  const { data, error } = await client()
    .from('meals')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(60)
  if (error) throw error
  return (data ?? []).map((m) => ({
    id: m.id,
    dataUrl: m.image ?? '',
    note: m.note ?? '',
    createdAt: m.created_at,
  }))
}

export async function insertMeal(
  userId: string,
  dataUrl: string,
  note: string,
): Promise<MealEntry> {
  const { data, error } = await client()
    .from('meals')
    .insert({ user_id: userId, image: dataUrl, note })
    .select()
    .single()
  if (error) throw error
  return { id: data.id, dataUrl: data.image ?? '', note: data.note ?? '', createdAt: data.created_at }
}
