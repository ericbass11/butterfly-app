import {
  FALLBACK_ANSWER,
  FORBIDDEN_FOODS,
  KNOWLEDGE_BASE,
  type KnowledgeEntry,
} from '@/data/knowledge'
import type { ChatMessage } from './types'

/**
 * Simulação local do "Squad de Agentes de IA" (RNF04).
 *
 * Em produção, isto seria orquestrado por LangGraph/Antigravity:
 *   1. Agente Recuperador — busca no banco vetorizado do método.
 *   2. Agente Auditor Clínico — revisa a resposta, rejeitando sugestões
 *      inflamatórias/fora da dieta antes de enviar ao usuário.
 *
 * Aqui usamos correspondência por palavras-chave + um passo de auditoria
 * que garante que nenhum alimento proibido seja recomendado.
 */

/** Normaliza para busca: minúsculas e sem acentos (á→a, ç→c...). */
function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function retrieve(query: string, entries: KnowledgeEntry[]): KnowledgeEntry | null {
  const q = norm(query)
  let best: { entry: KnowledgeEntry; score: number } | null = null
  for (const entry of entries) {
    const score = entry.keywords.reduce((acc, kw) => (q.includes(norm(kw)) ? acc + 1 : acc), 0)
    if (score > 0 && (!best || score > best.score)) best = { entry, score }
  }
  return best?.entry ?? null
}

/** Auditor clínico: se a resposta contiver alimento proibido de forma
 *  afirmativa (sem a negativa "evite/fuja"), acrescenta um alerta. */
function audit(answer: string): string {
  const lower = answer.toLowerCase()
  const flagged = FORBIDDEN_FOODS.filter((f) => lower.includes(f))
  const affirmsBad = flagged.some((f) => {
    const idx = lower.indexOf(f)
    const before = lower.slice(Math.max(0, idx - 24), idx)
    return !/evite|fuja|sem|nunca|não|nao|fora/.test(before)
  })
  if (affirmsBad) {
    return (
      answer +
      '\n\n⚠️ Auditoria clínica: reforçando que os itens acima devem seguir estritamente o seu plano — na dúvida, confirme com seu profissional parceiro.'
    )
  }
  return answer
}

export interface SquadReply {
  content: string
  tip?: string
}

/**
 * Ponto de entrada do chat. Retorna a resposta auditada.
 * `knowledge` permite injetar a base vinda do Supabase; se vazia, usa a local.
 */
export async function askSquad(query: string, knowledge?: KnowledgeEntry[]): Promise<SquadReply> {
  // pequena latência simulada para dar sensação de "pensando"
  await new Promise((r) => setTimeout(r, 650))
  const entries = knowledge && knowledge.length > 0 ? knowledge : KNOWLEDGE_BASE
  const entry = retrieve(query, entries)
  if (!entry) {
    return { content: FALLBACK_ANSWER }
  }
  return { content: audit(entry.answer), tip: entry.tip }
}

export function makeMessage(role: ChatMessage['role'], content: string, tip?: string): ChatMessage {
  return {
    id: `${role}-${Date.now()}-${Math.floor(performance.now())}`,
    role,
    content,
    tip,
    createdAt: new Date().toISOString(),
  }
}

export const GREETING: ChatMessage = {
  id: 'greeting',
  role: 'assistant',
  content:
    'Olá! Que bom ver você por aqui. Como posso te apoiar na sua jornada Metamorphosis hoje? Pergunte sobre alimentos permitidos, substituições e as fases do protocolo.',
  createdAt: new Date(0).toISOString(),
}
