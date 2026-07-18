import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/context/AuthContext'
import { useProgram } from '@/context/ProgramContext'
import { TopBar } from '@/components/TopBar'
import { Icon } from '@/components/Icon'
import { ProgressBar } from '@/components/ProgressBar'
import { ButterflyAvatar, StageBadge } from '@/components/ButterflyAvatar'
import { MealCapture } from '@/components/MealCapture'
import { HABITS, PROGRAM_LENGTH, programProgress, stageProgress } from '@/lib/gamification'
import { MOTIVATIONAL_QUOTES } from '@/data/lessons'
import { clsx } from '@/lib/utils'
import { fadeUpItem, staggerContainer } from '@/lib/motion'

/** Dashboard de Evolução — tela principal (RF04, RF05, RF06). */
export function Dashboard() {
  const { profile } = useAuth()
  const { program, toggleHabit, addMeal, todayPoints } = useProgram()
  const [mealOpen, setMealOpen] = useState(false)

  const quote = useMemo(
    () => MOTIVATIONAL_QUOTES[program.day % MOTIVATIONAL_QUOTES.length],
    [program.day],
  )
  const stageInfo = stageProgress(program.points)

  return (
    <div className="pt-20 pb-32 px-container-padding animate-fade-in">
      <TopBar
        brand
        subtitle={undefined}
        left={
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-secondary-fixed flex items-center justify-center border-2 border-primary-container">
              <Icon name="person" fill className="text-secondary text-[22px]" />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-surface-container-highest rounded-full p-0.5 border border-surface">
              <Icon name={program.stage === 'borboleta' ? 'flutter_dash' : program.stage === 'casulo' ? 'egg' : 'pest_control'} fill className="text-[12px] text-primary" />
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
      <div className="mb-4 flex items-center gap-3">
        <ButterflyAvatar stage={program.stage} size="sm" />
        <div>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Olá, <strong className="text-on-surface">{profile?.name?.split(' ')[0] ?? 'Convidada'}</strong> 👋
          </p>
          <div className="mt-1.5">
            <StageBadge stage={program.stage} />
          </div>
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
          <Stat icon="bolt" label="Pontos" value={program.points} />
          <Stat icon="local_fire_department" label="Sequência" value={`${program.streak}d`} />
          <Stat icon="restaurant_menu" label="Refeições" value={program.meals.length} />
        </div>
      </div>

      {/* Check-in Diário */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-headline-md text-headline-md text-on-surface">Check-in Diário</h3>
          <span className="font-label-md text-label-md text-primary">+{todayPoints} pts hoje</span>
        </div>
        <motion.div
          className="flex flex-col gap-3"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          {HABITS.map((h) => {
            const active = program.todayCheckins[h.key] === true
            return (
              <motion.button
                key={h.key}
                variants={fadeUpItem}
                whileTap={{ scale: 0.98 }}
                onClick={() => toggleHabit(h.key)}
                className={clsx(
                  'group flex items-center justify-between p-4 rounded-xl border transition-colors',
                  active
                    ? 'bg-primary border-primary text-on-primary'
                    : 'bg-surface-container-lowest border-outline-variant hover:border-primary-container',
                )}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={clsx(
                      'w-12 h-12 rounded-full flex items-center justify-center transition-colors',
                      active ? 'bg-on-primary text-primary' : 'bg-secondary-fixed/50 text-secondary',
                    )}
                  >
                    <Icon name={h.icon} fill className="text-[24px]" />
                  </div>
                  <div className="text-left">
                    <span className={clsx('font-label-md text-label-md block', active ? 'text-on-primary' : 'text-on-surface')}>
                      {h.label}
                    </span>
                    <span className={clsx('font-body-sm text-body-sm', active ? 'text-on-primary/80' : 'text-on-surface-variant')}>
                      {h.hint}
                    </span>
                  </div>
                </div>
                <Icon
                  name="check_circle"
                  fill={active}
                  className={clsx('text-[24px]', active ? 'text-on-primary' : 'text-outline-variant')}
                />
              </motion.button>
            )
          })}
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
    </div>
  )
}

function Stat({ icon, label, value }: { icon: string; label: string; value: string | number }) {
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
