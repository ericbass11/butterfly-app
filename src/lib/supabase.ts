import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * RNF02 — Backend Supabase (Postgres + Auth + RLS).
 *
 * Quando VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY estiverem definidos,
 * o app usa o backend real. Caso contrário, roda em "modo demonstração"
 * com persistência local (localStorage), permitindo avaliar o MVP sem
 * provisionar infraestrutura.
 */
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const isSupabaseConfigured = Boolean(url && anonKey)

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url as string, anonKey as string)
  : null

/**
 * RNF03 — dispara webhook do n8n para automações (boas-vindas WhatsApp/e-mail).
 * No modo demo (sem URL configurada), apenas registra no console.
 */
export async function triggerAutomation(
  event: string,
  payload: Record<string, unknown>,
): Promise<void> {
  const webhook = import.meta.env.VITE_N8N_WEBHOOK_URL as string | undefined
  if (!webhook) {
    // eslint-disable-next-line no-console
    console.info(`[n8n:demo] evento "${event}" seria disparado`, payload)
    return
  }
  try {
    await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, payload, at: new Date().toISOString() }),
    })
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[n8n] falha ao disparar automação', err)
  }
}
