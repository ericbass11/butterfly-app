import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { Anamnese, MealEntry, ProgramState, TriageResult } from '@/lib/types'
import { createInitialProgram, refreshProgram, store } from '@/lib/store'
import { DAILY_MAX_POINTS, HABITS, stageForPoints, todayKey } from '@/lib/gamification'
import { isSupabaseConfigured } from '@/lib/supabase'
import * as db from '@/lib/db'
import { useAuth } from './AuthContext'

interface ProgramContextValue {
  program: ProgramState
  /** Carregamento inicial concluído (evita decisões de rota prematuras). */
  ready: boolean
  onboarded: boolean
  toggleHabit: (key: string) => void
  addMeal: (dataUrl: string, note: string) => Promise<void>
  completeOnboarding: (anamnese: Anamnese, triage: TriageResult) => Promise<void>
  todayPoints: number
  todayComplete: boolean
  reset: () => void
}

const ProgramContext = createContext<ProgramContextValue | undefined>(undefined)

export function ProgramProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth()
  const userId = profile?.id ?? null

  const [program, setProgram] = useState<ProgramState>(() => createInitialProgram())
  const [ready, setReady] = useState(!isSupabaseConfigured)
  const [onboarded, setOnboarded] = useState(false)

  // Carregamento inicial do estado do programa
  useEffect(() => {
    let active = true

    if (!isSupabaseConfigured) {
      const existing = store.getProgram()
      setProgram(existing ? refreshProgram(existing) : createInitialProgram())
      setOnboarded(store.isOnboarded())
      setReady(true)
      return
    }

    // Supabase: só carrega quando há usuária autenticada
    if (!userId) {
      setReady(true)
      setOnboarded(false)
      setProgram(createInitialProgram())
      return
    }

    setReady(false)
    ;(async () => {
      try {
        const loaded = await db.getProgram(userId)
        const ob = await db.isOnboarded(userId)
        if (!active) return
        setProgram(loaded ? refreshProgram(loaded) : createInitialProgram())
        setOnboarded(ob)
      } catch {
        if (active) setProgram(createInitialProgram())
      } finally {
        if (active) setReady(true)
      }
    })()

    return () => {
      active = false
    }
  }, [userId])

  // Persiste o estado do programa (debounce leve para agrupar cliques rápidos)
  const persistTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const persist = useCallback(
    (next: ProgramState) => {
      if (!isSupabaseConfigured) {
        store.setProgram(next)
        return
      }
      if (!userId) return
      if (persistTimer.current) clearTimeout(persistTimer.current)
      persistTimer.current = setTimeout(() => {
        db.upsertProgram(userId, next, true).catch(() => {})
      }, 400)
    },
    [userId],
  )

  const toggleHabit = useCallback(
    (key: string) => {
      setProgram((prev) => {
        const habit = HABITS.find((h) => h.key === key)
        if (!habit) return prev
        const was = prev.todayCheckins[key] === true
        const todayCheckins = { ...prev.todayCheckins, [key]: !was }
        const delta = was ? -habit.points : habit.points
        const points = Math.max(0, prev.points + delta)
        const today = todayKey()
        const streak = !was && prev.lastCheckinDate !== today ? prev.streak + 1 : prev.streak
        const next: ProgramState = {
          ...prev,
          todayCheckins,
          points,
          lastCheckinDate: today,
          streak,
          stage: stageForPoints(points, prev.day),
        }
        persist(next)
        return next
      })
    },
    [persist],
  )

  const addMeal = useCallback(
    async (dataUrl: string, note: string) => {
      let meal: MealEntry
      if (isSupabaseConfigured && userId) {
        meal = await db.insertMeal(userId, dataUrl, note)
      } else {
        meal = { id: `meal-${Date.now()}`, dataUrl, note, createdAt: new Date().toISOString() }
      }
      setProgram((prev) => {
        const alreadyFood = prev.todayCheckins.food === true
        const foodHabit = HABITS.find((h) => h.key === 'food')!
        const points = alreadyFood ? prev.points : prev.points + foodHabit.points
        const next: ProgramState = {
          ...prev,
          meals: [meal, ...prev.meals].slice(0, 60),
          todayCheckins: { ...prev.todayCheckins, food: true },
          lastCheckinDate: todayKey(),
          points,
          stage: stageForPoints(points, prev.day),
        }
        persist(next)
        return next
      })
    },
    [persist, userId],
  )

  const completeOnboarding = useCallback(
    async (anamnese: Anamnese, triage: TriageResult) => {
      const base = store.getProgram() ?? createInitialProgram()
      if (isSupabaseConfigured && userId) {
        await db.saveAnamnese(userId, anamnese, triage)
        await db.upsertProgram(userId, program.meals.length ? program : base, true)
      } else {
        store.setAnamnese(anamnese)
        store.setOnboarded(true)
        if (!store.getProgram()) store.setProgram(base)
        setProgram(base)
      }
      setOnboarded(true)
    },
    [program, userId],
  )

  const reset = useCallback(() => {
    const fresh = createInitialProgram()
    setProgram(fresh)
    if (isSupabaseConfigured && userId) {
      db.upsertProgram(userId, fresh, onboarded).catch(() => {})
    } else {
      store.setProgram(fresh)
    }
  }, [userId, onboarded])

  const todayPoints = useMemo(
    () => HABITS.reduce((sum, h) => (program.todayCheckins[h.key] ? sum + h.points : sum), 0),
    [program.todayCheckins],
  )
  const todayComplete = todayPoints >= DAILY_MAX_POINTS

  const value = useMemo<ProgramContextValue>(
    () => ({
      program,
      ready,
      onboarded,
      toggleHabit,
      addMeal,
      completeOnboarding,
      todayPoints,
      todayComplete,
      reset,
    }),
    [program, ready, onboarded, toggleHabit, addMeal, completeOnboarding, todayPoints, todayComplete, reset],
  )

  return <ProgramContext.Provider value={value}>{children}</ProgramContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useProgram(): ProgramContextValue {
  const ctx = useContext(ProgramContext)
  if (!ctx) throw new Error('useProgram deve ser usado dentro de <ProgramProvider>')
  return ctx
}
