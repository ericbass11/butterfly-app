import { supabase } from './supabase'
import type {
  Anamnese,
  ChatMessage,
  MealEntry,
  Profile,
  ProgramState,
  Role,
  Stage,
  TriageResult,
} from './types'
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

// ---------- Conteúdo (Educação) ----------

export interface DbModule {
  id: string
  slug: string
  title: string
  description: string
  tag: string
  cover: string
}

export interface DbLesson {
  id: string
  slug: string
  moduleSlug: string | null
  category: string
  title: string
  description: string
  duration: string
  thumbnail: string
  content: string
  videoUrl: string
}

export interface DbEbook {
  id: string
  title: string
  format: string
}

export async function listModules(): Promise<DbModule[]> {
  const { data, error } = await client().from('modules').select('*').order('order_index')
  if (error) throw error
  return (data ?? []).map((m) => ({
    id: m.id,
    slug: m.slug,
    title: m.title,
    description: m.description ?? '',
    tag: m.tag ?? 'Módulo',
    cover: m.cover_url ?? '',
  }))
}

export async function listLessons(): Promise<DbLesson[]> {
  const { data, error } = await client().from('lessons').select('*').order('order_index')
  if (error) throw error
  return (data ?? []).map((l) => ({
    id: l.id,
    slug: l.slug,
    moduleSlug: l.module_slug ?? null,
    category: l.category,
    title: l.title,
    description: l.description ?? '',
    duration: l.duration ?? '',
    thumbnail: l.thumbnail_url ?? '',
    content: l.content ?? '',
    videoUrl: l.video_url ?? '',
  }))
}

export async function listEbooks(): Promise<DbEbook[]> {
  const { data, error } = await client().from('ebooks').select('*').order('order_index')
  if (error) throw error
  return (data ?? []).map((e) => ({ id: e.id, title: e.title, format: e.format ?? 'PDF' }))
}

/** Ids das aulas concluídas pela usuária. */
export async function getDoneLessonIds(userId: string): Promise<Set<string>> {
  const { data, error } = await client()
    .from('lesson_progress')
    .select('lesson_id, done')
    .eq('user_id', userId)
    .eq('done', true)
  if (error) throw error
  return new Set((data ?? []).map((r) => r.lesson_id as string))
}

export async function setLessonDone(userId: string, lessonId: string, done: boolean): Promise<void> {
  const { error } = await client()
    .from('lesson_progress')
    .upsert(
      { user_id: userId, lesson_id: lessonId, done, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,lesson_id' },
    )
  if (error) throw error
}

// ---------- Base de conhecimento da IA ----------

export interface DbKnowledge {
  keywords: string[]
  answer: string
  tip?: string
}

export async function listKnowledge(): Promise<DbKnowledge[]> {
  const { data, error } = await client().from('knowledge_entries').select('keywords, answer, tip')
  if (error) throw error
  return (data ?? []).map((k) => ({
    keywords: (k.keywords ?? []) as string[],
    answer: k.answer as string,
    tip: (k.tip as string) ?? undefined,
  }))
}

// ---------- Histórico de chat ----------

export async function listChatMessages(userId: string): Promise<ChatMessage[]> {
  const { data, error } = await client()
    .from('chat_messages')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(200)
  if (error) throw error
  return (data ?? []).map((m) => ({
    id: m.id,
    role: m.role,
    content: m.content,
    tip: m.tip ?? undefined,
    createdAt: m.created_at,
  }))
}

export async function insertChatMessage(
  userId: string,
  msg: { role: 'user' | 'assistant'; content: string; tip?: string },
): Promise<void> {
  const { error } = await client()
    .from('chat_messages')
    .insert({ user_id: userId, role: msg.role, content: msg.content, tip: msg.tip ?? null })
  if (error) throw error
}

// ============================================================================
// ADMIN — CRUD de conteúdo e gestão (requer papel admin; protegido por RLS)
// ============================================================================

function slugify(text: string): string {
  const base = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 40)
  return `${base || 'item'}-${crypto.randomUUID().slice(0, 4)}`
}

// ---------- Módulos ----------
export interface ModuleInput {
  title: string
  description: string
  tag: string
  cover: string
  orderIndex?: number
}

export async function createModule(input: ModuleInput): Promise<void> {
  const { error } = await client().from('modules').insert({
    slug: slugify(input.title),
    title: input.title,
    description: input.description,
    tag: input.tag,
    cover_url: input.cover,
    order_index: input.orderIndex ?? 99,
  })
  if (error) throw error
}

export async function updateModule(id: string, input: ModuleInput): Promise<void> {
  const { error } = await client()
    .from('modules')
    .update({
      title: input.title,
      description: input.description,
      tag: input.tag,
      cover_url: input.cover,
      ...(input.orderIndex !== undefined ? { order_index: input.orderIndex } : {}),
    })
    .eq('id', id)
  if (error) throw error
}

