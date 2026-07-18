import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { MealEntry, ProgramState } from '@/lib/types'
import { createInitialProgram, refreshProgram, store } from '@/lib/store'
import { DAILY_MAX_POINTS, HABITS, stageForPoints, todayKey } from '@/lib/gamification'

interface ProgramContextValue {
  program: ProgramState
  toggleHabit: (key: string) => void
  addMeal: (dataUrl: string, note: string) => void
  todayPoints: number
  todayComplete: boolean
  reset: () => void
}

const ProgramContext = createContext<ProgramContextValue | undefined>(undefined)

export function ProgramProvider({ children }: { children: ReactNode }) {
  const [program, setProgram] = useState<ProgramState>(() => {
    const existing = store.getProgram()
    return existing ? refreshProgram(existing) : createInitialProgram()
  })

  // Persiste sempre que muda
  useEffect(() => {
    store.setProgram(program)
  }, [program])

  const persistAndSet = useCallback((next: ProgramState) => {
    setProgram(next)
  }, [])

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
        const streak =
          !was && prev.lastCheckinDate !== today ? prev.streak + 1 : prev.streak
        return {
          ...prev,
          todayCheckins,
          points,
          lastCheckinDate: today,
          streak,
          stage: stageForPoints(points, prev.day),
        }
      })
    },
    [],
  )

  const addMeal = useCallback((dataUrl: string, note: string) => {
    setProgram((prev) => {
      const meal: MealEntry = {
        id: `meal-${Date.now()}`,
        dataUrl,
        note,
        createdAt: new Date().toISOString(),
      }
      // Registrar refeição também marca o hábito de alimentação e pontua uma vez/dia
      const alreadyFood = prev.todayCheckins.food === true
      const foodHabit = HABITS.find((h) => h.key === 'food')!
      const points = alreadyFood ? prev.points : prev.points + foodHabit.points
      return {
        ...prev,
        meals: [meal, ...prev.meals].slice(0, 60),
        todayCheckins: { ...prev.todayCheckins, food: true },
        lastCheckinDate: todayKey(),
        points,
        stage: stageForPoints(points, prev.day),
      }
    })
  }, [])

  const reset = useCallback(() => persistAndSet(createInitialProgram()), [persistAndSet])

  const todayPoints = useMemo(
    () =>
      HABITS.reduce((sum, h) => (program.todayCheckins[h.key] ? sum + h.points : sum), 0),
    [program.todayCheckins],
  )

  const todayComplete = todayPoints >= DAILY_MAX_POINTS

  const value = useMemo<ProgramContextValue>(
    () => ({ program, toggleHabit, addMeal, todayPoints, todayComplete, reset }),
    [program, toggleHabit, addMeal, todayPoints, todayComplete, reset],
  )

  return <ProgramContext.Provider value={value}>{children}</ProgramContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useProgram(): ProgramContextValue {
  const ctx = useContext(ProgramContext)
  if (!ctx) throw new Error('useProgram deve ser usado dentro de <ProgramProvider>')
  return ctx
}
