import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/context/AuthContext'
import { useProgram } from '@/context/ProgramContext'
import { TopBar } from '@/components/TopBar'
import { Icon } from '@/components/Icon'
import { ProgressBar } from '@/components/ProgressBar'
import { StageBadge } from '@/components/ButterflyAvatar'
import { Metamorphosis } from '@/components/Metamorphosis'
import { MealCapture } from '@/components/MealCapture'
import {
  AnimatedNumber,
  BadgeToast,
  Confetti,
  DailyCompleteToast,
  DailyRing,
  HabitCheck,
  StageCelebration,
} from '@/components/Gamify'
import { HABITS, PROGRAM_LENGTH, programProgress, stageProgress } from '@/lib/gamification'
import type { Stage } from '@/lib/types'
import { MOTIVATIONAL_QUOTES } from '@/data/lessons'
import { staggerContainer } from '@/lib/motion'

/** Dashboard de Evolução — tela principal (RF04, RF05, RF06). */
const STAGE_ORDER: Stage[] = ['larva', 'casulo', 'borboleta']

export function Dashboard() {
  const { profile } = useAuth()
  const { program, toggleHabit, addMeal, todayPoints, todayComplete, newBadges, dismissBadges } =
    useProgram()
  const [mealOpen, setMealOpen] = useState(false)

  // --- Gamificação: celebrações ---
  const [celebrateStage, setCelebrateStage] = useState<Stage | null>(null)
  const [confettiRun, setConfettiRun] = useState(false)
  const [dailyToast, setDailyToast] = useState(false)
  const prevStage = useRef(program.stage)
  const prevComplete = useRef(todayComplete)

  // Evolução de estágio → celebração com confete
  useEffect(() => {
    if (STAGE_ORDER.indexOf(program.stage) > STAGE_ORDER.indexOf(prevStage.current)) {
      setCelebrateStage(program.stage)
    }
    prevStage.current = program.stage
  }, [program.stage])

  // Dia completo (todos os hábitos) → confete + faixa
  useEffect(() => {
    if (todayComplete && !prevComplete.current) {
      setConfettiRun(true)
      setDailyToast(true)
      const t1 = setTimeout(() => setConfettiRun(false), 2400)
      const t2 = setTimeout(() => setDailyToast(false), 3400)
      prevComplete.current = todayComplete
      return () => {
        clearTimeout(t1)
        clearTimeout(t2)
      }
    }
    prevComplete.current = todayComplete
  }, [todayComplete])

  const quote = useMemo(
    () => MOTIVATIONAL_QUOTES[program.day % MOTIVATIONAL_QUOTES.length],
    [program.day],
  )
  const stageInfo = stageProgress(program.points)
  const doneCount = HABITS.filter((h) => program.todayCheckins[h.key]).length

  return (
    <div className="pt-20 pb-32 px-container-padding animate-fade-in">
      <TopBar
        brand
        subtitle={undefined}
        left={
          <div className="relative">
            {profile?.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt=""
                className="w-10 h-10 rounded-full object-cover border-2 border-primary-container"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-secondary-fixed flex items-center justify-center border-2 border-primary-container">
                <Icon name="person" fill className="text-secondary text-[22px]" />
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-surface-container-lowest rounded-full border border-surface flex items-center justify-center overflow-hidden">
              <Metamorphosis stage={program.stage} size={16} />
            </div>
          </div>
        }
        title="Butterfly"
        right={
          <button className="w-10 h-10 flex items-center justify-center rounded-full text-primary hover:bg-surface-container-high active:scale-95" aria-label="Notificações">
            <Icon name="notifications" />
          </button>
        }
      />

      {/* Saudação + estágio */}
      <div className="mb-4">
        <p className="font-body-md text-body-md text-on-surface-variant">
          Olá, <strong className="text-on-surface">{profile?.name?.split(' ')[0] ?? 'Convidada'}</strong> 👋
        </p>
        <div className="mt-2">
          <StageBadge stage={program.stage} />
        </div>
      </div>

      {/* Motivação */}
      <div className="glass-card rounded-xl p-md flex flex-col items-center text-center mb-4">
        <Icon name="spa" className="text-secondary text-[36px] mb-2 opacity-80" />
        <p className="font-body-lg text-body-lg text-on-surface italic">&ldquo;{quote}&rdquo;</p>
      </div>

      {/* Jornada / Progresso */}
      <div className="glass-card rounded-xl p-md mb-6">
        <div className="flex justify-between items-end mb-4">
          <div>
            <h2 className="font-headline-md text-headline-md text-on-surface">Jornada</h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant">Fase de adaptação</p>
          </div>
          <div className="text-right">
            <span className="font-headline-lg-mobile text-headline-lg-mobile text-primary font-bold">
              Dia {program.day}
            </span>
            <span className="font-body-sm text-body-sm text-on-surface-variant block">de {PROGRAM_LENGTH}</span>
          </div>
        </div>
        <ProgressBar ratio={programProgress(program)} butterflyHead />
        <div className="flex justify-between mt-2 font-label-md text-[10px] uppercase tracking-wider text-on-surface-variant">
          <span>Início</span>
          <span>{stageInfo.next === 'borboleta' ? 'Borboleta' : 'Casulo'}</span>
        </div>
        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-outline-variant/60">
          <Stat icon="bolt" label="Pontos" value={<AnimatedNumber value={program.points} />} />
          <Stat icon="local_fire_department" label="Sequência" value={`${program.streak}d`} />
          <Stat icon="restaurant_menu" label="Refeições" value={program.meals.length} />
        </div>
      </div>

      {/* Check-in Diário */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-headline-md text-headline-md text-on-surface">Check-in Diário</h3>
            <span className="font-label-md text-label-md text-primary">
              +<AnimatedNumber value={todayPoints} /> pts hoje
            </span>
          </div>
          <DailyRing done={doneCount} total={HABITS.length} />
        </div>
        <motion.div
          className="flex flex-col gap-3"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          {HABITS.map((h) => (
            <HabitCheck
              key={h.key}
              habit={h}
              active={program.todayCheckins[h.key] === true}
              onToggle={() => toggleHabit(h.key)}
            />
          ))}
        </motion.div>
      </section>

      {/* Upload de refeição */}
      <section className="mt-6">
        <button
          onClick={() => setMealOpen(true)}
          className="w-full relative overflow-hidden rounded-xl bg-gradient-to-br from-primary-container to-primary p-6 flex flex-col items-center justify-center text-on-primary shadow-ambient-lg hover:opacity-95 transition-opacity active:scale-[0.98] min-h-[140px]"
        >
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,white,transparent)]" />
          <Icon name="add_a_photo" className="text-4xl mb-2 relative z-10" />
          <span className="font-label-md text-label-md relative z-10">Upload de Foto da Refeição</span>
          <span className="font-body-sm text-body-sm text-on-primary/80 mt-1 relative z-10">
            Registre para acompanhamento
          </span>
        </button>
      </section>

      {/* Galeria recente de refeições */}
      {program.meals.length > 0 && (
        <section className="mt-6">
          <h3 className="font-headline-md text-[20px] text-on-surface mb-3">Registros recentes</h3>
          <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-container-padding px-container-padding">
            {program.meals.map((m) => (
              <div key={m.id} className="shrink-0 w-28">
                <img src={m.dataUrl} alt={m.note || 'Refeição'} className="w-28 h-28 object-cover rounded-xl" />
                {m.note && (
                  <p className="font-body-sm text-[12px] text-on-surface-variant mt-1 truncate">{m.note}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      <MealCapture open={mealOpen} onClose={() => setMealOpen(false)} onSave={addMeal} />

      {/* Gamificação: celebrações */}
      <Confetti run={confettiRun} />
      <DailyCompleteToast show={dailyToast} />
      {newBadges.length > 0 && <BadgeToast badges={newBadges} onDone={dismissBadges} />}
      {celebrateStage && (
        <StageCelebration stage={celebrateStage} onClose={() => setCelebrateStage(null)} />
      )}
    </div>
  )
}

function Stat({ icon, label, value }: { icon: string; label: string; value: ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <Icon name={icon} fill className="text-primary text-[20px]" />
      <div className="leading-tight">
        <span className="font-label-md text-label-md text-on-surface block">{value}</span>
        <span className="font-body-sm text-[11px] text-on-surface-variant">{label}</span>
      </div>
    </div>
  )
}
