import { useEffect, useRef, useState } from 'react'
import { TopBar } from '@/components/TopBar'
import { Icon } from '@/components/Icon'
import { askSquad, GREETING, makeMessage } from '@/lib/aiSquad'
import { SUGGESTED_QUESTIONS } from '@/data/knowledge'
import type { ChatMessage } from '@/lib/types'
import { clsx } from '@/lib/utils'
import { isSupabaseConfigured } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import * as db from '@/lib/db'

/** Chatbot de Suporte IA — Squad de Agentes (RF08, RNF04). */
export function Chat() {
  const { profile } = useAuth()
  const userId = profile?.id ?? null
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const [knowledge, setKnowledge] = useState<db.DbKnowledge[] | undefined>(undefined)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Carrega histórico + base de conhecimento do Supabase (quando disponível)
  useEffect(() => {
    if (!isSupabaseConfigured || !userId) return
    let active = true
    ;(async () => {
      try {
        const [history, kb] = await Promise.all([db.listChatMessages(userId), db.listKnowledge()])
        if (!active) return
        if (history.length > 0) setMessages(history)
        if (kb.length > 0) setKnowledge(kb)
      } catch {
        /* mantém saudação + base local */
      }
    })()
    return () => {
      active = false
    }
  }, [userId])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, typing])

  async function send(text: string) {
    const clean = text.trim()
    if (!clean || typing) return
    setInput('')
    setMessages((m) => [...m, makeMessage('user', clean)])
    setTyping(true)
    if (isSupabaseConfigured && userId) {
      db.insertChatMessage(userId, { role: 'user', content: clean }).catch(() => {})
    }
    const reply = await askSquad(clean, knowledge)
    setTyping(false)
    setMessages((m) => [...m, makeMessage('assistant', reply.content, reply.tip)])
    if (isSupabaseConfigured && userId) {
      db.insertChatMessage(userId, { role: 'assistant', content: reply.content, tip: reply.tip }).catch(
        () => {},
      )
    }
  }

  return (
    <div className="flex flex-col h-dvh max-w-[520px] mx-auto">
      <TopBar brand title="Butterfly" right={<Icon name="notifications" className="text-primary" />} />

      <div ref={scrollRef} className="flex-1 overflow-y-auto pt-20 pb-4 px-container-padding no-scrollbar">
        {/* Selo de confiança */}
        <div className="flex items-center gap-2 justify-center rounded-full bg-surface-container px-4 py-2.5 mb-4">
          <Icon name="verified" fill className="text-primary text-[18px]" />
          <span className="font-body-sm text-body-sm text-on-surface-variant text-center">
            Respostas baseadas no <strong className="text-on-surface">método oficial Butterfly</strong>
          </span>
        </div>

        <p className="text-center font-body-sm text-[12px] text-on-surface-variant mb-4">Hoje</p>

        <div className="flex flex-col gap-4">
          {messages.map((m) => (
            <Bubble key={m.id} message={m} />
          ))}
          {typing && <TypingBubble />}
        </div>
      </div>

      {/* Sugestões rápidas */}
      <div className="px-container-padding pb-2 flex flex-wrap gap-2">
        {SUGGESTED_QUESTIONS.map((q) => (
          <button
            key={q}
            onClick={() => send(q)}
            className="rounded-full bg-surface-container border border-outline-variant px-4 py-2 font-body-sm text-body-sm text-on-surface-variant hover:border-primary transition-colors active:scale-95"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="px-container-padding pb-safe pt-2 bg-surface">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            send(input)
          }}
          className="flex items-center gap-2 rounded-full border border-outline-variant bg-surface-container-lowest pl-2 pr-1.5 h-14 shadow-ambient mb-24"
        >
          <button type="button" className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high" aria-label="Anexar">
            <Icon name="add" />
          </button>
          <button type="button" className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high" aria-label="Câmera">
            <Icon name="photo_camera" />
          </button>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Pergunte sobre o protocolo…"
            className="flex-1 bg-transparent outline-none font-body-md text-body-md text-on-surface placeholder:text-outline min-w-0"
          />
          <button
            type="submit"
            disabled={!input.trim() || typing}
            className="w-11 h-11 shrink-0 rounded-full bg-primary text-on-primary flex items-center justify-center disabled:opacity-40 active:scale-95 transition-transform"
            aria-label="Enviar"
          >
            <Icon name="send" fill />
          </button>
        </form>
      </div>
    </div>
  )
}

function Bubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user'
  return (
    <div className={clsx('flex gap-2 items-end', isUser ? 'flex-row-reverse' : 'flex-row')}>
      {!isUser && (
        <div className="w-9 h-9 shrink-0 rounded-full bg-primary-container flex items-center justify-center mb-1">
          <Icon name="spa" fill className="text-on-primary text-[18px]" />
        </div>
      )}
      <div
        className={clsx(
          'max-w-[78%] rounded-2xl px-4 py-3 font-body-md text-body-md whitespace-pre-line',
          isUser
            ? 'bg-primary-container text-on-primary rounded-br-md'
            : 'bg-surface-container text-on-surface rounded-bl-md',
        )}
      >
        {message.content}
        {message.tip && (
          <div className="mt-3 rounded-lg bg-surface-container-high/70 border border-outline-variant/50 p-3 flex gap-2">
            <Icon name="info" className="text-secondary text-[18px] shrink-0" />
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              <strong className="text-on-surface">Dica Butterfly:</strong> {message.tip}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function TypingBubble() {
  return (
    <div className="flex gap-2 items-end">
      <div className="w-9 h-9 shrink-0 rounded-full bg-primary-container flex items-center justify-center mb-1">
        <Icon name="spa" fill className="text-on-primary text-[18px]" />
      </div>
      <div className="rounded-2xl rounded-bl-md bg-surface-container px-4 py-4 flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-2 h-2 rounded-full bg-outline animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  )
}