export async function deleteModule(id: string): Promise<void> {
  const { error } = await client().from('modules').delete().eq('id', id)
  if (error) throw error
}

// ---------- Aulas ----------
export interface LessonInput {
  title: string
  category: string
  moduleSlug: string | null
  description: string
  duration: string
  thumbnail: string
  videoUrl: string
  content: string
  orderIndex?: number
}

export async function createLesson(input: LessonInput): Promise<void> {
  const { error } = await client().from('lessons').insert({
    slug: slugify(input.title),
    module_slug: input.moduleSlug,
    category: input.category,
    title: input.title,
    description: input.description,
    duration: input.duration,
    thumbnail_url: input.thumbnail,
    video_url: input.videoUrl,
    content: input.content,
    order_index: input.orderIndex ?? 99,
  })
  if (error) throw error
}

export async function updateLesson(id: string, input: LessonInput): Promise<void> {
  const { error } = await client()
    .from('lessons')
    .update({
      module_slug: input.moduleSlug,
      category: input.category,
      title: input.title,
      description: input.description,
      duration: input.duration,
      thumbnail_url: input.thumbnail,
      video_url: input.videoUrl,
      content: input.content,
      ...(input.orderIndex !== undefined ? { order_index: input.orderIndex } : {}),
    })
    .eq('id', id)
  if (error) throw error
}

export async function deleteLesson(id: string): Promise<void> {
  const { error } = await client().from('lessons').delete().eq('id', id)
  if (error) throw error
}

// ---------- E-books ----------
export interface EbookInput {
  title: string
  description: string
  format: string
  fileUrl: string
  orderIndex?: number
}

export async function createEbook(input: EbookInput): Promise<void> {
  const { error } = await client().from('ebooks').insert({
    slug: slugify(input.title),
    title: input.title,
    description: input.description,
    format: input.format || 'PDF',
    file_url: input.fileUrl,
    order_index: input.orderIndex ?? 99,
  })
  if (error) throw error
}

export async function updateEbook(id: string, input: EbookInput): Promise<void> {
  const { error } = await client()
    .from('ebooks')
    .update({
      title: input.title,
      description: input.description,
      format: input.format || 'PDF',
      file_url: input.fileUrl,
      ...(input.orderIndex !== undefined ? { order_index: input.orderIndex } : {}),
    })
    .eq('id', id)
  if (error) throw error
}

export async function deleteEbook(id: string): Promise<void> {
  const { error } = await client().from('ebooks').delete().eq('id', id)
  if (error) throw error
}

// ---------- Base de conhecimento (admin, com id) ----------
export interface KnowledgeRow {
  id: string
  category: string
  keywords: string[]
  answer: string
  tip: string
}
export interface KnowledgeInput {
  category: string
  keywords: string[]
  answer: string
  tip: string
}

export async function listKnowledgeAll(): Promise<KnowledgeRow[]> {
  const { data, error } = await client()
    .from('knowledge_entries')
    .select('id, category, keywords, answer, tip')
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []).map((k) => ({
    id: k.id,
    category: k.category ?? '',
    keywords: (k.keywords ?? []) as string[],
    answer: k.answer ?? '',
    tip: k.tip ?? '',
  }))
}

export async function createKnowledge(input: KnowledgeInput): Promise<void> {
  const { error } = await client().from('knowledge_entries').insert({
    slug: slugify(input.keywords[0] ?? input.answer.slice(0, 20)),
    category: input.category,
    keywords: input.keywords,
    answer: input.answer,
    tip: input.tip || null,
  })
  if (error) throw error
}

export async function updateKnowledge(id: string, input: KnowledgeInput): Promise<void> {
  const { error } = await client()
    .from('knowledge_entries')
    .update({
      category: input.category,
      keywords: input.keywords,
      answer: input.answer,
      tip: input.tip || null,
    })
    .eq('id', id)
  if (error) throw error
}

export async function deleteKnowledge(id: string): Promise<void> {
  const { error } = await client().from('knowledge_entries').delete().eq('id', id)
  if (error) throw error
}

// ---------- Usuárias (gestão de papel) ----------
export interface ManagedUser {
  id: string
  name: string
  email: string
  role: Role
  createdAt: string
}

export async function listAllProfiles(): Promise<ManagedUser[]> {
  const { data, error } = await client()
    .from('profiles')
    .select('id, name, email, role, created_at')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map((p) => ({
    id: p.id,
    name: p.name ?? '',
    email: p.email ?? '',
    role: (p.role ?? 'patient') as Role,
    createdAt: p.created_at,
  }))
}

export async function updateUserRole(userId: string, role: Role): Promise<void> {
  const { error } = await client().from('profiles').update({ role }).eq('id', userId)
  if (error) throw error
}
